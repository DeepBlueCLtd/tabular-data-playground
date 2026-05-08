#!/usr/bin/env node
// Verification harness for Spike B. Mirrors Spike A's harness:
// serves app/spikes/spike-b/, opens Chromium and Firefox via
// Playwright, waits for the self-check banner, and reads the four
// assertion results from window.__SPIKE_B__.

import { createRequire } from "node:module";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "node:http";

const require = createRequire("/opt/node22/lib/node_modules/playwright/package.json");
const { chromium, firefox } = require("playwright");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const SPIKE_DIR = path.join(REPO_ROOT, "app/spikes/spike-b");
const RESULTS_DIR = path.join(HERE, "results");
const PORT = 8124;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      let filePath = path.join(SPIKE_DIR, urlPath);
      const st = await stat(filePath).catch(() => null);
      if (st && st.isDirectory()) filePath = path.join(filePath, "index.html");
      const buf = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "content-type": MIME[ext] || "application/octet-stream",
        "cache-control": "no-store",
      });
      res.end(buf);
    } catch (err) {
      res.writeHead(404); res.end(String(err));
    }
  });
  return new Promise((r, rej) => {
    server.once("error", rej);
    server.listen(PORT, "127.0.0.1", () => r(server));
  });
}

async function runOnBrowser(launcher, name, baseUrl) {
  const browser = await launcher.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const consoleLog = [];
  page.on("console", (m) => consoleLog.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => consoleLog.push(`[pageerror] ${e.message}`));

  const t0 = Date.now();
  await page.goto(baseUrl, { waitUntil: "load" });
  await page.waitForFunction(() => {
    const b = document.querySelector("#banner");
    const s = b && b.dataset && b.dataset.state;
    return s === "pass" || s === "fail";
  }, null, { timeout: 60_000 });
  const totalElapsedMs = Date.now() - t0;

  const record = await page.evaluate(() => {
    const banner = document.querySelector("#banner");
    return {
      outcome: banner?.dataset?.state === "pass" ? "PASS" : "FAIL",
      bannerText: banner?.textContent?.trim() ?? "",
      results: window.__SPIKE_B__?.results ?? [],
      vfsKeys: window.__SPIKE_B__?.vfsKeys ?? [],
      selfCheckTranscript: window.__SPIKE_B__?.selfCheckTranscript ?? [],
      pinned: window.__SPIKE_B__?.pinned ?? null,
      browser_ua: document.querySelector("#meta-browser")?.textContent?.trim() ?? "",
      total_elapsed_label: document.querySelector("#meta-total")?.textContent?.trim() ?? "",
    };
  });
  record.totalElapsedMs = totalElapsedMs;
  record.harness = { name };
  record.console = consoleLog;
  await browser.close();
  return record;
}

function renderMarkdown(name, rec) {
  const date = new Date().toISOString().slice(0, 10);
  const rows = rec.results
    .map((r, i) => `| ${i + 1} | ${r.name} | \`${r.command.replaceAll("|", "\\|")}\` | ${r.passed ? "✓" : "✗"} | ${(r.details || "").replaceAll("|", "\\|")} |`)
    .join("\n");
  return [
    `### Spike B — Mini-shell pipes prototype`,
    ``,
    `**Browser**: ${name} (Playwright headless) — ${rec.browser_ua}`,
    `**Date**: ${date}`,
    `**Outcome**: ${rec.outcome}`,
    `**Total elapsed**: ${rec.total_elapsed_label || rec.totalElapsedMs + " ms"}`,
    ``,
    `**Versions**:`,
    ``,
    `- xterm.js pinned URL: \`${rec.pinned?.xterm?.url || "—"}\``,
    `- xterm.js: \`${rec.pinned?.xterm?.version || "—"}\``,
    `- @xterm/addon-fit: \`${rec.pinned?.fit?.version || "—"}\``,
    ``,
    `**Self-check**:`,
    ``,
    `| # | Name | Command | Passed | Details |`,
    `|---|------|---------|--------|---------|`,
    rows,
    ``,
    `**VFS keys at end of self-check**: ${rec.vfsKeys.length ? rec.vfsKeys.map((k) => `\`${k}\``).join(", ") : "(empty)"}`,
    ``,
  ].join("\n");
}

async function main() {
  await mkdir(RESULTS_DIR, { recursive: true });
  console.log(`Serving ${SPIKE_DIR} on http://127.0.0.1:${PORT}/`);
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${PORT}/`;
  const summary = { allPass: true, results: {} };
  for (const [name, launcher] of [["chromium", chromium], ["firefox", firefox]]) {
    console.log(`\n=== ${name} ===`);
    try {
      const rec = await runOnBrowser(launcher, name, baseUrl);
      summary.results[name] = rec;
      if (rec.outcome !== "PASS") summary.allPass = false;
      console.log(`  outcome: ${rec.outcome}`);
      for (const r of rec.results) {
        console.log(`  ${r.passed ? "✓" : "✗"} ${r.name}: ${r.details}`);
      }
      await writeFile(path.join(RESULTS_DIR, `${name}.json`), JSON.stringify(rec, null, 2));
      await writeFile(path.join(RESULTS_DIR, `${name}.md`), renderMarkdown(name, rec));
    } catch (err) {
      summary.allPass = false;
      console.error(`  FAILED: ${err.stack || err}`);
      summary.results[name] = { outcome: "FAIL", error: String(err.message || err) };
      await writeFile(path.join(RESULTS_DIR, `${name}.json`), JSON.stringify(summary.results[name], null, 2));
    }
  }
  await new Promise((r) => server.close(r));
  await writeFile(path.join(RESULTS_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  if (!summary.allPass) {
    console.error("\nOne or more browsers did not reach PASS.");
    process.exitCode = 1;
  } else {
    console.log("\nAll browsers reached PASS.");
  }
}

main().catch((e) => { console.error(e); process.exit(2); });

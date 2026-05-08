#!/usr/bin/env node
// Verification harness for Spike A.
// Serves app/spikes/spike-a/ and opens it in Chromium + Firefox via
// Playwright, clicks Run, waits for the PASS/FAIL banner, and reads
// the run record off the DOM.
//
// Outputs:
//   - specs/001-spike-a-pyodide/verify/results/<browser>.md   (run record)
//   - specs/001-spike-a-pyodide/verify/results/<browser>.json (raw record)
//   - exit code 0 only if BOTH browsers reach PASS.
//
// This harness is research scaffolding, not part of the spike itself.
// The spike at app/spikes/spike-a/ remains build-step-free per spec
// FR-012; this script just automates the manual reproduction.

import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";

// Resolve Playwright from the global Node 22 install. This harness is
// research scaffolding; we deliberately don't add a package.json.
const require = createRequire("/opt/node22/lib/node_modules/playwright/package.json");
const { chromium, firefox } = require("playwright");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const SPIKE_DIR = path.join(REPO_ROOT, "app/spikes/spike-a");
const RESULTS_DIR = path.join(HERE, "results");
const PORT = 8123;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".csv":  "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
};

function startServer(rootDir, port) {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const safe = path
        .normalize(urlPath)
        .replace(/^([/]\.\.)+/, "");
      let filePath = path.join(rootDir, safe);
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
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found\n${err && err.message ? err.message : err}\n`);
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

async function runOnBrowser(launcher, name, baseUrl) {
  const browser = await launcher.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const consoleLog = [];
  page.on("console", (msg) => consoleLog.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => consoleLog.push(`[pageerror] ${err.message}`));

  const t0 = Date.now();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#run-btn:not([disabled])");
  await page.click("#run-btn");

  // Wait for banner to reach a terminal state. Pyodide cold-start can
  // be slow; allow up to 5 minutes.
  await page.waitForFunction(
    () => {
      const b = document.querySelector("#banner");
      const s = b && b.dataset && b.dataset.state;
      return s === "pass" || s === "fail";
    },
    null,
    { timeout: 5 * 60_000 }
  );
  const totalElapsedMs = Date.now() - t0;

  // Scrape the run-record straight from the DOM (mirrors what
  // Copy-results would emit, minus clipboard hassles).
  const record = await page.evaluate(() => {
    const ds = (sel) => document.querySelector(sel)?.textContent?.trim() ?? null;
    const banner = document.querySelector("#banner");
    const outcome = banner?.dataset?.state === "pass" ? "PASS" : "FAIL";
    const stepNames = [
      "pyodide_load",
      "micropip_install_frictionless",
      "frictionless_version",
      "frictionless_validate",
    ];
    const steps = stepNames.map((n) => {
      const row = document.querySelector(`tr[data-step="${n}"]`);
      const cell = (k) => row?.querySelector(`[data-cell="${k}"]`)?.textContent?.trim() ?? "";
      return {
        name: n,
        elapsed_ms: cell("elapsed") === "—" ? null : Number(cell("elapsed")),
        exit_code: cell("exit") === "—" ? null : Number(cell("exit")),
        stdout_first: cell("stdout-first"),
      };
    });
    return {
      outcome,
      bannerText: banner?.textContent?.trim() ?? "",
      pyodide_pinned_url: ds("#meta-pyodide-url"),
      pyodide_runtime_version: ds("#meta-pyodide-version"),
      frictionless_version: ds("#meta-frictionless-version"),
      browser_ua: ds("#meta-browser"),
      cross_origin_isolated: ds("#meta-coi") === "true",
      total_elapsed_label: ds("#meta-total"),
      steps,
      full_stdout: document.querySelector("#full-stdout")?.textContent ?? "",
      full_stderr: document.querySelector("#full-stderr")?.textContent ?? "",
    };
  });
  record.totalElapsedMs = totalElapsedMs;
  record.harness = { name, harnessElapsedMs: totalElapsedMs };
  record.console = consoleLog;

  await browser.close();
  return record;
}

function renderMarkdown(name, rec) {
  const date = new Date().toISOString().slice(0, 10);
  const stepRow = (s) => {
    const first = (s.stdout_first || "—").replaceAll("|", "\\|");
    return `| ${name === "chromium" ? "" : ""}${s.name} | ${s.elapsed_ms ?? "—"} | ${s.exit_code ?? "—"} | ${first} |`;
  };
  const stepRows = rec.steps
    .map((s, i) => `| ${i + 1} | ${s.name} | ${s.elapsed_ms ?? "—"} | ${s.exit_code ?? "—"} | ${(s.stdout_first || "—").replaceAll("|", "\\|")} |`)
    .join("\n");
  return [
    `### Spike A — Pyodide + Frictionless install proof`,
    ``,
    `**Browser**: ${name} (Playwright headless) — ${rec.browser_ua}`,
    `**Date**: ${date}`,
    `**Outcome**: ${rec.outcome}`,
    `**Total elapsed**: ${rec.total_elapsed_label || rec.totalElapsedMs + " ms"}`,
    `**crossOriginIsolated**: ${rec.cross_origin_isolated}`,
    ``,
    `**Versions**:`,
    ``,
    `- Pyodide pinned URL: \`${rec.pyodide_pinned_url}\``,
    `- Pyodide runtime version: \`${rec.pyodide_runtime_version}\``,
    `- Frictionless: \`${rec.frictionless_version}\``,
    ``,
    `**Steps**:`,
    ``,
    `| # | Step | Elapsed (ms) | Exit | Stdout (first line) |`,
    `|---|------|--------------|------|---------------------|`,
    stepRows,
    ``,
    `**Notes / sharp edges observed**:`,
    ``,
    `- Verified via Playwright headless (\`specs/001-spike-a-pyodide/verify/run-spikes.mjs\`).`,
    rec.cross_origin_isolated
      ? `- crossOriginIsolated === true (unexpected — re-check headers).`
      : `- crossOriginIsolated === false (expected on GitHub Pages and locally without COOP/COEP).`,
    ``,
  ].join("\n");
}

async function main() {
  await mkdir(RESULTS_DIR, { recursive: true });
  console.log(`Serving ${SPIKE_DIR} on http://127.0.0.1:${PORT}/`);
  const server = await startServer(SPIKE_DIR, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}/`;

  const results = {};
  let allPass = true;
  for (const [browserName, launcher] of [["chromium", chromium], ["firefox", firefox]]) {
    console.log(`\n=== ${browserName} ===`);
    try {
      const rec = await runOnBrowser(launcher, browserName, baseUrl);
      results[browserName] = rec;
      if (rec.outcome !== "PASS") allPass = false;
      console.log(`  outcome: ${rec.outcome}`);
      console.log(`  versions: pyodide=${rec.pyodide_runtime_version} frictionless=${rec.frictionless_version}`);
      for (const s of rec.steps) {
        console.log(`  step ${s.name}: exit=${s.exit_code} elapsed=${s.elapsed_ms}ms first="${s.stdout_first}"`);
      }
      await writeFile(path.join(RESULTS_DIR, `${browserName}.json`), JSON.stringify(rec, null, 2));
      await writeFile(path.join(RESULTS_DIR, `${browserName}.md`), renderMarkdown(browserName, rec));
    } catch (err) {
      allPass = false;
      console.error(`  FAILED: ${err && err.stack ? err.stack : err}`);
      results[browserName] = { outcome: "FAIL", error: String(err && err.message ? err.message : err) };
      await writeFile(
        path.join(RESULTS_DIR, `${browserName}.json`),
        JSON.stringify(results[browserName], null, 2)
      );
    }
  }

  await new Promise((r) => server.close(r));
  console.log(`\nServer closed.`);

  await writeFile(
    path.join(RESULTS_DIR, "summary.json"),
    JSON.stringify({ allPass, results }, null, 2)
  );

  if (!allPass) {
    console.error("\nOne or more browsers did not reach PASS.");
    process.exitCode = 1;
  } else {
    console.log("\nAll browsers reached PASS.");
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(2);
});

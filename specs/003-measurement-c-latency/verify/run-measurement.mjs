#!/usr/bin/env node
// Headless harness for Measurement C. Mirrors Spikes A/B.

import { createRequire } from "node:module";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "node:http";

const require = createRequire("/opt/node22/lib/node_modules/playwright/package.json");
const { chromium, firefox } = require("playwright");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
// We serve the repo's `app/` so /spikes/measurement-c/ + /spikes/spike-a/
// resolve, since main.js imports ../spike-a/pyodide.config.js.
const APP_ROOT = path.join(REPO_ROOT, "app");
const RESULTS_DIR = path.join(HERE, "results");
const PORT = 8125;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".csv":  "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      let filePath = path.join(APP_ROOT, urlPath);
      const st = await stat(filePath).catch(() => null);
      if (st && st.isDirectory()) filePath = path.join(filePath, "index.html");
      const buf = await readFile(filePath);
      res.writeHead(200, {
        "content-type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
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

  await page.goto(`${baseUrl}spikes/measurement-c/`, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.loadPyodide === "function", null, { timeout: 60_000 });
  await page.click("#run-btn");
  await page.waitForFunction(() => {
    const v = document.querySelector("#verdict");
    const s = v && v.dataset && v.dataset.state;
    return s === "main" || s === "worker" || s === "incon";
  }, null, { timeout: 10 * 60_000 });

  const record = await page.evaluate(() => window.__MEAS_C__?.record);
  await browser.close();
  return { ...record, harness: { name }, console: consoleLog };
}

function renderMarkdown(name, rec) {
  return [
    `### Measurement C — Pyodide latency budget — ${name} (Playwright headless)`,
    ``,
    `**Browser**: ${rec.browser}`,
    `**Date**: ${rec.date}`,
    `**Verdict**: **${rec.verdict}**`,
    `**Verdict reason**: ${rec.verdict_reason}`,
    `**crossOriginIsolated**: ${rec.crossOriginIsolated}`,
    ``,
    `**Versions**:`,
    ``,
    `- Pyodide pinned URL: \`${rec.pyodide.pinned_url}\``,
    `- Pyodide runtime: \`${rec.pyodide.runtime_version}\``,
    `- Frictionless: \`${rec.frictionless.version}\``,
    ``,
    `**Setup (context only)**:`,
    ``,
    `- pyodide_load: ${rec.setup.pyodide_load_ms} ms`,
    `- micropip_install: ${rec.setup.micropip_install_ms} ms`,
    ``,
    `**Cold call**: ${rec.cold.duration_ms} ms`,
    ``,
    `**Warm calls**:`,
    ``,
    `- count completed: ${rec.warm.completed}`,
    `- median: ${rec.warm.median_ms} ms`,
    `- p95: ${rec.warm.p95_ms} ms`,
    `- raw: [${rec.warm.durations_ms.join(", ")}]`,
    ``,
    `**Error**: ${rec.error || "(none)"}`,
    ``,
  ].join("\n");
}

async function main() {
  await mkdir(RESULTS_DIR, { recursive: true });
  console.log(`Serving ${APP_ROOT} on http://127.0.0.1:${PORT}/`);
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${PORT}/`;
  const summary = { results: {} };
  for (const [name, launcher] of [["chromium", chromium], ["firefox", firefox]]) {
    console.log(`\n=== ${name} ===`);
    try {
      const rec = await runOnBrowser(launcher, name, baseUrl);
      summary.results[name] = rec;
      console.log(`  verdict: ${rec.verdict} — ${rec.verdict_reason}`);
      console.log(`  cold: ${rec.cold.duration_ms} ms; warm median: ${rec.warm.median_ms} ms; p95: ${rec.warm.p95_ms} ms`);
      console.log(`  warm raw: [${rec.warm.durations_ms.join(", ")}]`);
      await writeFile(path.join(RESULTS_DIR, `${name}.json`), JSON.stringify(rec, null, 2));
      await writeFile(path.join(RESULTS_DIR, `${name}.md`), renderMarkdown(name, rec));
    } catch (err) {
      console.error(`  FAILED: ${err.stack || err}`);
      summary.results[name] = { error: String(err.message || err) };
      await writeFile(path.join(RESULTS_DIR, `${name}.json`), JSON.stringify(summary.results[name], null, 2));
    }
  }
  await new Promise((r) => server.close(r));
  await writeFile(path.join(RESULTS_DIR, "summary.json"), JSON.stringify(summary, null, 2));
}

main().catch((e) => { console.error(e); process.exit(2); });

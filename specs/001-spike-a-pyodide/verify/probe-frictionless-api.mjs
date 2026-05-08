#!/usr/bin/env node
// One-off probe: load Pyodide+frictionless headless and report what
// CLI entry-points are actually exposed by the installed frictionless
// version. Used to correct research.md R4.

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";

const require = createRequire("/opt/node22/lib/node_modules/playwright/package.json");
const { chromium } = require("playwright");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const SPIKE_DIR = path.join(REPO_ROOT, "app/spikes/spike-a");
const PORT = 8124;

const MIME = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".csv": "text/csv" };

async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      let filePath = path.join(SPIKE_DIR, urlPath);
      const st = await stat(filePath).catch(() => null);
      if (st && st.isDirectory()) filePath = path.join(filePath, "index.html");
      const buf = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
      res.end(buf);
    } catch (err) {
      res.writeHead(404); res.end(String(err));
    }
  });
  return new Promise((r) => server.listen(PORT, "127.0.0.1", () => r(server)));
}

const probeScript = `
import importlib, pkgutil, json, sys
import frictionless
report = {"frictionless_version": frictionless.__version__, "modules": []}
for m in pkgutil.iter_modules(frictionless.__path__, prefix="frictionless."):
    report["modules"].append(m.name)
# Look for CLI entry candidates
candidates = [
    ("frictionless.__main__", None),
    ("frictionless", "main"),
    ("frictionless", "program"),
    ("frictionless.console", "program"),
    ("frictionless.console", "main"),
    ("frictionless.cli", "main"),
    ("frictionless.cli", "program"),
]
report["candidates"] = []
for mod, attr in candidates:
    try:
        m = importlib.import_module(mod)
        if attr is None:
            report["candidates"].append({"target": f"{mod}", "ok": True, "type": "module"})
        else:
            present = hasattr(m, attr)
            report["candidates"].append({"target": f"{mod}.{attr}", "ok": present, "type": "attr" if present else "missing"})
    except Exception as e:
        report["candidates"].append({"target": f"{mod}{('.' + attr) if attr else ''}", "ok": False, "type": "import-error", "error": str(e)})

# Inspect frictionless top-level for a click/argparse Group
import inspect
top_attrs = []
for name in dir(frictionless):
    obj = getattr(frictionless, name)
    if callable(obj) and not name.startswith("_"):
        kind = type(obj).__name__
        if kind in ("Group", "Command", "function"):
            top_attrs.append({"name": name, "kind": kind})
report["top_callables"] = top_attrs

# Try to find click groups under frictionless.console
try:
    import frictionless.console as fc
    fc_attrs = []
    for name in dir(fc):
        if name.startswith("_"): continue
        obj = getattr(fc, name)
        kind = type(obj).__name__
        fc_attrs.append({"name": name, "kind": kind})
    report["console_attrs"] = fc_attrs
except Exception as e:
    report["console_attrs_error"] = str(e)

# Entry points declared in metadata
try:
    from importlib.metadata import entry_points
    eps = entry_points()
    if hasattr(eps, "select"):
        ce = list(eps.select(group="console_scripts"))
    else:
        ce = list(eps.get("console_scripts", []))
    report["console_scripts"] = [{"name": e.name, "value": e.value} for e in ce if "frictionless" in (e.value or "")]
except Exception as e:
    report["console_scripts_error"] = str(e)

print(json.dumps(report, indent=2))
`;

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on("console", (m) => console.log(`[browser ${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => console.log(`[browser pageerror] ${e.message}`));
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.loadPyodide === "function", null, { timeout: 60_000 });
  const result = await page.evaluate(async (snippet) => {
    const pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
    });
    await pyodide.loadPackage("micropip");
    await pyodide.runPythonAsync(`
import micropip
await micropip.install("frictionless")
`);
    const out = await pyodide.runPythonAsync(`
import io, sys
buf = io.StringIO()
orig = sys.stdout
sys.stdout = buf
try:
${snippet.split("\n").map((l) => "    " + l).join("\n")}
finally:
    sys.stdout = orig
buf.getvalue()
`);
    return out;
  }, probeScript);

  console.log(result);
  await browser.close();
  await new Promise((r) => server.close(r));
}

main().catch((e) => { console.error(e); process.exit(1); });

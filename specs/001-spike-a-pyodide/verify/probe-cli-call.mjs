#!/usr/bin/env node
import { createRequire } from "node:module";
const require = createRequire("/opt/node22/lib/node_modules/playwright/package.json");
const { chromium } = require("playwright");

const py = `
import io, sys, traceback, json
from frictionless.__main__ import console as cli_app
import typer
from typer.testing import CliRunner

results = {}

# Strategy A: typer.testing.CliRunner.invoke (Typer's official test-friendly entrypoint)
runner = CliRunner(mix_stderr=False)
res_v = runner.invoke(cli_app, ["--version"])
results["A_version"] = {
    "exit_code": res_v.exit_code,
    "stdout": res_v.stdout,
    "stderr": res_v.stderr,
    "exception": repr(res_v.exception) if res_v.exception else None,
}

import pyodide
pyodide.FS.writeFile if False else None
`;

// not using pyodide.FS in py snippet directly; CSV write done via JS

const probeMain = async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on("console", (m) => console.log(`[browser ${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => console.log(`[browser pageerror] ${e.message}`));
  await page.setContent(`<!doctype html><html><body><script src="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js"></script></body></html>`, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.loadPyodide === "function", null, { timeout: 60_000 });

  const out = await page.evaluate(async () => {
    const pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
    });
    await pyodide.loadPackage("micropip");
    await pyodide.runPythonAsync(`
import micropip
await micropip.install("frictionless")
`);
    // Write the sample CSV
    pyodide.FS.writeFile("/sample.csv", "id,name,joined\\n1,Ada,1843-08-15\\n2,Alan,1936-05-28\\n");
    const result = await pyodide.runPythonAsync(`
import io, sys, traceback, json
results = {}

# A) typer CliRunner
try:
    from frictionless.__main__ import console as cli_app
    from typer.testing import CliRunner
    runner = CliRunner(mix_stderr=False)
    res = runner.invoke(cli_app, ["--version"])
    results["A_version"] = {"exit": res.exit_code, "stdout": res.stdout, "stderr": getattr(res, "stderr", ""), "exc": repr(res.exception) if res.exception else None}
    res = runner.invoke(cli_app, ["validate", "/sample.csv"])
    results["A_validate"] = {"exit": res.exit_code, "stdout": res.stdout[:2000], "stderr": getattr(res, "stderr", "")[:500], "exc": repr(res.exception) if res.exception else None}
except Exception as e:
    results["A_error"] = repr(e)

# B) Library API
try:
    import frictionless
    results["B_version"] = {"frictionless_version": frictionless.__version__}
    rep = frictionless.validate("/sample.csv")
    summary_text = rep.to_summary() if hasattr(rep, "to_summary") else None
    results["B_validate"] = {"valid": rep.valid, "stats": rep.stats if hasattr(rep, "stats") else None, "summary": summary_text[:2000] if summary_text else str(rep)[:2000]}
except Exception as e:
    results["B_error"] = repr(e)
    results["B_traceback"] = traceback.format_exc()

# C) Direct typer call
try:
    from frictionless.__main__ import console as cli_app2
    # Typer apps are callable with standalone_mode=False
    sys.argv = ["frictionless", "--version"]
    buf_out, buf_err = io.StringIO(), io.StringIO()
    orig_out, orig_err = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = buf_out, buf_err
    exc = None
    try:
        cli_app2(prog_name="frictionless", standalone_mode=False, args=["--version"])
        exit_code = 0
    except SystemExit as e:
        exit_code = e.code if isinstance(e.code, int) else 0
    except BaseException as e:
        exit_code = 1
        exc = repr(e)
    finally:
        sys.stdout, sys.stderr = orig_out, orig_err
    results["C_version"] = {"exit": exit_code, "stdout": buf_out.getvalue(), "stderr": buf_err.getvalue(), "exc": exc}
except Exception as e:
    results["C_error"] = repr(e)

json.dumps(results)
`);
    return result;
  });

  console.log(out);
  await browser.close();
};

probeMain().catch((e) => { console.error(e); process.exit(1); });

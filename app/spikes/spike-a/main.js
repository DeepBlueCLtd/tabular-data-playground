// Spike A — orchestrates the four-step run:
//   1. pyodide_load
//   2. micropip_install_frictionless
//   3. frictionless_version
//   4. frictionless_validate
//
// Each step's stdout/stderr/exit-code is captured per spec FR-005 and
// rendered into the page. PASS/FAIL is computed per data-model.md.
// "Copy results" emits the markdown block defined in
// contracts/run-record.md.

import { PYODIDE_VERSION, PYODIDE_INDEX_URL } from "./pyodide.config.js";

// Frictionless 5.x rejects absolute paths via its "not safe" check, so
// we write the sample under Pyodide's default working directory and
// pass it to the CLI as a relative filename.
const SAMPLE_CSV_FS_PATH = "/home/pyodide/sample.csv";
const SAMPLE_CSV_RELATIVE = "sample.csv";
const SAMPLE_CSV_URL = "./sample.csv";

const STEP_NAMES = [
  "pyodide_load",
  "micropip_install_frictionless",
  "frictionless_version",
  "frictionless_validate",
];

const els = {
  runBtn: document.getElementById("run-btn"),
  copyBtn: document.getElementById("copy-btn"),
  status: document.getElementById("status"),
  banner: document.getElementById("banner"),
  rows: Object.fromEntries(
    STEP_NAMES.map((s) => [s, document.querySelector(`tr[data-step="${s}"]`)])
  ),
  metaPyodideUrl: document.getElementById("meta-pyodide-url"),
  metaPyodideVersion: document.getElementById("meta-pyodide-version"),
  metaFrictionlessVersion: document.getElementById("meta-frictionless-version"),
  metaBrowser: document.getElementById("meta-browser"),
  metaCOI: document.getElementById("meta-coi"),
  metaTotal: document.getElementById("meta-total"),
  fullStdout: document.getElementById("full-stdout"),
  fullStderr: document.getElementById("full-stderr"),
  notes: document.getElementById("notes"),
};

els.metaPyodideUrl.textContent = `${PYODIDE_INDEX_URL}pyodide.js`;
els.metaBrowser.textContent = navigator.userAgent;
els.metaCOI.textContent = String(self.crossOriginIsolated);

let pyodide = null;
let isRunning = false;
let lastRecord = null;

els.runBtn.addEventListener("click", () => {
  if (isRunning) return;
  void runSpike();
});

els.copyBtn.addEventListener("click", () => {
  if (!lastRecord) return;
  const md = renderRunRecord(lastRecord);
  navigator.clipboard.writeText(md).then(
    () => setStatus("Results copied to clipboard."),
    (err) => setStatus(`Clipboard write failed: ${err}`)
  );
});

function setStatus(msg) {
  els.status.textContent = msg;
}

function setBanner(state, text) {
  els.banner.dataset.state = state;
  els.banner.textContent = text;
}

function resetUI() {
  setBanner("running", "Running…");
  els.copyBtn.disabled = true;
  els.metaPyodideVersion.textContent = "—";
  els.metaFrictionlessVersion.textContent = "—";
  els.metaTotal.textContent = "—";
  els.fullStdout.textContent = "";
  els.fullStderr.textContent = "";
  for (const name of STEP_NAMES) {
    const row = els.rows[name];
    row.querySelector('[data-cell="elapsed"]').textContent = "—";
    const exitCell = row.querySelector('[data-cell="exit"]');
    exitCell.textContent = "—";
    exitCell.className = "";
    row.querySelector('[data-cell="stdout-first"]').textContent = "—";
  }
}

function renderStep(step) {
  const row = els.rows[step.name];
  if (!row) return;
  row.querySelector('[data-cell="elapsed"]').textContent =
    step.elapsed_ms != null ? String(step.elapsed_ms) : "—";
  const exitCell = row.querySelector('[data-cell="exit"]');
  exitCell.textContent = step.exit_code != null ? String(step.exit_code) : "—";
  exitCell.className = step.exit_code === 0 ? "exit-ok" : "exit-fail";
  const firstLine =
    (step.stdout || "").split(/\r?\n/).find((l) => l.length > 0) ||
    (step.exception_summary ? `<exception> ${step.exception_summary}` : "");
  row.querySelector('[data-cell="stdout-first"]').textContent = firstLine || "—";
}

function appendFullStreams(step) {
  if (step.stdout) {
    els.fullStdout.textContent += `\n— ${step.name} —\n${step.stdout}`;
  }
  if (step.stderr) {
    els.fullStderr.textContent += `\n— ${step.name} —\n${step.stderr}`;
  }
}

async function runSpike() {
  isRunning = true;
  els.runBtn.disabled = true;
  resetUI();
  setStatus("Starting…");
  const t0 = performance.now();
  const record = {
    browser: navigator.userAgent,
    pyodide: {
      pinned_url: `${PYODIDE_INDEX_URL}pyodide.js`,
      runtime_version: null,
    },
    frictionless: { version: null },
    steps: [],
    crossOriginIsolated: self.crossOriginIsolated,
    outcome: "FAIL",
    total_elapsed_ms: 0,
    notes: "",
    date: new Date().toISOString().slice(0, 10),
  };

  try {
    // Step 1 — pyodide_load
    const step1 = await runStep("pyodide_load", async () => {
      if (!pyodide) {
        // loadPyodide is exposed by the classic <script src="...pyodide.js">
        pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
      }
      record.pyodide.runtime_version = pyodide.version;
      els.metaPyodideVersion.textContent = pyodide.version;
      return { stdout: `Pyodide ${pyodide.version} loaded.\n`, stderr: "", exit_code: 0 };
    });
    record.steps.push(step1);
    if (step1.exit_code !== 0) return finalize(record, t0);

    // Step 2 — micropip_install_frictionless
    const step2 = await runStep("micropip_install_frictionless", async () => {
      await pyodide.loadPackage("micropip");
      const captured = await runPythonCaptured(`
import micropip
await micropip.install("frictionless")
print("frictionless installed via micropip")
`);
      return captured;
    });
    record.steps.push(step2);
    if (step2.exit_code !== 0) return finalize(record, t0);

    // Step 3 — frictionless_version
    // The CLI entry-point is exposed as `frictionless.__main__:console`
    // (a Typer app). `frictionless.console.program` does NOT exist —
    // discovered while building this spike (recorded in
    // docs/limitations.md and research.md R4 follow-up).
    const step3 = await runStep("frictionless_version", async () => {
      const captured = await runPythonCaptured(`
from frictionless.__main__ import console as _cli_app
_cli_app(prog_name="frictionless", standalone_mode=False, args=["--version"])
`);
      return captured;
    });
    record.steps.push(step3);
    record.frictionless.version =
      (step3.stdout.split(/\r?\n/).find((l) => l.length > 0) || "").trim() ||
      null;
    els.metaFrictionlessVersion.textContent = record.frictionless.version || "—";
    if (step3.exit_code !== 0) return finalize(record, t0);

    // Step 4 — frictionless_validate
    const step4 = await runStep("frictionless_validate", async () => {
      const resp = await fetch(SAMPLE_CSV_URL);
      if (!resp.ok) {
        return {
          stdout: "",
          stderr: `Failed to fetch ${SAMPLE_CSV_URL}: HTTP ${resp.status}`,
          exit_code: 2,
          exception_summary: null,
        };
      }
      const csvBytes = new Uint8Array(await resp.arrayBuffer());
      pyodide.FS.writeFile(SAMPLE_CSV_FS_PATH, csvBytes);
      // chdir to the directory that holds the CSV so we can pass a
      // relative path (Frictionless rejects absolute paths as "not safe").
      const captured = await runPythonCaptured(`
import os
os.chdir("/home/pyodide")
from frictionless.__main__ import console as _cli_app
_cli_app(prog_name="frictionless", standalone_mode=False, args=["validate", "${SAMPLE_CSV_RELATIVE}"])
`);
      return captured;
    });
    record.steps.push(step4);

    finalize(record, t0);
  } catch (err) {
    // A truly unexpected failure outside any captured step.
    setBanner("fail", `FAIL — uncaught: ${err && err.message ? err.message : err}`);
    setStatus("Run aborted.");
  } finally {
    isRunning = false;
    els.runBtn.disabled = false;
  }
}

async function runStep(name, body) {
  setStatus(`Running step: ${name}…`);
  const start = performance.now();
  let result = { stdout: "", stderr: "", exit_code: 0, exception_summary: null };
  try {
    const out = await body();
    if (out && typeof out === "object") {
      result = { exception_summary: null, ...out };
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    result.stderr = (result.stderr || "") + (msg ? msg + "\n" : "");
    result.exit_code = result.exit_code || 1;
    result.exception_summary =
      err && err.constructor ? `${err.constructor.name}: ${msg.split("\n")[0]}` : msg;
  }
  const elapsed_ms = Math.round(performance.now() - start);
  const step = { name, started_at_ms: Math.round(start), elapsed_ms, ...result };
  renderStep(step);
  appendFullStreams(step);
  return step;
}

// Run a Python snippet inside Pyodide with sys.stdout/stderr redirected
// to StringIO buffers. SystemExit is caught and converted to an exit code.
// `fallbackCli` is unused at runtime; kept as a hint for readers about
// which CLI invocation this snippet wraps.
async function runPythonCaptured(snippet, _fallbackCli = []) {
  const wrapped = `
import io, sys, traceback
_stdout, _stderr = io.StringIO(), io.StringIO()
_orig_out, _orig_err = sys.stdout, sys.stderr
sys.stdout, sys.stderr = _stdout, _stderr
_exit_code = 0
_exc_summary = None
try:
${indent(snippet)}
except SystemExit as _e:
    _exit_code = _e.code if isinstance(_e.code, int) else (0 if _e.code is None else 1)
except BaseException as _e:
    _exit_code = 1
    _exc_summary = f"{type(_e).__name__}: {_e}"
    traceback.print_exc(file=_stderr)
finally:
    sys.stdout, sys.stderr = _orig_out, _orig_err
import json as _json
_result = _json.dumps({
    "stdout": _stdout.getvalue(),
    "stderr": _stderr.getvalue(),
    "exit_code": int(_exit_code),
    "exception_summary": _exc_summary,
})
_result
`;
  const resultJson = await pyodide.runPythonAsync(wrapped);
  return JSON.parse(resultJson);
}

function indent(src, prefix = "    ") {
  return src
    .split("\n")
    .map((line) => (line.length ? prefix + line : line))
    .join("\n");
}

function finalize(record, t0) {
  record.total_elapsed_ms = Math.round(performance.now() - t0);
  els.metaTotal.textContent = `${record.total_elapsed_ms} ms`;

  // PASS rules per data-model.md:
  //   - every step exit_code === 0
  //   - frictionless_version step has non-empty stdout
  //   - frictionless_validate step has non-empty stdout
  const allClean = record.steps.length === STEP_NAMES.length &&
    record.steps.every((s) => s.exit_code === 0);
  const verStep = record.steps.find((s) => s.name === "frictionless_version");
  const valStep = record.steps.find((s) => s.name === "frictionless_validate");
  const verHasStdout = !!(verStep && verStep.stdout && verStep.stdout.trim().length > 0);
  const valHasStdout = !!(valStep && valStep.stdout && valStep.stdout.trim().length > 0);

  const pass = allClean && verHasStdout && valHasStdout;
  record.outcome = pass ? "PASS" : "FAIL";
  setBanner(pass ? "pass" : "fail",
    pass ? `PASS — total ${record.total_elapsed_ms} ms` : `FAIL — see step table and stderr`);
  setStatus(pass ? "Done." : "Done with errors.");

  lastRecord = record;
  els.copyBtn.disabled = false;
}

function renderRunRecord(rec) {
  rec.notes = els.notes.value || "";
  const headerStep = (n) => {
    const s = rec.steps.find((x) => x.name === n);
    if (!s) return { elapsed: "—", exit: "—", first: "—", stderr: "" };
    const first =
      (s.stdout || "").split(/\r?\n/).find((l) => l.length > 0) ||
      (s.exception_summary ? `<exception> ${s.exception_summary}` : "—");
    const stderr = (s.stderr || "").split(/\r?\n/).find((l) => l.length > 0) || "—";
    return {
      elapsed: s.elapsed_ms != null ? String(s.elapsed_ms) : "—",
      exit: s.exit_code != null ? String(s.exit_code) : "—",
      first: first.length > 120 ? first.slice(0, 117) + "…" : first,
      stderr: stderr.length > 120 ? stderr.slice(0, 117) + "…" : stderr,
    };
  };

  const r1 = headerStep("pyodide_load");
  const r2 = headerStep("micropip_install_frictionless");
  const r3 = headerStep("frictionless_version");
  const r4 = headerStep("frictionless_validate");

  return [
    `### Spike A — Pyodide + Frictionless install proof`,
    ``,
    `**Browser**: ${rec.browser}`,
    `**Date**: ${rec.date}`,
    `**Outcome**: ${rec.outcome}`,
    `**Total elapsed**: ${rec.total_elapsed_ms} ms`,
    `**crossOriginIsolated**: ${rec.crossOriginIsolated}`,
    ``,
    `**Versions**:`,
    ``,
    `- Pyodide pinned URL: \`${rec.pyodide.pinned_url}\``,
    `- Pyodide runtime version: \`${rec.pyodide.runtime_version || "—"}\``,
    `- Frictionless: \`${rec.frictionless.version || "—"}\``,
    ``,
    `**Steps**:`,
    ``,
    `| # | Step | Elapsed | Exit | Stdout (first line) | Stderr (first line) |`,
    `|---|------|---------|------|---------------------|---------------------|`,
    `| 1 | pyodide_load | ${r1.elapsed} | ${r1.exit} | ${r1.first} | ${r1.stderr} |`,
    `| 2 | micropip_install_frictionless | ${r2.elapsed} | ${r2.exit} | ${r2.first} | ${r2.stderr} |`,
    `| 3 | frictionless_version | ${r3.elapsed} | ${r3.exit} | ${r3.first} | ${r3.stderr} |`,
    `| 4 | frictionless_validate | ${r4.elapsed} | ${r4.exit} | ${r4.first} | ${r4.stderr} |`,
    ``,
    `**Notes / sharp edges observed**:`,
    ``,
    rec.notes.trim() ? rec.notes.trim().split("\n").map((l) => `- ${l}`).join("\n") : `- (none recorded)`,
    ``,
  ].join("\n");
}

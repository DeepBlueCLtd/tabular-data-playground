// Measurement C — times Pyodide cold-start and warm Frictionless
// calls, computes a verdict against spec.md §10 R3.

import {
  PYODIDE_VERSION,
  PYODIDE_INDEX_URL,
} from "../spike-a/pyodide.config.js";

const els = {
  status: document.getElementById("status"),
  runBtn: document.getElementById("run-btn"),
  copyBtn: document.getElementById("copy-btn"),
  nInput: document.getElementById("n-input"),
  verdict: document.getElementById("verdict"),
  setupLoad: document.getElementById("setup-load"),
  setupInstall: document.getElementById("setup-install"),
  coldMs: document.getElementById("cold-ms"),
  warmCount: document.getElementById("warm-count"),
  warmMedian: document.getElementById("warm-median"),
  warmP95: document.getElementById("warm-p95"),
  warmRows: document.getElementById("warm-rows"),
  metaPyodideUrl: document.getElementById("meta-pyodide-url"),
  metaPyodideVersion: document.getElementById("meta-pyodide-version"),
  metaFrictionlessVersion: document.getElementById("meta-frictionless-version"),
  metaBrowser: document.getElementById("meta-browser"),
};

els.metaPyodideUrl.textContent = `${PYODIDE_INDEX_URL}pyodide.js`;
els.metaBrowser.textContent = navigator.userAgent;

const SAMPLE_CSV_FS = "/home/pyodide/sample.csv";
const SAMPLE_CSV_REL = "sample.csv";

let pyodide = null;
let isRunning = false;
let lastRecord = null;

els.runBtn.addEventListener("click", () => { if (!isRunning) void runMeasurement(); });
els.copyBtn.addEventListener("click", () => {
  if (!lastRecord) return;
  navigator.clipboard.writeText(renderMarkdown(lastRecord)).then(
    () => (els.status.textContent = "Results copied."),
    (err) => (els.status.textContent = `Clipboard write failed: ${err}`)
  );
});

window.__MEAS_C__ = { get record() { return lastRecord; } };

async function runMeasurement() {
  isRunning = true;
  els.runBtn.disabled = true;
  els.copyBtn.disabled = true;
  els.warmRows.innerHTML = "";
  setVerdict("running", "Running…");
  els.status.textContent = "Loading Pyodide…";

  const N = Math.max(1, Math.min(100, Number(els.nInput.value) || 10));
  const record = newRecord();
  try {
    // Setup
    const tLoad0 = performance.now();
    if (!pyodide) {
      pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    }
    record.setup.pyodide_load_ms = ms(performance.now() - tLoad0);
    els.setupLoad.textContent = `${record.setup.pyodide_load_ms} ms`;
    record.pyodide.runtime_version = pyodide.version;
    els.metaPyodideVersion.textContent = pyodide.version;

    els.status.textContent = "micropip.install('frictionless')…";
    const tInstall0 = performance.now();
    await pyodide.loadPackage("micropip");
    await pyodide.runPythonAsync(`
import micropip
await micropip.install("frictionless")
`);
    record.setup.micropip_install_ms = ms(performance.now() - tInstall0);
    els.setupInstall.textContent = `${record.setup.micropip_install_ms} ms`;

    // Write the sample CSV and chdir (Frictionless rejects absolute paths)
    const resp = await fetch("./sample.csv");
    if (!resp.ok) throw new Error(`fetch sample.csv: HTTP ${resp.status}`);
    const csvBytes = new Uint8Array(await resp.arrayBuffer());
    pyodide.FS.writeFile(SAMPLE_CSV_FS, csvBytes);
    await pyodide.runPythonAsync(`
import os
os.chdir("/home/pyodide")
`);

    // Capture frictionless version (off-the-clock for the budget)
    const verRes = await runValidate(["--version"]);
    record.frictionless.version =
      (verRes.stdout || "").split(/\r?\n/).find((l) => l.length > 0)?.trim() || null;
    els.metaFrictionlessVersion.textContent = record.frictionless.version || "—";

    // Cold call: first validate
    els.status.textContent = "Cold call…";
    const t0 = performance.now();
    const cold = await runValidate(["validate", SAMPLE_CSV_REL]);
    record.cold.duration_ms = ms(performance.now() - t0);
    if (cold.exit_code !== 0) {
      record.error = `cold call exit ${cold.exit_code}: ${(cold.stderr || "").slice(0, 200)}`;
    }
    els.coldMs.textContent = `${record.cold.duration_ms} ms`;

    // Warm calls
    for (let i = 0; i < N; i++) {
      els.status.textContent = `Warm call ${i + 1}/${N}…`;
      const tw = performance.now();
      const r = await runValidate(["validate", SAMPLE_CSV_REL]);
      const dur = ms(performance.now() - tw);
      record.warm.durations_ms.push(dur);
      record.warm.completed = record.warm.durations_ms.length;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i + 1}</td><td class="num">${dur}</td>`;
      els.warmRows.appendChild(tr);
      if (r.exit_code !== 0 && !record.error) {
        record.error = `warm call ${i + 1} exit ${r.exit_code}`;
      }
    }
    record.warm.median_ms = median(record.warm.durations_ms);
    record.warm.p95_ms = percentile(record.warm.durations_ms, 95);
    els.warmCount.textContent = String(record.warm.completed);
    els.warmMedian.textContent = record.warm.median_ms != null ? `${record.warm.median_ms} ms` : "—";
    els.warmP95.textContent = record.warm.p95_ms != null ? `${record.warm.p95_ms} ms` : "—";

    decideVerdict(record);
    renderVerdict(record);
    els.status.textContent = "Done.";
    lastRecord = record;
    els.copyBtn.disabled = false;
  } catch (err) {
    record.error = (err && err.message) || String(err);
    record.verdict = "INCONCLUSIVE";
    record.verdict_reason = `aborted: ${record.error}`;
    renderVerdict(record);
    els.status.textContent = "Aborted.";
    lastRecord = record;
    els.copyBtn.disabled = false;
  } finally {
    isRunning = false;
    els.runBtn.disabled = false;
  }
}

async function runValidate(argv) {
  const py = `
import io, sys, traceback
from frictionless.__main__ import console as _cli_app
_argv = ${JSON.stringify(argv)}
_buf_out, _buf_err = io.StringIO(), io.StringIO()
_orig_out, _orig_err = sys.stdout, sys.stderr
sys.stdout, sys.stderr = _buf_out, _buf_err
_exit = 0
_exc = None
try:
    _cli_app(prog_name="frictionless", standalone_mode=False, args=_argv)
except SystemExit as e:
    _exit = e.code if isinstance(e.code, int) else 0
except BaseException as e:
    _exit = 1
    _exc = f"{type(e).__name__}: {e}"
    traceback.print_exc(file=_buf_err)
finally:
    sys.stdout, sys.stderr = _orig_out, _orig_err
import json as _json
_json.dumps({"stdout": _buf_out.getvalue(), "stderr": _buf_err.getvalue(), "exit_code": int(_exit), "exception": _exc})
`;
  const json = await pyodide.runPythonAsync(py);
  return JSON.parse(json);
}

function newRecord() {
  return {
    browser: navigator.userAgent,
    pyodide: { pinned_url: `${PYODIDE_INDEX_URL}pyodide.js`, runtime_version: null, pinned_version: PYODIDE_VERSION },
    frictionless: { version: null },
    setup: { pyodide_load_ms: null, micropip_install_ms: null },
    cold: { duration_ms: null },
    warm: { durations_ms: [], completed: 0, median_ms: null, p95_ms: null },
    verdict: "INCONCLUSIVE",
    verdict_reason: "",
    error: null,
    date: new Date().toISOString().slice(0, 10),
    crossOriginIsolated: self.crossOriginIsolated,
  };
}

function decideVerdict(rec) {
  if (rec.error) {
    rec.verdict = "INCONCLUSIVE";
    rec.verdict_reason = `error during measurement: ${rec.error}`;
    return;
  }
  if (rec.warm.completed < 5) {
    rec.verdict = "INCONCLUSIVE";
    rec.verdict_reason = `fewer than 5 warm calls completed (${rec.warm.completed})`;
    return;
  }
  const cold = rec.cold.duration_ms;
  const med = rec.warm.median_ms;
  if (cold == null || med == null) {
    rec.verdict = "INCONCLUSIVE";
    rec.verdict_reason = "missing cold or warm-median timing";
    return;
  }
  if (cold < 3000 && med < 250) {
    rec.verdict = "MAIN-THREAD-OK";
    rec.verdict_reason = `cold ${cold} ms < 3000 and warm median ${med} ms < 250 — within budget`;
  } else {
    rec.verdict = "WORKER-RECOMMENDED";
    rec.verdict_reason = `cold ${cold} ms vs limit 3000; warm median ${med} ms vs limit 250 — at least one over`;
  }
}

function renderVerdict(rec) {
  const map = { "MAIN-THREAD-OK": "main", "WORKER-RECOMMENDED": "worker", "INCONCLUSIVE": "incon" };
  setVerdict(map[rec.verdict] || "incon", `Verdict: ${rec.verdict} — ${rec.verdict_reason}`);
}

function setVerdict(state, text) {
  els.verdict.dataset.state = state;
  els.verdict.textContent = text;
}

function ms(x) { return Math.round(x); }

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function percentile(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  // Nearest-rank
  const idx = Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1);
  return s[Math.max(0, idx)];
}

function renderMarkdown(rec) {
  const browser = (rec.browser || "").split(" ").slice(0, 1).join(" ");
  return [
    `### Measurement C — Pyodide latency budget`,
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
    `- Pyodide runtime: \`${rec.pyodide.runtime_version || "—"}\``,
    `- Frictionless: \`${rec.frictionless.version || "—"}\``,
    ``,
    `**Setup (context only)**:`,
    ``,
    `- pyodide_load: ${rec.setup.pyodide_load_ms} ms`,
    `- micropip_install: ${rec.setup.micropip_install_ms} ms`,
    ``,
    `**Cold call** (first \`frictionless validate sample.csv\`): ${rec.cold.duration_ms} ms`,
    ``,
    `**Warm calls** (subsequent \`frictionless validate sample.csv\`):`,
    ``,
    `- count completed: ${rec.warm.completed}`,
    `- median: ${rec.warm.median_ms} ms`,
    `- p95: ${rec.warm.p95_ms} ms`,
    `- raw: [${rec.warm.durations_ms.join(", ")}]`,
    ``,
    `**Notes / sharp edges observed**:`,
    ``,
    `- Captured via Playwright headless if record produced by harness; otherwise headed measurement.`,
    rec.error ? `- Error: ${rec.error}` : `- (no errors)`,
    ``,
  ].join("\n");
}

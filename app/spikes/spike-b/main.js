// Spike B — wires xterm.js to the mini-shell, runs the self-check,
// then enables an interactive prompt.

import { XTERM_VERSION, XTERM_CSS_URL, XTERM_JS_URL, FIT_VERSION, FIT_JS_URL } from "./xterm.config.js";
import { createVFS } from "./shell/vfs.js";
import { tokenise, TokeniseError } from "./shell/tokenise.js";
import { parse, ParseError } from "./shell/parse.js";
import { execute } from "./shell/execute.js";
import { decodeUtf8 } from "./shell/builtins.js";

const els = {
  status: document.getElementById("status"),
  banner: document.getElementById("banner"),
  copyBtn: document.getElementById("copy-btn"),
  metaXtermUrl: document.getElementById("meta-xterm-url"),
  metaXtermVersion: document.getElementById("meta-xterm-version"),
  metaFitVersion: document.getElementById("meta-fit-version"),
  metaBrowser: document.getElementById("meta-browser"),
  metaTotal: document.getElementById("meta-total"),
  term: document.getElementById("term"),
  rows: {
    A1: document.querySelector('tr[data-row="A1"]'),
    A2: document.querySelector('tr[data-row="A2"]'),
    A3: document.querySelector('tr[data-row="A3"]'),
    A4: document.querySelector('tr[data-row="A4"]'),
  },
};

document.getElementById("xterm-css").setAttribute("href", XTERM_CSS_URL);
els.metaXtermUrl.textContent = XTERM_JS_URL;
els.metaBrowser.textContent = navigator.userAgent;
els.metaFitVersion.textContent = FIT_VERSION;

const t0 = performance.now();

const xtermScript = document.createElement("script");
xtermScript.src = XTERM_JS_URL;
xtermScript.onload = () => {
  const fitScript = document.createElement("script");
  fitScript.src = FIT_JS_URL;
  fitScript.onload = () => boot();
  fitScript.onerror = () => fail("addon-fit failed to load");
  document.head.appendChild(fitScript);
};
xtermScript.onerror = () => fail("xterm.js failed to load");
document.head.appendChild(xtermScript);

function fail(msg) {
  els.banner.dataset.state = "fail";
  els.banner.textContent = `FAIL — ${msg}`;
  els.status.textContent = "Aborted.";
}

let term = null;
const vfs = createVFS();

const PROMPT = "\x1b[32m$\x1b[0m ";
let inputBuf = "";

const results = []; // self-check results
const selfCheckTranscript = []; // captured CLI traces during self-check

function boot() {
  const Terminal = window.Terminal;
  const FitAddon = window.FitAddon ? window.FitAddon.FitAddon : null;
  if (!Terminal) return fail("Terminal global missing");
  els.metaXtermVersion.textContent = "(loaded)"; // xterm doesn't expose a version constant
  term = new Terminal({
    cursorBlink: true,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 13,
    convertEol: true,
    theme: { background: "#1a1a1a", foreground: "#e6e6e6" },
  });
  if (FitAddon) {
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(els.term);
    try { fit.fit(); } catch { /* ignore — fit can throw on hidden hosts */ }
  } else {
    term.open(els.term);
  }
  runSelfCheck().then(() => enableInteractive());
}

async function runSelfCheck() {
  els.banner.dataset.state = "running";
  els.banner.textContent = "Self-check running…";
  els.status.textContent = "Self-check running…";

  const trace = (line) => selfCheckTranscript.push(line);

  // A1 — pipeline_redirect
  await assert("A1", "echo hello | cat > out.txt", async () => {
    await runLine("echo hello | cat > out.txt", { trace });
    if (!vfs.has("out.txt")) return { ok: false, why: "out.txt not present in VFS" };
    const bytes = vfs.read("out.txt");
    const text = decodeUtf8(bytes);
    if (text !== "hello\n") {
      return { ok: false, why: `bytes mismatch: got ${JSON.stringify(text)}` };
    }
    return { ok: true, why: `out.txt = ${JSON.stringify(text)} (${bytes.length} bytes)` };
  });

  // A2 — read_back
  await assert("A2", "cat out.txt", async () => {
    const out = await runLine("cat out.txt", { trace });
    const text = decodeUtf8(out.stdout);
    if (text !== "hello\n") return { ok: false, why: `stdout mismatch: ${JSON.stringify(text)}` };
    return { ok: true, why: `stdout = ${JSON.stringify(text)}` };
  });

  // A3 — multistage_pipeline
  await assert("A3", "echo a | cat | cat", async () => {
    const out = await runLine("echo a | cat | cat", { trace });
    const text = decodeUtf8(out.stdout);
    if (text !== "a\n") return { ok: false, why: `stdout = ${JSON.stringify(text)}` };
    return { ok: true, why: `stdout = ${JSON.stringify(text)}` };
  });

  // A4 — rejected_feature
  await assert("A4", "echo a && echo b", async () => {
    let caught = null;
    try { await runLine("echo a && echo b", { trace }); }
    catch (err) { caught = err; }
    if (!caught) return { ok: false, why: "no error thrown for `&&`" };
    if (!(caught instanceof ParseError)) return { ok: false, why: `wrong error type: ${caught.constructor.name}` };
    if (!/&&/.test(caught.message)) return { ok: false, why: `error did not name '&&': ${caught.message}` };
    return { ok: true, why: caught.message };
  });

  const allPass = results.every((r) => r.passed);
  const elapsedMs = Math.round(performance.now() - t0);
  els.metaTotal.textContent = `${elapsedMs} ms`;
  if (allPass) {
    els.banner.dataset.state = "pass";
    els.banner.textContent = `PASS — total ${elapsedMs} ms`;
    els.status.textContent = "Self-check passed. Terminal is live.";
  } else {
    els.banner.dataset.state = "fail";
    const failed = results.filter((r) => !r.passed).map((r) => r.name).join(", ");
    els.banner.textContent = `FAIL — failed: ${failed}`;
    els.status.textContent = "Self-check failed. See table.";
  }
  els.copyBtn.disabled = false;
}

async function assert(name, command, body) {
  let result;
  try {
    const r = await body();
    result = { name, command, passed: r.ok, details: r.why };
  } catch (err) {
    result = { name, command, passed: false, details: `unexpected: ${err.message}` };
  }
  results.push(result);
  const row = els.rows[name];
  if (row) {
    const tick = row.querySelector('[data-cell="tick"]');
    tick.textContent = result.passed ? "✓" : "✗";
    tick.className = result.passed ? "tick-ok" : "tick-fail";
    row.querySelector('[data-cell="details"]').textContent = result.details;
  }
}

// Drive the shell with one line. Returns the executor's transcript
// (stdout, stderr, exit_code). Also writes the captured stdout into
// the xterm terminal so the human sees it.
async function runLine(line, { trace } = {}) {
  if (trace) trace(`$ ${line}`);
  const tokens = tokenise(line);
  const pipeline = parse(tokens);
  const out = await execute(pipeline, vfs);
  if (out.stderr) {
    if (term) term.write(`\x1b[31m${out.stderr}\x1b[0m`);
    if (trace) trace(out.stderr.replace(/\n$/, ""));
  }
  if (out.stdout && out.stdout.length > 0) {
    if (term) term.write(decodeUtf8(out.stdout));
    if (trace) trace(decodeUtf8(out.stdout).replace(/\n$/, ""));
  }
  return out;
}

function enableInteractive() {
  if (!term) return;
  term.write("\r\n");
  term.write(PROMPT);
  inputBuf = "";
  term.onData(async (data) => {
    for (const ch of data) {
      const code = ch.charCodeAt(0);
      if (ch === "\r") {
        term.write("\r\n");
        const line = inputBuf;
        inputBuf = "";
        await dispatch(line);
        term.write(PROMPT);
      } else if (code === 127 || code === 8) { // backspace
        if (inputBuf.length > 0) {
          inputBuf = inputBuf.slice(0, -1);
          term.write("\b \b");
        }
      } else if (code === 3) { // Ctrl+C
        term.write("^C\r\n");
        inputBuf = "";
        term.write(PROMPT);
      } else if (ch >= " " && ch !== "") {
        inputBuf += ch;
        term.write(ch);
      }
    }
  });
}

async function dispatch(line) {
  if (!line.trim()) return;
  try {
    const tokens = tokenise(line);
    const pipeline = parse(tokens);
    const out = await execute(pipeline, vfs);
    if (out.stderr) term.write(`\x1b[31m${out.stderr}\x1b[0m`);
    if (out.stdout && out.stdout.length > 0) term.write(decodeUtf8(out.stdout));
  } catch (err) {
    const tag = err instanceof TokeniseError ? "tokenise"
              : err instanceof ParseError ? "parse"
              : err.name || "error";
    term.write(`\x1b[31mshell ${tag}: ${err.message}\x1b[0m\r\n`);
  }
}

els.copyBtn.addEventListener("click", () => {
  const md = renderResultsMarkdown();
  navigator.clipboard.writeText(md).then(
    () => (els.status.textContent = "Results copied to clipboard."),
    (err) => (els.status.textContent = `Clipboard write failed: ${err}`)
  );
});

// Expose for headless harness so it can read the structured results
// without scraping innerText.
window.__SPIKE_B__ = {
  get results() { return results.slice(); },
  get vfsKeys() { return vfs.keys(); },
  get selfCheckTranscript() { return selfCheckTranscript.slice(); },
  pinned: { xterm: { url: XTERM_JS_URL, version: XTERM_VERSION }, fit: { version: FIT_VERSION } },
};

function renderResultsMarkdown() {
  const date = new Date().toISOString().slice(0, 10);
  const allPass = results.every((r) => r.passed);
  const rows = results
    .map((r, i) => `| ${i + 1} | ${r.name} | \`${r.command.replaceAll("|", "\\|")}\` | ${r.passed ? "✓" : "✗"} | ${r.details.replaceAll("|", "\\|")} |`)
    .join("\n");
  return [
    `### Spike B — Mini-shell pipes prototype`,
    ``,
    `**Browser**: ${navigator.userAgent}`,
    `**Date**: ${date}`,
    `**Outcome**: ${allPass ? "PASS" : "FAIL"}`,
    `**Total elapsed**: ${els.metaTotal.textContent}`,
    ``,
    `**Versions**:`,
    ``,
    `- xterm.js pinned URL: \`${XTERM_JS_URL}\``,
    `- xterm.js: \`${XTERM_VERSION}\``,
    `- @xterm/addon-fit: \`${FIT_VERSION}\``,
    ``,
    `**Self-check**:`,
    ``,
    `| # | Name | Command | Passed | Details |`,
    `|---|------|---------|--------|---------|`,
    rows,
    ``,
  ].join("\n");
}

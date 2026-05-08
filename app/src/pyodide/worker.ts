/// <reference lib="webworker" />

import { PYODIDE_INDEX_URL, PYODIDE_SCRIPT_URL } from './config';
import type {
  RunPythonRequest,
  RunRequest,
  WorkerErrorEvent,
  WorkerInbound,
  WorkerOutbound,
} from './protocol';

declare const self: DedicatedWorkerGlobalScope;

interface PyGlobals {
  set: (name: string, value: unknown) => void;
  delete: (name: string) => void;
}

interface MinimalPyodide {
  version: string;
  loadPackage: (name: string) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched?: (s: string) => void; isatty?: boolean }) => void;
  setStderr: (opts: { batched?: (s: string) => void; isatty?: boolean }) => void;
  setStdin: (opts: { stdin?: () => string; error?: boolean; autoEOF?: boolean }) => void;
  globals: PyGlobals;
}

interface PyodideGlobal {
  loadPyodide: (opts: { indexURL: string }) => Promise<MinimalPyodide>;
}

let pyodide: MinimalPyodide | null = null;

function post(msg: WorkerOutbound) {
  self.postMessage(msg);
}

function err(stage: WorkerErrorEvent['stage'], message: string) {
  post({ type: 'error', stage, message });
}

async function load() {
  if (pyodide) return;
  let stage: WorkerErrorEvent['stage'] = 'pyodide-load';
  try {
    (self as unknown as { importScripts: (url: string) => void }).importScripts(PYODIDE_SCRIPT_URL);
    const g = self as unknown as PyodideGlobal;
    if (typeof g.loadPyodide !== 'function') {
      throw new Error('loadPyodide is not exposed on the worker global after importScripts.');
    }
    pyodide = await g.loadPyodide({ indexURL: PYODIDE_INDEX_URL });

    stage = 'micropip-load';
    await pyodide.loadPackage('micropip');

    stage = 'frictionless-install';
    await pyodide.runPythonAsync(`
import micropip
await micropip.install("frictionless")
`);

    let frictionlessVersion: string | null = null;
    try {
      const v = await pyodide.runPythonAsync(`
import importlib.metadata as _m
_m.version("frictionless")
`);
      frictionlessVersion = typeof v === 'string' ? v : String(v ?? '') || null;
    } catch {
      frictionlessVersion = null;
    }

    post({ type: 'ready', pyodideVersion: pyodide.version, frictionlessVersion });
  } catch (e) {
    err(stage, e instanceof Error ? e.message : String(e));
  }
}

interface Capture {
  stdout: string;
  stderr: string;
}

function installCapture(py: MinimalPyodide): Capture {
  const cap: Capture = { stdout: '', stderr: '' };
  py.setStdout({
    batched: (s: string) => {
      cap.stdout += s + '\n';
    },
  });
  py.setStderr({
    batched: (s: string) => {
      cap.stderr += s + '\n';
    },
  });
  return cap;
}

function installStdin(py: MinimalPyodide, stdin: string | undefined) {
  if (stdin === undefined) {
    py.setStdin({ error: false, autoEOF: true, stdin: () => '' });
    return;
  }
  let consumed = false;
  py.setStdin({
    autoEOF: true,
    stdin: () => {
      if (consumed) return '';
      consumed = true;
      return stdin;
    },
  });
}

const CLI_WRAPPER = `
import sys, runpy, traceback
from js import __cli_args
_args = [str(a) for a in list(__cli_args)]
_old_argv = sys.argv
sys.argv = ['frictionless'] + _args
try:
    try:
        runpy.run_module('frictionless', run_name='__main__', alter_sys=True)
        _exit_code = 0
    except SystemExit as _e:
        if _e.code is None:
            _exit_code = 0
        elif isinstance(_e.code, int):
            _exit_code = _e.code
        else:
            sys.stderr.write(str(_e.code) + '\\n')
            _exit_code = 1
    except BaseException:
        sys.stderr.write(traceback.format_exc())
        _exit_code = 1
finally:
    sys.argv = _old_argv
_exit_code
`;

async function runCli(req: RunRequest) {
  if (!pyodide) {
    post({
      type: 'run-result',
      id: req.id,
      stdout: '',
      stderr: 'Pyodide not ready',
      exitCode: 1,
    });
    return;
  }
  const cap = installCapture(pyodide);
  installStdin(pyodide, req.stdin);
  pyodide.globals.set('__cli_args', req.args);
  let exitCode = 1;
  try {
    const result = await pyodide.runPythonAsync(CLI_WRAPPER);
    exitCode = typeof result === 'number' ? result : Number(result ?? 1);
    if (!Number.isFinite(exitCode)) exitCode = 1;
  } catch (e) {
    cap.stderr += (e instanceof Error ? e.message : String(e)) + '\n';
    exitCode = 1;
  } finally {
    try {
      pyodide.globals.delete('__cli_args');
    } catch {
      // ignore
    }
  }
  post({ type: 'run-result', id: req.id, stdout: cap.stdout, stderr: cap.stderr, exitCode });
}

async function runPython(req: RunPythonRequest) {
  if (!pyodide) {
    post({
      type: 'run-python-result',
      id: req.id,
      ok: false,
      error: 'Pyodide not ready',
      stdout: '',
      stderr: '',
    });
    return;
  }
  const cap = installCapture(pyodide);
  installStdin(pyodide, undefined);
  try {
    const result = await pyodide.runPythonAsync(req.code);
    const value = result === undefined || result === null ? '' : String(result);
    post({
      type: 'run-python-result',
      id: req.id,
      ok: true,
      value,
      stdout: cap.stdout,
      stderr: cap.stderr,
    });
  } catch (e) {
    post({
      type: 'run-python-result',
      id: req.id,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      stdout: cap.stdout,
      stderr: cap.stderr,
    });
  }
}

self.addEventListener('message', (event: MessageEvent<WorkerInbound>) => {
  const msg = event.data;
  if (!msg) return;
  if (msg.type === 'load') {
    void load();
  } else if (msg.type === 'run') {
    void runCli(msg);
  } else if (msg.type === 'run-python') {
    void runPython(msg);
  }
});

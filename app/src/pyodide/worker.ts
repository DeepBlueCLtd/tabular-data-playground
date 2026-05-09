/// <reference lib="webworker" />

import { FRICTIONLESS_VERSION, PYODIDE_INDEX_URL, PYODIDE_SCRIPT_URL } from './config';
import type {
  FsErrorPayload,
  FsRequest,
  RunPythonRequest,
  RunRequest,
  WorkerErrorEvent,
  WorkerInbound,
  WorkerOutbound,
} from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const WORKSPACE = '/workspace';

interface PyGlobals {
  set: (name: string, value: unknown) => void;
  delete: (name: string) => void;
}

interface FSStatResult {
  size: number;
  mtime: Date;
  mode: number;
}

interface PyodideFS {
  mkdir: (path: string) => void;
  mkdirTree: (path: string) => void;
  mount: (fs: unknown, opts: object, path: string) => void;
  syncfs: (populate: boolean, cb: (err: Error | null | undefined) => void) => void;
  readFile: (path: string, opts?: { encoding?: 'utf8' | 'binary' }) => string | Uint8Array;
  writeFile: (path: string, data: string | Uint8Array) => void;
  readdir: (path: string) => string[];
  stat: (path: string) => FSStatResult;
  unlink: (path: string) => void;
  rmdir: (path: string) => void;
  analyzePath: (path: string) => { exists: boolean };
  isDir: (mode: number) => boolean;
  isFile: (mode: number) => boolean;
  filesystems: { IDBFS: unknown };
}

interface MinimalPyodide {
  version: string;
  loadPackage: (name: string) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched?: (s: string) => void; isatty?: boolean }) => void;
  setStderr: (opts: { batched?: (s: string) => void; isatty?: boolean }) => void;
  setStdin: (opts: { stdin?: () => string; error?: boolean; autoEOF?: boolean }) => void;
  globals: PyGlobals;
  FS: PyodideFS;
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

function syncfs(py: MinimalPyodide, populate: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    py.FS.syncfs(populate, (e) => (e ? reject(e) : resolve()));
  });
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
await micropip.install("frictionless==${FRICTIONLESS_VERSION}")
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

    stage = 'fs-mount';
    // Ensure /workspace exists, mount IDBFS, populate from IndexedDB.
    try {
      pyodide.FS.mkdir(WORKSPACE);
    } catch {
      // already exists — fine
    }
    pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, {}, WORKSPACE);
    await syncfs(pyodide, true);
    // Frictionless rejects absolute paths; chdir into the workspace
    // once so CLI invocations see relative paths naturally.
    await pyodide.runPythonAsync(`
import os
os.chdir("${WORKSPACE}")
`);

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
import sys, runpy, traceback, os
from js import __cli_args
_args = [str(a) for a in list(__cli_args)]
_old_argv = sys.argv
sys.argv = ['frictionless'] + _args
# Stay in /workspace so relative paths resolve against the user's files.
try:
    os.chdir('/workspace')
except Exception:
    pass
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
  // CLI may have written files; sync IDBFS so they persist, and notify.
  try {
    await syncfs(pyodide, false);
    post({ type: 'fs-changed', paths: [WORKSPACE] });
  } catch {
    // sync failure should not fail the CLI call itself
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
    // Snippet may have touched the FS — sync just in case.
    try {
      await syncfs(pyodide, false);
      post({ type: 'fs-changed', paths: [WORKSPACE] });
    } catch {
      // ignore
    }
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

interface ErrnoLike {
  code?: string;
  errno?: number;
  message?: string;
}

const ERRNO_TO_CODE: Record<number, FsErrorPayload['code']> = {
  2: 'ENOENT',
  17: 'EEXIST',
  20: 'ENOTDIR',
  21: 'EISDIR',
  39: 'ENOTEMPTY',
  44: 'ENOENT',
  54: 'EEXIST',
  20020: 'EISDIR',
};

function mapFsError(e: unknown): FsErrorPayload {
  const eo = e as ErrnoLike;
  const message = eo?.message ?? (e instanceof Error ? e.message : String(e));
  const codeStr = eo?.code;
  if (
    codeStr === 'ENOENT' ||
    codeStr === 'EEXIST' ||
    codeStr === 'EISDIR' ||
    codeStr === 'ENOTDIR' ||
    codeStr === 'EPERM' ||
    codeStr === 'ENOTEMPTY'
  ) {
    return { code: codeStr, message };
  }
  if (typeof eo?.errno === 'number') {
    const mapped = ERRNO_TO_CODE[eo.errno];
    if (mapped) return { code: mapped, message };
  }
  return { code: 'EUNK', message };
}

async function postMutationSync(py: MinimalPyodide, paths: string[]) {
  try {
    await syncfs(py, false);
  } catch {
    // best-effort persist; consumers can still read the in-memory FS
  }
  post({ type: 'fs-changed', paths });
}

async function handleFs(req: FsRequest) {
  if (!pyodide) {
    post({
      type: 'fs-result',
      id: req.id,
      ok: false,
      error: { code: 'EUNK', message: 'Pyodide not ready' },
    });
    return;
  }
  const py = pyodide;
  try {
    if (req.type === 'fs-readFile') {
      const data = py.FS.readFile(req.path, { encoding: req.encoding });
      post({ type: 'fs-result', id: req.id, ok: true, value: data });
      return;
    }
    if (req.type === 'fs-writeFile') {
      py.FS.writeFile(req.path, req.content);
      await postMutationSync(py, [req.path]);
      post({ type: 'fs-result', id: req.id, ok: true });
      return;
    }
    if (req.type === 'fs-readdir') {
      const names = py.FS.readdir(req.path).filter((n) => n !== '.' && n !== '..');
      const entries = names.map((name) => {
        try {
          const st = py.FS.stat(`${req.path === '/' ? '' : req.path}/${name}`);
          return { name, kind: py.FS.isDir(st.mode) ? 'dir' : 'file' };
        } catch {
          return { name, kind: 'file' as const };
        }
      });
      entries.sort((a, b) => a.name.localeCompare(b.name));
      post({ type: 'fs-result', id: req.id, ok: true, value: entries });
      return;
    }
    if (req.type === 'fs-mkdir') {
      if (req.recursive) py.FS.mkdirTree(req.path);
      else py.FS.mkdir(req.path);
      await postMutationSync(py, [req.path]);
      post({ type: 'fs-result', id: req.id, ok: true });
      return;
    }
    if (req.type === 'fs-remove') {
      removePath(py, req.path, req.recursive);
      await postMutationSync(py, [req.path]);
      post({ type: 'fs-result', id: req.id, ok: true });
      return;
    }
    if (req.type === 'fs-stat') {
      const st = py.FS.stat(req.path);
      post({
        type: 'fs-result',
        id: req.id,
        ok: true,
        value: {
          kind: py.FS.isDir(st.mode) ? 'dir' : 'file',
          size: st.size,
          mtimeMs: st.mtime.getTime(),
        },
      });
      return;
    }
    if (req.type === 'fs-exists') {
      const result = py.FS.analyzePath(req.path);
      post({ type: 'fs-result', id: req.id, ok: true, value: result.exists });
      return;
    }
  } catch (e) {
    post({ type: 'fs-result', id: req.id, ok: false, error: mapFsError(e) });
  }
}

function removePath(py: MinimalPyodide, path: string, recursive: boolean) {
  const st = py.FS.stat(path);
  if (py.FS.isDir(st.mode)) {
    const names = py.FS.readdir(path).filter((n) => n !== '.' && n !== '..');
    if (names.length > 0 && !recursive) {
      const e = new Error(`directory not empty: ${path}`) as ErrnoLike & Error;
      e.code = 'ENOTEMPTY';
      throw e;
    }
    for (const name of names) {
      removePath(py, `${path === '/' ? '' : path}/${name}`, true);
    }
    py.FS.rmdir(path);
  } else {
    py.FS.unlink(path);
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
  } else if (
    msg.type === 'fs-readFile' ||
    msg.type === 'fs-writeFile' ||
    msg.type === 'fs-readdir' ||
    msg.type === 'fs-mkdir' ||
    msg.type === 'fs-remove' ||
    msg.type === 'fs-stat' ||
    msg.type === 'fs-exists'
  ) {
    void handleFs(msg);
  }
});

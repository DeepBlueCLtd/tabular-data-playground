/// <reference lib="webworker" />

import { PYODIDE_INDEX_URL, PYODIDE_SCRIPT_URL } from './config';
import type { LoadRequest, WorkerErrorEvent, WorkerOutbound } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

interface MinimalPyodide {
  version: string;
  loadPackage: (name: string) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
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
    // Pyodide ships a UMD that exposes loadPyodide on the worker global
    // when imported via importScripts.
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

self.addEventListener('message', (event: MessageEvent<LoadRequest>) => {
  if (event.data?.type === 'load') {
    void load();
  }
});

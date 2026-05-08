import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  PyodideContext,
  type PyodideStatus,
  type RunPythonResult,
  type RunResult,
} from './pyodide-context';
import type { WorkerOutbound } from './protocol';

interface Pending {
  resolve: (value: RunResult | RunPythonResult) => void;
  reject: (err: Error) => void;
  kind: 'run' | 'run-python';
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PyodideProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PyodideStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [pyodideVersion, setPyodideVersion] = useState<string | null>(null);
  const [frictionlessVersion, setFrictionlessVersion] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const startedRef = useRef(false);
  const pendingRef = useRef(new Map<string, Pending>());
  const inflightRef = useRef<Promise<unknown>>(Promise.resolve());
  const statusRef = useRef<PyodideStatus>('idle');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;

      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
        const msg = event.data;
        if (msg.type === 'ready') {
          setStatus('ready');
          setPyodideVersion(msg.pyodideVersion);
          setFrictionlessVersion(msg.frictionlessVersion);
        } else if (msg.type === 'error') {
          setStatus('error');
          setError(new Error(`[${msg.stage}] ${msg.message}`));
          worker.terminate();
          workerRef.current = null;
          // Reject any pending bridge calls.
          for (const p of pendingRef.current.values()) {
            p.reject(new Error(`[${msg.stage}] ${msg.message}`));
          }
          pendingRef.current.clear();
        } else if (msg.type === 'run-result') {
          const p = pendingRef.current.get(msg.id);
          if (p && p.kind === 'run') {
            pendingRef.current.delete(msg.id);
            p.resolve({ stdout: msg.stdout, stderr: msg.stderr, exitCode: msg.exitCode });
          }
        } else if (msg.type === 'run-python-result') {
          const p = pendingRef.current.get(msg.id);
          if (p && p.kind === 'run-python') {
            pendingRef.current.delete(msg.id);
            p.resolve({
              ok: msg.ok,
              value: msg.ok ? msg.value : '',
              error: msg.ok ? null : msg.error,
              stdout: msg.stdout,
              stderr: msg.stderr,
            });
          }
        }
        // 'fs-changed' is shaped here for #11/#12 — ignored for now.
      });

      worker.addEventListener('error', (event) => {
        setStatus('error');
        setError(new Error(event.message || 'Pyodide worker crashed.'));
        worker.terminate();
        workerRef.current = null;
        for (const p of pendingRef.current.values()) {
          p.reject(new Error(event.message || 'Pyodide worker crashed.'));
        }
        pendingRef.current.clear();
      });

      setStatus('loading');
      worker.postMessage({ type: 'load' });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const run = useCallback((args: string[], stdin?: string): Promise<RunResult> => {
    const next = inflightRef.current.then(
      () =>
        new Promise<RunResult>((resolve, reject) => {
          const worker = workerRef.current;
          if (!worker || statusRef.current !== 'ready') {
            reject(new Error('Pyodide not ready'));
            return;
          }
          const id = newId();
          pendingRef.current.set(id, {
            kind: 'run',
            resolve: resolve as (v: RunResult | RunPythonResult) => void,
            reject,
          });
          worker.postMessage({ type: 'run', id, args, stdin });
        }),
    );
    inflightRef.current = next.catch(() => undefined);
    return next;
  }, []);

  const runPython = useCallback((code: string): Promise<RunPythonResult> => {
    const next = inflightRef.current.then(
      () =>
        new Promise<RunPythonResult>((resolve, reject) => {
          const worker = workerRef.current;
          if (!worker || statusRef.current !== 'ready') {
            reject(new Error('Pyodide not ready'));
            return;
          }
          const id = newId();
          pendingRef.current.set(id, {
            kind: 'run-python',
            resolve: resolve as (v: RunResult | RunPythonResult) => void,
            reject,
          });
          worker.postMessage({ type: 'run-python', id, code });
        }),
    );
    inflightRef.current = next.catch(() => undefined);
    return next;
  }, []);

  const reload = useCallback(() => {
    // #30 will implement; v1 stub keeps the public API stable.
  }, []);

  // Dev-only smoke surface. Stripped from production by Vite.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (globalThis as unknown as { __pyodide?: unknown }).__pyodide = { run, runPython };
    return () => {
      delete (globalThis as unknown as { __pyodide?: unknown }).__pyodide;
    };
  }, [run, runPython]);

  const value = useMemo(
    () => ({
      status,
      error,
      pyodideVersion,
      frictionlessVersion,
      reload,
      run,
      runPython,
    }),
    [status, error, pyodideVersion, frictionlessVersion, reload, run, runPython],
  );

  return <PyodideContext.Provider value={value}>{children}</PyodideContext.Provider>;
}

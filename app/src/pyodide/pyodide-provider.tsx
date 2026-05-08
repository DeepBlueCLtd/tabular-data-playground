import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FsEventBus } from '@/fs/events';
import { createVfs, type Vfs } from '@/fs/vfs';
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
  const [vfs, setVfs] = useState<Vfs | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const startedRef = useRef(false);
  const pendingRef = useRef(new Map<string, Pending>());
  const inflightRef = useRef<Promise<unknown>>(Promise.resolve());
  const statusRef = useRef<PyodideStatus>('idle');
  const fsEventsRef = useRef(new FsEventBus());

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const schedule = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const next = inflightRef.current.then(() => fn());
    inflightRef.current = next.catch(() => undefined);
    return next;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;

      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      // Build the vfs against this worker; expose it only once ready.
      const builtVfs = createVfs({ worker, schedule });

      worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
        const msg = event.data;
        if (msg.type === 'ready') {
          setStatus('ready');
          setPyodideVersion(msg.pyodideVersion);
          setFrictionlessVersion(msg.frictionlessVersion);
          setVfs(builtVfs);
        } else if (msg.type === 'error') {
          setStatus('error');
          setError(new Error(`[${msg.stage}] ${msg.message}`));
          worker.terminate();
          workerRef.current = null;
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
        } else if (msg.type === 'fs-changed') {
          fsEventsRef.current.emit(msg.paths);
        }
        // 'fs-result' is consumed by createVfs's own listener.
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
  }, [schedule]);

  const run = useCallback(
    (args: string[], stdin?: string): Promise<RunResult> =>
      schedule(
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
      ),
    [schedule],
  );

  const runPython = useCallback(
    (code: string): Promise<RunPythonResult> =>
      schedule(
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
      ),
    [schedule],
  );

  const reload = useCallback(() => {
    // #30 will implement; v1 stub keeps the public API stable.
  }, []);

  // Dev-only smoke surface. Stripped from production by Vite.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (globalThis as unknown as { __pyodide?: unknown }).__pyodide = { run, runPython, vfs };
    return () => {
      delete (globalThis as unknown as { __pyodide?: unknown }).__pyodide;
    };
  }, [run, runPython, vfs]);

  const value = useMemo(
    () => ({
      status,
      error,
      pyodideVersion,
      frictionlessVersion,
      reload,
      run,
      runPython,
      vfs,
      fsEvents: fsEventsRef.current,
    }),
    [status, error, pyodideVersion, frictionlessVersion, reload, run, runPython, vfs],
  );

  return <PyodideContext.Provider value={value}>{children}</PyodideContext.Provider>;
}

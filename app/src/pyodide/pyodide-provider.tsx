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
  const [running, setRunning] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const startedRef = useRef(false);
  const pendingRef = useRef(new Map<string, Pending>());
  const inflightRef = useRef<Promise<unknown>>(Promise.resolve());
  const statusRef = useRef<PyodideStatus>('idle');
  const fsEventsRef = useRef(new FsEventBus());
  const runningCountRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const schedule = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const next = inflightRef.current.then(() => fn());
    inflightRef.current = next.catch(() => undefined);
    return next;
  }, []);

  const bumpRunning = useCallback((delta: number) => {
    runningCountRef.current = Math.max(0, runningCountRef.current + delta);
    setRunning(runningCountRef.current > 0);
  }, []);

  const attachWorkerListeners = useCallback(
    (worker: Worker) => {
      const builtVfs = createVfs({ worker, schedule });

      worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
        const msg = event.data;
        if (msg.type === 'ready') {
          setStatus('ready');
          setPyodideVersion(msg.pyodideVersion);
          setFrictionlessVersion(msg.frictionlessVersion);
          setError(null);
          setVfs(builtVfs);
        } else if (msg.type === 'error') {
          setStatus('error');
          setError(new Error(`[${msg.stage}] ${msg.message}`));
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          for (const p of pendingRef.current.values()) {
            p.reject(new Error(`[${msg.stage}] ${msg.message}`));
          }
          pendingRef.current.clear();
          runningCountRef.current = 0;
          setRunning(false);
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
        if (workerRef.current === worker) workerRef.current = null;
        for (const p of pendingRef.current.values()) {
          p.reject(new Error(event.message || 'Pyodide worker crashed.'));
        }
        pendingRef.current.clear();
        runningCountRef.current = 0;
        setRunning(false);
      });
    },
    [schedule],
  );

  const spawnWorker = useCallback(() => {
    // Classic worker (no `type: 'module'`): module workers cannot call
    // importScripts(), which is how Pyodide's UMD bundle is loaded
    // inside the worker. Vite still bundles the TS source for classic
    // workers; only the runtime module type changes.
    const worker = new Worker(new URL('./worker.ts', import.meta.url));
    workerRef.current = worker;
    setVfs(null);
    setStatus('loading');
    attachWorkerListeners(worker);
    worker.postMessage({ type: 'load' });
  }, [attachWorkerListeners]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;
      spawnWorker();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [spawnWorker]);

  const cancel = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    // Reject all pending bridge calls before tearing down.
    for (const p of pendingRef.current.values()) {
      p.reject(new Error('Cancelled'));
    }
    pendingRef.current.clear();
    runningCountRef.current = 0;
    setRunning(false);
    worker.terminate();
    workerRef.current = null;
    spawnWorker();
  }, [spawnWorker]);

  const run = useCallback(
    (
      args: string[],
      stdin?: string,
      cwd?: string,
      program?: 'frictionless' | 'livemark',
    ): Promise<RunResult> => {
      const promise = schedule(
        () =>
          new Promise<RunResult>((resolve, reject) => {
            const worker = workerRef.current;
            if (!worker || statusRef.current !== 'ready') {
              reject(new Error('Pyodide not ready'));
              return;
            }
            const id = newId();
            bumpRunning(1);
            pendingRef.current.set(id, {
              kind: 'run',
              resolve: resolve as (v: RunResult | RunPythonResult) => void,
              reject,
            });
            worker.postMessage({ type: 'run', id, args, stdin, cwd, program });
          }),
      );
      const finalize = () => bumpRunning(-1);
      promise.then(finalize, finalize);
      return promise;
    },
    [schedule, bumpRunning],
  );

  const runPython = useCallback(
    (code: string): Promise<RunPythonResult> => {
      const promise = schedule(
        () =>
          new Promise<RunPythonResult>((resolve, reject) => {
            const worker = workerRef.current;
            if (!worker || statusRef.current !== 'ready') {
              reject(new Error('Pyodide not ready'));
              return;
            }
            const id = newId();
            bumpRunning(1);
            pendingRef.current.set(id, {
              kind: 'run-python',
              resolve: resolve as (v: RunResult | RunPythonResult) => void,
              reject,
            });
            worker.postMessage({ type: 'run-python', id, code });
          }),
      );
      const finalize = () => bumpRunning(-1);
      promise.then(finalize, finalize);
      return promise;
    },
    [schedule, bumpRunning],
  );

  const reload = useCallback(() => {
    // Works whether or not a worker is currently alive (covers
    // crash-recovery from `status === 'error'` where workerRef
    // was nulled out).
    for (const p of pendingRef.current.values()) {
      p.reject(new Error('Reloaded'));
    }
    pendingRef.current.clear();
    runningCountRef.current = 0;
    setRunning(false);
    const worker = workerRef.current;
    if (worker) {
      worker.terminate();
      workerRef.current = null;
    }
    spawnWorker();
  }, [spawnWorker]);

  // Dev-only smoke surface. Stripped from production by Vite.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (globalThis as unknown as { __pyodide?: unknown }).__pyodide = {
      run,
      runPython,
      vfs,
      cancel,
    };
    return () => {
      delete (globalThis as unknown as { __pyodide?: unknown }).__pyodide;
    };
  }, [run, runPython, vfs, cancel]);

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
      running,
      cancel,
    }),
    [
      status,
      error,
      pyodideVersion,
      frictionlessVersion,
      reload,
      run,
      runPython,
      vfs,
      running,
      cancel,
    ],
  );

  return <PyodideContext.Provider value={value}>{children}</PyodideContext.Provider>;
}

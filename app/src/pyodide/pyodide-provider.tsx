import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PyodideContext, type PyodideStatus } from './pyodide-context';
import type { WorkerOutbound } from './protocol';

export function PyodideProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PyodideStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [pyodideVersion, setPyodideVersion] = useState<string | null>(null);
  const [frictionlessVersion, setFrictionlessVersion] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Lazy: yield to first paint before kicking off the heavy load.
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
        }
      });

      worker.addEventListener('error', (event) => {
        setStatus('error');
        setError(new Error(event.message || 'Pyodide worker crashed.'));
        worker.terminate();
        workerRef.current = null;
      });

      setStatus('loading');
      worker.postMessage({ type: 'load' });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      // Intentionally do not terminate on unmount: the provider sits at
      // the tree root and unmount only happens on full teardown.
    };
  }, []);

  const reload = useCallback(() => {
    // #30 will implement; v1 stub keeps the public API stable.
  }, []);

  const value = useMemo(
    () => ({ status, error, pyodideVersion, frictionlessVersion, reload }),
    [status, error, pyodideVersion, frictionlessVersion, reload],
  );

  return <PyodideContext.Provider value={value}>{children}</PyodideContext.Provider>;
}

import { createContext } from 'react';
import type { FsEventBus } from '@/fs/events';
import type { Vfs } from '@/fs/vfs';

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface RunPythonResult {
  ok: boolean;
  value: string;
  error: string | null;
  stdout: string;
  stderr: string;
}

export interface PyodideContextValue {
  status: PyodideStatus;
  error: Error | null;
  pyodideVersion: string | null;
  frictionlessVersion: string | null;
  /** Reload the runtime. No-op stub until #30 implements it. */
  reload: () => void;
  /**
   * Invoke a CLI (frictionless by default, or livemark) via the Pyodide
   * bridge. Rejects before ready.
   */
  run: (
    args: string[],
    stdin?: string,
    cwd?: string,
    program?: 'frictionless' | 'livemark',
  ) => Promise<RunResult>;
  /** Escape hatch — evaluate raw Python. Rejects before ready. */
  runPython: (code: string) => Promise<RunPythonResult>;
  /** Virtual FS over the worker's IDBFS. Null until status === 'ready'. */
  vfs: Vfs | null;
  /** Pub-sub bus for fs-changed events fanned out from the worker. */
  fsEvents: FsEventBus;
  /** True while at least one run / runPython call is in-flight. */
  running: boolean;
  /** Terminate the worker, reject pending calls, and re-init Pyodide. */
  cancel: () => void;
}

export const PyodideContext = createContext<PyodideContextValue | null>(null);

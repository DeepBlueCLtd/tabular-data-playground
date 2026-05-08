import { createContext } from 'react';

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
  /** Invoke the frictionless CLI via the Pyodide bridge. Rejects before ready. */
  run: (args: string[], stdin?: string) => Promise<RunResult>;
  /** Escape hatch — evaluate raw Python. Rejects before ready. */
  runPython: (code: string) => Promise<RunPythonResult>;
}

export const PyodideContext = createContext<PyodideContextValue | null>(null);

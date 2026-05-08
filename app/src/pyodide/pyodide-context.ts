import { createContext } from 'react';

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PyodideContextValue {
  status: PyodideStatus;
  error: Error | null;
  pyodideVersion: string | null;
  frictionlessVersion: string | null;
  /** Reload the runtime. No-op stub until #30 implements it. */
  reload: () => void;
}

export const PyodideContext = createContext<PyodideContextValue | null>(null);

import { useSyncExternalStore } from 'react';

export type TerminalSubmit = (line: string) => Promise<void>;

let registered: TerminalSubmit | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

export function setTerminalSubmit(fn: TerminalSubmit | null): void {
  if (registered === fn) return;
  registered = fn;
  notify();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): TerminalSubmit | null {
  return registered;
}

function getServerSnapshot(): TerminalSubmit | null {
  return null;
}

export function useTerminalSubmit(): TerminalSubmit | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

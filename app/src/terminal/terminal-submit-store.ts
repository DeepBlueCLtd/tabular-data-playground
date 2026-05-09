import { useSyncExternalStore } from 'react';

export type TerminalSubmit = (line: string) => Promise<void>;

let registered: TerminalSubmit | null = null;
let running = false;
let lastRunSource: string | null = null;

const submitListeners = new Set<() => void>();
const runningListeners = new Set<() => void>();
const lastRunListeners = new Set<() => void>();

function notify(set: Set<() => void>): void {
  for (const l of set) l();
}

export function setTerminalSubmit(fn: TerminalSubmit | null): void {
  if (registered === fn) return;
  registered = fn;
  notify(submitListeners);
}

export function setTerminalRunning(value: boolean): void {
  if (running === value) return;
  running = value;
  notify(runningListeners);
}

export function setLastRunSource(source: string | null): void {
  if (lastRunSource === source) return;
  lastRunSource = source;
  notify(lastRunListeners);
}

function makeSubscribe(set: Set<() => void>) {
  return (cb: () => void) => {
    set.add(cb);
    return () => {
      set.delete(cb);
    };
  };
}

const submitGet = (): TerminalSubmit | null => registered;
const runningGet = (): boolean => running;
const lastRunGet = (): string | null => lastRunSource;
const submitGetServer = (): TerminalSubmit | null => null;
const runningGetServer = (): boolean => false;
const lastRunGetServer = (): string | null => null;

export function useTerminalSubmit(): TerminalSubmit | null {
  return useSyncExternalStore(makeSubscribe(submitListeners), submitGet, submitGetServer);
}

export function useTerminalRunning(): boolean {
  return useSyncExternalStore(makeSubscribe(runningListeners), runningGet, runningGetServer);
}

export function useLastRunSource(): string | null {
  return useSyncExternalStore(makeSubscribe(lastRunListeners), lastRunGet, lastRunGetServer);
}

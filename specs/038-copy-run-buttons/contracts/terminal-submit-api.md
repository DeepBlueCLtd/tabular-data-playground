# Public surface — `app/src/terminal/terminal-submit-store.ts`

```ts
export type TerminalSubmit = (line: string) => Promise<void>;

export function setTerminalSubmit(fn: TerminalSubmit | null): void;
// Called by the terminal panel on mount/unmount. Internal use only.

export function useTerminalSubmit(): TerminalSubmit | null;
// React hook. Returns the registered submit fn, or null when no
// terminal is mounted / Pyodide is not yet ready (terminal panel
// renders the disabled-state placeholder).
```

When `submit(line)` is called:

1. The terminal display writes the line as if typed (with the
   prompt prefix and a trailing newline).
2. The terminal's existing `onCommand` handler is invoked, running
   the mini-shell pipeline.
3. The returned promise resolves after the command completes.

Concurrent calls are not supported — if `submit` is called while a
previous submit is in flight, the second call queues *behind*
xterm's busy ref (the current command must finish first; this is
the same behaviour as user-typed input).

import { PyodideLoadingIndicator } from '@/pyodide/pyodide-loading-indicator';
import { usePyodide } from '@/pyodide/use-pyodide';

export function TerminalPanel() {
  const { status, running, cancel, reload } = usePyodide();
  const ready = status === 'ready';
  const errored = status === 'error';

  return (
    <section
      aria-label="Terminal"
      className="flex h-full flex-col overflow-hidden border-t border-border bg-background"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Terminal
        </span>
        <div className="flex items-center gap-3">
          {running && (
            <button
              type="button"
              onClick={cancel}
              className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted"
              aria-label="Cancel running command"
            >
              Cancel
            </button>
          )}
          {errored && (
            <button
              type="button"
              onClick={reload}
              className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted"
              aria-label="Reload Python runtime"
            >
              Reload runtime
            </button>
          )}
          <PyodideLoadingIndicator />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3 font-mono text-xs">
        {ready ? (
          <span className="text-muted-foreground">xterm.js + mini-shell land here (#21).</span>
        ) : (
          <div
            role="textbox"
            aria-disabled="true"
            aria-label="Terminal prompt (disabled while Python loads)"
            tabIndex={-1}
            className="select-none text-muted-foreground opacity-60"
          >
            <span aria-hidden>$ </span>
          </div>
        )}
      </div>
    </section>
  );
}

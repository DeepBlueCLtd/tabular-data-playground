import { PyodideLoadingIndicator } from '@/pyodide/pyodide-loading-indicator';
import { usePyodide } from '@/pyodide/use-pyodide';

export function TerminalPanel() {
  const { status } = usePyodide();
  const ready = status === 'ready';

  return (
    <section
      aria-label="Terminal"
      className="flex h-full flex-col overflow-hidden border-t border-border bg-background"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Terminal
        </span>
        <PyodideLoadingIndicator />
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

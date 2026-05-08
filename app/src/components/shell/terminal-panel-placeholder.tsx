export function TerminalPanelPlaceholder() {
  return (
    <section
      aria-label="Terminal"
      className="flex h-full flex-col overflow-hidden border-t border-border bg-background"
    >
      <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Terminal
      </div>
      <div className="flex flex-1 items-center justify-center p-4 font-mono text-xs text-muted-foreground">
        xterm.js + mini-shell land here (#21–#26).
      </div>
    </section>
  );
}

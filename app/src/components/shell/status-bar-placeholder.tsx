export function StatusBarPlaceholder() {
  return (
    <footer
      aria-label="Status bar"
      className="flex h-6 items-center justify-between border-t border-border bg-muted/40 px-3 text-xs text-muted-foreground"
    >
      <span>Ready</span>
      <span>Status bar lands via #18</span>
    </footer>
  );
}

import { PyodideLoadingIndicator } from '@/pyodide/pyodide-loading-indicator';

export function StatusBarPlaceholder() {
  return (
    <footer
      aria-label="Status bar"
      className="flex h-6 items-center justify-between border-t border-border bg-muted/40 px-3 text-xs text-muted-foreground"
    >
      <span>Ready</span>
      <div className="flex items-center gap-4">
        <span>Status bar lands via #18</span>
        <PyodideLoadingIndicator variant="compact" />
      </div>
    </footer>
  );
}

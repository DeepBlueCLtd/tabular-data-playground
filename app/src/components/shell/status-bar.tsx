import { PyodideLoadingIndicator } from '@/pyodide/pyodide-loading-indicator';
import { useEditorFocus } from '@/editor/use-editor-focus';
import { useEditorTabs } from '@/editor/use-editor-tabs';
import { schemaForPath } from '@/editor/schema-for-path';

export function StatusBar() {
  const { tabs, activeTabId, isSaving } = useEditorTabs();
  const { cursor } = useEditorFocus();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const schema = schemaForPath(activeTab?.path);

  let saveState = '—';
  if (activeTab) {
    if (isSaving(activeTab.id)) saveState = 'Saving…';
    else if (activeTab.dirty) saveState = 'Modified';
    else saveState = 'Saved';
  }

  return (
    <footer
      aria-label="Status bar"
      className="flex h-6 items-center justify-between gap-4 border-t border-border bg-muted/40 px-3 text-xs text-muted-foreground"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="truncate">{activeTab?.path ?? 'No file open'}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{cursor ? `Ln ${cursor.line}, Col ${cursor.column}` : '—'}</span>
        <span>UTF-8</span>
        <span>{schema ?? 'No schema'}</span>
        <span>{saveState}</span>
        <PyodideLoadingIndicator variant="compact" />
      </div>
    </footer>
  );
}

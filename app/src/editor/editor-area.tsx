import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTheme } from '@/theme/use-theme';
import { useVfs } from '@/fs/use-vfs';
import { useFsChanged } from '@/fs/use-fs-changed';
import { MONACO_CDN_VS_URL } from './config';
import { registerJsonSchemas } from './json-schemas';
import { languageForPath } from './language';
import type { EditorTab } from './types';
import { useEditorFocus } from './use-editor-focus';
import { useEditorTabs } from './use-editor-tabs';

const MonacoEditor = lazy(() =>
  import('@monaco-editor/react').then((m) => ({ default: m.Editor })),
);

const SAMPLE_PATH = '/workspace/sample.csv';
const SAMPLE_CONTENT = 'id,name,score\n1,Ada,42\n2,Linus,99\n3,Grace,73\n';

function configureMonacoLoader() {
  void import('@monaco-editor/react').then(({ loader }) => {
    loader.config({ paths: { vs: MONACO_CDN_VS_URL } });
  });
}

interface MonacoPaneProps {
  tab: EditorTab;
  reportCursor: boolean;
  onChange: (value: string) => void;
}

function MonacoPane({ tab, reportCursor, onChange }: MonacoPaneProps) {
  const { theme } = useTheme();
  const { setCursor } = useEditorFocus();

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading editor…
        </div>
      }
    >
      <MonacoEditor
        key={tab.id}
        path={tab.path}
        value={tab.content}
        language={languageForPath(tab.path)}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        onMount={(ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
          registerJsonSchemas(monaco);
          if (reportCursor) {
            const pos = ed.getPosition();
            if (pos) setCursor({ line: pos.lineNumber, column: pos.column });
            ed.onDidChangeCursorPosition((e) => {
              setCursor({ line: e.position.lineNumber, column: e.position.column });
            });
          }
        }}
        onChange={(value) => {
          onChange(value ?? '');
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </Suspense>
  );
}

function isHtmlPath(path: string): boolean {
  return /\.html?$/i.test(path);
}

/**
 * Renders an HTML file in a sandboxed iframe. Reads the file fresh from the
 * VFS (the source of truth — the file may have just been rebuilt by
 * `livemark build`) and re-reads on any workspace change. The iframe is
 * sandboxed to `allow-scripts` only: scripts (MathJax, DataTables) run, but
 * the framed page cannot reach back into the host app (no allow-same-origin).
 * Livemark's CDN assets load at view time; offline the page degrades to its
 * inline content (the table rows are embedded, so they still show).
 */
function HtmlPreviewPane({ path }: { path: string }) {
  const { vfs } = useVfs();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!vfs) return;
    try {
      const content = await vfs.readFile(path);
      // Only swap srcDoc when the bytes actually changed, so unrelated FS
      // events don't reload the iframe (and re-fetch its CDN assets).
      setHtml((prev) => (prev === content ? prev : content));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [vfs, path]);

  useEffect(() => {
    void load();
  }, [load]);
  useFsChanged(() => {
    void load();
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-7 items-center justify-between border-b border-border bg-muted/40 px-3 text-xs text-muted-foreground">
        <span className="truncate">preview: {path.split('/').pop()}</span>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded px-1 hover:bg-muted"
          aria-label="Refresh preview"
        >
          ↻ Refresh
        </button>
      </div>
      <div className="flex-1 overflow-hidden bg-white">
        {error ? (
          <div className="p-4 text-sm text-destructive">Preview unavailable: {error}</div>
        ) : html === null ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading preview…
          </div>
        ) : (
          <iframe
            title={`Preview of ${path}`}
            srcDoc={html}
            sandbox="allow-scripts allow-popups"
            referrerPolicy="no-referrer"
            className="h-full w-full border-0 bg-white"
          />
        )}
      </div>
    </div>
  );
}

export function EditorArea() {
  const { tabs, activeTabId, open, close, setActive, setBuffer } = useEditorTabs();
  const { vfs } = useVfs();
  const { setCursor } = useEditorFocus();
  const [loaderConfigured, setLoaderConfigured] = useState(false);
  const [secondaryTabId, setSecondaryTabId] = useState<string | null>(null);
  // Ids of HTML tabs currently showing the rendered preview instead of source.
  const [previewTabs, setPreviewTabs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (activeTabId === null) setCursor(null);
  }, [activeTabId, setCursor]);

  useEffect(() => {
    if (loaderConfigured) return;
    configureMonacoLoader();
    setLoaderConfigured(true);
  }, [loaderConfigured]);

  // If the secondary tab is closed, drop it.
  useEffect(() => {
    if (secondaryTabId && !tabs.some((t) => t.id === secondaryTabId)) {
      setSecondaryTabId(null);
    }
  }, [tabs, secondaryTabId]);

  // Forget preview state for tabs that have closed.
  useEffect(() => {
    setPreviewTabs((prev) => {
      const next = new Set([...prev].filter((id) => tabs.some((t) => t.id === id)));
      return next.size === prev.size ? prev : next;
    });
  }, [tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const secondaryTab = (secondaryTabId && tabs.find((t) => t.id === secondaryTabId)) || null;
  const activeIsHtml = activeTab ? isHtmlPath(activeTab.path) : false;
  const activePreviewing = activeTab ? previewTabs.has(activeTab.id) : false;

  function togglePreview(tabId: string) {
    setPreviewTabs((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }

  const primaryPane = activeTab ? (
    activeIsHtml && activePreviewing ? (
      <HtmlPreviewPane path={activeTab.path} />
    ) : (
      <MonacoPane
        tab={activeTab}
        reportCursor
        onChange={(value) => setBuffer(activeTab.id, value)}
      />
    )
  ) : null;

  function cycleSecondaryTab() {
    if (tabs.length === 0) return;
    const currentIdx = secondaryTabId ? tabs.findIndex((t) => t.id === secondaryTabId) : -1;
    const next = tabs[(currentIdx + 1) % tabs.length];
    if (next) setSecondaryTabId(next.id);
  }

  async function handleOpenSample() {
    if (!vfs) return;
    const exists = await vfs.exists(SAMPLE_PATH);
    if (!exists) {
      await vfs.writeFile(SAMPLE_PATH, SAMPLE_CONTENT);
    }
    await open(SAMPLE_PATH);
  }

  return (
    <section
      aria-label="Editor area"
      className="flex h-full flex-col overflow-hidden bg-background"
    >
      <div className="flex h-9 items-stretch border-b border-border bg-muted/40">
        {tabs.length === 0 ? (
          <span className="flex items-center px-3 text-xs uppercase tracking-wide text-muted-foreground">
            Editor
          </span>
        ) : (
          <ul className="flex flex-1 items-stretch overflow-x-auto">
            {tabs.map((tab) => {
              const fileName = tab.path.split('/').pop() ?? tab.path;
              const isActive = tab.id === activeTabId;
              return (
                <li
                  key={tab.id}
                  className={`group flex items-center gap-2 border-r border-border px-3 text-xs ${
                    isActive ? 'bg-background' : 'bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActive(tab.id)}
                    className={`flex items-center gap-1 ${tab.missing ? 'line-through' : ''}`}
                  >
                    <span>{fileName}</span>
                    {tab.dirty && <span aria-label="Unsaved changes">•</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void close(tab.id);
                    }}
                    className="opacity-50 hover:opacity-100"
                    aria-label={`Close ${fileName}`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {tabs.length > 0 && (
          <div className="flex items-center gap-2 pr-2">
            {activeIsHtml && (
              <button
                type="button"
                onClick={() => activeTabId && togglePreview(activeTabId)}
                className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted"
                aria-pressed={activePreviewing}
              >
                {activePreviewing ? 'Code' : 'Preview'}
              </button>
            )}
            {secondaryTabId === null ? (
              <button
                type="button"
                disabled={!activeTabId}
                onClick={() => setSecondaryTabId(activeTabId)}
                className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
              >
                Split editor
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSecondaryTabId(null)}
                className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted"
              >
                Close split
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab ? (
          secondaryTab ? (
            <PanelGroup direction="horizontal" autoSaveId="fde-editor-split">
              <Panel defaultSize={50} minSize={20}>
                {primaryPane}
              </Panel>
              <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-ring" />
              <Panel defaultSize={50} minSize={20}>
                <div className="flex h-full flex-col">
                  <div className="flex h-7 items-center justify-between border-b border-border bg-muted/40 px-3 text-xs text-muted-foreground">
                    <span className="truncate">viewing: {secondaryTab.path}</span>
                    <button
                      type="button"
                      onClick={cycleSecondaryTab}
                      className="rounded px-1 hover:bg-muted"
                      aria-label="Cycle file in split pane"
                    >
                      ▸
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <MonacoPane
                      tab={secondaryTab}
                      reportCursor={false}
                      onChange={(value) => setBuffer(secondaryTab.id, value)}
                    />
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          ) : (
            primaryPane
          )
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
            <p>No file open.</p>
            <button
              type="button"
              onClick={handleOpenSample}
              disabled={!vfs}
              className="rounded border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
            >
              + Open sample CSV
            </button>
            <p className="text-xs opacity-70">
              Use the file tree (Files panel) or drag-and-drop to add files.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

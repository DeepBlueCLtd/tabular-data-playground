import { lazy, Suspense, useEffect, useState } from 'react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTheme } from '@/theme/use-theme';
import { useVfs } from '@/fs/use-vfs';
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

export function EditorArea() {
  const { tabs, activeTabId, open, close, setActive, setBuffer } = useEditorTabs();
  const { vfs } = useVfs();
  const { setCursor } = useEditorFocus();
  const [loaderConfigured, setLoaderConfigured] = useState(false);
  const [secondaryTabId, setSecondaryTabId] = useState<string | null>(null);

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

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const secondaryTab = (secondaryTabId && tabs.find((t) => t.id === secondaryTabId)) || null;

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
          <div className="flex items-center pr-2">
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
                <MonacoPane
                  tab={activeTab}
                  reportCursor
                  onChange={(value) => setBuffer(activeTab.id, value)}
                />
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
            <MonacoPane
              tab={activeTab}
              reportCursor
              onChange={(value) => setBuffer(activeTab.id, value)}
            />
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

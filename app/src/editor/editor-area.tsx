import { lazy, Suspense, useEffect, useState } from 'react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTheme } from '@/theme/use-theme';
import { useVfs } from '@/fs/use-vfs';
import { MONACO_CDN_VS_URL } from './config';
import { registerJsonSchemas } from './json-schemas';
import { languageForPath } from './language';
import { useEditorFocus } from './use-editor-focus';
import { useEditorTabs } from './use-editor-tabs';

const MonacoEditor = lazy(() =>
  import('@monaco-editor/react').then((m) => ({ default: m.Editor })),
);

const SAMPLE_PATH = '/workspace/sample.csv';
const SAMPLE_CONTENT = 'id,name,score\n1,Ada,42\n2,Linus,99\n3,Grace,73\n';

function configureMonacoLoader() {
  // Lazy-import the loader so it isn't on the main chunk path until
  // the editor area first mounts.
  void import('@monaco-editor/react').then(({ loader }) => {
    loader.config({ paths: { vs: MONACO_CDN_VS_URL } });
  });
}

export function EditorArea() {
  const { tabs, activeTabId, open, close, setActive, setBuffer } = useEditorTabs();
  const { theme } = useTheme();
  const { vfs } = useVfs();
  const { setCursor } = useEditorFocus();
  const [loaderConfigured, setLoaderConfigured] = useState(false);

  useEffect(() => {
    if (activeTabId === null) setCursor(null);
  }, [activeTabId, setCursor]);

  useEffect(() => {
    if (loaderConfigured) return;
    configureMonacoLoader();
    setLoaderConfigured(true);
  }, [loaderConfigured]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

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
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab ? (
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Loading editor…
              </div>
            }
          >
            <MonacoEditor
              key={activeTab.id}
              path={activeTab.path}
              value={activeTab.content}
              language={languageForPath(activeTab.path)}
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              onMount={(ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
                registerJsonSchemas(monaco);
                const pos = ed.getPosition();
                if (pos) setCursor({ line: pos.lineNumber, column: pos.column });
                ed.onDidChangeCursorPosition((e) => {
                  setCursor({ line: e.position.lineNumber, column: e.position.column });
                });
              }}
              onChange={(value) => {
                setBuffer(activeTab.id, value ?? '');
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </Suspense>
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
              File tree (#15) and drag-and-drop (#17) land later.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

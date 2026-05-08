import { AppShell } from '@/components/shell/app-shell';
import { EditorFocusProvider } from '@/editor/editor-focus-provider';
import { EditorTabsProvider } from '@/editor/editor-tabs-provider';
import { PyodideProvider } from '@/pyodide/pyodide-provider';
import { ThemeProvider } from '@/theme/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <PyodideProvider>
        <EditorTabsProvider>
          <EditorFocusProvider>
            <AppShell />
          </EditorFocusProvider>
        </EditorTabsProvider>
      </PyodideProvider>
    </ThemeProvider>
  );
}

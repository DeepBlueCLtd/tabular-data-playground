import { AppShell } from '@/components/shell/app-shell';
import { EditorTabsProvider } from '@/editor/editor-tabs-provider';
import { PyodideProvider } from '@/pyodide/pyodide-provider';
import { ThemeProvider } from '@/theme/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <PyodideProvider>
        <EditorTabsProvider>
          <AppShell />
        </EditorTabsProvider>
      </PyodideProvider>
    </ThemeProvider>
  );
}

import { AppShell } from '@/components/shell/app-shell';
import { PyodideProvider } from '@/pyodide/pyodide-provider';
import { ThemeProvider } from '@/theme/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <PyodideProvider>
        <AppShell />
      </PyodideProvider>
    </ThemeProvider>
  );
}

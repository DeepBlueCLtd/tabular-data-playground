import { AppShell } from '@/components/shell/app-shell';
import { ThemeProvider } from '@/theme/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

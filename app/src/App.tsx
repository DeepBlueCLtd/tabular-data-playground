import { AppShell } from '@/components/shell/app-shell';
import { EditorFocusProvider } from '@/editor/editor-focus-provider';
import { EditorTabsProvider } from '@/editor/editor-tabs-provider';
import { LandingPage } from '@/landing/landing-page';
import { NoWasmScreen } from '@/landing/no-wasm-screen';
import { useLandingState } from '@/landing/use-landing-state';
import { PyodideProvider } from '@/pyodide/pyodide-provider';
import { usePyodide } from '@/pyodide/use-pyodide';
import { ThemeProvider } from '@/theme/theme-provider';

// If the worker reports back that WebAssembly is missing, swap the
// IDE for a friendly explanation. We can't gate on `typeof
// WebAssembly` at module load — some Chrome extensions strip it
// during early parse and restore it shortly after, which gave a
// false-positive block on machines that can actually run Pyodide.
function PyodideErrorGate({ children }: { children: React.ReactNode }) {
  const { status, error } = usePyodide();
  if (status === 'error' && /WebAssembly is not defined/i.test(error?.message ?? '')) {
    return <NoWasmScreen />;
  }
  return <>{children}</>;
}

export default function App() {
  const landing = useLandingState();
  return (
    <ThemeProvider>
      <PyodideProvider>
        <PyodideErrorGate>
          <EditorTabsProvider>
            <EditorFocusProvider>
              <AppShell onReshowLanding={landing.reshow} />
              {landing.hidden ? null : <LandingPage onStart={landing.markSeen} />}
            </EditorFocusProvider>
          </EditorTabsProvider>
        </PyodideErrorGate>
      </PyodideProvider>
    </ThemeProvider>
  );
}

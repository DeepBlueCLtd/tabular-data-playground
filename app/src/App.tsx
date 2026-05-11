import { AppShell } from '@/components/shell/app-shell';
import { EditorFocusProvider } from '@/editor/editor-focus-provider';
import { EditorTabsProvider } from '@/editor/editor-tabs-provider';
import { LandingPage } from '@/landing/landing-page';
import { NoWasmScreen } from '@/landing/no-wasm-screen';
import { useLandingState } from '@/landing/use-landing-state';
import { PyodideProvider } from '@/pyodide/pyodide-provider';
import { ThemeProvider } from '@/theme/theme-provider';

const HAS_WASM = typeof WebAssembly !== 'undefined';

export default function App() {
  const landing = useLandingState();
  if (!HAS_WASM) {
    return (
      <ThemeProvider>
        <NoWasmScreen />
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider>
      <PyodideProvider>
        <EditorTabsProvider>
          <EditorFocusProvider>
            <AppShell onReshowLanding={landing.reshow} />
            {landing.hidden ? null : <LandingPage onStart={landing.markSeen} />}
          </EditorFocusProvider>
        </EditorTabsProvider>
      </PyodideProvider>
    </ThemeProvider>
  );
}

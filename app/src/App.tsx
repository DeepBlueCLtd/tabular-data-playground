import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeProvider } from '@/theme/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <span className="text-sm font-medium">Frictionless Data Explorer</span>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-2xl font-semibold">Scaffold ready</h1>
          <p className="text-sm text-muted-foreground">
            Tailwind v4 + shadcn-style primitives + theme provider wired in.
          </p>
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

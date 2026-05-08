import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 bg-background p-8 text-foreground">
      <h1 className="text-2xl font-semibold">Frictionless Data Explorer</h1>
      <p className="text-sm text-muted-foreground">
        Scaffold ready — Tailwind v4 + shadcn-style primitives wired in.
      </p>
      <div className="flex gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
      </div>
    </main>
  );
}

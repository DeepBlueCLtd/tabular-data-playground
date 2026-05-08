export function EditorAreaPlaceholder() {
  return (
    <section
      aria-label="Editor area"
      className="flex h-full flex-col overflow-hidden bg-background"
    >
      <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Editor
      </div>
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        <p>Monaco tabs land here (#13). JSON Schema via #14.</p>
      </div>
    </section>
  );
}

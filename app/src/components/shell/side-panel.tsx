import type { ActivityEntry } from './activity-bar';

interface SidePanelProps {
  active: ActivityEntry;
}

export function SidePanel({ active }: SidePanelProps) {
  return (
    <aside className="flex h-full flex-col overflow-hidden bg-background">
      <header className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {active === 'lessons' ? 'Lessons' : 'Files'}
      </header>
      <div className="flex-1 overflow-auto p-3 text-sm text-muted-foreground">
        {active === 'lessons' ? (
          <p>Curriculum index lands here (#37). Lesson content via #38.</p>
        ) : (
          <p>File tree lands here (#15). Right-click menu via #16. DnD import via #17.</p>
        )}
      </div>
    </aside>
  );
}

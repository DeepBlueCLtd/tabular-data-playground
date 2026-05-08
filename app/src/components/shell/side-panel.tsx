import { DragDropImporter } from '@/file-tree/drag-drop-importer';
import { FileTree } from '@/file-tree/file-tree';
import { ResetWorkspaceButton } from '@/file-tree/reset-workspace-button';
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
      {active === 'lessons' ? (
        <div className="flex-1 overflow-auto p-3 text-sm text-muted-foreground">
          <p>Curriculum index lands here (#37). Lesson content via #38.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <DragDropImporter>
            <FileTree />
          </DragDropImporter>
          <ResetWorkspaceButton />
        </div>
      )}
    </aside>
  );
}

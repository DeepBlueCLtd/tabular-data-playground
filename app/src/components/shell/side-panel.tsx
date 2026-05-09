import { useState } from 'react';
import { DragDropImporter } from '@/file-tree/drag-drop-importer';
import { FileTree } from '@/file-tree/file-tree';
import { ResetWorkspaceButton } from '@/file-tree/reset-workspace-button';
import { CurriculumIndex, LessonView, getLessonIndex } from '@/lessons';
import type { ActivityEntry } from './activity-bar';

interface SidePanelProps {
  active: ActivityEntry;
}

function LessonsPane() {
  const index = getLessonIndex();
  const [selected, setSelected] = useState<string | null>(null);

  if (selected === null) {
    return (
      <div className="flex flex-1 flex-col overflow-auto p-3 text-sm">
        <CurriculumIndex entries={index.entries} onSelect={setSelected} />
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-3 py-2">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline"
          onClick={() => setSelected(null)}
        >
          ← Curriculum
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 text-sm">
        <LessonView slug={selected} />
      </div>
    </div>
  );
}

export function SidePanel({ active }: SidePanelProps) {
  return (
    <aside className="flex h-full flex-col overflow-hidden bg-background">
      <header className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {active === 'lessons' ? 'Lessons' : 'Files'}
      </header>
      {active === 'lessons' ? (
        <LessonsPane />
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

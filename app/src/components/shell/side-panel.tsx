import { useState } from 'react';
import { DragDropImporter } from '@/file-tree/drag-drop-importer';
import { FileTree } from '@/file-tree/file-tree';
import { ResetWorkspaceButton } from '@/file-tree/reset-workspace-button';
import { LessonView, getLessonIndex } from '@/lessons';
import type { ActivityEntry } from './activity-bar';

interface SidePanelProps {
  active: ActivityEntry;
}

function LessonsPane() {
  const index = getLessonIndex();
  const [selected, setSelected] = useState<string | null>(index.entries[0]?.slug ?? null);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* TODO(#37): replace this <select> picker with the curriculum index. */}
      <div className="border-b border-border px-3 py-2">
        <label className="block text-xs uppercase tracking-wide text-muted-foreground">
          Lesson
        </label>
        <select
          data-temp-picker
          className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={selected ?? ''}
          onChange={(e) => setSelected(e.target.value || null)}
        >
          {index.entries.length === 0 ? <option value="">(no lessons available)</option> : null}
          {index.entries.map((meta) => (
            <option key={meta.slug} value={meta.slug}>
              {meta.order}. {meta.title}
            </option>
          ))}
        </select>
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

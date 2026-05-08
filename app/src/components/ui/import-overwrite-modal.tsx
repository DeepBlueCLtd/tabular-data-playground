import { useEffect, useRef } from 'react';

export type OverwriteChoice = 'cancel' | 'overwrite' | 'overwrite-all';

interface Props {
  open: boolean;
  path: string;
  onChoose: (choice: OverwriteChoice) => void;
}

export function ImportOverwriteModal({ open, path, onChoose }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChoose('cancel');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onChoose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onChoose('cancel')}
    >
      <div
        className="w-full max-w-sm rounded border border-border bg-background p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-medium">Overwrite existing file?</h2>
        <p className="mt-2 text-xs text-muted-foreground">{path} already exists.</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onChoose('cancel')}
            className="rounded border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onChoose('overwrite')}
            className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
          >
            Overwrite
          </button>
          <button
            type="button"
            onClick={() => onChoose('overwrite-all')}
            className="rounded bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-800"
          >
            Overwrite all
          </button>
        </div>
      </div>
    </div>
  );
}

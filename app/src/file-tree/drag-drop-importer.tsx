import { useCallback, useState, type ReactNode } from 'react';
import { ImportOverwriteModal, type OverwriteChoice } from '@/components/ui/import-overwrite-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useVfs } from '@/fs/use-vfs';
import { WORKSPACE_ROOT } from '@/fs/types';

const FILE_CAP_BYTES = 10 * 1024 * 1024;

interface CollectedFile {
  relativePath: string;
  file: File;
}

// Minimal types to avoid lib.dom edge cases across TS versions.
interface FsEntryMin {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
}

interface FsFileEntry extends FsEntryMin {
  file: (cb: (f: File) => void, errCb?: (e: unknown) => void) => void;
}

interface FsDirReader {
  readEntries: (cb: (entries: FsEntryMin[]) => void, errCb?: (e: unknown) => void) => void;
}

interface FsDirEntry extends FsEntryMin {
  createReader: () => FsDirReader;
}

function entryAsFile(entry: FsEntryMin): Promise<File> {
  return new Promise((resolve, reject) => {
    (entry as FsFileEntry).file(resolve, reject);
  });
}

function readDirectory(entry: FsDirEntry): Promise<FsEntryMin[]> {
  return new Promise((resolve, reject) => {
    const reader = entry.createReader();
    const all: FsEntryMin[] = [];
    const step = () => {
      reader.readEntries((entries) => {
        if (entries.length === 0) {
          resolve(all);
        } else {
          all.push(...entries);
          step();
        }
      }, reject);
    };
    step();
  });
}

async function collectEntry(entry: FsEntryMin, prefix: string): Promise<CollectedFile[]> {
  if (entry.isFile) {
    const file = await entryAsFile(entry);
    return [{ relativePath: `${prefix}${entry.name}`, file }];
  }
  if (entry.isDirectory) {
    const children = await readDirectory(entry as FsDirEntry);
    const out: CollectedFile[] = [];
    for (const child of children) {
      const sub = await collectEntry(child, `${prefix}${entry.name}/`);
      out.push(...sub);
    }
    return out;
  }
  return [];
}

function joinPath(parent: string, child: string): string {
  if (parent === '/') return `/${child}`;
  return `${parent}/${child}`;
}

interface ImporterProps {
  children: ReactNode;
  /** Resolves the dropped target into a vfs absolute path; defaults to /workspace. */
  resolveTarget?: (event: React.DragEvent) => string;
}

export function DragDropImporter({ children, resolveTarget }: ImporterProps) {
  const { vfs } = useVfs();
  const [dragOver, setDragOver] = useState(false);
  const [overwritePrompt, setOverwritePrompt] = useState<{
    path: string;
    resolve: (choice: OverwriteChoice) => void;
  } | null>(null);
  const [oversizeMessage, setOversizeMessage] = useState<string | null>(null);

  const askOverwrite = useCallback((path: string): Promise<OverwriteChoice> => {
    return new Promise((resolve) => {
      setOverwritePrompt({ path, resolve });
    });
  }, []);

  const importDropped = useCallback(
    async (target: string, dt: DataTransfer) => {
      if (!vfs) return;
      const entries: FsEntryMin[] = [];
      for (const item of Array.from(dt.items)) {
        const it = item as DataTransferItem & {
          webkitGetAsEntry?: () => FsEntryMin | null;
        };
        const e = it.webkitGetAsEntry?.();
        if (e) entries.push(e);
      }
      const collected: CollectedFile[] = [];
      for (const e of entries) {
        const sub = await collectEntry(e, '');
        collected.push(...sub);
      }
      // Fallback for browsers / drops with no entries: dt.files (flat).
      if (collected.length === 0) {
        for (const f of Array.from(dt.files)) {
          collected.push({ relativePath: f.name, file: f });
        }
      }

      const oversized = collected.filter((c) => c.file.size > FILE_CAP_BYTES);
      if (oversized.length > 0) {
        const sample = oversized[0];
        if (sample) {
          const mb = (sample.file.size / 1024 / 1024).toFixed(1);
          setOversizeMessage(
            `Cannot import "${sample.relativePath}": ${mb} MB exceeds the 10 MB per-file cap.`,
          );
        }
        return;
      }

      let allOverwrite = false;
      for (const c of collected) {
        const dest = joinPath(target, c.relativePath);
        // Ensure parent dirs exist.
        const lastSlash = dest.lastIndexOf('/');
        if (lastSlash > 0) {
          await vfs.mkdir(dest.slice(0, lastSlash), { recursive: true }).catch(() => undefined);
        }
        if (await vfs.exists(dest)) {
          if (!allOverwrite) {
            const choice = await askOverwrite(dest);
            if (choice === 'cancel') return;
            if (choice === 'overwrite-all') allOverwrite = true;
          }
        }
        const buf = new Uint8Array(await c.file.arrayBuffer());
        await vfs.writeFile(dest, buf);
      }
    },
    [vfs, askOverwrite],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget === e.target) setDragOver(false);
  }, []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const target = resolveTarget?.(e) ?? WORKSPACE_ROOT;
      void importDropped(target, e.dataTransfer);
    },
    [importDropped, resolveTarget],
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex h-full flex-col ${dragOver ? 'ring-2 ring-inset ring-primary/40' : ''}`}
    >
      {children}
      <ImportOverwriteModal
        open={overwritePrompt !== null}
        path={overwritePrompt?.path ?? ''}
        onChoose={(choice) => {
          overwritePrompt?.resolve(choice);
          setOverwritePrompt(null);
        }}
      />
      <ConfirmModal
        open={oversizeMessage !== null}
        title="File too large"
        body={oversizeMessage ?? ''}
        confirmLabel="OK"
        cancelLabel="Close"
        onConfirm={() => setOversizeMessage(null)}
        onCancel={() => setOversizeMessage(null)}
      />
    </div>
  );
}

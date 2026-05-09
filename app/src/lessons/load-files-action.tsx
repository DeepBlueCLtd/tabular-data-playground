import { useCallback, useState } from 'react';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useVfs } from '@/fs/use-vfs';
import { WORKSPACE_ROOT } from '@/fs/types';
import type { Vfs } from '@/fs/vfs';
import type { Lesson, LessonStarterFile } from './types';
import { getLessonStarterFiles } from './load';

interface Props {
  lesson: Lesson;
}

type State =
  | { kind: 'idle' }
  | { kind: 'confirming'; collisions: number }
  | { kind: 'copying' }
  | { kind: 'error'; message: string };

function joinPath(parent: string, child: string): string {
  if (parent === '/') return `/${child}`;
  return `${parent}/${child}`;
}

async function ensureParent(vfs: Vfs, dest: string): Promise<void> {
  const lastSlash = dest.lastIndexOf('/');
  if (lastSlash <= 0) return;
  await vfs.mkdir(dest.slice(0, lastSlash), { recursive: true }).catch(() => undefined);
}

async function fetchAsBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

async function copyAll(
  vfs: Vfs,
  destRoot: string,
  files: readonly LessonStarterFile[],
): Promise<void> {
  await vfs.mkdir(destRoot, { recursive: true }).catch(() => undefined);
  for (const file of files) {
    const dest = joinPath(destRoot, file.relativePath);
    await ensureParent(vfs, dest);
    const bytes = await fetchAsBytes(file.assetUrl);
    // Non-colliding user files are preserved by construction (FR-011):
    // we only ever write paths that come from the starter set.
    await vfs.writeFile(dest, bytes);
  }
}

async function findCollisions(
  vfs: Vfs,
  destRoot: string,
  files: readonly LessonStarterFile[],
): Promise<number> {
  let count = 0;
  for (const file of files) {
    const dest = joinPath(destRoot, file.relativePath);
    if (await vfs.exists(dest)) count += 1;
  }
  return count;
}

export function LoadLessonFilesButton({ lesson }: Props) {
  const { vfs } = useVfs();
  const [state, setState] = useState<State>({ kind: 'idle' });

  const slug = lesson.slug;
  const destRoot = `${WORKSPACE_ROOT}/${slug}`;
  const files = getLessonStarterFiles(slug);

  const startCopy = useCallback(async () => {
    if (!vfs) return;
    setState({ kind: 'copying' });
    try {
      await copyAll(vfs, destRoot, files);
      setState({ kind: 'idle' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ kind: 'error', message });
    }
  }, [vfs, destRoot, files]);

  const onClick = useCallback(async () => {
    if (!vfs) return;
    if (state.kind !== 'idle' && state.kind !== 'error') return;
    if (files.length === 0) return;
    const collisions = await findCollisions(vfs, destRoot, files);
    if (collisions === 0) {
      void startCopy();
      return;
    }
    setState({ kind: 'confirming', collisions });
  }, [vfs, files, destRoot, state.kind, startCopy]);

  if (!lesson.meta.hasFiles) return null;

  const disabled = !vfs || state.kind === 'copying' || state.kind === 'confirming';
  const label = state.kind === 'copying' ? 'Copying…' : 'Load lesson files';
  const title = !vfs ? 'Waiting for Python runtime to be ready' : undefined;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        title={title}
        onClick={() => {
          void onClick();
        }}
        className="rounded border border-border bg-muted/40 px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        {label}
      </button>
      {state.kind === 'error' ? (
        <p className="mt-1 text-xs text-destructive">Could not load files: {state.message}</p>
      ) : null}
      <ConfirmModal
        open={state.kind === 'confirming'}
        title="Overwrite lesson files?"
        body={
          state.kind === 'confirming'
            ? `Folder ${slug} already has files. Loading the lesson's starter files will overwrite ${
                state.collisions === 1 ? '1 file' : `${state.collisions} files`
              } with the same name. Your edits to those files will be lost.`
            : ''
        }
        confirmLabel="Overwrite"
        destructive
        onConfirm={() => {
          void startCopy();
        }}
        onCancel={() => setState({ kind: 'idle' })}
      />
    </>
  );
}

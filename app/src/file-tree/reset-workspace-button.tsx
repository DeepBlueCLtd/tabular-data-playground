import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { WORKSPACE_ROOT } from '@/fs/types';
import { useVfs } from '@/fs/use-vfs';

export function ResetWorkspaceButton() {
  const { vfs } = useVfs();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!vfs) return;
    setBusy(true);
    try {
      const entries = await vfs.readdir(WORKSPACE_ROOT);
      for (const entry of entries) {
        const path = `${WORKSPACE_ROOT}/${entry.name}`;
        await vfs.remove(path, { recursive: entry.kind === 'dir' }).catch(() => undefined);
      }
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <>
      <div className="border-t border-border p-2">
        <button
          type="button"
          disabled={!vfs || busy}
          onClick={() => setOpen(true)}
          className="w-full rounded border border-border bg-muted/40 px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
        >
          Reset workspace
        </button>
      </div>
      <ConfirmModal
        open={open}
        title="Reset workspace?"
        body="All files in /workspace will be permanently deleted. Your theme choice and editor tab layout are preserved."
        confirmLabel={busy ? 'Resetting…' : 'Reset'}
        destructive
        onConfirm={() => {
          void reset();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

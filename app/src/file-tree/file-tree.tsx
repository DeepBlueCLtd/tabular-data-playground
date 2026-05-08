import { useCallback, useEffect, useState } from 'react';
import { type NodeApi, Tree } from 'react-arborist';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { PromptModal } from '@/components/ui/prompt-modal';
import { useEditorTabs } from '@/editor/use-editor-tabs';
import { useFsChanged } from '@/fs/use-fs-changed';
import { WORKSPACE_ROOT } from '@/fs/types';
import { useVfs } from '@/fs/use-vfs';
import { FileTreeMenu, type MenuAction } from './file-tree-menu';
import { type TreeNode, walkWorkspace } from './walk';

interface MenuState {
  x: number;
  y: number;
  target: TreeNode | null;
}

type DialogState =
  | { kind: 'none' }
  | { kind: 'newFile'; parent: string }
  | { kind: 'newFolder'; parent: string }
  | { kind: 'rename'; node: TreeNode }
  | { kind: 'delete'; node: TreeNode }
  | { kind: 'overwrite'; oldPath: string; newPath: string };

function joinPath(parent: string, name: string): string {
  return parent === '/' ? `/${name}` : `${parent}/${name}`;
}

function dirOf(path: string): string {
  const i = path.lastIndexOf('/');
  if (i <= 0) return '/';
  return path.slice(0, i);
}

function basenameOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i < 0 ? path : path.slice(i + 1);
}

function validateName(name: string): string | null {
  if (!name) return 'Name is required';
  if (name.includes('/')) return 'Name may not contain "/"';
  if (name === '.' || name === '..') return 'Reserved name';
  return null;
}

export function FileTree() {
  const { vfs } = useVfs();
  const { open } = useEditorTabs();
  const [nodes, setNodes] = useState<TreeNode[] | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });

  const refresh = useCallback(async () => {
    if (!vfs) return;
    try {
      const tree = await walkWorkspace(vfs);
      setNodes(tree);
    } catch {
      setNodes([]);
    }
  }, [vfs]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFsChanged(() => {
    void refresh();
  });

  function openMenu(e: React.MouseEvent, target: TreeNode | null) {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, target });
  }

  async function performNew(kind: 'file' | 'folder', parent: string, name: string) {
    if (!vfs) return;
    const path = joinPath(parent, name);
    if (kind === 'file') {
      await vfs.writeFile(path, '');
    } else {
      await vfs.mkdir(path);
    }
  }

  async function performRename(node: TreeNode, newName: string, force: boolean) {
    if (!vfs) return;
    const newPath = joinPath(dirOf(node.path), newName);
    if (newPath === node.path) return;
    if (!force && (await vfs.exists(newPath))) {
      setDialog({ kind: 'overwrite', oldPath: node.path, newPath });
      return;
    }
    if (node.kind === 'file') {
      const content = await vfs.readFile(node.path);
      await vfs.writeFile(newPath, content);
      await vfs.remove(node.path);
    } else {
      // Folder rename: walk contents, copy, remove original.
      await copyDir(node.path, newPath);
      await vfs.remove(node.path, { recursive: true });
    }
  }

  async function copyDir(src: string, dst: string) {
    if (!vfs) return;
    await vfs.mkdir(dst, { recursive: true });
    const entries = await vfs.readdir(src);
    for (const entry of entries) {
      const s = joinPath(src, entry.name);
      const d = joinPath(dst, entry.name);
      if (entry.kind === 'dir') await copyDir(s, d);
      else {
        const content = await vfs.readFile(s, 'binary');
        await vfs.writeFile(d, content);
      }
    }
  }

  async function performDelete(node: TreeNode) {
    if (!vfs) return;
    await vfs.remove(node.path, { recursive: node.kind === 'dir' });
  }

  function actionsFor(target: TreeNode | null): MenuAction[] {
    const parent = target
      ? target.kind === 'dir'
        ? target.path
        : dirOf(target.path)
      : WORKSPACE_ROOT;
    const actions: MenuAction[] = [
      { label: 'New file', onClick: () => setDialog({ kind: 'newFile', parent }) },
      { label: 'New folder', onClick: () => setDialog({ kind: 'newFolder', parent }) },
    ];
    if (target) {
      actions.push({ label: 'Rename', onClick: () => setDialog({ kind: 'rename', node: target }) });
      actions.push({
        label: 'Delete',
        destructive: true,
        onClick: () => setDialog({ kind: 'delete', node: target }),
      });
    }
    return actions;
  }

  if (!vfs) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Waiting for Python runtime…</p>;
  }
  if (nodes === null) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Loading files…</p>;
  }

  function handleActivate(node: NodeApi<TreeNode>) {
    if (node.data.kind === 'file') {
      void open(node.data.path);
    }
  }

  return (
    <div
      className="flex h-full flex-1 flex-col overflow-hidden"
      onContextMenu={(e) => {
        // Only fire for empty area (not handled by row).
        if ((e.target as HTMLElement).closest('[data-tree-row]')) return;
        openMenu(e, null);
      }}
    >
      {nodes.length === 0 ? (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          Workspace is empty. Right-click to create a file, or use the editor empty state.
        </p>
      ) : (
        <div className="flex-1 overflow-auto">
          <Tree<TreeNode>
            data={nodes}
            openByDefault={false}
            rowHeight={22}
            indent={16}
            width="100%"
            height={2000}
            onActivate={handleActivate}
            disableDrag
            disableDrop
          >
            {({ node, style, dragHandle }) => (
              <div
                ref={dragHandle}
                style={style}
                data-tree-row="true"
                className={`flex cursor-pointer items-center gap-1 truncate px-2 text-xs hover:bg-muted ${
                  node.isSelected ? 'bg-muted' : ''
                }`}
                onClick={() => {
                  if (node.data.kind === 'dir') node.toggle();
                  else node.activate();
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  openMenu(e, node.data);
                }}
              >
                <span aria-hidden className="opacity-60">
                  {node.data.kind === 'dir' ? (node.isOpen ? '▾' : '▸') : '·'}
                </span>
                <span className="truncate">{node.data.name}</span>
              </div>
            )}
          </Tree>
        </div>
      )}

      {menu && (
        <FileTreeMenu
          x={menu.x}
          y={menu.y}
          actions={actionsFor(menu.target)}
          onClose={() => setMenu(null)}
        />
      )}

      {dialog.kind === 'newFile' && (
        <PromptModal
          open
          title={`New file in ${dialog.parent}`}
          okLabel="Create"
          validate={validateName}
          onSubmit={async (name) => {
            await performNew('file', dialog.parent, name);
            setDialog({ kind: 'none' });
          }}
          onCancel={() => setDialog({ kind: 'none' })}
        />
      )}
      {dialog.kind === 'newFolder' && (
        <PromptModal
          open
          title={`New folder in ${dialog.parent}`}
          okLabel="Create"
          validate={validateName}
          onSubmit={async (name) => {
            await performNew('folder', dialog.parent, name);
            setDialog({ kind: 'none' });
          }}
          onCancel={() => setDialog({ kind: 'none' })}
        />
      )}
      {dialog.kind === 'rename' && (
        <PromptModal
          open
          title={`Rename ${basenameOf(dialog.node.path)}`}
          initialValue={basenameOf(dialog.node.path)}
          okLabel="Rename"
          validate={validateName}
          onSubmit={async (name) => {
            const node = dialog.node;
            setDialog({ kind: 'none' });
            await performRename(node, name, false);
          }}
          onCancel={() => setDialog({ kind: 'none' })}
        />
      )}
      {dialog.kind === 'delete' && (
        <ConfirmModal
          open
          title={`Delete ${basenameOf(dialog.node.path)}?`}
          body={`This permanently removes ${dialog.node.path} from the workspace.`}
          confirmLabel="Delete"
          destructive
          onConfirm={async () => {
            const node = dialog.node;
            setDialog({ kind: 'none' });
            await performDelete(node);
          }}
          onCancel={() => setDialog({ kind: 'none' })}
        />
      )}
      {dialog.kind === 'overwrite' && (
        <ConfirmModal
          open
          title={`Overwrite ${basenameOf(dialog.newPath)}?`}
          body={`A file or folder already exists at ${dialog.newPath}.`}
          confirmLabel="Overwrite"
          destructive
          onConfirm={async () => {
            if (!vfs) return;
            const { oldPath, newPath } = dialog;
            setDialog({ kind: 'none' });
            await vfs.remove(newPath, { recursive: true }).catch(() => undefined);
            const node: TreeNode = {
              id: oldPath,
              path: oldPath,
              name: basenameOf(oldPath),
              kind: (await vfs.stat(oldPath)).kind,
            };
            await performRename(node, basenameOf(newPath), true);
          }}
          onCancel={() => setDialog({ kind: 'none' })}
        />
      )}
    </div>
  );
}

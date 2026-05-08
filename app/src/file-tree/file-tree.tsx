import { useCallback, useEffect, useState } from 'react';
import { type NodeApi, Tree } from 'react-arborist';
import { useVfs } from '@/fs/use-vfs';
import { useFsChanged } from '@/fs/use-fs-changed';
import { useEditorTabs } from '@/editor/use-editor-tabs';
import { type TreeNode, walkWorkspace } from './walk';

export function FileTree() {
  const { vfs } = useVfs();
  const { open } = useEditorTabs();
  const [nodes, setNodes] = useState<TreeNode[] | null>(null);

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

  if (!vfs) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Waiting for Python runtime…</p>;
  }
  if (nodes === null) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Loading files…</p>;
  }
  if (nodes.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">
        Workspace is empty. Open a sample from the editor or drop files in (#17).
      </p>
    );
  }

  function handleActivate(node: NodeApi<TreeNode>) {
    if (node.data.kind === 'file') {
      void open(node.data.path);
    }
  }

  return (
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
            className={`flex cursor-pointer items-center gap-1 truncate px-2 text-xs hover:bg-muted ${
              node.isSelected ? 'bg-muted' : ''
            }`}
            onClick={() => {
              if (node.data.kind === 'dir') node.toggle();
              else node.activate();
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
  );
}

import { WORKSPACE_ROOT } from '@/fs/types';
import type { Vfs } from '@/fs/vfs';

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  kind: 'file' | 'dir';
  children?: TreeNode[];
}

export async function walkWorkspace(vfs: Vfs): Promise<TreeNode[]> {
  return walkDir(vfs, WORKSPACE_ROOT);
}

async function walkDir(vfs: Vfs, path: string): Promise<TreeNode[]> {
  const entries = await vfs.readdir(path).catch(() => []);
  const result: TreeNode[] = [];
  for (const entry of entries) {
    const childPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
    if (entry.kind === 'dir') {
      const children = await walkDir(vfs, childPath);
      result.push({
        id: childPath,
        name: entry.name,
        path: childPath,
        kind: 'dir',
        children,
      });
    } else {
      result.push({
        id: childPath,
        name: entry.name,
        path: childPath,
        kind: 'file',
      });
    }
  }
  return result;
}

import { WORKSPACE_ROOT } from '@/fs/types';

/**
 * Resolve a path argument against a cwd, normalising `..` and
 * `.` segments. Returns null if the result escapes `/workspace`.
 */
export function resolveCwd(cwd: string, p: string): string | null {
  const base = p.startsWith('/') ? '' : cwd;
  const combined = (base + (p.startsWith('/') ? '' : '/') + p).replace(/\/+/g, '/');
  const segs = combined.split('/').filter(Boolean);
  const out: string[] = [];
  for (const s of segs) {
    if (s === '.') continue;
    if (s === '..') {
      if (out.length === 0) return null;
      out.pop();
      continue;
    }
    out.push(s);
  }
  const result = '/' + out.join('/');
  if (result !== WORKSPACE_ROOT && !result.startsWith(`${WORKSPACE_ROOT}/`)) {
    return null;
  }
  return result;
}

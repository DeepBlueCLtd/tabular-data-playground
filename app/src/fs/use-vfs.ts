import { usePyodide } from '@/pyodide/use-pyodide';
import type { Vfs } from './vfs';

/**
 * Returns the virtual FS once Pyodide is ready and IDBFS is mounted.
 * Returns null beforehand. Consumers gate their UI on `vfs !== null`.
 */
export function useVfs(): { vfs: Vfs | null } {
  const { vfs } = usePyodide();
  return { vfs };
}

export interface EditorTab {
  id: string;
  path: string;
  /** Latest in-memory content for the tab. */
  content: string;
  /** True if the buffer differs from the last vfs write. */
  dirty: boolean;
  /** True if the underlying vfs file has been removed since open. */
  missing: boolean;
}

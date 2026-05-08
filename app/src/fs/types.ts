export type FsKind = 'file' | 'dir';

export interface DirEntry {
  name: string;
  kind: FsKind;
}

export interface FsStat {
  kind: FsKind;
  size: number;
  mtimeMs: number;
}

export type FsErrorCode =
  | 'ENOENT'
  | 'EEXIST'
  | 'EISDIR'
  | 'ENOTDIR'
  | 'EPERM'
  | 'ENOTEMPTY'
  | 'EUNK';

export class FsError extends Error {
  readonly code: FsErrorCode;
  constructor(code: FsErrorCode, message: string) {
    super(message);
    this.name = 'FsError';
    this.code = code;
  }
}

export const WORKSPACE_ROOT = '/workspace';

export function isFsError(e: unknown): e is FsError {
  return e instanceof FsError;
}

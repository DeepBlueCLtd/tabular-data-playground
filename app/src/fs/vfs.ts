import type { FsRequest, WorkerOutbound } from '@/pyodide/protocol';
import { type DirEntry, FsError, type FsErrorCode, type FsStat, WORKSPACE_ROOT } from './types';

export interface Vfs {
  readFile(path: string): Promise<string>;
  readFile(path: string, encoding: 'utf8'): Promise<string>;
  readFile(path: string, encoding: 'binary'): Promise<Uint8Array>;
  writeFile(path: string, content: string | Uint8Array): Promise<void>;
  readdir(path: string): Promise<DirEntry[]>;
  mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>;
  remove(path: string, opts?: { recursive?: boolean }): Promise<void>;
  stat(path: string): Promise<FsStat>;
  exists(path: string): Promise<boolean>;
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
}

type Send = (req: FsRequest) => Promise<unknown>;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isWithinWorkspace(path: string): boolean {
  if (!path.startsWith('/')) return false;
  // Reject any '..' segment that could escape; keep the check simple
  // and re-validated server-side.
  const segs = path.split('/').filter(Boolean);
  let depth = 0;
  for (const s of segs) {
    if (s === '..') {
      depth -= 1;
      if (depth < 0) return false;
    } else if (s !== '.') {
      depth += 1;
    }
  }
  return path === WORKSPACE_ROOT || path.startsWith(`${WORKSPACE_ROOT}/`);
}

function ensurePath(path: string) {
  if (!isWithinWorkspace(path)) {
    throw new FsError('EPERM', `Path outside workspace: ${path}`);
  }
}

interface VfsBridge {
  worker: Worker;
  schedule: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function createVfs(bridge: VfsBridge): Vfs {
  const pending = new Map<string, Pending>();

  bridge.worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
    const msg = event.data;
    if (msg?.type !== 'fs-result') return;
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.ok) {
      p.resolve(msg.value);
    } else {
      p.reject(new FsError(msg.error.code as FsErrorCode, msg.error.message));
    }
  });

  const send: Send = (req) =>
    bridge.schedule(
      () =>
        new Promise<unknown>((resolve, reject) => {
          pending.set(req.id, { resolve, reject });
          bridge.worker.postMessage(req);
        }),
    );

  function readFile(path: string): Promise<string>;
  function readFile(path: string, encoding: 'utf8'): Promise<string>;
  function readFile(path: string, encoding: 'binary'): Promise<Uint8Array>;
  async function readFile(
    path: string,
    encoding: 'utf8' | 'binary' = 'utf8',
  ): Promise<string | Uint8Array> {
    ensurePath(path);
    const value = await send({ type: 'fs-readFile', id: newId(), path, encoding });
    if (encoding === 'binary') {
      if (value instanceof Uint8Array) return value;
      // Pyodide's readFile may return a number array or a typed array view.
      return new Uint8Array(value as ArrayBufferLike);
    }
    return String(value ?? '');
  }

  return {
    readFile,
    async writeFile(path, content) {
      ensurePath(path);
      await send({ type: 'fs-writeFile', id: newId(), path, content });
    },
    async readdir(path) {
      ensurePath(path);
      const value = await send({ type: 'fs-readdir', id: newId(), path });
      return value as DirEntry[];
    },
    async mkdir(path, opts) {
      ensurePath(path);
      await send({
        type: 'fs-mkdir',
        id: newId(),
        path,
        recursive: opts?.recursive ?? false,
      });
    },
    async remove(path, opts) {
      ensurePath(path);
      await send({
        type: 'fs-remove',
        id: newId(),
        path,
        recursive: opts?.recursive ?? false,
      });
    },
    async stat(path) {
      ensurePath(path);
      const value = await send({ type: 'fs-stat', id: newId(), path });
      return value as FsStat;
    },
    async exists(path) {
      if (!isWithinWorkspace(path)) return false;
      const value = await send({ type: 'fs-exists', id: newId(), path });
      return Boolean(value);
    },
  };
}

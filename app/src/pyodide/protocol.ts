// Typed messages exchanged with the Pyodide Web Worker.
// Loader handshake (#27) + command bridge (#28) + virtual FS (#11).
// fs-changed event shape locked here, fan-out lands with #12.

export interface LoadRequest {
  type: 'load';
}

/** CLIs the worker can drive via runpy. Both run through the same wrapper. */
export type CliProgram = 'frictionless' | 'livemark';

export interface RunRequest {
  type: 'run';
  id: string;
  args: string[];
  stdin?: string;
  /** Working directory for the CLI invocation. Defaults to /workspace. */
  cwd?: string;
  /**
   * Which CLI to invoke. Defaults to 'frictionless'. 'livemark' triggers a
   * one-time lazy install on first use (see worker `ensureLivemark`).
   */
  program?: CliProgram;
}

export interface RunPythonRequest {
  type: 'run-python';
  id: string;
  code: string;
}

export interface FsReadFileRequest {
  type: 'fs-readFile';
  id: string;
  path: string;
  encoding: 'utf8' | 'binary';
}

export interface FsWriteFileRequest {
  type: 'fs-writeFile';
  id: string;
  path: string;
  content: string | Uint8Array;
}

export interface FsReaddirRequest {
  type: 'fs-readdir';
  id: string;
  path: string;
}

export interface FsMkdirRequest {
  type: 'fs-mkdir';
  id: string;
  path: string;
  recursive: boolean;
}

export interface FsRemoveRequest {
  type: 'fs-remove';
  id: string;
  path: string;
  recursive: boolean;
}

export interface FsStatRequest {
  type: 'fs-stat';
  id: string;
  path: string;
}

export interface FsExistsRequest {
  type: 'fs-exists';
  id: string;
  path: string;
}

export type FsRequest =
  | FsReadFileRequest
  | FsWriteFileRequest
  | FsReaddirRequest
  | FsMkdirRequest
  | FsRemoveRequest
  | FsStatRequest
  | FsExistsRequest;

export type WorkerInbound = LoadRequest | RunRequest | RunPythonRequest | FsRequest;

export interface ReadyEvent {
  type: 'ready';
  pyodideVersion: string;
  frictionlessVersion: string | null;
}

export interface WorkerErrorEvent {
  type: 'error';
  message: string;
  stage: 'pyodide-load' | 'micropip-load' | 'frictionless-install' | 'fs-mount' | 'unknown';
}

export interface RunResponse {
  type: 'run-result';
  id: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export type RunPythonResponse =
  | {
      type: 'run-python-result';
      id: string;
      ok: true;
      value: string;
      stdout: string;
      stderr: string;
    }
  | {
      type: 'run-python-result';
      id: string;
      ok: false;
      error: string;
      stdout: string;
      stderr: string;
    };

export interface FsErrorPayload {
  code: 'ENOENT' | 'EEXIST' | 'EISDIR' | 'ENOTDIR' | 'EPERM' | 'ENOTEMPTY' | 'EUNK';
  message: string;
}

export type FsResponse =
  | { type: 'fs-result'; id: string; ok: true; value?: unknown }
  | { type: 'fs-result'; id: string; ok: false; error: FsErrorPayload };

/**
 * Posted after every mutating FS call so consumers (file tree,
 * editor, lesson loader) can refresh. Consumed by #12.
 */
export interface FsChangedEvent {
  type: 'fs-changed';
  paths: string[];
}

export type WorkerOutbound =
  | ReadyEvent
  | WorkerErrorEvent
  | RunResponse
  | RunPythonResponse
  | FsResponse
  | FsChangedEvent;

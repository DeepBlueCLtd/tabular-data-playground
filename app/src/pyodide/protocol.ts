// Typed messages exchanged with the Pyodide Web Worker.
// Loader handshake (v1, #27) + command bridge (#28) +
// fs-changed shape (stub here, emission lands with #11/#12).

export interface LoadRequest {
  type: 'load';
}

export interface RunRequest {
  type: 'run';
  id: string;
  args: string[];
  stdin?: string;
}

export interface RunPythonRequest {
  type: 'run-python';
  id: string;
  code: string;
}

export type WorkerInbound = LoadRequest | RunRequest | RunPythonRequest;

export interface ReadyEvent {
  type: 'ready';
  pyodideVersion: string;
  frictionlessVersion: string | null;
}

export interface WorkerErrorEvent {
  type: 'error';
  message: string;
  stage: 'pyodide-load' | 'micropip-load' | 'frictionless-install' | 'unknown';
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

/**
 * Stub shape for FS notifications. The worker does not post this in
 * #28; #11 (IDBFS mount) + #12 (event system) wire emission. Locking
 * the shape here so downstream items don't change the protocol.
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
  | FsChangedEvent;

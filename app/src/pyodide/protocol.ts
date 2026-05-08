// Typed messages exchanged with the Pyodide Web Worker.
// v1 covers loader handshake only; #28 adds run + FS shapes.

export interface LoadRequest {
  type: 'load';
}

export type WorkerInbound = LoadRequest;

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

export type WorkerOutbound = ReadyEvent | WorkerErrorEvent;

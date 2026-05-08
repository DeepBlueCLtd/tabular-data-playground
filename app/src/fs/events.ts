export interface FsChangedPayload {
  paths: string[];
}

export type FsChangedListener = (event: FsChangedPayload) => void;

export class FsEventBus {
  private listeners = new Set<FsChangedListener>();

  on(listener: FsChangedListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(paths: string[]): void {
    // Snapshot so a listener that unsubscribes mid-iteration is safe.
    const snapshot = Array.from(this.listeners);
    for (const listener of snapshot) {
      try {
        listener({ paths });
      } catch (e) {
        console.error('[fs-changed] listener threw:', e);
      }
    }
  }
}

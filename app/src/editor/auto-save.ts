import { AUTOSAVE_DEBOUNCE_MS } from './config';

type Timer = ReturnType<typeof setTimeout>;
type Listener = (savingIds: ReadonlySet<string>) => void;

export class AutoSaveQueue {
  private timers = new Map<string, Timer>();
  private pendingFlush = new Map<string, () => Promise<void>>();
  private saving = new Set<string>();
  private listeners = new Set<Listener>();

  schedule(id: string, save: () => Promise<void>): void {
    const existing = this.timers.get(id);
    if (existing) clearTimeout(existing);
    this.pendingFlush.set(id, save);
    const t = setTimeout(() => {
      this.timers.delete(id);
      this.pendingFlush.delete(id);
      void this.runSave(id, save);
    }, AUTOSAVE_DEBOUNCE_MS);
    this.timers.set(id, t);
  }

  async flush(id: string): Promise<void> {
    const t = this.timers.get(id);
    const save = this.pendingFlush.get(id);
    if (t) {
      clearTimeout(t);
      this.timers.delete(id);
    }
    this.pendingFlush.delete(id);
    if (save) await this.runSave(id, save);
  }

  cancel(id: string): void {
    const t = this.timers.get(id);
    if (t) clearTimeout(t);
    this.timers.delete(id);
    this.pendingFlush.delete(id);
  }

  cancelAll(): void {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.pendingFlush.clear();
  }

  isSaving(id: string): boolean {
    return this.saving.has(id);
  }

  onSavingChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async runSave(id: string, save: () => Promise<void>): Promise<void> {
    this.saving.add(id);
    this.notify();
    try {
      await save();
    } catch (e) {
      console.error('[autosave]', e);
    } finally {
      this.saving.delete(id);
      this.notify();
    }
  }

  private notify(): void {
    const snapshot: ReadonlySet<string> = new Set(this.saving);
    for (const l of Array.from(this.listeners)) {
      try {
        l(snapshot);
      } catch (e) {
        console.error('[autosave] listener', e);
      }
    }
  }
}

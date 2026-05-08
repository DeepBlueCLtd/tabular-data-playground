import { AUTOSAVE_DEBOUNCE_MS } from './config';

type Timer = ReturnType<typeof setTimeout>;

export class AutoSaveQueue {
  private timers = new Map<string, Timer>();
  private pendingFlush = new Map<string, () => Promise<void>>();

  schedule(id: string, save: () => Promise<void>): void {
    const existing = this.timers.get(id);
    if (existing) clearTimeout(existing);
    this.pendingFlush.set(id, save);
    const t = setTimeout(() => {
      this.timers.delete(id);
      this.pendingFlush.delete(id);
      void save().catch((err) => console.error('[autosave]', err));
    }, AUTOSAVE_DEBOUNCE_MS);
    this.timers.set(id, t);
  }

  /** Run any pending save for `id` immediately. */
  async flush(id: string): Promise<void> {
    const t = this.timers.get(id);
    const save = this.pendingFlush.get(id);
    if (t) {
      clearTimeout(t);
      this.timers.delete(id);
    }
    this.pendingFlush.delete(id);
    if (save) {
      await save();
    }
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
}

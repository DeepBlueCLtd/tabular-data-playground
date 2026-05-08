/**
 * Single-line input buffer with cursor + session history. Pure
 * model — the xterm wrapper draws / clears characters based on
 * the deltas this returns.
 */

export interface LineState {
  buffer: string;
  cursor: number;
}

export class LineEditor {
  private state: LineState = { buffer: '', cursor: 0 };
  private history: string[] = [];
  private historyIndex: number | null = null; // null = at "current line" (not in history)
  private savedCurrent = '';

  get value(): string {
    return this.state.buffer;
  }

  get cursor(): number {
    return this.state.cursor;
  }

  reset(): void {
    this.state = { buffer: '', cursor: 0 };
    this.historyIndex = null;
    this.savedCurrent = '';
  }

  insert(text: string): void {
    const { buffer, cursor } = this.state;
    this.state = {
      buffer: buffer.slice(0, cursor) + text + buffer.slice(cursor),
      cursor: cursor + text.length,
    };
  }

  backspace(): boolean {
    const { buffer, cursor } = this.state;
    if (cursor === 0) return false;
    this.state = {
      buffer: buffer.slice(0, cursor - 1) + buffer.slice(cursor),
      cursor: cursor - 1,
    };
    return true;
  }

  del(): boolean {
    const { buffer, cursor } = this.state;
    if (cursor >= buffer.length) return false;
    this.state = {
      buffer: buffer.slice(0, cursor) + buffer.slice(cursor + 1),
      cursor,
    };
    return true;
  }

  moveLeft(): boolean {
    if (this.state.cursor === 0) return false;
    this.state = { ...this.state, cursor: this.state.cursor - 1 };
    return true;
  }

  moveRight(): boolean {
    if (this.state.cursor >= this.state.buffer.length) return false;
    this.state = { ...this.state, cursor: this.state.cursor + 1 };
    return true;
  }

  home(): number {
    const moved = this.state.cursor;
    this.state = { ...this.state, cursor: 0 };
    return moved;
  }

  end(): number {
    const moved = this.state.buffer.length - this.state.cursor;
    this.state = { ...this.state, cursor: this.state.buffer.length };
    return moved;
  }

  /** Navigate up in history. Returns new buffer. */
  historyPrev(): string {
    if (this.history.length === 0) return this.state.buffer;
    if (this.historyIndex === null) {
      this.savedCurrent = this.state.buffer;
      this.historyIndex = this.history.length - 1;
    } else if (this.historyIndex > 0) {
      this.historyIndex -= 1;
    }
    const next = this.history[this.historyIndex] ?? '';
    this.state = { buffer: next, cursor: next.length };
    return next;
  }

  /** Navigate down in history. */
  historyNext(): string {
    if (this.historyIndex === null) return this.state.buffer;
    this.historyIndex += 1;
    let next: string;
    if (this.historyIndex >= this.history.length) {
      this.historyIndex = null;
      next = this.savedCurrent;
    } else {
      next = this.history[this.historyIndex] ?? '';
    }
    this.state = { buffer: next, cursor: next.length };
    return next;
  }

  /** Push the current line into history (if non-empty + not duplicate). */
  pushHistory(): string {
    const line = this.state.buffer;
    if (line.length > 0) {
      const last = this.history[this.history.length - 1];
      if (last !== line) this.history.push(line);
    }
    this.historyIndex = null;
    this.savedCurrent = '';
    return line;
  }
}

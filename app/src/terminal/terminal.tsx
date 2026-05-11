import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTheme } from '@/theme/use-theme';
import type { CompletionResult } from '@/mini-shell/complete';
import { LineEditor } from './line-editor';
import {
  setTerminalRunning,
  setTerminalSubmit,
  type TerminalSubmit,
} from './terminal-submit-store';

const PROMPT = '$ ';
const BELL = '\x07';

export interface TerminalApi {
  /** Print text to the terminal (auto-converts \n to \r\n). */
  print: (text: string) => void;
  /** Re-display the prompt and the current line. */
  redrawPrompt: () => void;
}

interface Props {
  /**
   * Called when the user submits a line with Enter. The terminal
   * is "busy" until the returned promise resolves; further input
   * is ignored. The handler may print via the api passed in.
   */
  onCommand: (line: string, api: TerminalApi) => Promise<void>;
  /**
   * Optional Tab autocomplete callback. Called on every Tab
   * keystroke (suppressed while busy) with the current line, the
   * cursor position, and whether this is the second consecutive
   * Tab on the same (line, cursor). Returns the desired completion
   * action; the terminal applies it to the line editor and screen.
   */
  onComplete?: (
    line: string,
    cursor: number,
    doubleTab: boolean,
  ) => Promise<CompletionResult>;
}

export function TerminalView({ onCommand, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Refs that survive re-renders.
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const lineRef = useRef(new LineEditor());
  const busyRef = useRef(false);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // Snapshot of the line/cursor at the moment of the previous Tab.
  // Used to detect double-Tab; cleared by any non-Tab keystroke.
  const lastTabRef = useRef<{ line: string; cursor: number } | null>(null);

  // Mount terminal once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
      disableStdin: false,
      theme: themeColors(theme),
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(container);
    fit.fit();

    termRef.current = term;
    fitRef.current = fit;

    term.write(PROMPT);

    const api: TerminalApi = {
      print: (text) => term.write(text.replace(/\n/g, '\r\n')),
      redrawPrompt: () => {
        term.write(`\r\n${PROMPT}${lineRef.current.value}`);
      },
    };

    async function dispatch(line: string): Promise<void> {
      // Run a command from any source (user typing or external Run
      // button). Uses the same busy gate as user-typed commands.
      busyRef.current = true;
      setTerminalRunning(true);
      try {
        await onCommandRef.current(line, api);
      } finally {
        busyRef.current = false;
        setTerminalRunning(false);
        term.write(`${PROMPT}`);
      }
    }

    const onData = term.onData((data) => {
      if (busyRef.current) return;
      // Tab is handled here (not in handleData) because completion
      // needs access to the onComplete callback ref and double-Tab
      // tracking state that live in this closure.
      if (data === '\t') {
        const line = lineRef.current.value;
        const cursor = lineRef.current.cursor;
        const last = lastTabRef.current;
        const doubleTab = !!last && last.line === line && last.cursor === cursor;
        lastTabRef.current = { line, cursor };
        const cb = onCompleteRef.current;
        if (!cb) {
          term.write(BELL);
          return;
        }
        void cb(line, cursor, doubleTab).then((result) =>
          applyCompletion(term, lineRef.current, result),
        );
        return;
      }
      // Any non-Tab input invalidates the double-Tab snapshot.
      lastTabRef.current = null;
      handleData(term, lineRef.current, data, async () => {
        const line = lineRef.current.pushHistory();
        lineRef.current.reset();
        term.write('\r\n');
        await dispatch(line);
      });
    });

    // Register an external submit hook for #39's Run button.
    const submit: TerminalSubmit = async (line) => {
      // If the user is mid-typing, drop their in-progress line and
      // start fresh with the externally submitted command. This is
      // the documented best-effort behaviour (spec FR §Edge Cases).
      if (busyRef.current) {
        // A previous command is still running — refuse; #40 disables
        // the button to prevent this from being clicked.
        return;
      }
      lineRef.current.pushHistory();
      lineRef.current.reset();
      // Clear any in-progress typed text on the current line and
      // re-write a fresh prompt + the submitted command. Then \r\n
      // so the command output begins on the next line.
      term.write(`\r\x1b[K${PROMPT}${line}\r\n`);
      await dispatch(line);
    };
    setTerminalSubmit(submit);

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        // ignore — happens during teardown
      }
    });
    ro.observe(container);

    return () => {
      setTerminalSubmit(null);
      setTerminalRunning(false);
      ro.disconnect();
      onData.dispose();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // We deliberately do not include `theme` here; theme changes
    // are handled in the next effect via term.options.theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep theme in sync.
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = themeColors(theme);
  }, [theme]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function themeColors(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    return { background: '#0b0b0b', foreground: '#e8e8e8', cursor: '#e8e8e8' };
  }
  return { background: '#ffffff', foreground: '#1f1f1f', cursor: '#1f1f1f' };
}

function handleData(
  term: Terminal,
  line: LineEditor,
  data: string,
  onEnter: () => void | Promise<void>,
): void {
  // xterm delivers escape sequences as multi-char strings. We
  // process them char-by-char so paste of plain text just works.
  let i = 0;
  while (i < data.length) {
    const ch = data[i] ?? '';
    if (ch === '\r' || ch === '\n') {
      void onEnter();
      return; // stop consuming; reset/redraw happens after
    }
    if (ch === '\x7f') {
      if (line.backspace()) {
        // \b moves cursor left, \x1b[P deletes the char at cursor
        // and shifts the rest left.
        term.write('\b\x1b[P');
      }
      i += 1;
      continue;
    }
    if (ch === '\x1b' && data[i + 1] === '[') {
      const code = data[i + 2] ?? '';
      if (code === 'A') {
        // Up arrow → previous history
        const next = line.historyPrev();
        rewriteLine(term, next, line.cursor);
        i += 3;
        continue;
      }
      if (code === 'B') {
        const next = line.historyNext();
        rewriteLine(term, next, line.cursor);
        i += 3;
        continue;
      }
      if (code === 'C') {
        if (line.moveRight()) term.write('\x1b[C');
        i += 3;
        continue;
      }
      if (code === 'D') {
        if (line.moveLeft()) term.write('\x1b[D');
        i += 3;
        continue;
      }
      if (code === 'H') {
        const moved = line.home();
        if (moved > 0) term.write(`\x1b[${moved}D`);
        i += 3;
        continue;
      }
      if (code === 'F') {
        const moved = line.end();
        if (moved > 0) term.write(`\x1b[${moved}C`);
        i += 3;
        continue;
      }
      // Unknown CSI sequence — swallow.
      i += 3;
      continue;
    }
    if (ch >= ' ' && ch !== '\x7f') {
      line.insert(ch);
      term.write(ch);
      i += 1;
      continue;
    }
    // Other control char — ignore.
    i += 1;
  }
}

function rewriteLine(term: Terminal, line: string, cursor: number): void {
  // Move to start of line (after prompt) and rewrite.
  term.write(`\r${PROMPT}\x1b[K${line}`);
  // Move cursor to desired column relative to line end.
  const back = line.length - cursor;
  if (back > 0) term.write(`\x1b[${back}D`);
}

function applyCompletion(
  term: Terminal,
  line: LineEditor,
  result: CompletionResult,
): void {
  if (result.kind === 'none') {
    term.write(BELL);
    return;
  }
  const before = line.value;
  const next =
    before.slice(0, result.insertStart) + result.insert + before.slice(result.insertEnd);
  if (result.kind === 'list') {
    term.write(BELL);
    // Print candidates on a new line, lay out by trailing-suffix.
    const labels = result.candidates.map((c) => (c.kind === 'dir' ? `${c.name}/` : c.name));
    term.write('\r\n' + labels.join('  ') + '\r\n');
    line.setBuffer(next, result.newCursor);
    rewriteLine(term, next, result.newCursor);
    return;
  }
  if (result.kind === 'prefix') {
    term.write(BELL);
  }
  line.setBuffer(next, result.newCursor);
  rewriteLine(term, next, result.newCursor);
}

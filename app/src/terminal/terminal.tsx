import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTheme } from '@/theme/use-theme';
import { LineEditor } from './line-editor';

const PROMPT = '$ ';

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
}

export function TerminalView({ onCommand }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Refs that survive re-renders.
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const lineRef = useRef(new LineEditor());
  const busyRef = useRef(false);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

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

    const onData = term.onData((data) => {
      if (busyRef.current) return;
      handleData(term, lineRef.current, data, async () => {
        const line = lineRef.current.pushHistory();
        lineRef.current.reset();
        term.write('\r\n');
        busyRef.current = true;
        try {
          await onCommandRef.current(line, api);
        } finally {
          busyRef.current = false;
          term.write(`${PROMPT}`);
        }
      });
    });

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        // ignore — happens during teardown
      }
    });
    ro.observe(container);

    return () => {
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

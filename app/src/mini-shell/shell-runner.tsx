import { useCallback, useRef } from 'react';
import { useEditorTabs } from '@/editor/use-editor-tabs';
import { useVfs } from '@/fs/use-vfs';
import { usePyodide } from '@/pyodide/use-pyodide';
import type { TerminalApi } from '@/terminal/terminal';
import { executePipeline, SHELL_HOME } from './execute';
import { parse, ParseError } from './parse';
import { tokenise, TokeniseError } from './tokenise';

/**
 * Returns a stable callback that runs a single shell line in the
 * mini-shell. Cwd lives in a ref scoped to the calling component
 * so the terminal panel has its own session.
 */
export function useShellRunner() {
  const { vfs } = useVfs();
  const { run, runPython } = usePyodide();
  const { flushAll } = useEditorTabs();
  const cwdRef = useRef<string>(SHELL_HOME);

  const runLine = useCallback(
    async (line: string, api: TerminalApi) => {
      if (!line.trim()) return;
      if (!vfs) {
        api.print('shell: filesystem not ready\n');
        return;
      }
      let tokens;
      try {
        tokens = tokenise(line);
      } catch (e) {
        if (e instanceof TokeniseError) api.print(`tokenise: ${e.message}\n`);
        else throw e;
        return;
      }
      let pipeline;
      try {
        pipeline = parse(tokens);
      } catch (e) {
        if (e instanceof ParseError) api.print(`parse: ${e.message}\n`);
        else throw e;
        return;
      }
      // Pre-execution flush: ensure pending editor autosaves land
      // before the shell dispatches (#26 — editor↔terminal race).
      try {
        await flushAll();
      } catch (e) {
        api.print(`shell: editor flush failed: ${e instanceof Error ? e.message : String(e)}\n`);
      }
      try {
        const { cwdAfter } = await executePipeline(pipeline, {
          vfs,
          cwd: cwdRef.current,
          bridge: (args, stdin, cwd) => run(args, stdin, cwd),
          runPython: (code) => runPython(code),
          print: (text) => api.print(text),
          printErr: (text) => api.print(text),
        });
        cwdRef.current = cwdAfter;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        api.print(`shell: ${msg}\n`);
      }
    },
    [vfs, run, runPython, flushAll],
  );

  return { runLine };
}

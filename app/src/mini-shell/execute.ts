import { WORKSPACE_ROOT } from '@/fs/types';
import type { Vfs } from '@/fs/vfs';
import { BUILTINS, isBuiltin, type BuiltinResult } from './builtins';
import { resolveCwd } from './path-util';
import type { Pipeline, PipelineStage } from './parse';

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface RunPythonBridgeResult {
  ok: boolean;
  value: string;
  error: string | null;
  stdout: string;
  stderr: string;
}

export interface ExecuteCtx {
  vfs: Vfs;
  /** Current working directory at start; may be updated via cwdAfter. */
  cwd: string;
  bridge: (args: string[], stdin?: string) => Promise<RunResult>;
  /** Run a snippet of Python in the Pyodide worker. */
  runPython: (code: string) => Promise<RunPythonBridgeResult>;
  /** Print stdout chunk to the terminal (no extra newline). */
  print: (text: string) => void;
  /** Print stderr chunk (no extra newline). */
  printErr: (text: string) => void;
}

const EMPTY = new Uint8Array(0);
const dec = new TextDecoder('utf-8', { fatal: false });
const enc = new TextEncoder();

export async function executePipeline(
  pipeline: Pipeline,
  ctx: ExecuteCtx,
): Promise<{ exitCode: number; cwdAfter: string }> {
  if (pipeline.stages.length === 0) {
    return { exitCode: 0, cwdAfter: ctx.cwd };
  }
  let stdin: Uint8Array = EMPTY;
  let cwd = ctx.cwd;
  let lastResult: BuiltinResult | RunStageResult | null = null;
  for (const stage of pipeline.stages) {
    const result = await runStage(stage, stdin, { ...ctx, cwd });
    if (result.stderr) ctx.printErr(result.stderr);
    if (result.cwdAfter) cwd = result.cwdAfter;
    stdin = result.stdout;
    lastResult = result;
  }
  // Final stage's stdout: redirect or print.
  const finalBytes = lastResult?.stdout ?? EMPTY;
  if (pipeline.redirect) {
    const resolved = resolveCwd(cwd, pipeline.redirect.target);
    if (!resolved) {
      ctx.printErr(`redirect: path outside workspace: ${pipeline.redirect.target}\n`);
      return { exitCode: 1, cwdAfter: cwd };
    }
    try {
      await ctx.vfs.writeFile(resolved, finalBytes);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      ctx.printErr(`redirect: ${pipeline.redirect.target}: ${msg}\n`);
      return { exitCode: 1, cwdAfter: cwd };
    }
  } else if (finalBytes.length > 0) {
    ctx.print(dec.decode(finalBytes));
  }
  return { exitCode: lastResult?.exitCode ?? 0, cwdAfter: cwd };
}

interface RunStageResult {
  stdout: Uint8Array;
  stderr: string;
  exitCode: number;
  cwdAfter?: string;
}

async function runStage(
  stage: PipelineStage,
  stdin: Uint8Array,
  ctx: ExecuteCtx,
): Promise<RunStageResult> {
  const argv = stage.argv;
  const head = argv[0];
  if (!head) {
    return { stdout: EMPTY, stderr: 'empty command\n', exitCode: 2 };
  }
  if (isBuiltin(head)) {
    const fn = BUILTINS[head];
    if (!fn) {
      return { stdout: EMPTY, stderr: `${head}: not implemented\n`, exitCode: 1 };
    }
    return fn({ argv, stdin, vfs: ctx.vfs, cwd: ctx.cwd });
  }
  if (head === 'frictionless') {
    const stdinStr = stdin.length > 0 ? dec.decode(stdin) : undefined;
    try {
      const result = await ctx.bridge(argv.slice(1), stdinStr);
      return {
        stdout: enc.encode(result.stdout),
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { stdout: EMPTY, stderr: `frictionless: ${msg}\n`, exitCode: 1 };
    }
  }
  if (head === 'python') {
    return runPythonStage(argv, ctx);
  }
  return { stdout: EMPTY, stderr: `${head}: command not found\n`, exitCode: 127 };
}

async function runPythonStage(argv: string[], ctx: ExecuteCtx): Promise<RunStageResult> {
  const args = argv.slice(1);
  if (args.length === 0) {
    return {
      stdout: EMPTY,
      stderr: 'python: usage: python <script.py> [args...]\n',
      exitCode: 2,
    };
  }
  const scriptArg = args[0] as string;
  const resolved = resolveCwd(ctx.cwd, scriptArg);
  if (!resolved) {
    return {
      stdout: EMPTY,
      stderr: `python: path outside workspace: ${scriptArg}\n`,
      exitCode: 1,
    };
  }
  try {
    const st = await ctx.vfs.stat(resolved);
    if (st.kind !== 'file') {
      return { stdout: EMPTY, stderr: `python: ${scriptArg}: not a file\n`, exitCode: 1 };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { stdout: EMPTY, stderr: `python: ${scriptArg}: ${msg}\n`, exitCode: 1 };
  }
  const wrapper = `
import os, sys, runpy, traceback
__argv = ${JSON.stringify(args)}
__cwd = ${JSON.stringify(ctx.cwd)}
__path = ${JSON.stringify(resolved)}
_old_argv = sys.argv
_old_cwd = os.getcwd()
try:
    try:
        os.chdir(__cwd)
    except Exception:
        pass
    sys.argv = list(__argv)
    try:
        runpy.run_path(__path, run_name='__main__')
        _exit_code = 0
    except SystemExit as _e:
        if _e.code is None:
            _exit_code = 0
        elif isinstance(_e.code, int):
            _exit_code = _e.code
        else:
            sys.stderr.write(str(_e.code) + '\\n')
            _exit_code = 1
    except BaseException:
        sys.stderr.write(traceback.format_exc())
        _exit_code = 1
finally:
    sys.argv = _old_argv
    try:
        os.chdir(_old_cwd)
    except Exception:
        pass
_exit_code
`;
  try {
    const result = await ctx.runPython(wrapper);
    const exitNum = Number(result.value);
    const exitCode = Number.isFinite(exitNum) ? exitNum : result.ok ? 0 : 1;
    const stderr = result.error ? `${result.stderr}${result.error}\n` : result.stderr;
    return { stdout: enc.encode(result.stdout), stderr, exitCode };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { stdout: EMPTY, stderr: `python: ${msg}\n`, exitCode: 1 };
  }
}

export const SHELL_HOME = WORKSPACE_ROOT;

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

export interface ExecuteCtx {
  vfs: Vfs;
  /** Current working directory at start; may be updated via cwdAfter. */
  cwd: string;
  bridge: (args: string[], stdin?: string) => Promise<RunResult>;
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
  return { stdout: EMPTY, stderr: `${head}: command not found\n`, exitCode: 127 };
}

export const SHELL_HOME = WORKSPACE_ROOT;

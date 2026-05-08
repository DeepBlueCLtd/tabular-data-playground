import type { Vfs } from '@/fs/vfs';
import { isFsError } from '@/fs/types';
import { resolveCwd } from './path-util';

export interface BuiltinCtx {
  argv: string[];
  stdin: Uint8Array;
  vfs: Vfs;
  cwd: string;
}

export interface BuiltinResult {
  stdout: Uint8Array;
  stderr: string;
  exitCode: number;
  /** When set, the executor updates the shell session cwd. */
  cwdAfter?: string;
}

export type BuiltinFn = (ctx: BuiltinCtx) => Promise<BuiltinResult>;

const enc = new TextEncoder();
const EMPTY = new Uint8Array(0);

function ok(stdout: Uint8Array | string, extra: Partial<BuiltinResult> = {}): BuiltinResult {
  const bytes = typeof stdout === 'string' ? enc.encode(stdout) : stdout;
  return { stdout: bytes, stderr: '', exitCode: 0, ...extra };
}
function fail(name: string, msg: string, exitCode = 1): BuiltinResult {
  return { stdout: EMPTY, stderr: `${name}: ${msg}\n`, exitCode };
}

function extractFsErr(name: string, e: unknown): BuiltinResult {
  if (isFsError(e)) return fail(name, e.message.split('\n')[0] ?? e.message);
  return fail(name, e instanceof Error ? e.message : String(e));
}

const echo: BuiltinFn = async ({ argv }) => ok(argv.slice(1).join(' ') + '\n');

const pwd: BuiltinFn = async ({ cwd }) => ok(`${cwd}\n`);

const cd: BuiltinFn = async ({ argv, cwd, vfs }) => {
  const target = argv[1] ?? '/workspace';
  const resolved = resolveCwd(cwd, target);
  if (!resolved) return fail('cd', `path outside workspace: ${target}`);
  try {
    const st = await vfs.stat(resolved);
    if (st.kind !== 'dir') return fail('cd', `not a directory: ${target}`);
  } catch (e) {
    return extractFsErr('cd', e);
  }
  return ok(EMPTY, { cwdAfter: resolved });
};

const ls: BuiltinFn = async ({ argv, cwd, vfs }) => {
  const target = argv[1] ? resolveCwd(cwd, argv[1]) : cwd;
  if (!target) return fail('ls', `path outside workspace: ${argv[1]}`);
  try {
    const entries = await vfs.readdir(target);
    const text = entries.map((e) => e.name).join('\n');
    return ok(text.length > 0 ? text + '\n' : '');
  } catch (e) {
    return extractFsErr('ls', e);
  }
};

const cat: BuiltinFn = async ({ argv, stdin, cwd, vfs }) => {
  if (argv.length === 1) {
    return ok(stdin);
  }
  const chunks: Uint8Array[] = [];
  let stderr = '';
  let exitCode = 0;
  for (const arg of argv.slice(1)) {
    const resolved = resolveCwd(cwd, arg);
    if (!resolved) {
      stderr += `cat: path outside workspace: ${arg}\n`;
      exitCode = 1;
      continue;
    }
    try {
      const data = await vfs.readFile(resolved, 'binary');
      chunks.push(data);
    } catch (e) {
      stderr += `cat: ${arg}: ${isFsError(e) ? e.message : String(e)}\n`;
      exitCode = 1;
    }
  }
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return { stdout: out, stderr, exitCode };
};

const mkdir: BuiltinFn = async ({ argv, cwd, vfs }) => {
  let recursive = false;
  const paths: string[] = [];
  for (const a of argv.slice(1)) {
    if (a === '-p') {
      recursive = true;
      continue;
    }
    paths.push(a);
  }
  if (paths.length === 0) return fail('mkdir', 'missing operand');
  let stderr = '';
  let exitCode = 0;
  for (const p of paths) {
    const resolved = resolveCwd(cwd, p);
    if (!resolved) {
      stderr += `mkdir: path outside workspace: ${p}\n`;
      exitCode = 1;
      continue;
    }
    try {
      await vfs.mkdir(resolved, { recursive });
    } catch (e) {
      stderr += `mkdir: ${p}: ${isFsError(e) ? e.message : String(e)}\n`;
      exitCode = 1;
    }
  }
  return { stdout: EMPTY, stderr, exitCode };
};

const rm: BuiltinFn = async ({ argv, cwd, vfs }) => {
  let recursive = false;
  const paths: string[] = [];
  for (const a of argv.slice(1)) {
    if (a === '-r' || a === '-R' || a === '-rf' || a === '-fr') {
      recursive = true;
      continue;
    }
    if (a === '-f') continue; // accept silently
    paths.push(a);
  }
  if (paths.length === 0) return fail('rm', 'missing operand');
  let stderr = '';
  let exitCode = 0;
  for (const p of paths) {
    const resolved = resolveCwd(cwd, p);
    if (!resolved) {
      stderr += `rm: path outside workspace: ${p}\n`;
      exitCode = 1;
      continue;
    }
    try {
      await vfs.remove(resolved, { recursive });
    } catch (e) {
      stderr += `rm: ${p}: ${isFsError(e) ? e.message : String(e)}\n`;
      exitCode = 1;
    }
  }
  return { stdout: EMPTY, stderr, exitCode };
};

export const BUILTINS: Record<string, BuiltinFn> = {
  echo,
  pwd,
  cd,
  ls,
  cat,
  mkdir,
  rm,
};

export function isBuiltin(name: string): boolean {
  return Object.hasOwn(BUILTINS, name);
}

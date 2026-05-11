import type { Vfs } from '@/fs/vfs';
import { isFsError } from '@/fs/types';
import { resolveCwd } from './path-util';

export type CompletionKind = 'command' | 'file' | 'dir';

export interface Candidate {
  name: string;
  kind: CompletionKind;
}

export interface UniqueResult {
  kind: 'unique';
  insertStart: number;
  insertEnd: number;
  insert: string;
  newCursor: number;
}

export interface PrefixResult {
  kind: 'prefix';
  insertStart: number;
  insertEnd: number;
  insert: string;
  newCursor: number;
  bell: true;
}

export interface ListResult {
  kind: 'list';
  insertStart: number;
  insertEnd: number;
  insert: string;
  newCursor: number;
  candidates: Candidate[];
  bell: true;
}

export interface NoneResult {
  kind: 'none';
  bell: true;
}

export type CompletionResult = UniqueResult | PrefixResult | ListResult | NoneResult;

export interface CompleteInput {
  line: string;
  cursor: number;
  cwd: string;
  vfs: Vfs;
  commandNames: readonly string[];
  doubleTab: boolean;
}

interface TokenSlice {
  start: number;
  end: number;
  text: string;
  index: number;
  hasQuoteOrEscape: boolean;
}

interface SplitPath {
  dir: string;
  base: string;
}

export function tokenAtCursor(line: string, cursor: number): TokenSlice {
  const isWs = (c: string) => c === ' ' || c === '\t';
  let start = cursor;
  while (start > 0 && !isWs(line[start - 1] ?? '')) start--;
  let end = cursor;
  while (end < line.length && !isWs(line[end] ?? '')) end++;
  const text = line.slice(start, end);
  let index = 0;
  let inToken = false;
  for (let i = 0; i < start; i++) {
    const ws = isWs(line[i] ?? '');
    if (!ws && !inToken) {
      index++;
      inToken = true;
    } else if (ws) {
      inToken = false;
    }
  }
  // If the cursor is at `start` and `start > 0` and the previous char
  // was whitespace, we've placed the cursor on a fresh empty token —
  // index counts all preceding tokens, which is the value above.
  const hasQuoteOrEscape = /['"\\]/.test(text);
  return { start, end, text, index, hasQuoteOrEscape };
}

export function splitTokenPath(token: string): SplitPath {
  const slash = token.lastIndexOf('/');
  if (slash < 0) return { dir: '', base: token };
  return { dir: token.slice(0, slash), base: token.slice(slash + 1) };
}

export function longestCommonPrefix(names: readonly string[]): string {
  if (names.length === 0) return '';
  let prefix = names[0] ?? '';
  for (let i = 1; i < names.length; i++) {
    const n = names[i] ?? '';
    let j = 0;
    const max = Math.min(prefix.length, n.length);
    while (j < max && prefix[j] === n[j]) j++;
    prefix = prefix.slice(0, j);
    if (prefix.length === 0) return '';
  }
  return prefix;
}

interface ResolveOpts {
  candidates: Candidate[];
  insertStart: number;
  insertEnd: number;
  /** The current basename / prefix being completed (already-typed text). */
  typed: string;
  /** The character of `line` at index `insertEnd` (or '' if EOL). Used
   *  to skip an appended trailing space when one already follows. */
  trailingChar: string;
  doubleTab: boolean;
}

function resolveCandidates(opts: ResolveOpts): CompletionResult {
  const { candidates, insertStart, insertEnd, typed, trailingChar, doubleTab } = opts;
  if (candidates.length === 0) {
    return { kind: 'none', bell: true };
  }
  if (candidates.length === 1) {
    const c = candidates[0]!;
    let insert = c.name;
    if (c.kind === 'dir') {
      insert += '/';
    } else if (trailingChar !== ' ') {
      insert += ' ';
    }
    return {
      kind: 'unique',
      insertStart,
      insertEnd,
      insert,
      newCursor: insertStart + insert.length,
    };
  }
  // Multiple candidates.
  const sorted = [...candidates].sort((a, b) => a.name.localeCompare(b.name));
  const lcp = longestCommonPrefix(sorted.map((c) => c.name));
  if (doubleTab) {
    return {
      kind: 'list',
      insertStart,
      insertEnd,
      insert: lcp.length > typed.length ? lcp : typed,
      newCursor: insertStart + (lcp.length > typed.length ? lcp.length : typed.length),
      candidates: sorted,
      bell: true,
    };
  }
  if (lcp.length > typed.length) {
    return {
      kind: 'prefix',
      insertStart,
      insertEnd,
      insert: lcp,
      newCursor: insertStart + lcp.length,
      bell: true,
    };
  }
  return {
    kind: 'prefix',
    insertStart,
    insertEnd,
    insert: typed,
    newCursor: insertStart + typed.length,
    bell: true,
  };
}

export async function complete(input: CompleteInput): Promise<CompletionResult> {
  const { line, cursor, cwd, vfs, commandNames, doubleTab } = input;
  const tok = tokenAtCursor(line, cursor);
  if (tok.hasQuoteOrEscape) {
    return { kind: 'none', bell: true };
  }
  const trailingChar = line.charAt(tok.end);

  if (tok.index === 0) {
    const matches = commandNames
      .filter((n) => n.startsWith(tok.text))
      .map<Candidate>((name) => ({ name, kind: 'command' }));
    return resolveCandidates({
      candidates: matches,
      insertStart: tok.start,
      insertEnd: tok.end,
      typed: tok.text,
      trailingChar,
      doubleTab,
    });
  }

  const { dir, base } = splitTokenPath(tok.text);
  const dirPrefixLen = dir.length + (dir.length > 0 ? 1 : 0);
  const insertStart = tok.start + dirPrefixLen;
  const resolved = resolveCwd(cwd, dir === '' ? '.' : dir);
  if (resolved === null) {
    return { kind: 'none', bell: true };
  }
  let entries;
  try {
    entries = await vfs.readdir(resolved);
  } catch (e) {
    if (isFsError(e)) return { kind: 'none', bell: true };
    throw e;
  }
  const matches = entries
    .filter((e) => e.name.startsWith(base))
    .map<Candidate>((e) => ({ name: e.name, kind: e.kind === 'dir' ? 'dir' : 'file' }));
  return resolveCandidates({
    candidates: matches,
    insertStart,
    insertEnd: tok.end,
    typed: base,
    trailingChar,
    doubleTab,
  });
}

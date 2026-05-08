/**
 * Mini-shell parser. Token stream → Pipeline AST. Constitution
 * Principle VII: rejected operators surface a precise error
 * message rather than being silently stripped.
 *
 * v1 rejects: subshells `$(...)`, command substitution, env-var
 * expansion (`$VAR` / `${VAR}`), globs (`*`, `?`, `~`),
 * chaining (`&&` / `||` / `;`), backgrounding (`&`), tab
 * completion (no parser involvement), `<` redirection, and `>>`
 * append.
 */

import type { Token } from './tokenise';

export interface PipelineStage {
  argv: string[];
}

export interface Redirect {
  op: '>';
  target: string;
}

export interface Pipeline {
  stages: PipelineStage[];
  redirect: Redirect | null;
}

export class ParseError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ParseError';
  }
}

const REJECTED_OPERATORS: ReadonlyArray<string> = [
  '&&',
  '||',
  ';',
  '&',
  '(',
  ')',
  '$(',
  '${',
  '<',
  '>>',
  '*',
  '?',
  '~',
];

export function parse(tokens: Token[]): Pipeline {
  if (tokens.length === 0) return { stages: [], redirect: null };

  for (const t of tokens) {
    if (t.type !== 'word') continue;
    if (REJECTED_OPERATORS.includes(t.value)) {
      throw new ParseError(`'${t.value}' is not supported (see docs/limitations.md)`);
    }
    for (const op of REJECTED_OPERATORS) {
      if (t.value.includes(op)) {
        throw new ParseError(`'${op}' is not supported (see docs/limitations.md)`);
      }
    }
    if (/\$[A-Za-z_]/.test(t.value) || /\$\{/.test(t.value)) {
      throw new ParseError(`variable expansion is not supported (see docs/limitations.md)`);
    }
  }

  const stageTokens: Token[][] = [[]];
  let redirect: Redirect | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (t.type === 'pipe') {
      const cur = stageTokens[stageTokens.length - 1] ?? [];
      if (cur.length === 0) {
        throw new ParseError(`empty pipeline stage near position ${t.pos}`);
      }
      stageTokens.push([]);
      continue;
    }
    if (t.type === 'redirect') {
      const next = tokens[i + 1];
      if (!next || next.type !== 'word') {
        throw new ParseError(`'>' requires a target filename`);
      }
      const after = tokens[i + 2];
      if (after) {
        throw new ParseError(`extra tokens after '> ${next.value}'`);
      }
      redirect = { op: '>', target: next.value };
      break;
    }
    const cur = stageTokens[stageTokens.length - 1];
    if (cur) cur.push(t);
  }

  const stages: PipelineStage[] = stageTokens.map((toks) => {
    if (toks.length === 0) {
      throw new ParseError('empty pipeline stage');
    }
    return { argv: toks.map((t) => t.value) };
  });

  return { stages, redirect };
}

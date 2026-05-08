/**
 * Mini-shell tokeniser. Ported from spike B with TypeScript types.
 *
 * Quoting rules:
 *   - Single quotes preserve everything literally (no escapes).
 *   - Double quotes preserve everything except `\`, which escapes
 *     `\` and `"`.
 *   - Outside quotes, `\` escapes the next character.
 *
 * Operators recognised: `|` and `>`. Other meta-looking sequences
 * (`>>`, `<`, `&`, `;`, etc.) are passed through as `'word'`
 * tokens so the parser can produce precise rejection messages.
 */

export type TokenType = 'word' | 'pipe' | 'redirect';

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export class TokeniseError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'TokeniseError';
  }
}

export function tokenise(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    const ch = line[i] ?? '';
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }
    if (ch === '|') {
      tokens.push({ type: 'pipe', value: '|', pos: i });
      i++;
      continue;
    }
    if (ch === '>') {
      if (line[i + 1] === '>') {
        tokens.push({ type: 'word', value: '>>', pos: i });
        i += 2;
        continue;
      }
      tokens.push({ type: 'redirect', value: '>', pos: i });
      i++;
      continue;
    }

    const start = i;
    let buf = '';
    while (i < n) {
      const c = line[i] ?? '';
      if (c === ' ' || c === '\t' || c === '|' || c === '>') break;
      if (c === '\\') {
        if (i + 1 < n) {
          buf += line[i + 1];
          i += 2;
          continue;
        }
        throw new TokeniseError(`trailing backslash at position ${i}`);
      }
      if (c === "'") {
        const close = line.indexOf("'", i + 1);
        if (close === -1) throw new TokeniseError(`unterminated single quote starting at ${i}`);
        buf += line.slice(i + 1, close);
        i = close + 1;
        continue;
      }
      if (c === '"') {
        i++; // past opening
        while (i < n && line[i] !== '"') {
          const cur = line[i] ?? '';
          if (cur === '\\' && i + 1 < n) {
            const next = line[i + 1] ?? '';
            if (next === '"' || next === '\\') {
              buf += next;
              i += 2;
              continue;
            }
          }
          buf += cur;
          i++;
        }
        if (i >= n) throw new TokeniseError(`unterminated double quote starting at ${start}`);
        i++; // past closing
        continue;
      }
      buf += c;
      i++;
    }
    tokens.push({ type: 'word', value: buf, pos: start });
  }
  return tokens;
}

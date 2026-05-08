// Tokeniser for Spike B mini-shell.
//
// Emits: { type: 'word' | 'pipe' | 'redirect', value: string, pos: number }
//
// Quoting:
//   - 'single' quotes preserve everything literally (no escapes).
//   - "double" quotes preserve everything except `\`, which escapes
//     `\` and `"`.
//   - Outside quotes, `\` escapes the next character.
//
// Operators: `|` and `>`. All other characters that look like shell
// metas (`<`, `>>`, `&`, `;`, `(`, `)`, `*`, `?`, `~`, `$`) are NOT
// special at the tokeniser level — the parser rejects them.

export function tokenise(line) {
  const tokens = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    const ch = line[i];
    if (ch === " " || ch === "\t") { i++; continue; }
    if (ch === "|") { tokens.push({ type: "pipe", value: "|", pos: i }); i++; continue; }
    if (ch === ">") {
      // Reject `>>` here so the parser's reject-message can name it.
      if (line[i + 1] === ">") {
        tokens.push({ type: "word", value: ">>", pos: i });
        i += 2;
        continue;
      }
      tokens.push({ type: "redirect", value: ">", pos: i });
      i++;
      continue;
    }
    // Word — possibly with quoted segments.
    const start = i;
    let buf = "";
    while (i < n) {
      const c = line[i];
      if (c === " " || c === "\t" || c === "|" || c === ">") break;
      if (c === "\\") {
        if (i + 1 < n) { buf += line[i + 1]; i += 2; continue; }
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
        i++; // past opening "
        while (i < n && line[i] !== '"') {
          if (line[i] === "\\" && i + 1 < n && (line[i + 1] === '"' || line[i + 1] === "\\")) {
            buf += line[i + 1]; i += 2;
          } else {
            buf += line[i]; i++;
          }
        }
        if (i >= n) throw new TokeniseError(`unterminated double quote starting at ${start}`);
        i++; // past closing "
        continue;
      }
      buf += c;
      i++;
    }
    tokens.push({ type: "word", value: buf, pos: start });
  }
  return tokens;
}

export class TokeniseError extends Error {
  constructor(msg) { super(msg); this.name = "TokeniseError"; }
}

// Parser for Spike B mini-shell. Token stream → Pipeline AST.
// Rejects unsupported features by name (Constitution Principle VII —
// surface absences rather than silently strip).

const REJECTED_OPERATORS = new Set([
  "&&", "||", ";", "&", "(", ")", "$(", "${", "<", ">>", "*", "?", "~",
]);

export function parse(tokens) {
  if (tokens.length === 0) return { stages: [], redirect: null };

  // Reject features we deliberately don't support. Walk the token
  // word values for forbidden multi-character operators that the
  // tokeniser passed through verbatim (e.g. `&&`).
  for (const t of tokens) {
    if (t.type === "word") {
      // Detect operator-like words AS WHOLE TOKENS. We do not search
      // inside quoted text — that's the user's data, not their shell
      // syntax.
      if (REJECTED_OPERATORS.has(t.value)) {
        throw new ParseError(`'${t.value}' is not supported (see docs/limitations.md)`);
      }
      // Also catch suffix/prefix forms like `cmd&&`, `a||b` if the
      // user didn't space them. The tokeniser would normally have
      // them as single words, so check substrings for the forbidden
      // operator characters.
      for (const op of REJECTED_OPERATORS) {
        if (t.value.includes(op)) {
          throw new ParseError(`'${op}' is not supported (see docs/limitations.md)`);
        }
      }
      // Detect $VAR / ${VAR} — variable expansion is rejected.
      if (/\$[A-Za-z_]/.test(t.value) || /\$\{/.test(t.value)) {
        throw new ParseError(`variable expansion is not supported (see docs/limitations.md)`);
      }
    }
  }

  // Split on `pipe` tokens.
  const stageTokens = [[]];
  let redirect = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "pipe") {
      if (stageTokens[stageTokens.length - 1].length === 0) {
        throw new ParseError(`empty pipeline stage near position ${t.pos}`);
      }
      stageTokens.push([]);
      continue;
    }
    if (t.type === "redirect") {
      // `>` may only appear after the last stage; everything after
      // it must be a single word (the target).
      const next = tokens[i + 1];
      if (!next || next.type !== "word") {
        throw new ParseError(`'>' requires a target filename`);
      }
      const after = tokens[i + 2];
      if (after) {
        throw new ParseError(`extra tokens after '> ${next.value}'`);
      }
      redirect = { op: ">", target: next.value };
      break;
    }
    stageTokens[stageTokens.length - 1].push(t);
  }

  const stages = stageTokens.map((toks) => {
    if (toks.length === 0) {
      throw new ParseError("empty pipeline stage");
    }
    return { argv: toks.map((t) => t.value) };
  });

  return { stages, redirect };
}

export class ParseError extends Error {
  constructor(msg) { super(msg); this.name = "ParseError"; }
}

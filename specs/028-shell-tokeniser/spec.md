# Feature Specification: Mini-shell Tokeniser (#22)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #22 — splits a line respecting
single/double quotes and escape characters (~50 LoC) (`spec.md`
§6).

## User Scenarios

- `echo hello` → `[word echo, word hello]`.
- `echo 'a b' "c d" e\\ f` → `[word echo, word "a b", word "c d",
  word "e f"]`.
- `cat foo | grep x > out.txt` → `[word, word, pipe, word, word,
  redirect, word]`.
- `>>` is recognised as a "word" so the parser can produce a
  precise rejection message.

## Requirements

- **FR-001**: New module `app/src/mini-shell/tokenise.ts`
  implements the spike B tokeniser, ported to TypeScript. Token
  types: `'word' | 'pipe' | 'redirect'`. Errors throw
  `TokeniseError`.
- **FR-002**: Single quotes preserve everything literally;
  double quotes preserve everything except `\` (escapes `\` and
  `"`); outside quotes `\` escapes the next char.
- **FR-003**: Operators recognised: `|` and `>`. Everything else
  is left as a word for the parser to police.
- **FR-004**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Success Criteria

- Hand-written test cases produce the expected token streams.
  (Exhaustive tests live with #24 — but the implementation
  matches the spike B golden tests in shape.)

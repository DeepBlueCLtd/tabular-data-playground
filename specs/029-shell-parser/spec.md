# Feature Specification: Mini-shell Parser (#23)

**Branch**: `claude/epic-e1-1gMf9`
**Input**: Backlog item #23 — AST of pipelines and redirections.
Reject for v1: subshells `$(...)`, command substitution, env-var
expansion, globs, `&&`/`||`/`;` chaining, backgrounding, signal
handling, tab completion. Document rejections clearly (~100 LoC).

## Requirements

- **FR-001**: New module `app/src/mini-shell/parse.ts` ports the
  spike B parser to TypeScript with `Pipeline`,
  `PipelineStage`, `Redirect` types.
- **FR-002**: Output: `{ stages: PipelineStage[]; redirect:
  Redirect | null }` for non-empty input; `{ stages: [],
  redirect: null }` for empty.
- **FR-003**: Reject (with `ParseError` carrying a precise
  message naming the operator) any of: `&&`, `||`, `;`, `&`,
  `(`, `)`, `$(`, `${`, `<`, `>>`, `*`, `?`, `~`, `$VAR`-style
  expansion. Each rejection points users at
  `docs/limitations.md`.
- **FR-004**: `>` may only appear after the last stage; the
  next token must be a single word (target). Extra tokens after
  the redirect target → ParseError.
- **FR-005**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

# Implementation Plan: Mini-shell Executor

**Branch**: `claude/epic-e1-1gMf9` (epic mode)

## Files touched

- `app/src/mini-shell/execute.ts` — new.
- `app/src/mini-shell/shell-runner.tsx` — new (hook).
- `app/src/components/shell/terminal-panel.tsx` — wire runner.

## Constitution Check

1–6. All gates pass. Tokeniser/parser/builtins already in place
from #22 / #23 / #25. Constitution Principle VII (sharp edges)
already documented in `docs/limitations.md`.

## Notes

The executor is small (~150 LoC) because the heavy lifting lives
in the tokeniser, parser, builtins, and bridge. This module is
glue.

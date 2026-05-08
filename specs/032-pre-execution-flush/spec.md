# Feature Specification: Pre-execution Flush (#26)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #26 — editor cancels pending auto-saves
and writes synchronously before mini-shell dispatches (decision
#48, `spec.md` §6.5). Eliminates editor↔terminal race.

## User Scenarios

The user types in the editor, then immediately switches to the
terminal and runs `frictionless validate file.csv` before the
500 ms autosave debounce fires. The shell flushes the pending
write, so the CLI sees the latest content.

## Requirements

- **FR-001**: `useShellRunner` MUST call
  `editorTabs.flushAll()` before invoking `executePipeline`.
- **FR-002**: Flush failures (rare) are surfaced to the
  terminal as a one-line warning but do NOT abort the command.
- **FR-003**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

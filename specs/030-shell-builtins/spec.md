# Feature Specification: Mini-shell Builtins (#25)

**Branch**: `claude/epic-e1-1gMf9`
**Input**: Backlog item #25 — `ls`, `cat`, `cd`, `pwd`, `mkdir`,
`rm`, `echo`.

## User Scenarios

- `pwd` → prints the current cwd (defaults to `/workspace`).
- `cd subdir` → changes cwd; prints nothing.
- `ls` / `ls subdir` → newline-separated entries.
- `cat foo bar` → concatenates file contents to stdout.
- `cat` (no args) → echoes stdin.
- `mkdir new` / `mkdir -p a/b/c` → creates dirs.
- `rm foo` / `rm -r dir` → removes (no implicit recursion;
  `-r` required for dirs).
- `echo a b c` → `a b c\n`.

## Requirements

- **FR-001**: New module `app/src/mini-shell/builtins.ts`
  exports `BUILTINS: Record<string, BuiltinFn>` and
  `isBuiltin(name)`.
- **FR-002**: A `BuiltinFn` is async:
  `(ctx: BuiltinCtx) => Promise<BuiltinResult>` where
  `BuiltinCtx = { argv, stdin, vfs, cwd }` and
  `BuiltinResult = { stdout: Uint8Array; stderr: string;
  exitCode: number; cwdAfter?: string }`.
- **FR-003**: Path resolution: relative paths resolve against
  `cwd`; absolute paths are absolute. Resolved paths must stay
  within `/workspace` (else error `EPERM`-equivalent).
- **FR-004**: Each builtin produces a non-zero exit code on
  errors and writes a one-line message to stderr. No throws
  except for unexpected internal errors.
- **FR-005**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Assumptions

- Executor (#24) provides stdin as a `Uint8Array` and routes
  the result. Builtins themselves do not implement piping.
- Binary content is fine for `cat`; output is bytes.

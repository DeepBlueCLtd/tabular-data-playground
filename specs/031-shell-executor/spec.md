# Feature Specification: Mini-shell Executor (#24)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #24 — resolves each pipeline stage to JS
builtin or Pyodide call; streams stdout via async iterators /
`ReadableStream`; serialised + buffered pipes (decision #4)
(~200 LoC) (`spec.md` §6).

## Decisions confirmed

- **Routing**: only `frictionless ...` invocations route to the
  Pyodide bridge. Other non-builtin commands → "command not
  found" (exit 127). Builtins from #25 short-circuit.
- **Pipes**: serialised + buffered (decision #4). Each stage runs
  to completion; its stdout (Uint8Array) is the next stage's
  stdin; stderr surfaces immediately to the terminal as each
  stage finishes; final stage's stdout is the pipeline's stdout.
- **Bridge stdin**: UTF-8 decoded (lossy on invalid bytes). The
  bridge protocol stays string-only.
- **Redirect**: `> target` truncates without modal-confirm.

## User Scenarios

- `echo hi` → terminal prints `hi`.
- `echo hi | cat` → terminal prints `hi`.
- `frictionless --version` → version + exit 0.
- `cat data.csv | frictionless validate -` (if `-` is the
  Frictionless convention) → CSV piped to stdin.
- `echo data > out.txt` → file written.
- `cd subdir && pwd` — `&&` is rejected by the parser.
- An unknown command → `nope: command not found`, exit 127.

## Requirements

- **FR-001**: New module `app/src/mini-shell/execute.ts`
  exports `executePipeline(pipeline, ctx)` returning
  `{ exitCode: number; cwdAfter: string }`.
- **FR-002**: Stage routing:
  - `argv[0]` in `BUILTINS` → builtin function.
  - `argv[0] === 'frictionless'` → `bridge.run(argv.slice(1),
    stdinAsUtf8String)`.
  - Otherwise → `{stdout: empty, stderr: 'cmd: command not
    found\n', exitCode: 127}`.
- **FR-003**: stdin to a stage is the previous stage's stdout
  (`Uint8Array`). The first stage gets an empty stdin.
- **FR-004**: stderr from each stage is printed to the terminal
  immediately upon stage completion (so a slow earlier stage's
  errors don't get held back). stdout of intermediate stages is
  ONLY consumed as the next stage's stdin.
- **FR-005**: Final stage's stdout is either written to the
  redirect target (truncating without modal) or printed to the
  terminal.
- **FR-006**: Pipeline exit code = last stage's exit code.
- **FR-007**: A new `app/src/mini-shell/shell-runner.tsx`
  React hook returns a stable `runLine(line, api)` callback
  that tokenises → parses → executes. Shell session cwd lives in
  a ref bound to the hook (per-component instance — scopes to
  the terminal panel).
- **FR-008**: `terminal-panel.tsx` MUST replace the stub
  `handleCommand` with the runner.
- **FR-009**: Tokenise / Parse errors are printed in red as
  `<name>: <message>` and exit code 2.
- **FR-010**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Success Criteria

- `echo hello | cat > out.txt` writes `hello\n` to
  `/workspace/out.txt`.
- `frictionless --version` prints the version line.
- `&&` produces "is not supported" error from the parser.
- `cd /workspace/foo` updates `pwd` for the next command.

# Feature Specification: Pyodide Command Bridge

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #28 — "Pyodide command bridge — wrap Python
entry-point invocation, feed stdin string, capture
stdout/stderr/exit-code via `runPythonAsync` + stdin/stdout
redirection patches; emits `fs-changed` on FS writes (`spec.md` §6)."

## Decisions confirmed (per user)

- **Surface**: high-level `run(args, stdin?)` for the `frictionless`
  CLI **plus** an escape-hatch `runPython(code)` for tests/spikes.
- **Output**: buffered (resolve once on completion). Streaming
  deferred — fits decision #4 (serialised + buffered pipes).
- **fs-changed**: protocol shape stubbed in #28; emission wired by
  #11 (IDBFS mount) and #12 (event system).
- **Exit code**: catch `SystemExit`, use its `.code`; fall back to 1
  on other exceptions, 0 on clean completion.

## User Scenarios & Testing

### User Story 1 — `frictionless --version` returns stdout + exit 0 (P1)

A test harness calls `run(['--version'])` on the bridge once Pyodide
is ready. The promise resolves with stdout containing "frictionless"
and a version string, empty stderr, exit code 0.

**Independent Test**: From the dev console after Pyodide ready,
`(await window.__pyodide.run(['--version'])).exitCode === 0` and
`stdout.includes('frictionless')`.

### User Story 2 — `frictionless validate <missing.csv>` returns non-zero (P1)

`run(['validate', 'missing.csv'])` resolves with exit code ≠ 0 and
an error in stderr. The bridge does not throw.

**Independent Test**: From console, the call resolves and reports a
non-zero exit code with a readable stderr.

### User Story 3 — `runPython('1+1')` returns 2 (P2)

The escape hatch evaluates a snippet and resolves with the
stringified result.

**Independent Test**: `(await __pyodide.runPython('1+1')).value === '2'`.

### User Story 4 — Errors do not poison subsequent calls (P1)

After a failing `run(...)`, a follow-up successful call still works.
stdout/stderr buffers and `sys.argv` are restored regardless.

**Independent Test**: Failing call followed by `--version` — second
call resolves cleanly.

### Edge Cases

- Concurrent calls: the worker serialises bridge calls (one Python
  call at a time per Pyodide constraints). The provider uses an
  in-flight queue so a second `run()` waits for the first.
- stdin: feeding a string is supported via Pyodide's `setStdin({
  stdin: () => <string-once> })`. Subsequent reads return EOF.
- Capturing output: Pyodide's `setStdout({ batched })` /
  `setStderr({ batched })`. Each batched callback receives a
  newline-terminated chunk; we accumulate.
- The `fs-changed` message shape exists in `protocol.ts` from #28
  but the worker does not post it yet. #11 adds the emission once
  IDBFS is mounted.

## Requirements

- **FR-001**: `protocol.ts` MUST add: `RunRequest`, `RunPythonRequest`,
  `RunResponse`, `RunPythonResponse`, `FsChangedEvent` (latter
  stubbed).
- **FR-002**: The worker MUST handle `run` requests by:
  1. installing batched stdout/stderr capture,
  2. installing a one-shot `setStdin` if `stdin` provided,
  3. running a small Python wrapper that does
     `runpy.run_module('frictionless', run_name='__main__',
     alter_sys=True)` after setting `sys.argv`,
  4. catching `SystemExit` to derive exit code (None → 0, int → as
     is, str → 1 with message to stderr); other `Exception` → 1
     with traceback header to stderr,
  5. restoring `sys.argv` in a `finally`,
  6. posting `RunResponse` with `{ id, stdout, stderr, exitCode }`.
- **FR-003**: The worker MUST handle `run-python` by calling
  `runPythonAsync(code)` and posting `RunPythonResponse` with
  `{ id, ok: true, value }` (stringified) or `{ id, ok: false,
  error }`. Stdout/stderr capture is wired the same way so prints
  go to a result side-channel.
- **FR-004**: The provider MUST expose `run(args, stdin?)` and
  `runPython(code)` as functions on the context value, returning
  Promises correlated by a generated id. Calls before `status === 'ready'`
  reject with `'Pyodide not ready'`.
- **FR-005**: The provider MUST serialise calls per worker so two
  Python invocations don't trample each other's stdout capture.
- **FR-006**: The provider MUST mount the bridge on
  `globalThis.__pyodide` in dev (via `import.meta.env.DEV`) for
  manual smoke testing; production builds skip this.
- **FR-007**: `pnpm run lint && pnpm run typecheck && pnpm run build`
  MUST exit 0.

## Success Criteria

- **SC-001**: After Pyodide ready, `run(['--version'])` resolves to
  `exitCode 0` with `frictionless` in stdout.
- **SC-002**: An invalid invocation resolves to `exitCode !== 0`
  without throwing.
- **SC-003**: A failing call followed by `run(['--version'])` still
  succeeds (no leaked argv / capture state).

## Assumptions

- Frictionless ships a `__main__.py` that Click/Typer drives;
  `runpy.run_module('frictionless', run_name='__main__')` invokes
  the CLI exactly as `python -m frictionless` would.
- Pyodide 0.27 exposes `setStdout({ batched })`,
  `setStderr({ batched })`, and `setStdin({ stdin })`.
- Buffered output is acceptable for v1 — large outputs are bounded
  by Pyodide memory rather than this bridge.
- `fs-changed` shape is locked here so #11 / #12 don't change the
  protocol again.

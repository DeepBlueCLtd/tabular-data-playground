# Implementation Plan: Pyodide Command Bridge

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Extend the worker protocol with `run` (CLI) and `run-python`
(escape hatch) request/response messages, plus a stubbed
`fs-changed` event shape. Worker captures stdout/stderr/stdin via
Pyodide's `setStdout/setStderr/setStdin`, runs `frictionless` via
`runpy.run_module`, derives exit code from `SystemExit`. Provider
correlates promises by id and serialises calls.

## Constitution Check

1. Research-first — pass. Critical for evaluating Frictionless.
2. Notes-section — N/A (infra).
3. Destruction — pass.
4. Backend — pass.
5. Pinning — N/A (no new deps).
6. Limitations — pass; no new sharp edges beyond those already in
   `docs/limitations.md`.

All gates pass.

## Technical Context

- **Capture**: `pyodide.setStdout({ batched: s => stdout += s })`
  receives newline-terminated chunks; we append the trailing `\n`.
- **stdin**: `setStdin({ stdin: () => oneShot })` — a closure
  yields the string once, EOF afterwards.
- **Exit code derivation** (Python side):
  ```python
  try:
      runpy.run_module('frictionless', run_name='__main__', alter_sys=True)
      exit_code = 0
  except SystemExit as e:
      if e.code is None: exit_code = 0
      elif isinstance(e.code, int): exit_code = e.code
      else:
          import sys; sys.stderr.write(str(e.code) + '\n'); exit_code = 1
  except BaseException as e:
      import sys, traceback
      sys.stderr.write(traceback.format_exc()); exit_code = 1
  ```
- **Argv plumbing**: pass args from JS via `pyodide.globals.set('__cli_args', args)`; Python reads `list(__cli_args)`.
- **Serialisation**: a per-provider promise chain
  `inflight = inflight.then(() => doCall())` ensures one Python
  call at a time.
- **Id correlation**: `crypto.randomUUID()`; map id → {resolve, reject}.
- **Reset between calls**: install fresh capture closures each
  call; `setStdin` is reset to a no-op-EOF after the call so a
  later call without stdin reads EOF.
- **MinimalPyodide** type expanded with `setStdout / setStderr /
  setStdin / globals.set`.

## Files touched

- `app/src/pyodide/protocol.ts` — extend.
- `app/src/pyodide/worker.ts` — handle run + run-python.
- `app/src/pyodide/pyodide-context.ts` — add `run`, `runPython`.
- `app/src/pyodide/pyodide-provider.tsx` — implement bridge.
- `app/src/pyodide/use-pyodide.ts` — no change.

## Phase 0 — Research

- `runpy.run_module(..., run_name='__main__', alter_sys=True)` is
  the canonical way to invoke a Python package's `__main__`. Click
  / Typer raise `SystemExit` on completion or error, which we
  convert to an exit code.
- Pyodide stdout/stderr APIs are stable since 0.25; we pin 0.27.7.
- For the escape-hatch `runPython`, output capture uses the same
  hooks; the resolved `value` is `String(result ?? '')`.

## Notes

The protocol bump is additive; #29's loader handshake is unchanged.

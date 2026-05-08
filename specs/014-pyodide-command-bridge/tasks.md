# Tasks: Pyodide Command Bridge (Backlog #28)

## Phase 1: Protocol

- [X] T001 Extend `protocol.ts` with `RunRequest`, `RunPythonRequest`,
  `RunResponse`, `RunPythonResponse`, `FsChangedEvent` (stub);
  update `WorkerInbound` / `WorkerOutbound` unions.

## Phase 2: Worker

- [X] T002 In `worker.ts`, expand `MinimalPyodide` with
  `setStdout/setStderr/setStdin/globals.set`.
- [X] T003 Add `runCli(id, args, stdin)` handler — capture
  stdout/stderr, set stdin once, set `__cli_args`, invoke a
  Python wrapper that `runpy.run_module('frictionless',
  run_name='__main__')` and derives exit code from `SystemExit`.
  Restore `sys.argv` in a finally.
- [X] T004 Add `runPythonHandler(id, code)` — captures
  stdout/stderr, calls `runPythonAsync(code)`, posts
  `run-python-result`.
- [X] T005 Wire the message dispatcher to route `'run'` and
  `'run-python'` requests.

## Phase 3: Provider

- [X] T006 Extend `pyodide-context.ts` with `run` / `runPython`
  signatures.
- [X] T007 In `pyodide-provider.tsx`, add an in-flight promise
  chain + id-correlated resolver map; implement `run(args, stdin?)`
  and `runPython(code)`. Calls before ready reject.
- [X] T008 In dev only (`import.meta.env.DEV`), expose
  `globalThis.__pyodide = { run, runPython }` for manual smoke
  tests.

## Phase 4: Verify

- [X] T009 `pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run build` exit 0.
- [X] T010 Manual smoke (left to user): in dev console after Pyodide ready,
  `(await __pyodide.run(['--version'])).exitCode === 0`.

## Phase 5: Backlog + commit

- [X] T011 Strikethrough `#28` in `backlog.md`; bump Updated.
- [X] T012 Three commits: `feat(#28)`, `docs(#28)`, `docs: backlog status`.

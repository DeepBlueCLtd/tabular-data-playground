# Tasks: Pyodide Loader (Web Worker) (Backlog #27)

## Phase 1: Config + protocol

- [X] T001 Create `app/src/pyodide/config.ts` exporting `PYODIDE_VERSION`, `PYODIDE_INDEX_URL`, `PYODIDE_SCRIPT_URL`, `FRICTIONLESS_VERSION`.
- [X] T002 Create `app/src/pyodide/protocol.ts` with typed message shapes: `LoadRequest`, `ReadyEvent`, `WorkerErrorEvent`. (Run/FS messages deferred to #28.)

## Phase 2: Worker

- [X] T003 Create `app/src/pyodide/worker.ts` — module worker. On `'load'`: `importScripts(PYODIDE_SCRIPT_URL)`, `loadPyodide({ indexURL })`, `loadPackage('micropip')`, `micropip.install('frictionless')`, post `{ type: 'ready', pyodideVersion, frictionlessVersion }`. On error post `{ type: 'error', stage, message }`.

## Phase 3: Provider + hook

- [X] T004 Create `app/src/pyodide/pyodide-context.ts` — context type `{ status, error, pyodideVersion, frictionlessVersion, reload }`.
- [X] T005 Create `app/src/pyodide/pyodide-provider.tsx` — lazy worker creation (after first paint via `setTimeout(0)`), guard ref against StrictMode double-invoke, terminate on error, no-op `reload` stub.
- [X] T006 Create `app/src/pyodide/use-pyodide.ts` — consumer hook, throws if outside provider.

## Phase 4: Wire + verify

- [X] T007 Wrap `App.tsx` with `<PyodideProvider>` (inside `<ThemeProvider>`).
- [X] T008 `pnpm run lint && pnpm run format:check && pnpm run build` — all exit 0. Worker bundles into a separate chunk under `dist/assets/worker-*.js`.
- [X] T009 Manual sanity check left for the user; logic mirrors spike A's loader path verified end-to-end via Playwright in #1.

## Phase 5: Backlog + commit

- [X] T010 Strikethrough `#27` in `backlog.md`; bump Updated.
- [X] T011 Three commits: `feat(#27)`, `docs(#27)`, `docs: backlog status`.

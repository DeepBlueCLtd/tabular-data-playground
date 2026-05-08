# Tasks: Pyodide Crash Recovery (Backlog #30)

- [X] T001 In `pyodide-provider.tsx`, change `reload` to a
  dedicated function that: rejects pending, terminates worker if
  any, calls `spawnWorker()`. (Today it just calls `cancel()`,
  which short-circuits when the worker is null.)
- [X] T002 In `terminal-panel.tsx`, add a "Reload runtime" button
  in the header when `status === 'error'`. Hidden otherwise.
- [X] T003 `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.
- [X] T004 Strikethrough `#30` in `backlog.md`; bump Updated.
- [X] T005 Three commits: `feat(#30)`, `docs(#30)`, `docs: backlog status`.

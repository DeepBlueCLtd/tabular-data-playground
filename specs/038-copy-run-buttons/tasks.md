# Tasks: Copy + Run buttons (#39)

## Phase 1: Foundational
- [ ] T001 Create `app/src/terminal/terminal-submit-store.ts` exposing `setTerminalSubmit(fn|null)` and `useTerminalSubmit()`. Module-level singleton; React subscribers via `useSyncExternalStore`.
- [ ] T002 Modify `app/src/terminal/terminal.tsx`: extend `TerminalApi` with an internal `submitLine(line: string): Promise<void>` that writes the line to xterm and triggers `onCommand`. Register/unregister with the store on mount/unmount.

## Phase 2: Action component
- [ ] T003 Create `app/src/lessons/copy-run-actions.tsx` exporting a `CopyRunActions` factory that returns either a Copy/Run pair (when `lang === 'bash'`) or `null`. Copy: `navigator.clipboard.writeText(source)`, brief "Copied" indicator on success, inline error on failure. Run: disabled when `useTerminalSubmit()` is `null`; on click, calls `submit(source)`.
- [ ] T004 Modify `app/src/lessons/lesson-renderer.tsx`: pass `renderCodeActions={CopyRunActions}` so `LessonCodeBlock` (#38) injects the action bar.

## Phase 3: Sample + e2e
- [ ] T005 Confirm `_sample/lesson.md` already has a `bash` block (it does — `frictionless describe data.csv`). No content change needed.
- [ ] T006 Add `e2e/lessons.spec.ts` test "Copy on bash block writes to clipboard" — uses Playwright `context.grantPermissions(['clipboard-read', 'clipboard-write'])`. Asserts clipboard contents post-click.
- [ ] T007 Add e2e "Run is disabled before terminal ready, enabled after" — verify button has `disabled` attribute while Pyodide is loading; verify button is enabled after `Python ready` (skip if Pyodide unreachable).
- [ ] T008 Add e2e "Non-bash blocks have no action bar" — `code.language-python` should not have a sibling `[data-lesson-code-actions]`.

## Phase 4: Polish
- [ ] T009 Run `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && CI=1 pnpm test:e2e`.
- [ ] T010 Update `backlog.md` row #39 → `complete`. Commit `docs: backlog status — #39 complete`.

## Dependencies
T001 → T002 → T003 → T004 → e2e (T005..T008) → T009 → T010.

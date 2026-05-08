# Tasks: Run button states (#40)

- [ ] T001 Modify `app/src/terminal/terminal-submit-store.ts`: split into three small `useSyncExternalStore`-backed values: `submit`, `running`, `lastRunSource`. New setters `setTerminalRunning(b)`, `setLastRunSource(s)`. New hooks `useTerminalRunning()`, `useLastRunSource()`.
- [ ] T002 Modify `app/src/terminal/terminal.tsx`: in `dispatch`, set running=true at entry and running=false in `finally`. The `submit` callback for Run additionally sets `lastRunSource` *before* dispatching (so the marker shows immediately).
- [ ] T003 Modify `app/src/lessons/lesson-code-block.tsx`: optionally apply `data-lesson-code-active="true"` and a `lesson-code-block--active` class when an `isActive` prop is true (or pass through a render-prop callback so the action component can request activation). Simplest: let `LessonCodeBlock` accept an `isActive: boolean` prop derived externally — but that requires the renderer to know. Cleanest: have the action bar read `lastRunSource` itself and set the data attribute via a wrapping `<div>` inside the actions area, or modify the renderer to lift the active state up. **Decision: have CopyRunBar render a wrapping `<div>` with the data-active attribute and CSS that targets the parent code block via `:has()`-style sibling selectors.**
- [ ] T004 Modify `app/src/lessons/copy-run-bar.tsx`:
  - Read `useTerminalRunning()` and `useLastRunSource()`.
  - Wrap the bar in a `<div data-lesson-code-active="true|false">`.
  - Run button disabled when `submit === null || running`.
  - Run button label = "Running…" when `running && lastRunSource === source`.
  - On click: call `setLastRunSource(source)` THEN submit.
- [ ] T005 Add a CSS selector in `lesson-styles.css` so an active code block has a left-edge accent. Use the actions wrapper's data attribute via `[data-lesson-code-active="true"]` styling.
- [ ] T006 e2e: extend `lessons.spec.ts` "Copy + Run buttons" describe block with a test asserting that clicking Run on the bash block sets `data-lesson-code-active="true"` on the bar wrapper. (We can't easily test the running-disable transition without Pyodide; defer that to deployed-site verification per spec.md §11.)
- [ ] T007 Run typecheck/lint/format/build/e2e green.
- [ ] T008 Backlog status — #40 complete.

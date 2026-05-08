# Feature Specification: Monaco Editor (Tabbed, Lazy, Autosave)

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #13 — "Monaco editor integration,
lazy-loaded; tabbed editing; debounced auto-save ~500 ms after
last keystroke (decision #27)."

## User Scenarios & Testing

### User Story 1 — Open a workspace file in a tab and edit it (P1)

A user calls `editorTabs.open('/workspace/foo.csv')` (or, in v1,
clicks a temporary "+ Open sample file" affordance). A tab opens,
Monaco loads, file content shows. Typing edits the buffer and a
debounced auto-save writes to the vfs ~500 ms after the last
keystroke.

**Independent Test**: From dev console, write a file via
`__pyodide.vfs.writeFile`, then open it via the editor tab API.
Edit. Wait 600 ms. Re-read via vfs — content matches the editor.

### User Story 2 — Multiple tabs, switching focus (P1)

Open two files. Each gets a tab. Clicking a tab focuses that
file's buffer; the other tab keeps its content. Closing the
non-active tab leaves the focused one alone.

### User Story 3 — Monaco loads only when first needed (P2)

Until the first tab opens, the Monaco bundle is not in the main
chunk. The editor area shows an empty state. When a tab opens,
Monaco lazy-loads (Suspense fallback "Loading editor…"); main
chunk size growth on the loader path is tiny.

### Edge Cases

- An open tab whose file is removed from the vfs shows a "file
  deleted on disk" indicator (Monaco's built-in `markers` /
  badge). For v1 the indicator is just a strikethrough on the
  tab label. Reopening the file via vfs writeFile clears it.
- Auto-save is debounced per-tab (each tab has its own timer).
  Switching tabs does NOT cancel pending saves on the previous
  tab.
- Modal-confirm before closing a tab with unsaved changes is
  out of scope for v1 (auto-save makes this rare); a closing
  tab flushes its pending save synchronously.
- Tab persistence (which tabs are open across reload) lands in
  #19; this item only persists a tab list in memory.
- The Monaco theme follows the app theme via the existing theme
  provider (#10) — `vs-dark` for dark, `vs` for light.

## Requirements

- **FR-001**: New deps MUST be added to `app/package.json` with
  exact versions (no `^`):
  - `@monaco-editor/react@4.6.0`
  - `monaco-editor@0.52.2`
- **FR-002**: A `app/src/editor/config.ts` MUST export the pinned
  Monaco version + the CDN URL used by the loader, mirroring
  Pyodide's pattern.
- **FR-003**: `app/src/editor/editor-tabs-context.ts` +
  `editor-tabs-provider.tsx` + `use-editor-tabs.ts` MUST expose:
  - `tabs: EditorTab[]` — `{ id, path, dirty }`,
  - `activeTabId: string | null`,
  - `open(path: string): Promise<void>` — load via vfs, dedupe
    on path, focus the new tab,
  - `close(id: string): Promise<void>` — flush pending save, remove tab,
  - `setActive(id: string): void`,
  - `setBuffer(id: string, content: string): void` — called by
    Monaco onChange; updates dirty + schedules autosave.
- **FR-004**: `app/src/editor/editor-area.tsx` MUST replace
  `editor-area-placeholder.tsx`. It renders:
  - tab strip,
  - lazy-loaded Monaco area (Suspense fallback "Loading editor…"),
  - empty state when no tabs are open.
- **FR-005**: `app/src/editor/auto-save.ts` MUST debounce writes
  per tab at 500 ms; `flush(id)` writes immediately. Used by
  close + a future #26 pre-execution flush.
- **FR-006**: Monaco theme MUST be set from `useTheme()` —
  `vs-dark` for dark, `vs` for light.
- **FR-007**: Monaco language MUST be inferred from extension:
  `.csv` → plaintext (Monaco has no built-in CSV mode in v1),
  `.json` → json, `.yaml`/`.yml` → yaml, `.md` → markdown,
  `.py` → python; otherwise plaintext.
- **FR-008**: A temporary "+ Open sample file" affordance in the
  empty state MUST allow the user to open `/workspace/sample.csv`
  for smoke testing — replaced by the file tree (#15) /
  drag-drop importer (#17). The affordance creates the file with
  a 3-row CSV if it doesn't exist.
- **FR-009**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0. `pnpm test` (tsc --noEmit) MUST pass.

## Success Criteria

- **SC-001**: Opening a file via `open(path)` mounts the editor,
  shows the content within ~1 s on broadband, and the user can
  type into it.
- **SC-002**: After 600 ms idle, vfs reads return the edited
  content.
- **SC-003**: Monaco code is in a separate chunk; the main bundle
  growth from this item is bounded (within ~10 KB gzipped on the
  hot path).
- **SC-004**: Closing a tab with unsaved changes flushes the save
  before unmounting.

## Assumptions

- `@monaco-editor/react` ships its own loader that fetches Monaco
  from CDN; we configure the CDN to a pinned version and trust
  the lockfile + URL pin to satisfy Constitution Principle VI.
- The user is on a network that can reach jsdelivr; failures
  surface in the Suspense boundary. (No fallback in v1.)
- Tab persistence + restoration is #19's job. v1 starts with no
  tabs open on every page load.

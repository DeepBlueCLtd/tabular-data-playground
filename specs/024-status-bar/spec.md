# Feature Specification: Status Bar (#18)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #18 — "Status bar — file path of focused
tab, cursor position, encoding, active JSON Schema, save state
(decisions #41, `spec.md` §2)."

## User Scenarios

The status bar at the bottom of the IDE shows, left to right:

- File path of the focused tab (or "No file open").
- Cursor position `Ln 12, Col 4`.
- Encoding `UTF-8` (fixed in v1).
- Active JSON Schema (`Data Package`, `Dialect`, `Table Schema`,
  or none).
- Save state: `Saved`, `Saving…`, or `Modified`.
- Python loading indicator (already from #29).

## Requirements

- **FR-001**: New `app/src/components/shell/status-bar.tsx`
  replaces the placeholder.
- **FR-002**: Editor exposes the focused Monaco editor's cursor
  position via a small `editor-focus` context (`{ cursor:
  {line, column} | null }`). `editor-area.tsx` reports it via
  the Monaco `onMount` `onDidChangeCursorPosition` handler.
- **FR-003**: Active schema is computed from the active tab path
  via a new `schemaForPath(path)` helper.
- **FR-004**: Save state is derived from the active tab's
  `dirty` flag and an in-flight `saving` flag exposed by the
  autosave queue.
- **FR-005**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Success Criteria

- Path, cursor, schema, save state all update correctly in
  realtime as the user navigates and edits.

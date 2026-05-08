# Feature Specification: Reset Workspace (#20)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #20 — modal-confirmed; deletes everything
in `/workspace` only; does NOT touch theme, landing-page flag,
or tab list (decision #30, `spec.md` §5). Implements Principle
III.

## User Scenarios

- A "Reset workspace" button at the bottom of the Files side
  panel. Click → modal: "Reset workspace? All files in
  `/workspace` will be permanently deleted. Theme and tab
  layout are preserved." Cancel / Reset.
- After reset, the file tree shows an empty workspace; theme is
  unchanged; the tab list still exists but tabs are marked
  `missing`.

## Requirements

- **FR-001**: New `app/src/file-tree/reset-workspace-button.tsx`
  rendered at the bottom of the FileTree side panel.
- **FR-002**: On confirm, walk `/workspace` via vfs and remove
  each top-level entry (recursive for dirs). After completion,
  the worker has already emitted `fs-changed` per entry, so the
  tree refreshes naturally.
- **FR-003**: Theme provider's `localStorage` key (`fde-theme`)
  and tab persistence key (`fde-editor-tabs`) MUST not be
  touched.
- **FR-004**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

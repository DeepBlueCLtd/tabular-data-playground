# Feature Specification: File Tree

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Input**: Backlog item #15 — "File tree (`react-arborist` or
equivalent) — display & navigate the virtual workspace,
subscribes to `fs-changed`."

## User Scenarios

- **Read the workspace tree**: opens a list of files/folders
  under `/workspace` rendered by `react-arborist`. Folders
  expand/collapse on click; files open a tab on click.
- **Auto-refresh on fs-changed**: any vfs / CLI mutation
  refreshes the tree without polling.

## Requirements

- **FR-001**: Add `react-arborist@3.4.0` to `app/package.json`
  (exact version, no `^`).
- **FR-002**: New module `app/src/file-tree/file-tree.tsx`
  reads `/workspace` recursively via vfs and feeds nodes to
  `<Tree />` from `react-arborist`. Subscribes to `useFsChanged`
  to refresh.
- **FR-003**: Clicking a file calls `editorTabs.open(path)`.
- **FR-004**: The component handles empty workspace and errors
  (e.g. status not ready) by showing a one-line message.
- **FR-005**: `side-panel.tsx` renders the file tree when
  `active === 'files'`.
- **FR-006**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exits 0.

## Success Criteria

- After writing `/workspace/foo.csv`, a node appears in the tree
  (within ~1 frame of the fs-changed event).
- Clicking the node opens it in the editor.

## Assumptions

- Reads of `/workspace` are cheap (small lesson-sized
  workspaces). For 100s of files we'd virtualise + lazy-load
  subtrees, but v1 walks the whole tree.

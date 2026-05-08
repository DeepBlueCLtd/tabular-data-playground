# Feature Specification: File Tree Right-Click Menu

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #16 — "File tree right-click menu —
New file, New folder, Rename, Delete (decision #26)."

## User Scenarios

- Right-click a file or folder → menu with: New file, New folder,
  Rename, Delete (file/folder).
- Right-click on empty area → New file, New folder (at root).
- Delete prompts a modal: "Delete `<name>` permanently?" with
  Cancel / Delete buttons.
- Rename to an existing path prompts a modal: "Overwrite `<name>`?".
- New file / New folder prompt for a name (inline input under
  the cursor or a small dialog).

## Requirements

- **FR-001**: New `app/src/file-tree/file-tree-menu.tsx` renders
  a positioned popover with the four actions, plus headerless
  variant for empty-area actions.
- **FR-002**: New `app/src/components/ui/confirm-modal.tsx` —
  a focus-trapped modal with title, body, Cancel + destructive
  primary action. Used for Delete + Overwrite confirmation
  (Principle III).
- **FR-003**: New `app/src/components/ui/prompt-modal.tsx` —
  a simple text-input modal for New file / New folder /
  Rename name entry.
- **FR-004**: Actions wire to vfs:
  - New file: `vfs.writeFile(path, '')`
  - New folder: `vfs.mkdir(path)`
  - Rename: read content, write at new path, remove old (atomic
    enough for v1)
  - Delete: `vfs.remove(path, { recursive: true })` for folders,
    non-recursive for files
- **FR-005**: After any successful action, the file tree
  refreshes (it already does via `fs-changed`).
- **FR-006**: Open editor tabs whose path was renamed/deleted
  reflect the change via the existing `useFsChanged` handler in
  `editor-tabs-provider.tsx` (already marks `missing`).
- **FR-007**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Success Criteria

- Delete with modal-confirm removes the path and refreshes tree.
- Cancelling the Delete modal leaves the path intact.
- Rename to an existing path shows the overwrite modal.
- New file/folder appears in the tree immediately.

## Assumptions

- No undo in v1.
- Inline rename in the tree row is overkill; we use a small
  prompt modal.

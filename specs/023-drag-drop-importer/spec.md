# Feature Specification: Drag-and-drop Importer

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #17 — files **and folders** recursively
via `DataTransferItemList`; 10 MB per-file hard cap with clear
error; **modal-confirm overwrite** on filename collision; drop on
folder lands in folder, drop in empty space lands at root.
Decisions #20, #42, #43, #44, #45.

## User Scenarios

- Drop a file onto the side panel (Files view) → file appears in
  `/workspace/<name>`.
- Drop a file onto a folder row → file lands in that folder.
- Drop a folder → tree replicated under target.
- File > 10 MB → modal alert "Cannot import `name`: 10.5 MB
  exceeds the 10 MB per-file cap."
- Path collision → modal-confirm overwrite (per file in a batch
  the user can opt to apply-to-all).

## Requirements

- **FR-001**: New module `app/src/file-tree/drag-drop-importer.tsx`
  wraps the file tree pane with drag-over highlight + drop
  handler.
- **FR-002**: Use `DataTransferItem.webkitGetAsEntry()` to walk
  folders recursively. Each `FileSystemFileEntry` produces a
  `File`; size check (> 10 * 1024 * 1024) → reject.
- **FR-003**: Modal-confirm on collision before write, with
  Cancel / Overwrite / Overwrite all (Principle III).
- **FR-004**: Drop target resolution:
  - over a row whose `node.kind === 'dir'` → that folder,
  - over a row whose `node.kind === 'file'` → that file's parent,
  - else → `/workspace`.
- **FR-005**: Use `vfs.writeFile(path, Uint8Array)` for binary
  payloads; `Uint8Array` is the universal accept type.
- **FR-006**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Success Criteria

- A small CSV dropped onto the empty file tree creates
  `/workspace/<name>`.
- A 12 MB file shows the cap modal and is NOT written.
- Dropping over an existing file shows the overwrite modal.

## Assumptions

- `webkitGetAsEntry` is available in all Constitution-named
  browsers (Chrome/Firefox/Safari/Edge latest 2). It is.
- The modals from #16 (Confirm/Prompt) cover the dialog needs,
  with a small extension: a tri-state confirm
  (Cancel / Overwrite / Overwrite all).

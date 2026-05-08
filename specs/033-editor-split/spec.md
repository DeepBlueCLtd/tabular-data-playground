# Feature Specification: Editor Split Panes (#9)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #9 — "Drag-to-split horizontal editor
panes via `react-mosaic` or `dockview` (decision #29)."

## Decision (Constitution Complexity Tracking)

The constitution names `react-mosaic` / `dockview`. Using either
adds ~50–80 KB to the bundle and a meaningful API surface for a
v1 feature whose evaluation value is "split-view a single file
or compare two files side by side". v1 instead uses
`react-resizable-panels` (already a dep) to provide a
**toggle + drag-resize** horizontal split: click "Split editor"
to create a second pane; drag the divider to resize; click
"Close split" to merge. This is one strict subset of mosaic's
behaviour (only 2 panes, only horizontal). Recorded as a
Complexity Tracking entry in this plan; revisit if the lessons
need >2 panes or vertical splits. **No new dep.**

## User Scenarios

- Click "Split editor" in the editor toolbar → a second pane
  opens to the right showing the same Monaco model (path).
  Editing in one pane updates the other immediately because both
  Monaco instances share the same model URI.
- Each pane has an independent **active tab** — switching the
  tab in pane B does NOT affect pane A.
- Drag the vertical divider to resize.
- Click "Close split" → second pane closes; primary pane stays.

## Requirements

- **FR-001**: `editor-area.tsx` MUST track an additional
  `secondaryTabId: string | null` ephemeral state. When set,
  the area renders two horizontal panes; otherwise one pane.
- **FR-002**: Toolbar buttons:
  - When not split: "Split editor" → set
    `secondaryTabId = activeTabId`.
  - When split: "Close split" → clear `secondaryTabId`.
- **FR-003**: Pane B's tab strip is shared with pane A (same
  open tabs from `useEditorTabs`); clicking a tab in pane B
  updates `secondaryTabId` only. (For v1 we keep the tab strip
  on top of pane A; pane B shows a small "viewing: <path>"
  label and a chevron to cycle through open tabs.)
- **FR-004**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.
- **FR-005**: `docs/limitations.md` MUST record the
  simplification (2-pane only, no drag-to-split-from-empty).

## Success Criteria

- Click Split → two Monaco panes render. Editing reflects in
  both. Drag the handle to resize.

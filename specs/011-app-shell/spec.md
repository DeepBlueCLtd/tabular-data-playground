# Feature Specification: App Shell Layout

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #8 — "App shell layout — collapsible left rail
(Activity bar: Lesson panel, File tree), centre tabbed editor area,
status bar, bottom terminal panel. No router; single SPA URL
(decision #28). (`spec.md` §2, §3)"

## User Scenarios & Testing

### User Story 1 — IDE-shaped layout on first load (P1)

A user lands on the page and sees the familiar IDE shape: a vertical
icon strip on the far left, a side panel with two switchable views
(Lessons, Files), a centre area for an editor, a horizontal terminal
strip across the bottom of the centre area, and a status bar across
the very bottom.

**Independent Test**: Open the dev server. The header is at the top
(with theme toggle, item #10). Below it: activity bar (icons), side
panel, editor area on top, terminal panel below it. Status bar is the
last visible row. No content yet — just placeholders — but the
geometry is correct.

### User Story 2 — Activity bar switches the side panel (P1)

Clicking the Lessons icon shows the Lessons placeholder; clicking the
Files icon shows the Files placeholder. Clicking the active icon
collapses the side panel. Clicking it again restores it.

**Independent Test**: From a clean load, the side panel shows Lessons
by default. Click the Files icon → panel content swaps. Click Files
again → panel collapses (zero width). Click Files → reopens.

### User Story 3 — Resizable splits (P2)

The user can drag the divider between side panel and editor area
(horizontal resize). The user can drag the divider between editor area
and terminal (vertical resize). Sizes persist across reloads under a
namespaced storage key.

**Independent Test**: Drag a divider, reload the page; the divider
position is restored.

### Edge Cases

- The side panel collapse-state is local UI; it is not persisted in v1
  to keep this item simple. Resizable panel sizes are persisted through
  `react-resizable-panels`'s `autoSaveId` (which uses localStorage
  internally with a custom key prefix).
- Below ~900 px width the layout is allowed to look cramped; the
  responsive notice (#32) handles that case.
- No router is added; "back" / "forward" do not change UI state.
- Activity bar is keyboard-accessible (Tab / Enter / Space).
- Future panels (#13 editor, #15 tree, #18 status bar, #21 terminal)
  must be drop-in replacements for placeholders without re-shaping the
  grid.

## Requirements

- **FR-001**: Pin and use `react-resizable-panels` for the
  horizontal (rail+side ↔ editor) and vertical (editor ↔ terminal)
  splits.
- **FR-002**: `app/src/components/shell/app-shell.tsx` MUST compose the
  layout from these sub-components: `ActivityBar`, `SidePanel`,
  `EditorAreaPlaceholder`, `TerminalPanelPlaceholder`,
  `StatusBarPlaceholder`.
- **FR-003**: `ActivityBar` MUST render at least two entries
  ("Lessons", "Files") with `aria-label`s and a visible active-state.
  Clicking the active entry collapses the side panel; clicking it again
  reopens.
- **FR-004**: `SidePanel` MUST switch its rendered content based on the
  active entry, with stable placeholder content for each
  (e.g. "Lessons (#37)" / "Files (#15)").
- **FR-005**: Panel sizes MUST be persisted under storage keys prefixed
  `fde-shell-` (delegated to `react-resizable-panels`'s `autoSaveId`).
- **FR-006**: The shell MUST occupy the full viewport height; the
  status bar is the bottom row and is always visible.
- **FR-007**: All shell pieces MUST consume the existing theme tokens
  (`bg-background`, `border-border`, etc.) so #10's dark mode applies
  without further work.
- **FR-008**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.

## Success Criteria

- **SC-001**: Resizing a divider and reloading restores the size.
- **SC-002**: The activity bar correctly toggles the side panel
  open/collapsed.
- **SC-003**: Bundle size growth from `react-resizable-panels` is under
  20 KB gzipped (it is a tiny library).

## Assumptions

- `react-resizable-panels` (currently maintained, ~10 KB) is the right
  choice for shell-level splits. Item #9 (drag-to-split editor tabs)
  is independent and can use either the same library or a heavier one
  like dockview if needed; that decision is deferred to #9.
- Activity-bar entries are limited to "Lessons" and "Files" in v1.
- No icons library yet; reuse the inline-SVG approach from #10.

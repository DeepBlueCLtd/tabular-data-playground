# Feature Specification: Curriculum index (#37)

**Backlog ID**: #37
**Input**: Curriculum index in lesson panel as default view (`spec.md` §2, §7).

## User Scenarios

### US1 — See the curriculum at a glance (P1)
The lesson panel default view shows every lesson in pedagogical order
with title, one-line summary, and estimated minutes. Clicking a row
opens the lesson body.

### US2 — Return to the index (P2)
From any open lesson, a "← Curriculum" link returns the panel to the
index without losing position in the panel.

### US3 — Active lesson is highlighted (P3)
When a lesson is open, its row in the index is visually marked. (The
index is hidden in single-pane mode; this marker is for when both
panes are visible — out of scope for v1, just FR.)

### Edge cases
- Empty curriculum (no `_*` lessons in dev, no real lessons in prod):
  show "No lessons available" placeholder.
- Long summary in `meta.json`: index renders the full text; data
  model already caps it at 200 chars (#38 FR-004).

## Functional Requirements
- **FR-001**: When `selectedSlug === null`, the lesson panel renders
  a list of all lessons, in ascending `order`. Each row shows title,
  summary, and estimated minutes; a button-like control selects the
  lesson on click.
- **FR-002**: When `selectedSlug` is set, the lesson view renders the
  selected lesson; a "← Curriculum" link clears the selection.
- **FR-003**: The temporary `<select>`-based picker (#38 T012) MUST
  be removed.
- **FR-004**: Empty-state message when the index has zero entries.
- **FR-005**: Selecting a lesson scrolls the panel to top.

## Success Criteria
- **SC-001**: With ≥2 lessons available, the index renders all of
  them in numeric `order`.
- **SC-002**: Clicking a lesson row opens that lesson; clicking
  "← Curriculum" returns to the index.
- **SC-003**: Empty curriculum renders a placeholder, not a crash.

## Assumptions
- The lesson loader (#38) provides `getLessonIndex().entries`.
- This item replaces the temp picker entirely. The `<LessonView>`
  empty state ("Pick a lesson…") becomes unreachable from the new
  flow but is preserved as a defensive fallback.

# Feature Specification: Wider-Screen Notice (#32)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #32 — "Best on a wider screen" notice
below ~900 px width; no responsive layout work (decision #6,
`spec.md` §10 R8).

## User Scenarios

- Window narrower than 900 px → a single-line banner across the
  top: "Best viewed on a wider screen (≥ 900 px)." Dismissible
  for the session via an × button.
- Window ≥ 900 px → no banner.

## Requirements

- **FR-001**: New `app/src/components/shell/wider-screen-notice.tsx`
  rendered above the header bar when `window.innerWidth < 900`.
- **FR-002**: Component listens to `window` `resize` events and
  re-evaluates.
- **FR-003**: A "×" button hides the notice for the rest of the
  session (state lives in component, no localStorage).
- **FR-004**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

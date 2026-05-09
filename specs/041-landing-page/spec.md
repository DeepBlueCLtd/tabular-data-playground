# Feature Specification: Landing page (#36)

**Backlog ID**: #36
**Input**: First-visit landing page ("What is this? Who's it for?") with Start button into the IDE; localStorage flag suppresses on return; "What is this?" link in IDE chrome lets user revisit (decisions #18, #39, `spec.md` §2).

## User Scenarios

### US1 — First-time visitor reads the framing (P1)
A new visitor opens the deployed site. Before seeing the IDE, they
see a brief landing card explaining "What is this? Who's it for?"
with a Start button. Clicking Start sets a localStorage flag and
shows the IDE.

### US2 — Returning visitor lands directly in the IDE (P1)
On return visits (localStorage flag set), the IDE renders
immediately; no landing page interrupts the flow.

### US3 — Revisit the landing page from the IDE (P2)
The IDE chrome shows a "What is this?" link in the header. Clicking
it shows the landing page again (modal-like overlay or full-screen
swap). Closing returns to the IDE.

### Edge cases
- localStorage unavailable (private mode, quota): the landing page
  shows on every visit (best-effort fallback). The Start button
  still enters the IDE for the current session.
- Reset workspace MUST NOT clear the landing-page flag (decision
  recorded in `spec.md` §5).

## Functional Requirements
- **FR-001**: On app mount, if `localStorage['landing-seen'] !== '1'`,
  render the landing page instead of the IDE.
- **FR-002**: The landing page MUST contain: a heading, a brief
  intro paragraph (1-3 sentences), an audience note ("Who's it
  for?"), and a Start button.
- **FR-003**: Clicking Start MUST set
  `localStorage['landing-seen'] = '1'` and switch to the IDE.
- **FR-004**: The IDE header MUST include a "What is this?" button
  that re-shows the landing page when clicked.
- **FR-005**: Re-showing the landing page from IDE chrome is a
  read-only revisit; it MUST NOT clear the flag, MUST NOT change
  any other state.
- **FR-006**: When localStorage is unavailable, the app MUST still
  render the landing page on first paint and accept Start (which
  then becomes session-only).
- **FR-007**: The "Reset workspace" action (#20) MUST NOT touch
  the landing-page flag.

## Success Criteria
- **SC-001**: First visit shows the landing page; clicking Start
  reveals the IDE.
- **SC-002**: Reload after Start lands directly in the IDE.
- **SC-003**: "What is this?" in the IDE header re-shows the
  landing page; closing returns to the IDE; the flag remains set.

## Assumptions
- Landing page is a React component, not a separate route (no
  router; spec.md decision #28).
- The flag key is `landing-seen` (kebab-case to match other
  localStorage keys in the project).
- Theme provider applies to the landing page too (decision #12).

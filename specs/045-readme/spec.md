# Feature Specification: README (#54)

**Backlog ID**: #54
**Input**: README — project framing, setup, screenshot, **short
summary of evaluation findings** drawn from the Notes &
Observations sections (`spec.md` §11 Phase 3, §13).

## User Scenarios

### US1 — Visitor lands on the repo (P1)
A first-time visitor (developer evaluating Frictionless, GitHub
browser) opens README.md and within 60 seconds knows: what the
project is, who it's for, the live URL, what Frictionless looks
like in practice (screenshot), and the headline findings from
running the curriculum end-to-end.

### US2 — Returning author needs setup (P2)
The solo author or a future maintainer needs to recall how to
run the app locally, build it, run linters/tests, and capture
screenshots. README points at `app/` scripts and the relevant
docs (`docs/limitations.md`, `docs/architecture.md`,
`docs/lesson-authoring.md`).

### US3 — Pinned versions surfaced (P2)
The "Pinned versions" section already added by #55 stays as-is;
this item folds it into the larger README without breaking it.

## Requirements
- **FR-001**: Top-of-README sentence states what the project is
  and who it's for.
- **FR-002**: A live URL points at the deployed Pages site.
- **FR-003**: A screenshot from `app/e2e/screenshots/` is embedded.
- **FR-004**: A "Findings" section summarises evaluation results
  drawn from the eight Notes & Observations sections.
- **FR-005**: A "Setup / development" section enumerates the
  pnpm scripts (`dev`, `build`, `test`, `lint`, `test:e2e`,
  `capture:screenshots`).
- **FR-006**: Cross-links to `spec.md`, `.specify/memory/constitution.md`,
  `docs/limitations.md`, `docs/architecture.md`,
  `docs/lesson-authoring.md`.
- **FR-007**: The "Pinned versions" section from #55 is preserved.

## Success criteria
- **SC-001**: A reader unfamiliar with the project can answer
  "what is this and what did it find?" from the README alone.

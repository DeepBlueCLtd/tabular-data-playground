# Feature Specification: Solo-author walkthrough & fixups (#53)

**Backlog ID**: #53
**Input**: Solo-author walkthrough of the entire curriculum end-to-end; fix
whatever cracks appear (`spec.md` §11 Phase 3).

## User Scenarios

### US1 — End-to-end curriculum run (P1)
The author opens the deployed IDE, completes lessons 1–8 in order
(loading lesson files, running every Copy/Run block, populating
Notes & Observations), and records every glitch surfaced. Glitches
include: typos, broken commands, stale outputs, missing files,
incorrect Frictionless behaviour, lesson text that contradicts what
the runtime actually shows, lesson files that fail to load, and any
UI rough edges encountered along the way.

### US2 — Fix surfaced cracks (P1)
For each surfaced issue the author edits the lesson source (or app
source where appropriate) and re-verifies the affected step. Fixes
land on the epic branch as one or more `feat(#53):` / `docs(#53):`
commits. Issues touching genuinely-out-of-scope behaviour are
recorded in `docs/limitations.md` instead (Principle VII) rather
than fixed.

### US3 — Notes captured (P2)
Each lesson's **Notes & Observations** section is reviewed; any
empty or stub sections are filled in based on the walkthrough run
(Principle II — required for the README findings summary in #54).

## Requirements
- **FR-001**: Every lesson 01–08 renders end-to-end without runtime
  errors after the walkthrough fixups land.
- **FR-002**: Every Copy/Run bash block in a lesson executes
  successfully on a freshly-loaded workspace, OR the lesson text
  explicitly explains why a particular block is expected to fail
  (e.g. "this should produce a validation error").
- **FR-003**: Each lesson's `files/` directory (where present)
  produces the inputs the lesson text references; no missing or
  out-of-date files.
- **FR-004**: Every lesson has a populated Notes & Observations
  section (Principle II); placeholders are filled in.
- **FR-005**: Sharp edges newly surfaced by the walkthrough land in
  `docs/limitations.md` in the same change (Principle VII).

## Success criteria
- **SC-001**: A clean walkthrough produces zero unresolved issues
  outside `docs/limitations.md`.
- **SC-002**: All eight Notes & Observations sections are non-empty
  and concrete (no `TODO` placeholders).

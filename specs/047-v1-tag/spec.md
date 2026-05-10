# Feature Specification: v1.0 tag (#57)

**Backlog ID**: #57
**Input**: Tag v1.0; freeze the artefact as a dated reference
(Principle VI, decision #35).

## User Scenarios

### US1 — v1.0 tag on `main` after epic merge (P1)
After the E3 epic PR is merged and Pages deploys cleanly, the
maintainer creates an **annotated** `v1.0` tag on the merge
commit on `main`, pushes it, and verifies the deploy still
matches. The tag is the freeze marker; the artefact is then
**frozen-as-is** as a dated reference (`spec.md` §11 Phase 3 /
§13 Definition of Done).

## Requirements
- **FR-001**: Tag is annotated (not lightweight).
- **FR-002**: Tag points at a commit on `main` (not on the epic
  branch in case the merge produces a merge commit).
- **FR-003**: Tag message records the date and the live URL of
  the deployed artefact.
- **FR-004**: Tag is pushed only after the maintainer confirms
  Pages deploy is green and the deployed site passes a quick
  smoke (open landing, run lesson 1's `frictionless describe`).
- **FR-005**: After tagging, the Epics row for E3 in
  `backlog.md` is strikethroughed and the epic is closed.

## Success criteria
- **SC-001**: `git tag -l v1.0` returns the tag locally and on
  origin.
- **SC-002**: A reader landing on the GitHub release page sees
  the tag, the date, and the live URL.

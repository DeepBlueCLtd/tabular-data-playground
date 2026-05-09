# Feature Specification: docs/lesson-authoring.md (#50)

**Backlog ID**: #50
**Input**: How to write a new lesson — folder layout, `meta.json`, code-block conventions, Notes & Observations template (`spec.md` §9).

## User Scenarios

### US1 — Author a new lesson from scratch (P1)
The author wants to add a new lesson. They open
`docs/lesson-authoring.md` and follow it end-to-end: create folder,
fill `meta.json`, write `lesson.md`, drop starter files, rebuild,
verify it appears in the curriculum index.

### US2 — Lesson templates and conventions (P1)
The doc lists the conventions the loader/renderer assume, so
authors don't accidentally violate them: bash-block convention for
runnable commands, allow-listed languages for highlighting,
markdown features supported, image-handling boundaries, and the
Notes & Observations template.

### US3 — Surface the build-fail rules (P2)
The doc enumerates the eight `meta.json` validation rules so
authors recognise the build error message when they trip one.

## Requirements

- **FR-001**: Document the folder layout under `content/lessons/<slug>/`.
- **FR-002**: Document `meta.json` fields with examples and
  constraints (matching contracts/meta-schema.json).
- **FR-003**: Document supported markdown / GFM / highlight allow-list.
- **FR-004**: Document Copy/Run conventions for `bash` blocks (one
  command per block; multi-line considerations).
- **FR-005**: Document the Notes & Observations template (Principle II).
- **FR-006**: Document the dev-only `_*` slug convention.
- **FR-007**: Reference the existing limitations doc rather than
  duplicating it.

## Success criteria
- **SC-001**: An author following the doc end-to-end produces a
  lesson that renders correctly without other guidance.

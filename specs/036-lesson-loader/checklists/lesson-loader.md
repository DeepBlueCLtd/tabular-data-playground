# Lesson Loader (#38) — Requirements Quality Checklist

**Purpose**: Validate the requirements covering the constitution's
Pinning, Limitations, and Read-only/no-destruction surfaces for
backlog item #38 BEFORE implementation begins. Tests the *requirements*
themselves, not the eventual code.

**Created**: 2026-05-08
**Feature**: [spec.md](../spec.md), [plan.md](../plan.md), [tasks.md](../tasks.md)
**Focus areas**: Pinning gate · Limitations gate · Read-only/no-FS-writes
**Depth**: Standard
**Audience**: Author (self-review on the epic branch)

## Pinning Requirements (Constitution Principle VI)

- [X] CHK001 — Are the four new external dependencies named explicitly in the spec or plan? [Completeness, Plan §Constitution Check]
- [X] CHK002 — Are exact pinned versions specified in tasks (no caret/tilde ranges, no "latest")? [Clarity, Tasks T001]
- [X] CHK003 — Is the lockfile update treated as part of the same change rather than a follow-up? [Consistency, Tasks T001]
- [X] CHK004 — Is the `highlight.js` language allow-list specified deterministically (named imports, no autoloader)? [Clarity, Plan §Constitution Check, Research D3, Tasks T008]
- [X] CHK005 — Are the registered languages aligned across spec, research, and tasks (single canonical list)? [Consistency, Spec §FR-009, Research D3, Tasks T008]
- [X] CHK006 — Is the rationale for declining to add Zod / Ajv as a validation dependency recorded? [Traceability, Research D4]
- [X] CHK007 — Does the README pinning recap (#55) own the long-term record, with this spec only owning the lockfile diff? [Boundary, Plan §Constitution Check]
- [X] CHK008 — Is there a stated rule that any addition to the language allow-list is a deliberate spec change, not an ad-hoc addition? [Gap, Research D3]

## Limitations Requirements (Constitution Principle VII)

- [X] CHK009 — Is the decision to keep `react-markdown`'s default raw-HTML stripping recorded as deliberate (not a bug)? [Clarity, Spec §FR-010, Research D2]
- [X] CHK010 — Is the v1 image-handling boundary (data URIs / absolute paths only, no relative-asset glob) explicit in the spec? [Completeness, Spec §FR-012]
- [X] CHK011 — Is the "underscored slugs are dev-only" convention documented somewhere a future author will find? [Coverage, Research D7, Quickstart §1, Data Model §entities]
- [X] CHK012 — Is the criterion for promoting a runtime surprise into `docs/limitations.md` defined (e.g., "discovered during T021/T024")? [Clarity, Tasks T029]
- [X] CHK013 — Are the GFM features the renderer commits to listed exhaustively (so a future GFM regression has a written contract to violate)? [Completeness, Spec §FR-008]
- [X] CHK014 — Is the "unknown code-fence language renders as plain text" behaviour stated as a positive requirement, not just as an edge case? [Clarity, Spec §FR-009]
- [X] CHK015 — Are limits on `meta.json` field lengths (title 80, summary 200) consistent between data-model and JSON Schema? [Consistency, Data Model §LessonMeta, contracts/meta-schema.json]

## Read-Only / No-FS-Writes Requirements (Constitution Principle III boundary)

- [X] CHK016 — Is it explicit that this loader does NOT write to the virtual FS (the destruction-confirm gate is N/A)? [Clarity, Plan §Constitution Check]
- [X] CHK017 — Is the boundary between #38 (read-only) and #41 (writes lesson files into `/workspace/`, requires modal) drawn unambiguously? [Boundary, Spec §Assumptions]
- [X] CHK018 — Is the structural hook for #39 (Copy/Run buttons) specified WITHOUT making this loader responsible for executing terminal commands? [Boundary, Spec §FR-013, Research D6, Contracts §LessonCodeBlock]
- [X] CHK019 — Is `LessonView`'s side-effect surface documented as "renders + emits no events" so #39, #40, #41 know what to plug into? [Gap, Contracts §LessonView]
- [X] CHK020 — Is the lesson body rendering specified as independent of Pyodide readiness (no implicit ordering coupling)? [Consistency, Spec §FR-016, Tasks T024–T025]
- [X] CHK021 — Is the empty-state requirement (no lesson selected → placeholder, not a default lesson) consistent across spec and plan? [Consistency, Spec §FR-014, Plan §Glossary]

## Build-Failure Requirements (auxiliary, since FR-005 is the loader's only sharp edge)

- [X] CHK022 — Is each of the eight build-fail rules named individually so coverage is testable? [Completeness, Data Model §Validation rules]
- [X] CHK023 — Is the requirement that build-fail messages name the offending file path stated for ALL eight rules, not just some? [Consistency, Spec §FR-005]
- [X] CHK024 — Is the warn-not-error behaviour for unknown `meta.json` fields differentiated from the eight error rules in writing? [Clarity, Spec §FR-020, Tasks T005]

## Notes

- Items CHK008, CHK012, CHK019 are gap markers — there is no spec text
  to test today; the question is whether the gap is acceptable for v1.
  Address inline during `/speckit-implement` if a gap turns into a
  decision.
- This checklist is appended-only. If `/speckit-checklist` is run again
  for #38, new items continue from CHK025.

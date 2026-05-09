# Implementation Plan: Load lesson files (#41)

**Branch**: `claude/epic-e2-qp0Tr` (epic E2) | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)

## Summary

Extend the lesson loader (#38) with a binary-safe build-time index of
each lesson's `files/` subfolder, expose a `getLessonFiles(slug)`
helper, and add a **Load lesson files** button to `LessonView` that
copies those files into `/workspace/<slug>/` via the existing VFS,
modal-confirming when any destination paths already exist (Principle
III).

## Technical Context

**Language/Version**: TypeScript (project default), React 18.3.1.
**Primary Dependencies**: None new. Uses Vite's `import.meta.glob` with
`{ query: '?url' }` (or `?raw` for text and a parallel `?url` for
binaries) and the existing VFS (`@/fs/vfs`) + modals
(`@/components/ui/confirm-modal`).
**Storage**: Writes go to `/workspace/<slug>/` via the existing
IDBFS-backed VFS.
**Testing**: Playwright e2e against the production build (extends
`app/e2e/lessons.spec.ts`).
**Target Platform**: Static SPA on GitHub Pages.
**Performance Goals**: ≤ 1 s for N≤20 small starter files (SC-001).
**Constraints**: Binary-safe; bundle bloat from `?url` glob is
acceptable for the curriculum's modest fixture set (≤ a few MB total
across 8 lessons).
**Scale/Scope**: 8 lessons in v1, each with at most ~10 starter files.

## Constitution Check

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | Research-first | **PASS** | Action is foundational to running every lesson. |
| 2 | Notes-section | **N/A** | Infrastructure, not a lesson. |
| 3 | Destruction | **PASS — central to the feature** | Modal confirms when the colliding set is non-empty (FR-008). Symmetric with #17 (drag-drop importer) and #20 (Reset workspace). |
| 4 | Backend | **PASS** | All client-side; no telemetry. |
| 5 | Pinning | **PASS** | No new external dependencies. |
| 6 | Limitations | **PASS — action required** | Two new limitations to document in `docs/limitations.md` in the same change: (a) **No rollback on partial copy failure** (FR-014); (b) "user-edited files" is approximated as "any existing file" (Assumptions). Will be folded into #51's expansion when it lands; for #41 we add stub bullets so the gate is satisfied this commit. |

## Project Structure

### Documentation

```text
specs/037-load-lesson-files/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── lesson-files-api.md
├── checklists/
│   ├── requirements.md
│   └── lesson-files.md
└── tasks.md
```

### Source code

```text
app/src/lessons/
├── files.ts                 # NEW — getLessonFiles(slug), file-content glob
├── load.ts                  # MODIFY — add hasFiles to LessonMeta, glob
├── lesson-view.tsx          # MODIFY — add Load lesson files button + state
├── load-files-action.tsx    # NEW — button + modal + copy orchestration
└── __tests__/.gitkeep

app/src/components/ui/
└── confirm-modal.tsx        # reused as-is (destructive=true)

docs/
└── limitations.md           # MODIFY — append rollback + over-prompt notes
```

**Structure Decision**: Keep the file-list discovery inside the
`lessons` module (it's a property of a lesson) but split the action
component into `load-files-action.tsx` so #50 (lesson-authoring docs)
can document it independently from rendering.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

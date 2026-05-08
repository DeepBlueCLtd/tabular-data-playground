# Implementation Plan: Lesson Loader (#38)

**Branch**: `claude/epic-e2-qp0Tr` (epic E2) | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/036-lesson-loader/spec.md`

## Summary

Render the eight Phase-2 lessons from `/content/lessons/<slug>/` into the
existing lesson panel (E1 #11), using a build-time index of `meta.json`
files and `react-markdown` + `remark-gfm` + `rehype-highlight` for the
body. The index is collected at module-load time using
`import.meta.glob('/content/lessons/*/meta.json', { eager: true })`; lesson
markdown bodies are imported with `?raw` so they ship as part of the
application bundle and render synchronously. No runtime fetches, no
third-party CMS, no MDX. The renderer's `<code>` element is exposed as a
small overridable component (`LessonCodeBlock`) so #39 (Copy/Run buttons)
can extend it without rework.

## Technical Context

**Language/Version**: TypeScript (project default), React 18.3.1.
**Primary Dependencies**: New, pinned: `react-markdown`, `remark-gfm`,
`rehype-highlight`, `highlight.js` (peer dep used by `rehype-highlight`).
Existing: React, Vite. Already permitted by Constitution → Technology
Constraints (Markdown row).
**Storage**: N/A. Lesson content is bundled with the app; no runtime
persistence.
**Testing**: Vitest unit tests for index builder + meta validator;
Playwright Chromium smoke for "open lesson, see body".
**Target Platform**: Static SPA on GitHub Pages; latest 2 versions of
Chrome/Firefox/Safari/Edge (per constitution).
**Project Type**: Web application — `app/` is the SPA. Lesson content
lives one level up at repository-root `content/lessons/`.
**Performance Goals**: Index build ≤ 50 ms (8 lessons, build-time);
warm lesson-switch render ≤ 500 ms (FR/SC budget).
**Constraints**: Browser-only; bundle size — `highlight.js` languages must
be **explicitly imported** (not the autoloader), to avoid pulling in
~200 languages we don't use.
**Scale/Scope**: 8 lessons in v1, ~3000 words each at most. Linear
scan / linear render is fine.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | Research-first | **PASS** | Lesson rendering is the substrate for the eight lessons (Principle II). Without it, Notes & Observations cannot be authored. |
| 2 | Notes-section | **N/A** | This item is infrastructure, not a lesson. Notes-section gate applies to backlog items #42–#49. |
| 3 | Destruction | **PASS** | Loader is read-only. It does not write to the virtual FS. (The "Load lesson files" copy is item #41 and carries the modal-confirm.) |
| 4 | Backend | **PASS** | All content bundled; no network, no account, no telemetry. |
| 5 | Pinning | **PASS — action required** | Adds `react-markdown`, `remark-gfm`, `rehype-highlight`, `highlight.js` — all named in Technology Constraints. They MUST land at exact pinned versions in `app/package.json` and the lockfile. The README pinning recap is owned by #55. |
| 6 | Limitations | **PASS** | One sharp edge: `react-markdown` does not render raw HTML by default (we keep this default — see Assumptions in spec FR-010). This is a deliberate restriction, not a surprise; documenting in `docs/limitations.md` is **not** required because it matches CommonMark expectations and is explicit in spec FR-010. If during implementation we discover behaviour that *does* surprise (e.g. `highlight.js` mis-tokenises a `bash` block in lessons), that gets logged in `docs/limitations.md` per Principle VII. |

No violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/036-lesson-loader/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (Lesson, LessonMeta, LessonIndex)
├── quickstart.md        # Phase 1 output (how to add a lesson)
├── contracts/
│   ├── meta-schema.json     # JSON Schema for meta.json
│   └── lesson-api.md        # Public TS surface from app/src/lessons/
└── tasks.md             # Phase 2 output — created by /speckit-tasks
```

### Source Code (repository root)

```text
/
├── app/
│   ├── src/
│   │   ├── lessons/
│   │   │   ├── index.ts                 # Public API: getLessonIndex(), getLessonBody(slug)
│   │   │   ├── load.ts                  # import.meta.glob for meta.json + body raw imports
│   │   │   ├── validate.ts              # Zod-like hand-rolled validator (no new dep)
│   │   │   ├── lesson-renderer.tsx      # ReactMarkdown wrapper + components map
│   │   │   ├── lesson-code-block.tsx    # <code> override, exposed for #39 to extend
│   │   │   ├── lesson-view.tsx          # Pane component used by side panel
│   │   │   ├── highlight.ts             # rehype-highlight bootstrap with explicit langs
│   │   │   └── __tests__/
│   │   │       ├── load.test.ts
│   │   │       └── validate.test.ts
│   │   └── components/shell/side-panel.tsx   # Replace placeholder JSX with <LessonView/>
│   └── package.json                     # Add pinned deps
├── content/
│   └── lessons/
│       └── _sample/                     # Smoke-test lesson used in dev only; gitignored OR shipped
│           ├── lesson.md
│           └── meta.json
└── tests/e2e/
    └── lessons.spec.ts                  # Playwright: open panel, click lesson, see body
```

**Glossary** (resolves analyse finding F8):

- *Lesson panel*: the side-panel slot that becomes visible when the
  Lessons activity is selected (existing E1 chrome).
- *LessonView*: the new React component that fills the lesson panel.
- *Lesson index* / *curriculum index*: the same ordered list of
  `LessonMeta` entries; "curriculum index" is the user-facing label
  (#37 owns the UI), "lesson index" is the in-memory data structure.

**Interim empty-state** (resolves F7): in epic mode this loader and the
real lessons (#42–#49) ship in the same E2 PR, so production never sees
a "loader merged but no lessons" state. The `LessonView` empty state
("Pick a lesson from the index") is therefore only reached during dev
when the developer hasn't picked a lesson yet.

**Structure Decision**: Lesson rendering code lives in `app/src/lessons/`
(per `spec.md` §9 repo structure). Lesson content lives at
repository-root `content/lessons/`. The Vite alias `@` already points at
`app/src`, so loader code uses `@/lessons/*`; lesson content is loaded by
absolute path string given to `import.meta.glob`.

## Complexity Tracking

> No constitution violations to track. (Section retained per template.)

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

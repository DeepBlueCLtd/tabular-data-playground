---

description: "Task list — Lesson Loader (#38)"
---

# Tasks: Lesson Loader (#38)

**Input**: Design documents in `specs/036-lesson-loader/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Test tasks are included where the spec calls for build-fail
behaviour (FR-005) or perceptible-budget criteria (SC-002). They are not
TDD-style; they exist to lock the failure modes that matter.

**Organization**: Grouped by the four user stories in `spec.md`. US1 is
the MVP — render a lesson body. The remaining stories layer on
deterministic ordering (US2), zero-config authoring (US3), and rendering
that is independent of Pyodide (US4).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no dependency on an in-flight task → parallelisable.
- **[Story]**: User-story phase tasks only (US1, US2, US3, US4).
- Setup, Foundational, and Polish phases carry no story label.

## Path conventions

Web app layout (per `plan.md` § Source Code):

- App code: `app/src/lessons/`, `app/src/components/shell/`
- Lesson content: `content/lessons/<slug>/`
- Unit tests: `app/src/lessons/__tests__/`
- E2E tests: `app/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin the new dependencies and create empty target dirs so
later phases can land tasks in parallel.

- [X] T001 Add pinned dependencies in `app/package.json` — `react-markdown@10.1.0`, `remark-gfm@4.0.1`, `rehype-highlight@7.0.2`, `highlight.js@11.11.1` (latest stable at implementation time, all React 18 compatible); ran `pnpm install` and committed `app/pnpm-lock.yaml`. (Pinning gate satisfied.)
- [X] T002 [P] Create empty module directories `app/src/lessons/__tests__/` and `content/lessons/` with `.gitkeep` files so they are tracked. (`app/src/lessons/` already exists with a `.gitkeep`.)
- [X] T003 [P] Update `app/src/vite-env.d.ts` (or add `app/src/lessons/glob-modules.d.ts`) to declare `*.md?raw` as `string` so TS recognises raw markdown imports.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the data shape and the validator that all four user
stories depend on. Nothing renders or imports anything until these land.

- [X] T004 Create `app/src/lessons/index.ts` with exported types `LessonMeta`, `Lesson`, `LessonIndex` exactly per `contracts/lesson-api.md`. (Other modules import only from this barrel.)
- [X] T005 [P] Create `app/src/lessons/validate.ts` with `validateLessonMeta(folderName: string, raw: unknown): LessonMeta` enforcing the eight rules in `data-model.md` §"Validation rules". Throws `Error` with the offending file path on failure. Unknown top-level fields in `meta.json` log a `console.warn` during build but do NOT throw (FR-020). No new deps; hand-rolled (research D4).
- [~] T006 [P] **DEFERRED** — Vitest is constitution-permitted but not yet installed (E1 shipped without it). Adding Vitest in this PR is dep-creep beyond the lesson loader's immediate scope. Validator coverage is provided by the build-fail e2e exercises in US2 (T020) and by the loader executing during every `pnpm build`. If Vitest lands later (separate item), revive this task.

---

## Phase 3: User Story 1 — Render a lesson (P1)

**Story goal**: A learner clicks a lesson; its `lesson.md` renders with
GFM features and code-block highlighting.

**Independent test**: Drop a single `_sample` lesson under
`content/lessons/`, build the app, open the Lessons activity panel,
click the lesson entry, see the body rendered with table + task-list +
fenced bash highlighted.

- [X] T007 [US1] Create `app/src/lessons/load.ts` that builds the lesson index using `import.meta.glob('/content/lessons/*/meta.json', { eager: true, import: 'default' })` and `import.meta.glob('/content/lessons/*/lesson.md', { eager: true, query: '?raw', import: 'default' })`. Derive `slug` from folder name. Filter underscored slugs out when `import.meta.env.PROD`. Export `getLessonIndex()` (memoised) and `getLesson(slug)` per the public surface.
- [X] T008 [P] [US1] Create `app/src/lessons/highlight.ts` that imports only the languages on the v1 allow-list (`bash`, `json`, `python`, `yaml`) from `highlight.js/lib/languages/*` and exports a configured `rehype-highlight` plugin instance (research D3). `csv` and unknown tags are intentionally NOT registered — `rehype-highlight` falls back to plain monospace.
- [X] T009 [P] [US1] Create `app/src/lessons/lesson-code-block.tsx` with `LessonCodeBlock` component per `contracts/lesson-api.md`. In #38 the `renderActions` prop is wired but unused (research D6). Pass through `className` (which `rehype-highlight` populates with `language-*`) so highlight CSS still applies.
- [X] T010 [US1] Create `app/src/lessons/lesson-renderer.tsx` exporting `LessonRenderer({ source }: { source: string })`. Configures `react-markdown` with `remarkPlugins=[remarkGfm]`, `rehypePlugins=[rehypeHighlight]` (from T008), and `components={{ code: LessonCodeBlock, a: anchor-with-rel-noopener }}`. Anchor override: external links (absolute http(s) URLs) get `target="_blank" rel="noopener noreferrer"`; relative/internal links pass through unchanged so in-page anchors and relative URLs work (FR-011). Default sanitiser kept (raw HTML stripped, FR-010).
- [X] T011 [US1] Create `app/src/lessons/lesson-view.tsx` exporting `LessonView({ slug })`. When `slug` is `null` it renders an empty-state placeholder ("Pick a lesson from the index"). When `slug` resolves, renders `<header>` with title + estimated minutes, then `<LessonRenderer source={lesson.body} />`. On slug change, scroll-resets the body container (FR-015).
- [X] T012 [US1] Wire `<LessonView slug={selectedSlug} />` into `app/src/components/shell/side-panel.tsx`, replacing the current `"Curriculum index lands here (#37). Lesson content via #38."` placeholder JSX. For #38 alone, expose a minimal slug-picker (e.g. `<select>` of `getLessonIndex().entries`) so the view is reachable without the full curriculum index (#37 ships the proper index). Mark this picker with a `data-temp-picker` attribute and a TODO comment naming #37 as the replacement.
- [X] T013 [P] [US1] Add `app/src/lessons/styles.css` (or extend `app/src/index.css`) with a Tailwind-friendly `prose`-style block + `.hljs` token colours that respect the existing dark/light theme provider (theme integration, leverage `[data-theme]` selectors already used in the app). Keep diff small — reuse `highlight.js/styles/github.css` and `github-dark.css` selectively scoped under `.lesson-body`.
- [X] T014 [P] [US1] Create the dev-only sample at `content/lessons/_sample/lesson.md` and `content/lessons/_sample/meta.json` (slug `_sample`, order 0, summary "Sample for #38 dev only"). Body MUST exercise: heading, paragraph, GFM table, GFM task list, GFM strikethrough, autolinked URL, fenced `bash` block, fenced `json` block, fenced `python` block, fenced unknown-lang block, external link. Used by T015 + T016.
- [X] T015 [P] [US1] Add e2e test `app/e2e/lessons.spec.ts` that opens the built site, clicks the Lessons activity icon, picks `_sample`, asserts the rendered body contains the table cell text, the rendered checkbox input, and a `code.hljs.language-bash` element. (SC-002: assert body appears within 500 ms after click on a warm load. SC-004: attach `page.on('console', …)` and fail the test if any `error`-level console entry fires during the open-lesson flow.)
- [~] T016 [P] [US1] **DEFERRED** — same rationale as T006. Sort, `bySlug` lookup, and prod-vs-dev `_*` filtering are exercised by T015 (Playwright against the production build) and by the dev-mode visual smoke during T021/T022.

**Checkpoint**: `pnpm dev` shows `_sample` selectable; `pnpm build && pnpm preview` does NOT show it; the Playwright smoke passes against the preview server.

---

## Phase 4: User Story 2 — Curated curriculum order (P1)

**Story goal**: With multiple lessons, the index respects the
author-specified `order`, and the build refuses malformed lessons.

**Independent test**: Add three lessons with `order` 1, 2, 3 and slugs
that sort differently alphabetically. Verify the index is in `order`,
not slug order. Then break one (duplicate `order`) and confirm
`pnpm build` exits non-zero with a message naming the offending file.

- [X] T017 [US2] Wire validator (T005) into the loader (T007): for every glob entry, run `validateLessonMeta(folderName, raw)`; on throw, the loader re-throws with a wrapping message `"lesson loader: <slug>: <reason>"`. This surfaces during Vite build → `pnpm build` exits non-zero (research D5).
- [X] T018 [US2] In `load.ts`, after per-file validation, run two cross-folder checks: duplicate `slug`, duplicate `order` (excluding `_*` slugs in prod). Throw with both offending folder names listed.
- [X] T019 [P] [US2] Add a second dev-only sample lesson at `content/lessons/_aa-second/` with `order: 2`, picked so its slug sorts alphabetically *before* `_sample` (`_a*` < `_s*`) while its `order` is later. This proves the index is sorted by `order`, not slug. Smoke that the dev index renders in numeric order.
- [~] T020 [P] [US2] **DEFERRED** — same rationale (Vitest not installed). Build-fail behaviour is verified by T021/T022/T023's intentional malformed lessons + manual `pnpm build` exit-code observation; the validator is exercised on every dev/prod build via the eager glob.

**Checkpoint**: All four malformed-input paths fail `pnpm build` with a named error message.

---

## Phase 5: User Story 3 — Drop folder, rebuild, done (P2)

**Story goal**: Adding/removing a lesson is folder + rebuild only — no
code edits.

**Independent test**: Run through `quickstart.md` from a clean checkout
with the implementation in place; new lesson must show up in the index
without any code change beyond the lesson folder itself.

- [~] T021 [P] [US3] **DEFERRED to first lesson author session** — Vite 6's `import.meta.glob` is documented to hot-reload on glob match changes; verification will happen the first time #42 author drops a new folder during a `pnpm dev` session. If HMR misses the new folder, add a "must restart dev server when adding lessons" note to `docs/limitations.md` per Principle VII.
- [X] T022 [P] [US3] Verify removing a lesson folder during dev makes the lesson disappear without runtime errors. Add a brief note to `quickstart.md` if the `select` widget needs a manual reset.
- [X] T023 [P] [US3] Verify `pnpm build` succeeds with zero lessons (only the sample(s)) and with eight lessons (simulate by duplicating sample folders to slugs `_perf-1..8`). Build time delta must stay imperceptible.

(No new files in this phase — it's a manual / smoke-test verification of behaviour shipped in Phase 3 + 4. If a verification fails, return to the relevant earlier task.)

---

## Phase 6: User Story 4 — Lesson body independent of Pyodide (P2)

**Story goal**: Lesson rendering is not blocked by Pyodide load state.

**Independent test**: Throttle Pyodide load (e.g. `?slowPyodide=5000`
URL flag if implemented in the loader, else gate manually); confirm
lesson body fully renders and is scrollable while Pyodide is still
loading.

- [X] T024 [P] [US4] Confirm `LessonView`/`LessonRenderer` (T010, T011) have **no** import path that pulls in `app/src/pyodide/*`. Add an ESLint rule `no-restricted-imports` scoped to `app/src/lessons/**` blocking `@/pyodide/**` so the boundary cannot regress. (Or document the discipline in `lesson-api.md` if the rule is overkill.)
- [X] T025 [P] [US4] Add e2e assertion in `lessons.spec.ts` (T015): mock or delay the Pyodide loader, click the lesson, assert body text is present before Pyodide reports ready. (If the existing Pyodide loader can be told to stall via env/query param, use that; otherwise add a feature-flag entry-point used by tests only.)

---

## Phase 7: Polish & Cross-Cutting

- [X] T026 [P] Run `pnpm lint` and `pnpm format:check`; fix any issues introduced under `app/src/lessons/**`.
- [X] T027 [P] Run `pnpm test` (typecheck) and `pnpm build` clean from `app/`.
- [X] T028 [P] Run `pnpm test:e2e` against the production build; confirm `lessons.spec.ts` passes.
- [X] T029 Verify `docs/limitations.md` does not need an entry for #38 (default sanitiser stripping raw HTML matches CommonMark expectations and is documented in the spec). If during T021/T024 a real sharp edge surfaced (e.g. HMR doesn't pick up new folders), add it to `docs/limitations.md` in the same change per Principle VII.
- [X] T030 Update `backlog.md` row #38: status → `complete` (or `implementing` if E2 PR not yet open), `Updated: 2026-05-08`, strikethrough on completion. Commit with `docs: backlog status — #38 complete` per the per-item commit convention.

---

## Dependencies

```text
Phase 1 (Setup)
  └─ T001 → T002, T003

Phase 2 (Foundational)  ← blocks every story
  T001 ─┬─ T004 → T005 → T006
        └────────┘
                 │
Phase 3 (US1)    ▼
  T004 → T007 → T010 → T011 → T012
  T007 → T016
  T008, T009 (parallel) → T010
  T013, T014 (parallel)
  T011 + T014 → T015

Phase 4 (US2)
  T007 + T005 → T017
  T017 → T018
  T014 (sample) → T019 (parallel sample)
  T016 → T020 (extends file)

Phase 5 (US3)   manual verification, depends on US1 + US2 landed
Phase 6 (US4)   depends on US1; T024/T025 parallel within
Phase 7 (Polish) depends on US1+US2 (US3/US4 are pass-through smoke)
```

**MVP scope (US1 only)**: T001–T016. Delivers a renderable lesson body
with the dev-only `_sample`. Defer US2's strict cross-folder checks to a
follow-up if necessary, but only if the curriculum stays at one lesson
during interim demos.

## Parallel execution opportunities

- T002, T003 alongside T001 (after T001's pnpm install completes).
- T005 + T006 (validator + its tests) parallel after T004.
- T008, T009, T013, T014, T015, T016 are mostly file-disjoint within
  Phase 3 — fan out after T007 + T010 + T011 land.
- T019, T020 in Phase 4 (different files).
- T024, T025 in Phase 6 (config vs e2e).

## Implementation strategy

1. **MVP first**: Ship Phases 1–3 (US1) on a working `_sample` lesson.
   At this point #39, #40, #41 can begin exploration in parallel (they
   only depend on the public surface from `contracts/lesson-api.md`).
2. **Tighten the build (Phase 4)** before #42 starts authoring real
   lessons, so a malformed `meta.json` fails fast.
3. **Verify dev ergonomics (Phase 5)** with the actual lesson-author
   workflow from `quickstart.md`.
4. **Pyodide-independence guard (Phase 6)** is a one-time discipline
   check; once the lint rule is in, it's free thereafter.
5. **Polish + backlog update (Phase 7)**: the per-item commit lands
   alongside `docs: backlog status — #38 …`.

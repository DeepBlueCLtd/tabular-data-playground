---

description: "Tasks for backlog item #4 — App Scaffold"
---

# Tasks: App Scaffold (Backlog #4)

**Input**: Design documents in `/specs/004-app-scaffold/` (spec.md, plan.md, research.md, data-model.md, contracts/package-scripts.md, quickstart.md).
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓ (intentionally empty), contracts/package-scripts.md ✓.

**Tests**: No automated unit/integration tests for this item — the scaffold's testable behaviours are "dev server starts" and "build emits to `app/dist/`," verified manually per `quickstart.md`. Per-feature CI will arrive with item #33; Vitest is deferred (research R5).

**Organization**: Tasks grouped by user story from `spec.md`. The MVP slice is User Story 1 (boots locally); Stories 2 and 3 add the §9 layout completeness and CI-friendliness.

**Format**: `[ID] [P?] [Story?] Description with file path`

- **[P]** = Can run in parallel (different files, no shared dependencies on incomplete work).
- **[Story]** = Maps to user story from `spec.md` (US1, US2, US3).
- Setup, Foundational, and Polish tasks have **no** story label.
- All paths are relative to repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the directory shell. Cheap, parallel, must come first.

- [X] T001 Create `app/` directory at the repository root.
- [X] T002 [P] Create `app/.gitignore` with entries for `node_modules/`, `dist/`, `.vite/`, and `*.log`.
- [X] T003 [P] Append `app/node_modules/` and `app/dist/` to the existing root `.gitignore` if not already covered (read first; do not duplicate).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pin all external dependencies and lay down the TypeScript + Vite configs that every later phase reads. No user story can proceed without these.

**⚠️ CRITICAL**: Phase 3+ tasks read these files; do them all before story phases.

- [X] T004 Create `app/package.json` with the exact-version pins from `plan.md` Notes (vite 6.0.7, @vitejs/plugin-react 4.3.4, react 18.3.1, react-dom 18.3.1, typescript 5.7.2, @types/react 18.3.18, @types/react-dom 18.3.5), `"type": "module"`, name `"frictionless-data-explorer-app"`, private: true, and the script surface from `contracts/package-scripts.md` (`dev`, `build`, `preview`, `typecheck`, `test`).
- [X] T005 [P] Create `app/tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `lib: ["ES2022", "DOM", "DOM.Iterable"]`, `skipLibCheck: true`, `noEmit: true`, `isolatedModules: true`, `useDefineForClassFields: true`, references `tsconfig.node.json`, includes `src`.
- [X] T006 [P] Create `app/tsconfig.node.json` with the standard Vite node-side compile config (`composite: true`, `module: "ESNext"`, `moduleResolution: "bundler"`, includes `vite.config.ts`).
- [X] T007 [P] Create `app/vite.config.ts` importing `@vitejs/plugin-react`, exporting `defineConfig({ base: process.env.VITE_BASE_PATH ?? '/', plugins: [react()] })`.

**Checkpoint**: With Phase 2 done, the repo has every config file the build pipeline needs. The only thing missing for User Story 1 is the entry point and rendered placeholder.

---

## Phase 3: User Story 1 — Contributor can boot the app locally (Priority: P1) 🎯 MVP

**Goal**: A contributor running `npm run dev` from `app/` sees "Frictionless Data Explorer — scaffold ready." in the browser with no console errors.

**Independent Test**: From a fresh clone, `cd app && npm install && npm run dev`, open the printed URL, see the placeholder line. `npm run build` succeeds and emits `app/dist/`. No further E1 features need exist.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `app/index.html` — standard Vite HTML shell with `<title>Frictionless Data Explorer</title>`, `<div id="root">`, and a `<script type="module" src="/src/main.tsx">`.
- [X] T009 [P] [US1] Create `app/src/App.tsx` — a single React component rendering the line `Frictionless Data Explorer — scaffold ready.` (semantic HTML, no styles required for this item).
- [X] T010 [US1] Create `app/src/main.tsx` — `ReactDOM.createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)`. Imports `App` from `./App`.
- [X] T011 [US1] Run `npm install` inside `app/` once and verify `npm run dev` starts the dev server cleanly. Confirm the rendered page shows the placeholder line and the browser console is clean. Stop the dev server. (No file change beyond `node_modules/` — both ignored.)
- [X] T012 [US1] Run `npm run build` inside `app/` and confirm `app/dist/` is produced and exits 0. Run `npm run preview` and load the served URL to confirm the same placeholder renders from the production bundle.

**Checkpoint**: User Story 1 is complete and demonstrable. The MVP for backlog #4 has shipped.

---

## Phase 4: User Story 2 — §9 layout is in place for downstream items (Priority: P1)

**Goal**: Every directory listed under `app/` in `spec.md` §9 exists at the same relative path, with empty subdirectories tracked via `.gitkeep` so the layout is visible to contributors before code lands inside.

**Independent Test**: Compare the `app/` tree to `spec.md` §9. Every entry under `app/` matches: `src/components/`, `src/shell/`, `src/pyodide/`, `src/fs/`, `src/lessons/`, `src/main.tsx`, `public/`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`. `.gitkeep` files exist in each currently-empty subdirectory.

### Implementation for User Story 2

- [X] T013 [P] [US2] Create `app/src/components/.gitkeep`.
- [X] T014 [P] [US2] Create `app/src/shell/.gitkeep`.
- [X] T015 [P] [US2] Create `app/src/pyodide/.gitkeep`.
- [X] T016 [P] [US2] Create `app/src/fs/.gitkeep`.
- [X] T017 [P] [US2] Create `app/src/lessons/.gitkeep`.
- [X] T018 [P] [US2] Create `app/public/.gitkeep`.
- [X] T019 [US2] Verify `git status` shows the new `.gitkeep` files as untracked (or staged) so they will land in the per-item commit.

**Checkpoint**: Stories 1 + 2 together leave `app/` matching `spec.md` §9 exactly with no further drift required.

---

## Phase 5: User Story 3 — Build is CI-friendly (Priority: P2)

**Goal**: The scaffold can be installed and built non-interactively in a clean container — a prerequisite for items #33 (CI) and #35 (Playwright smoke).

**Independent Test**: From a fresh clone in a clean container or shell, `cd app && npm install --no-audit --no-fund && npm run build` exits 0 without prompts and produces `app/dist/`.

### Implementation for User Story 3

- [X] T020 [US3] Verify that running `npm install` in `app/` does **not** trigger any interactive prompt and exits 0 in a fresh shell.
- [X] T021 [US3] Verify `npm run build` from `app/` exits 0 and the produced `index.html` in `app/dist/` references assets via the configured `base` (defaulting to `/`). Spot-check that no contributor home-directory paths leak into the bundle (`grep -R "$HOME" app/dist/` returns empty).
- [X] T022 [US3] Run a parameterised build: `VITE_BASE_PATH=/tabular-data-playground/ npm run build`. Confirm the produced `app/dist/index.html` references assets at `/tabular-data-playground/...`. Then `rm -rf app/dist/` and re-run the default build so the working tree is left in the default-base state.

**Checkpoint**: Stories 1, 2, and 3 are all independently verified. Item #4 is done.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Minimal: documentation stub and per-item commit hygiene.

- [X] T023 [P] Create `app/README.md` — short stub: project name, link back to `spec.md`, `dev` and `build` commands, note that the project-level README is item #54 in E3.
- [X] T024 Update `backlog.md`: bump item #4's row from `proposed` → `complete`, set `Updated` to today's ISO date, add strikethrough on the completed row. Commit on the epic branch separately as `docs: backlog status — #4 complete` (epic policy: per-item status commit follows the per-item code commit).
- [X] T025 Run the `quickstart.md` walkthrough once end-to-end as a sanity check before closing the item. Record any deviation; if a sharp edge surfaces (e.g. Node version requirement), update `docs/limitations.md` per Constitution Principle VII in this same change.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — first.
- **Phase 2 (Foundational)**: After Phase 1. Blocks every story phase because every story task imports config or pins from these files.
- **Phase 3 (US1, MVP)**: After Phase 2.
- **Phase 4 (US2)**: After Phase 2. Independent of Phase 3 — `.gitkeep` files don't depend on the entry point.
- **Phase 5 (US3)**: After Phase 3 (needs a working build to verify CI-friendliness).
- **Phase 6 (Polish)**: After Phases 3, 4, 5.

### User Story Dependencies

- **US1 (P1, MVP)**: Boots locally — depends on Phase 2 only.
- **US2 (P1)**: Layout completeness — depends on Phase 2 only; testable independently of US1.
- **US3 (P2)**: CI-friendliness — depends on US1's working build to verify against.

### Within Each User Story

- T011 (US1) depends on T008/T009/T010 (entry point present) and T004/T005/T007 (configs present).
- T012 (US1) depends on T011 (install must have run).
- T020/T021/T022 (US3) depend on T011/T012 (build pipeline working).

### Parallel Opportunities

- T002, T003 in Phase 1 — different files.
- T005, T006, T007 in Phase 2 — different files (T004 must precede them only if package-manager resolution is involved; safe to parallelise once T004 has landed the dependency list).
- T008, T009 in Phase 3 — different files; T010 imports App from T009 so T010 sequences after T009.
- T013–T018 in Phase 4 — six independent `.gitkeep` files, fully parallel.
- T023 in Phase 6 — independent of T024/T025.

---

## Parallel Example: User Story 2

```bash
# Six independent .gitkeep files — parallelise freely:
Task: "Create app/src/components/.gitkeep"
Task: "Create app/src/shell/.gitkeep"
Task: "Create app/src/pyodide/.gitkeep"
Task: "Create app/src/fs/.gitkeep"
Task: "Create app/src/lessons/.gitkeep"
Task: "Create app/public/.gitkeep"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1).
2. Stop and verify in a browser. If the placeholder renders, the MVP for #4 is done.

### Incremental Delivery

1. MVP (Phase 3) → demonstrable: a contributor can boot the scaffold.
2. + Phase 4 (US2) → §9 layout matches; downstream items have stable paths.
3. + Phase 5 (US3) → build is CI-friendly; #33 can wire CI without re-blocking on this item.
4. + Phase 6 (Polish) → README stub + backlog bump + quickstart sanity walkthrough.

### Solo-Author Strategy

Single author, evening pace. Do Phases 1–6 in order; the parallel markers exist to identify mutually independent file edits but the workload is small enough that serial execution is fine.

---

## Per-Item Commit Plan (Epic mode)

Per the epic skill's "one commit per item" policy:

- **Code commit** (T001–T023): one commit titled
  `feat(#4): vite + react 18 + typescript scaffold under app/`.
- **Docs commit** (T024 only): a separate commit titled
  `docs: backlog status — #4 complete`.

`docs/limitations.md` updates from T025 (if any) land in the code commit.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- [Story] label maps each task to the user story for traceability.
- US1 is the smallest viable slice; US2 and US3 add layout completeness and CI-friendliness on top.
- No automated tests in this item; verification is manual via `quickstart.md`. Vitest wiring is deferred (research R5).
- The Vite default port is 5173; if it's busy on the contributor's machine the dev server picks the next free port automatically — this is not a sharp edge worth documenting.

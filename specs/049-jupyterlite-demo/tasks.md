---

description: "Task list for JupyterLite Demo Page (issue #21)"
---

# Tasks: JupyterLite Demo Page

**Input**: Design documents from `specs/049-jupyterlite-demo/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested as TDD. Verification is folded into each story as
manual cold-load checks plus a cheap CI build guard; a Playwright smoke is an
optional polish task.

**Organization**: Tasks are grouped by user story (from spec.md) so each story
is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story the task belongs to (US1/US2/US3)
- Exact file paths are included in each description

## Path Conventions

New demo source lives in a top-level `jupyterlite/` directory (own pins,
isolated from the frozen `app/`). Published surface is `/jupyterlite/` on the
`gh-pages` tree. See plan.md → Project Structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the isolated `jupyterlite/` demo source and its pinned toolchain.

- [ ] T001 [P] Create the `jupyterlite/` scaffold with `jupyterlite/content/` and `jupyterlite/content/data/` subdirectories
- [ ] T002 [P] Add `jupyterlite/requirements.txt` with exact `==` pins for `jupyterlite-core` and `jupyterlite-pyodide-kernel` (lock the concrete versions from the build env; no ranges — Constitution VI)
- [ ] T003 [P] Add `jupyterlite/jupyter_lite_config.json` setting the content root (`jupyterlite/content/`) and output dir (`jupyterlite/_output`) per contracts/build-command.md
- [ ] T004 [P] Add `jupyterlite/jupyter-lite.json` runtime config selecting the Pyodide kernel and disabling unneeded features
- [ ] T005 [P] Add an ignore rule for the derived build output (`jupyterlite/_output/`) in `jupyterlite/.gitignore` (or root `.gitignore`) so it is never committed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Land the amendment-class gate obligations and confirm the pinned toolchain builds. These MUST be complete before the demo can ship or a user story can be validated end-to-end.

**⚠️ CRITICAL**: JupyterLite is a *new infrastructural dependency* — per the constitution's Technology Constraints this requires an amendment landed in the same change (see plan.md → Complexity Tracking).

- [ ] T006 Amend `.specify/memory/constitution.md`: add a "JupyterLite demo" bullet under Technology Constraints, update the Sync Impact Report comment, bump the version MINOR, and set Last Amended to today
- [ ] T007 [P] Record the demo pins (JupyterLite core, Pyodide-kernel, the kernel's bundled Pyodide, and the matplotlib the notebook installs) in the `README.md` "Pinned versions" table, noting they are independent of the frozen playground's Pyodide `0.27.7`
- [ ] T008 [P] Add a `docs/limitations.md` entry covering the demo's online-only design (no offline/air-gapped path), cold-load wheel weight, and its separate pin set (FR-010, gate 6)
- [ ] T009 Confirm the pinned toolchain installs and builds against the scaffold: `pip install -r jupyterlite/requirements.txt && jupyter lite build --config jupyterlite/jupyter_lite_config.json --output-dir jupyterlite/_output` exits 0 and produces a non-empty `_output/`

**Checkpoint**: Toolchain builds, gate obligations satisfied — user story work can begin.

---

## Phase 3: User Story 1 - See in-browser matplotlib plotting on tabular data (Priority: P1) 🎯 MVP

**Goal**: A visitor opens the demo, opens the example notebook, runs it, and a matplotlib figure renders inline entirely in the browser from a sample dataset.

**Independent Test**: Build locally, serve `jupyterlite/_output/`, open `demo.ipynb`, Run All → at least one matplotlib figure renders inline; verified on a cold load in Chrome and Firefox.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Author a generic, light, non-sensitive sample dataset at `jupyterlite/content/data/sample.csv` (a handful of columns × a few dozen rows — FR-009, research R6)
- [ ] T011 [US1] Author `jupyterlite/content/demo.ipynb`: install/import matplotlib in-browser (e.g. `piplite`/`%pip`), load `data/sample.csv`, and render ≥1 inline matplotlib figure (FR-002, FR-003; depends on T010)
- [ ] T012 [US1] Rebuild (`jupyter lite build`), serve `jupyterlite/_output/`, and confirm Run-All in the served notebook renders a matplotlib figure inline (depends on T011)
- [ ] T013 [US1] Cold-load verification: in fresh Chrome and Firefox profiles (empty cache), open the demo, Run-All, and confirm the figure renders and no server/account is involved (FR-005, SC-002, SC-003)

**Checkpoint**: The headline value works and is testable via a local build/serve — MVP.

---

## Phase 4: User Story 2 - Discover the demo from the landing page (Priority: P2)

**Goal**: The public site welcome page shows a visible, labelled link to the JupyterLite demo.

**Independent Test**: On the assembled welcome page, a labelled link is present and, when clicked, navigates to the `/jupyterlite/` demo.

### Implementation for User Story 2

- [ ] T014 [US2] Add a visible, labelled hyperlink to `/jupyterlite/` in `web/index.html`, placed alongside the existing welcome links (FR-004, SC-001)
- [ ] T015 [US2] Verify the link in an assembled local preview (welcome page + `jupyterlite/` output under the same base) resolves to the running demo (contract G1)

**Checkpoint**: The demo is discoverable from the site entry point.

---

## Phase 5: User Story 3 - Reproduce the demo build from one documented command (Priority: P3)

**Goal**: The demo builds from a single documented command and is published as an additive step in the existing deploy and PR-preview workflows, leaving the frozen playground untouched.

**Independent Test**: On a clean checkout, the single documented command produces `_output/`; the workflows publish `_site/jupyterlite/` without altering the `/playground/` assembly.

### Implementation for User Story 3

- [ ] T016 [US3] Document the single reproducible build command (and base-URL parameterisation) in `jupyterlite/README.md` (FR-006, contracts/build-command.md)
- [ ] T017 [US3] Add the additive JupyterLite step to `.github/workflows/deploy.yml` **after** the existing IDE copy: pinned `actions/setup-python`, `pip install -r jupyterlite/requirements.txt`, `jupyter lite build` with deploy base URL `/tabular-data-playground/jupyterlite/`, then `mkdir -p _site/jupyterlite && cp -r jupyterlite/_output/. _site/jupyterlite/` (FR-007; must not touch the pnpm IDE build, `keep_files`, or sample-package handling — FR-008)
- [ ] T018 [US3] Add the same additive step to `.github/workflows/pr-preview.yml` using the PR-scoped base URL `/tabular-data-playground/pr-preview/pr-<N>/jupyterlite/`
- [ ] T019 [US3] Add a CI guard (in the relevant workflow) asserting `jupyter lite build` exits 0 and `_output/` is non-empty (contract C1)
- [ ] T020 [P] [US3] Extend the PR-preview comment body in `.github/workflows/pr-preview.yml` to list the new `/jupyterlite/` demo URL for reviewers

**Checkpoint**: The demo is reproducible and published additively; the frozen playground is byte-for-byte unchanged.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Optional hardening and final validation.

- [ ] T021 [P] (Optional) Add a Playwright Chromium smoke that opens the built `/jupyterlite/` demo, runs the notebook, and asserts a figure element appears (research R7)
- [ ] T022 Run `specs/049-jupyterlite-demo/quickstart.md` end-to-end and confirm every listed verification step passes
- [ ] T023 [P] Confirm frozen-playground isolation: `/playground/` assets and the frozen pins in `README.md`/`app/src/pyodide/config.ts` are unchanged by this feature (FR-008, contract G4)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (needs the scaffold + pins to build). BLOCKS shipping and full validation of user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational. The MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational; independent of US1 for the link edit, but its verify step (T015) is most meaningful once a build exists (US1).
- **User Story 3 (Phase 5)**: Depends on Foundational; publishes what US1 produces. The single-command doc (T016) and CI/deploy wiring make the demo reproducible/published.
- **Polish (Phase 6)**: After the desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories — testable via local build/serve.
- **US2 (P2)**: After Foundational. The `web/index.html` link edit is independent; verification benefits from US1 existing.
- **US3 (P3)**: After Foundational. Wires build/publish; independently testable by running the documented command and inspecting the assembled `_site`.

### Within Each User Story

- US1: sample data (T010) → notebook (T011) → local render check (T012) → cold-load check (T013).
- US3: document command (T016) → deploy wiring (T017) → preview wiring (T018) → CI guard (T019) → preview comment (T020).

### Parallel Opportunities

- All Phase 1 Setup tasks (T001–T005) are independent files → run in parallel.
- Foundational T007 (README) and T008 (limitations) are parallel; T006 (constitution) is a distinct file and also parallel; T009 depends on Setup.
- US1 T010 (data) can start in parallel with US2 T014 (welcome-page link) once Foundational is done.
- US3 T017 and T018 touch different workflow files (parallelizable), but T020 also edits `pr-preview.yml` so sequence T018 → T020.

---

## Parallel Example: Phase 1 Setup

```bash
# These create distinct files and can proceed together:
Task: "Create jupyterlite/ scaffold with content/ and content/data/"
Task: "Add jupyterlite/requirements.txt with pinned versions"
Task: "Add jupyterlite/jupyter_lite_config.json"
Task: "Add jupyterlite/jupyter-lite.json"
Task: "Add _output/ ignore rule"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup — scaffold + pins + configs.
2. Phase 2: Foundational — constitution amendment, README pins, limitations, toolchain build check.
3. Phase 3: US1 — sample data + notebook + rendered figure, verified on cold load.
4. **STOP & VALIDATE**: the demo renders a matplotlib figure locally. This is the headline deliverable.

### Incremental Delivery

1. Setup + Foundational → toolchain ready and gate obligations met.
2. US1 → figure renders (MVP, locally verifiable).
3. US2 → discoverable from the welcome page.
4. US3 → reproducible single-command build wired additively into deploy + PR preview (published, reviewable).
5. Polish → optional Playwright smoke + quickstart validation + isolation check.

---

## Notes

- [P] = different files, no dependencies.
- The constitution amendment (T006), README pins (T007), and limitations entry
  (T008) are **not optional** — they are the gate obligations that must land in
  the same change as the dependency.
- Keep the sample data light to bound the cold-load wheel payload.
- Do not modify `app/` or the frozen `/playground/` assembly (FR-008).
- Commit after each task or logical group.

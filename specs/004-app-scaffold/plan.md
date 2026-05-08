# Implementation Plan: App Scaffold

**Branch**: `claude/epic-e1-1gMf9` (epic mode — shared across all E1 items)
**Date**: 2026-05-08
**Spec**: [spec.md](./spec.md)
**Input**: Backlog item #4 (Epic E1) — "Vite + TypeScript + React 18 project scaffold under `app/`."

## Summary

Land the foundational Vite + TypeScript + React 18 project under `app/` so that all downstream E1 items have a stable host page to compose into. Output: a directory tree matching `spec.md` §9 exactly, a runnable dev server, a working production build, strict TypeScript, and a parameterised base path so item #34 (GitHub Pages) can configure deployment without code edits. No dependencies beyond what the constitution's Technology Constraints fix for this slot. No styling system, no FS, no editor, no terminal, no Pyodide — those are later items.

Approach: copy the standard `npm create vite@latest -- --template react-ts` layout into `app/`, drop unused boilerplate (HMR demo styles, the React-logo asset, the counter), pin every dependency to an exact version, and replace the rendered placeholder with a single line that says "Frictionless Data Explorer — scaffold ready." Track empty subdirectories from `spec.md` §9 with `.gitkeep` files so the layout is visible to contributors immediately.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict).
**Primary Dependencies**: Vite 6.0.7, @vitejs/plugin-react 4.3.4, React 18.3.1, react-dom 18.3.1.
**Dev/Type Dependencies**: typescript 5.7.2, @types/react 18.3.18, @types/react-dom 18.3.5.
**Storage**: N/A (no persistent state in this item; IDBFS/localStorage are downstream).
**Testing**: Vitest is constitution-mandated for unit testing but is **not** wired in this item — the scaffold's only verifiable behaviours are "dev server starts" and "build emits to `app/dist/`." Runtime tests for those are CI-style smoke and arrive with item #33 (CI) and #35 (Playwright). This item ships a `pnpm test` script that runs `tsc --noEmit` so item #33 has something non-trivial to invoke; richer test infrastructure is layered on later.
**Target Platform**: Browsers — latest 2 versions of Chrome, Firefox, Safari, Edge (per constitution Technology Constraints).
**Project Type**: Static SPA (browser-only).
**Performance Goals**: Placeholder bundle under 200 kB gzipped (HTML + JS + CSS combined). Dev server starts in <2 s on a typical contributor workstation. `vite build` completes in <30 s on the same.
**Constraints**: No backend, no telemetry, no accounts (Constitution Principle IV). Vite `base` MUST be parameterisable via env var so #34 can configure GitHub Pages without source edits. No dependencies outside the constitution's Technology Constraints. Empty §9 subdirectories tracked with `.gitkeep`.
**Scale/Scope**: ~10 source files in this item; future E1 items will grow `app/src/` to dozens of modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution defines six per-feature gates (see `.specify/memory/constitution.md`, "Per-feature gates"). Result for this feature:

1. **Research-first gate** — *Pass.* The scaffold is the substrate for the entire IDE shell that hosts the Frictionless evaluation. There is no product-shaped scope creep here; it is the minimum needed to render anything at all.

2. **Notes-section gate** — *Not applicable.* This item is infrastructure, not a lesson. The Notes & Observations rule (Principle II) attaches to lesson templates (E2), not to scaffolding.

3. **Destruction gate** — *Pass (vacuous).* The scaffold introduces no flow that overwrites or deletes user content. There is no user content yet. No modal confirmations are required for this item; they arrive with #17 (DnD overwrite) and #20 (Reset workspace).

4. **Backend gate** — *Pass.* Static SPA only. No server, no account, no telemetry. Dev mode runs on the local Vite server, which is a local-only build tool and not a deployed backend.

5. **Pinning gate** — *Pass.* All seven new dependencies are pinned to exact versions in this plan's Notes section and will land in `app/package.json` with exact pins (no `^`, no `~`). Lockfile commitment itself is item #5; this item ensures the pins are correct so #5's lockfile reflects the intended versions.

6. **Limitations gate** — *Pass (no new limitations).* The scaffold itself does not introduce a new sharp edge. Vite/React/TS quirks that bite later items (e.g. Pyodide + SharedArrayBuffer interactions, Monaco lazy-load gotchas) will be documented in `docs/limitations.md` by the items that surface them, per Principle VII.

**Phase-0 Spike Gate**: E0 is complete (`backlog.md` Epics table strikethrough, results recorded in `docs/architecture.md`). E1 work is unblocked.

**Result**: All gates pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-app-scaffold/
├── plan.md              # This file
├── spec.md              # Already created by /speckit-specify
├── research.md          # Phase 0 output (this run)
├── data-model.md        # Phase 1 output (this run)
├── quickstart.md        # Phase 1 output (this run)
├── contracts/           # Phase 1 output — package.json scripts contract (this run)
├── checklists/
│   └── requirements.md  # Spec-quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

This item adds `app/` only. Other top-level paths in `spec.md` §9 (`content/`, `docs/`, `.github/workflows/`) are owned by later items and are not touched here.

```text
app/
├── src/
│   ├── components/        # .gitkeep — populated by #8 (app shell layout)
│   ├── shell/             # .gitkeep — populated by #22–#25 (mini-shell)
│   ├── pyodide/           # .gitkeep — populated by #27, #28
│   ├── fs/                # .gitkeep — populated by #11, #12
│   ├── lessons/           # .gitkeep — populated by E2 lesson loader
│   └── main.tsx           # entry point: ReactDOM.createRoot, renders <App />
├── src/App.tsx            # placeholder — single line "Frictionless Data Explorer — scaffold ready."
├── public/                # .gitkeep — public assets land here in later items
├── index.html             # Vite-standard HTML, references /src/main.tsx
├── package.json           # exact-version pins, scripts: dev, build, preview, typecheck, test
├── tsconfig.json          # strict: true, jsx: react-jsx, target: ES2022, module: ESNext
├── tsconfig.node.json     # for vite.config.ts compilation
├── vite.config.ts         # plugin-react, base parameterised via VITE_BASE_PATH env var
├── README.md              # stub — dev/build commands only
└── .gitignore             # node_modules, dist, .vite cache
```

**Structure Decision**: This is a single-package web SPA — Option 1 (Single project) from the template, but rooted at `app/` rather than the repo root, per `spec.md` §9. The repo root is reserved for spec/constitution/backlog and per-feature `specs/`; `app/` is the npm package boundary; `content/`, `docs/`, `.github/`, and `LICENSE`/`README.md` at root are owned by other items and are out of scope here.

## Phase 0 — Research

Output: `research.md` in this directory. Resolves the only meaningful unknown (exact dependency pins) and records the rationale for the small handful of decisions this item carries.

Research tasks:

- **R1: Pin Vite + plugin-react versions.** Decision: vite@6.0.7, @vitejs/plugin-react@4.3.4. Rationale: Vite 6.x is the active major as of 2024 H2; 6.0.7 is a known-stable patch with the React plugin 4.3.x line. Alternatives considered: Vite 5.x (older major, no benefit here); Vite 7.x — out at the time of writing but still settling, and Vite 6 has the longer track record for the constraints we care about.
- **R2: Pin React 18.x.** Decision: react@18.3.1, react-dom@18.3.1. Rationale: spec.md §9 and constitution Technology Constraints fix React at "18+"; 18.3.1 is the last 18.x release before the 19.0 line. Choosing 18.3.1 over 19.x preserves compatibility with the rest of the stack (Monaco wrapper, react-arborist, react-mosaic/dockview) without forcing version-resolution churn in later items. If a downstream item needs a 19-only feature we revisit.
- **R3: Pin TypeScript.** Decision: typescript@5.7.2. Rationale: the 5.7.x line is current and has the strict-mode behaviour the constitution implies. No alternatives meaningfully different at this scale.
- **R4: Configure `base` for GitHub Pages.** Decision: `base: process.env.VITE_BASE_PATH ?? '/'` in `vite.config.ts`. Rationale: lets item #34 set `VITE_BASE_PATH=/<repo>/` at deploy time without modifying source. Local dev defaults to `/`. Alternatives considered: hard-code the repo path (rejected — couples the scaffold to deployment details that belong in #34); detect via env in source (rejected — Vite's own `base` config is the canonical knob).
- **R5: Test runner.** Decision: ship a `test` script that runs `tsc --noEmit` only; defer Vitest wiring to a later infrastructure item. Rationale: there is nothing meaningful to unit-test in a placeholder scaffold; introducing Vitest now means picking versions and config for tests that don't exist. The `tsc --noEmit` target gives item #33's CI workflow a non-trivial `pnpm test` to run. Alternatives considered: wire Vitest now with a placeholder test (rejected — premature; the constitution says "no half-finished implementations").
- **R6: Strict mode.** Decision: `strict: true`, plus `noUncheckedIndexedAccess: true` and `exactOptionalPropertyTypes: true`. Rationale: turning these on now is a one-line change; turning them on later forces audits across every file written between now and then.
- **R7: Empty-directory tracking.** Decision: `.gitkeep` per empty subfolder under `app/src/`. Rationale: standard convention; downstream contributors see the §9 layout immediately. Alternatives considered: README stubs in each folder (rejected — pure noise).

## Phase 1 — Design & Contracts

### Data model

There is no data model for this item — no persisted entities, no IDBFS interactions, no IndexedDB schema. `data-model.md` will record this explicitly so downstream tools (e.g. `/speckit-analyze`) don't flag a missing artefact.

### Contracts

The only externally observable contract this item exposes is the npm script surface in `app/package.json`. `contracts/package-scripts.md` records the script names, intent, and exit-code expectations:

| Script | Command | Expected behaviour |
|--------|---------|--------------------|
| `dev` | `vite` | Starts the local dev server with HMR. Prints the URL. Non-zero exit on port conflict. |
| `build` | `tsc --noEmit && vite build` | Type-checks then emits production bundle to `app/dist/`. Exit 0 on success, non-zero on type errors or build errors. |
| `preview` | `vite preview` | Serves `app/dist/` for local inspection. |
| `typecheck` | `tsc --noEmit` | Type checks without emitting. Exit 0 on success. |
| `test` | `tsc --noEmit` | Alias for `typecheck` until Vitest is wired by a later item. Lets item #33's CI invoke `pnpm test` non-trivially. |

These names are stable across items #5/#6/#33 (which will add `lint`, `format`, etc., not redefine these).

### Quickstart

`quickstart.md` records the one-page how-to-boot for the scaffold so contributors landing the rest of E1 don't need to reverse-engineer it: clone, `cd app`, install (item #5 will replace the install command with `pnpm install --frozen-lockfile`; for now `npm install` works), `npm run dev`, open the printed URL, see "scaffold ready."

### Agent context update

`CLAUDE.md` already references `specs/002-spike-b-shell/plan.md` between markers as the "current plan." Per the speckit-plan template, the marker block is updated to point at this item's plan during implementation. There are no SPECKIT markers in `CLAUDE.md` today — the reference is a plain sentence at the top — so the agent context update is a manual edit during the implementation step (#4) rather than a marker swap.

## Notes — Pinned External Dependencies (Constitution Principle VI)

All versions are exact pins. They land in `app/package.json` without `^`/`~`/`>=`. Item #5 commits the pnpm lockfile that locks the dependency tree below these.

| Package | Version | Role |
|---------|---------|------|
| `vite` | `6.0.7` | Build tool / dev server |
| `@vitejs/plugin-react` | `4.3.4` | React HMR + JSX transform plugin |
| `react` | `18.3.1` | UI runtime |
| `react-dom` | `18.3.1` | React DOM renderer |
| `typescript` | `5.7.2` | TypeScript compiler |
| `@types/react` | `18.3.18` | React type definitions |
| `@types/react-dom` | `18.3.5` | React DOM type definitions |

If a fresher patch is current at implementation time and the change is a strict patch bump, the implementer may use the newer patch and record the swap in this Notes section. Minor or major bumps require re-running this gate.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None. All six per-feature gates pass cleanly. Table left intentionally empty.

# Phase 0 Research — App Scaffold

This item has very few unknowns; the constitution's Technology Constraints
fix the stack. Research here is mostly version-pin selection and a couple
of small configuration decisions.

## R1 — Pin Vite + plugin-react versions

- **Decision**: `vite@6.0.7`, `@vitejs/plugin-react@4.3.4`.
- **Rationale**: Vite 6.x is the active major as of 2024 H2; 6.0.7 is a
  known-stable patch. The 4.3.x React plugin tracks the 6.x core. Aligns
  with mainstream Vite + React 18 setups so future contributors recognise
  the scaffolding.
- **Alternatives considered**:
  - Vite 5.x — older major, no benefit here, and the 6.x defaults
    (Rolldown-readiness etc.) match where downstream items will lean.
  - Vite 7.x — current at the time of writing but younger; Vite 6 has the
    longer track record for the constraints this artefact needs.

## R2 — Pin React 18.x

- **Decision**: `react@18.3.1`, `react-dom@18.3.1`.
- **Rationale**: spec.md §9 and the constitution Technology Constraints
  fix React at "18+". 18.3.1 is the last 18.x release, with the
  18 → 19 deprecation warnings already wired so future migration is
  signposted. Choosing 18.3.1 over 19.x avoids forcing the rest of the
  stack (Monaco wrapper, react-arborist, react-mosaic/dockview) onto
  19-compatible versions immediately.
- **Alternatives considered**:
  - React 19.x — viable but pulls in concurrent-features churn we don't
    need for the scaffold and adds a dependency-resolution constraint to
    every later item.
  - React 18.2.x — unnecessarily older; 18.3.1 supersedes it cleanly.

## R3 — Pin TypeScript

- **Decision**: `typescript@5.7.2`.
- **Rationale**: 5.7.x is current and stable; the strict-mode behaviour is
  what the constitution implicitly assumes. No meaningful difference at
  this scope vs. neighbours.
- **Alternatives considered**:
  - TypeScript 5.6.x — older patch line.
  - TypeScript 5.8+ — younger, no feature this item depends on.

## R4 — Configure `base` for GitHub Pages

- **Decision**: `base: process.env.VITE_BASE_PATH ?? '/'` in
  `vite.config.ts`.
- **Rationale**: Lets item #34 set `VITE_BASE_PATH=/<repo>/` at deploy
  time without modifying the source. Local dev keeps `/` and works
  unchanged.
- **Alternatives considered**:
  - Hard-code the repo path — rejected; couples scaffold to a deployment
    detail owned by #34.
  - Detect via runtime env in source — rejected; Vite's own `base` config
    is the canonical knob and avoids per-asset URL rewriting at runtime.

## R5 — Test runner

- **Decision**: ship a `test` script that runs `tsc --noEmit` only.
  Vitest is deferred to a later item.
- **Rationale**: There is nothing meaningful to unit-test in a
  placeholder scaffold. Wiring Vitest now picks versions and config for
  tests that don't exist, contradicting "no half-finished
  implementations." `tsc --noEmit` gives item #33's CI a non-trivial
  `pnpm test` target.
- **Alternatives considered**:
  - Wire Vitest with a placeholder smoke test — rejected; premature.
  - Leave `pnpm test` undefined — rejected; item #33's CI workflow
    expects the script to exist.

## R6 — Strict-mode flags

- **Decision**: `strict: true`, plus `noUncheckedIndexedAccess: true` and
  `exactOptionalPropertyTypes: true`.
- **Rationale**: Cheaper to turn on now than retrofit. Both flags catch
  classes of bug that show up immediately in the kind of FS / shell /
  bridge code downstream items will write.
- **Alternatives considered**:
  - `strict: true` only — leaves index-access and optional-property
    holes that bite later, when the cost of fixing is per-call-site.

## R7 — Empty-directory tracking

- **Decision**: `.gitkeep` per empty subfolder under `app/src/`
  (`components/`, `shell/`, `pyodide/`, `fs/`, `lessons/`).
- **Rationale**: Standard convention; downstream contributors see the
  §9 layout immediately and don't have to invent it.
- **Alternatives considered**:
  - README stubs per folder — rejected; pure noise.
  - Leave folders absent until populated — rejected; defeats the purpose
    of using #4 to nail down the layout.

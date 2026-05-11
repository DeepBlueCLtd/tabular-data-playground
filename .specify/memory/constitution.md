<!--
SYNC IMPACT REPORT
Version change: 1.0.0 → 2.0.0
Bump rationale: Principle VI redefined incompatibly. The "Pin and Freeze"
principle previously required the artefact to freeze at v1.0 with no
further maintenance. The project is not in production and is still
under active development; the v1.0 tag is a phasing milestone, not a
freeze. Pinning for reproducibility of any tagged build is retained;
the "no further work after v1.0" framing is removed. Backwards
compatibility is now scoped explicitly to external Frictionless Data
artefacts only.
Modified principles:
  - VI. Pin and Freeze → VI. Pin Versions, Iterate Forward
Added sections: n/a
Removed sections: n/a
Templates requiring updates:
  - .specify/templates/plan-template.md — no edit required.
  - .specify/templates/spec-template.md — no edit required.
  - .specify/templates/tasks-template.md — no edit required.
  - .specify/templates/checklist-template.md — no edit required.
Companion edits in same commit:
  - spec.md §11 Phase 3 — drop "frozen as-is" disposition.
  - spec.md §13 — last DoD bullet softened from "frozen as a dated
    reference" to a neutral milestone.
Follow-up TODOs: None.
-->

# Tabular Data Playground Constitution

This constitution governs the **Frictionless Data Explorer** research artefact
(see `spec.md` for the full specification). It is deliberately scoped to a
solo-authored, single-version research deliverable that freezes at v1.0.

## Core Principles

### I. Research Artefact, Not Product (NON-NEGOTIABLE)

The deliverable is a **research artefact** evaluating the Frictionless Data
ecosystem. Construction is the research method ("build-it-to-learn-it"). The
artefact MUST NOT be designed for community growth, multi-tenant use, or
long-term maintenance. Architectural decisions resolve in favour of learning
Frictionless faithfully over polish, scalability, abstraction, or
hypothetical future requirements.

Rationale: The author's purpose is confirmatory-with-adversarial-probes
evaluation. Treating the codebase as a product distorts the evaluation by
optimising for the wrong outcomes (see spec.md §1).

### II. Notes & Observations as Durable Output (NON-NEGOTIABLE)

Every lesson template MUST contain a **Notes & Observations** section that
the author fills in *while authoring the lesson*, at the moment of contact
with Frictionless — not reconstructed afterwards. These aggregated notes are
the evidence base for the v1.1 fitness assessment and any eventual write-up.
A lesson whose Notes section ends up empty or unenlightening is a signal to
rework that lesson before tagging v1.0.

Rationale: The artefact's value to the author is the captured observations,
not the running site. If the notes aren't there, the build-it-to-learn-it
discipline has failed (see spec.md §1, §10 R7).

### III. Confirm-on-Destruction Throughout (NON-NEGOTIABLE)

No silent destruction of user work. Every flow that could overwrite or delete
user-edited content — lesson-load into an existing folder, drag-and-drop on
filename collision, "Reset workspace" — MUST present a modal confirmation
that names what will be lost. Confirmation behaviour MUST be symmetric
across all destructive flows.

Rationale: The single shared workspace was reversed precisely because silent
destruction was a footgun (see spec.md decision #49). Symmetry across flows
is what makes the rule reliable rather than a per-flow opinion.

### IV. Browser-Only, No Backend, No Telemetry

The deliverable is a static SPA hosted on GitHub Pages. There MUST be no
backend, no accounts, no shared state across users, no telemetry, and no
analytics. All compute happens in the browser; durable state lives in the
user's own IndexedDB and localStorage. Network access during use is
permissible only for fetching pinned static assets (Pyodide CDN, optionally
remote `datapackage.json` for lesson 8) and MUST degrade gracefully when
absent.

Rationale: GitHub Pages hosting is a hard constraint and the privacy posture
suits a research artefact (spec.md §3, decision #14).

### V. Phased Demonstrability

Work proceeds in named phases (Phase 0 de-risking spike, Phase 1 IDE shell,
Phase 2 lesson system + curriculum, Phase 3 polish & freeze). Each phase
MUST end at a publicly demonstrable, useful artefact such that if momentum
stalls the previous phase still stands as a usable, public reference. A
phase MUST NOT be declared complete on the basis of in-flight work alone.

Rationale: Solo author, evening pace, real risk of momentum loss; the
phasing is the mitigation (spec.md §10 R9, §11).

### VI. Pin Versions, Iterate Forward

All external versions — Frictionless, Pyodide, JSON Schemas (Data Package /
Table Schema / Dialect), and npm dependencies via committed lockfile — MUST
be pinned and recorded in the README so that any tagged build is
reproducible. Backwards compatibility is **not** a project goal except
where it concerns external Frictionless Data artefacts (datapackages,
schemas, dialects) that the artefact reads or writes: those MUST remain
compliant with the pinned Frictionless / JSON Schema versions in use.

The `v1.0` tag is a phasing milestone (Principle V), not a freeze.
Development continues past it. Adopting newer standards is encouraged
when they improve evaluation faithfulness; when a standard is adopted,
in-tree files MUST migrate to the adopted standard rather than carrying
historical formats.

Rationale: Tagged reproducibility supports the artefact's "this is what
we found at point X" value without locking out improvements to the
tooling around it. Production-style maintenance constraints are not in
scope because the project is not in production.

### VII. Document Limitations Honestly

Known constraints MUST be enumerated in `docs/limitations.md` and surfaced
in the lesson where they bite. This includes (non-exhaustive): Pyodide
command latency, serialised pipes, no `&&`/`||`/`;` shell chaining, no
SharedArrayBuffer, no in-IDE note-taking, no mobile/small-screen support,
no in-band cancellation when Pyodide runs on the main thread, and any
Frictionless features that creak or require workarounds. Workarounds and
sharp edges discovered during build MUST be recorded rather than papered
over.

Rationale: The evaluation's credibility depends on the honesty of its
caveats; the limitations doc is part of the deliverable, not a footnote
(spec.md §6.5, §10, decision #15).

## Technology Constraints

The v1 stack is fixed by the spec and is part of the constitutional surface
(changes require a constitution amendment, not just a PR):

- **Build & runtime**: Vite + TypeScript + React 18+; pnpm with committed
  lockfile; CI uses `pnpm install --frozen-lockfile`.
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives owned in-repo).
- **Editor**: `monaco-editor` (lazy-loaded) + `@monaco-editor/react`;
  drag-to-split panes via `react-mosaic` or `dockview`.
- **File tree**: `react-arborist` (or equivalent).
- **Markdown**: `react-markdown` + `remark-gfm` + `rehype-highlight`
  (deliberately not MDX; lessons are static markdown).
- **Terminal**: `xterm.js` + `xterm-addon-fit` + `xterm-addon-web-links`.
- **Python runtime**: Pyodide loaded from CDN, version pinned;
  `frictionless` installed via `micropip` after page paint (hybrid load).
- **State**: Zustand or React context (Redux is overkill at this scope).
- **Tests**: Vitest (unit), Playwright (Chromium-only smoke against the
  built site).
- **CI/CD**: GitHub Actions — `pnpm build` + `pnpm test` on PR; deploy to
  GitHub Pages on push to `main`.
- **Lint/format**: ESLint + Prettier, standard config.
- **Browser support**: latest 2 versions of Chrome, Firefox, Safari, Edge.
  CI smoke-tests Chromium only.
- **Accessibility**: best-effort — keyboard-navigable, semantic HTML, no
  formal WCAG conformance commitment (decision #15).

Substitutions within these slots (e.g. `dockview` instead of `react-mosaic`)
are permitted and not amendments. Adding a new infrastructural dependency,
introducing a backend, or replacing a pinned runtime IS an amendment.

## Development Workflow & Quality Gates

**Phase 0 gate.** Before committing to the full build, Spike A (Pyodide +
frictionless), Spike B (pipes prototype), and Measurement C (latency budget)
MUST pass per the criteria in spec.md §11. Failure of A triggers a
re-plan; failure of B downgrades terminal scope; Measurement C produces a
recorded recommendation in `docs/architecture.md` that determines whether
Pyodide runs on main thread or a Web Worker.

**Per-feature gates** (enforced via `/speckit-plan` Constitution Check):

1. *Research-first check*: does this feature serve evaluating Frictionless,
   or is it product-shaped scope creep? Justify if the latter.
2. *Notes-section check*: if the feature is a lesson, does it carry a
   Notes & Observations template section?
3. *Destruction check*: does the feature introduce any flow that overwrites
   or deletes user content? If yes, modal confirmation is mandatory.
4. *Backend check*: does the feature require a backend, account, or
   third-party telemetry? If yes, it is rejected unless it can be reshaped
   into a static-only flow.
5. *Pinning check*: does the feature introduce a new external dependency?
   If yes, it must land pinned and recorded.
6. *Limitations check*: does the feature introduce a new sharp edge,
   workaround, or surprise? If yes, `docs/limitations.md` is updated in the
   same change.

**Definition of Done (v1.0)** is fixed by spec.md §13 and is not amendable
without a major-version constitution bump.

**Branching**: feature work branches from `main`; PRs require CI green
(`pnpm build`, `pnpm test`, Playwright Chromium smoke). Solo author, so
review is self-review against this constitution.

## Governance

This constitution supersedes ad-hoc practices for the duration of the v1.0
build. It does not supersede `spec.md` — where the two disagree, `spec.md`
is the authoritative product specification and this constitution is to be
amended to align.

**Amendment procedure**:

1. Edit this file with the proposed change.
2. Update the Sync Impact Report HTML comment at the top.
3. Bump the version per semantic versioning:
   - **MAJOR**: a principle is removed, redefined incompatibly, or the
     Definition of Done changes.
   - **MINOR**: a new principle or section is added, or an existing one is
     materially expanded.
   - **PATCH**: clarifications, wording, typo fixes, non-semantic
     refinements.
4. Set `Last Amended` to today's date (ISO `YYYY-MM-DD`).
5. Commit with message `docs: amend constitution to vX.Y.Z (<summary>)`.

**Compliance review**: every `/speckit-plan` run executes the per-feature
gates above. Violations MUST either be removed or justified in the plan's
Complexity Tracking section before `/speckit-tasks` runs.

**Project lifecycle**: development continues past the `v1.0` tag
(Principle VI). Tagged builds are reproducible via pinned versions, but
the constitution and the codebase continue to evolve while the project
is in its pre-production research phase.

**Version**: 2.0.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-11

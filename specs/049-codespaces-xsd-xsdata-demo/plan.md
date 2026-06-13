# Implementation Plan: Codespaces XSD → XSData Typed-Data Demo

**Branch**: `claude/codespaces-xsd-xsdata-demo-0quywk` | **Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/049-codespaces-xsd-xsdata-demo/spec.md`

## Summary

Stand up a self-contained GitHub Codespaces experiment that proves the
schema-first typed-binding workflow end to end: a mock, richly-annotated
**sonar-performance XSD** → Python types generated with **xsdata** → a short
Python program that parses a sample XML into those typed objects, reads fields
via type-aware access, and runs a **structural verification gate** (serialise
back to XML, validate against the XSD, round-trip check). The whole thing must
come up ready-to-run in a Codespace with zero manual setup, so it can be put
in front of a colleague in one click.

This is a lean, reversible **de-risking pilot** — deliberately separate from
the Frictionless Data Explorer SPA, not a curriculum lesson, and not shipped in
the static site. It exercises the mechanics (generation, annotations→docstrings,
typed domain objects, conformant-by-construction) without building any
production line around them.

## Technical Context

**Language/Version**: Python 3.12 (devcontainer base image, pinned by tag/digest)
**Primary Dependencies**: `xsdata[cli,lxml]` (code generation + parse/serialise), `lxml` (XSD validation + C14N round-trip compare) — both pinned; exact patch versions locked into `requirements.txt` at implement time
**Storage**: Files only — `schema/*.xsd`, `samples/*.xml`, generated bindings package, demo scripts. No database, no network at runtime.
**Testing**: `pytest` (pinned) — asserts on parsed typed objects, docstring presence, and the round-trip/validation gate
**Target Platform**: GitHub Codespaces (Linux dev container); portable enough to run locally via the same devcontainer or a venv, but Codespaces is the supported path
**Project Type**: Standalone Python demo / research spike (single directory under `experiments/`)
**Performance Goals**: Not performance-driven. Onboarding target: colleague reaches a running demo in <10 min active effort (SC-001); `make generate` succeeds first try (SC-002)
**Constraints**: Zero manual setup in a fresh Codespace; deterministic/reproducible generation and demo output (SC-006); all external versions pinned and recorded; no backend/accounts/telemetry
**Scale/Scope**: Tiny — one XSD (several annotated entities + enumerations), one valid + one invalid sample, one generated bindings package, one demo program, one round-trip step, a small test suite, and the walkthrough

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v2.1.0. Per-feature gates from the Development Workflow section:

1. **Research-first** — *Pass (justified).* spec.md §1 frames the project as
   assessing several data-validation "legs", of which Frictionless is one. This
   spike evaluates an adjacent leg — schema-first XSD→typed-binding — and is
   build-it-to-learn-it research (Principle I), not product scope creep. It is
   explicitly carved out from the SPA and ships nothing into the site.
2. **Notes-section** — *Pass.* Not a lesson, but FR-011 (Principle II) is honoured
   by a **Notes & Observations** section in the experiment's `README.md`,
   filled at the moment of contact with xsdata (smooth spots, workarounds,
   limitations).
3. **Destruction** — *Pass.* The only overwrite is `make generate` rewriting the
   *generated bindings* — regenerable artefacts that are never hand-edited (per
   the generated-artefacts discipline), not user content. No user-work
   destruction flow is introduced; generation cleans its output dir first to
   avoid stale files.
4. **Backend** — *Pass.* No backend, accounts, or telemetry. A Codespace is a
   dev environment, not a deployed server; the demo runs offline after setup.
5. **Pinning** — *Pass (with action).* New tooling (Python image, `xsdata`,
   `lxml`, `pytest`) lands pinned in `requirements.txt` and the devcontainer
   image reference, and is recorded in the experiment README.
6. **Limitations** — *Pass (with action).* New sharp edges (xsdata constructs it
   can't model on this schema, round-trip formatting differences, Codespace/
   devcontainer caveats) are recorded in `docs/limitations.md` in this change.

**Technology-Constraints — covered by the Experiments & Spikes carve-out.** The
constitution's Technology Constraints fix the *shipped SPA* stack. This
experiment introduces a Python + xsdata toolchain, but it is standalone,
non-shipping, and does not touch the SPA. Constitution **v2.2.0** added an
**Experiments & Spikes** section that explicitly permits exactly this:
isolated, self-pinned spikes outside the SPA stack with no backend/telemetry.
This plan satisfies all four of that section's conditions (isolation in
`experiments/`, self-contained pinning, limitations recorded, no backend), so
no Technology-Constraints amendment is required. See Complexity Tracking for the
rationale.

## Project Structure

### Documentation (this feature)

```text
specs/049-codespaces-xsd-xsdata-demo/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CLI command + schema contracts)
│   ├── cli-commands.md
│   └── schema-contract.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (already present)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
.devcontainer/
└── devcontainer.json            # Codespaces config: pinned Python image,
                                 # postCreateCommand installs pinned deps

experiments/
└── sonar-xsdata/
    ├── README.md                # Walkthrough + Notes & Observations section
    ├── requirements.txt         # Pinned: xsdata[cli,lxml], lxml, pytest
    ├── Makefile                 # `generate`, `demo`, `roundtrip`, `test`
    ├── schema/
    │   └── sonar_performance.xsd        # Mock, richly annotated XSD
    ├── samples/
    │   ├── valid_prediction.xml         # Conforms to the schema
    │   └── invalid_prediction.xml       # Deliberately non-conforming
    ├── generated/                       # xsdata output (committed for review;
    │   └── sonar_performance/           #   regenerable via `make generate`)
    ├── demo.py                          # Load → typed access → summary
    ├── roundtrip.py                     # Serialise → validate XSD → C14N diff
    └── tests/
        ├── test_generation.py           # Types + docstrings present (SC-003/003a)
        ├── test_demo.py                 # Typed-access summary + invalid error
        └── test_roundtrip.py            # Schema-valid + equivalent round-trip
```

**Structure Decision**: A standalone `experiments/sonar-xsdata/` directory keeps
the spike fully isolated from `app/` (the SPA) and `content/` (the curriculum),
satisfying FR-012. The `.devcontainer/` lives at repo root because that is where
Codespaces looks; its `postCreateCommand` installs only this experiment's pinned
requirements, so opening the repo in a Codespace yields a ready-to-run
environment (US1) without affecting the SPA's pnpm/Vite toolchain. Generated
bindings are committed so reviewers and a fresh Codespace can inspect/run
immediately, while `make generate` proves deterministic regeneration from the
XSD (the generated-artefacts discipline).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| New Python + `xsdata`/`lxml` toolchain outside the SPA stack (now permitted by the v2.2.0 Experiments & Spikes carve-out) | The spike's entire purpose is to evaluate the XSD→typed-binding leg the maintainer asked for; that requires xsdata and an XSD validator. The SPA's TS/Pyodide stack cannot demonstrate xsdata code generation. | Reusing the SPA's Pyodide runtime was rejected: xsdata code generation is a build-time developer workflow, not a browser runtime, and forcing it into Pyodide would distort the very thing being evaluated. Isolating it in `experiments/` with its own pinned deps keeps the SPA stack untouched. |
| `.devcontainer/` added at repo root | Codespaces requires the config at root to provision the environment (US1, FR-001). | A per-experiment devcontainer path is possible but the maintainer's goal is "open *this repo* in a Codespace"; root config is the zero-friction path and is inert for SPA work. |

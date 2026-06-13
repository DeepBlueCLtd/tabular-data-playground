# Phase 0 Research: Codespaces XSD → XSData Typed-Data Demo

Resolves the open technical choices left as implementation details in the spec
(specific versions, validation library, round-trip equivalence method,
devcontainer shape). Each decision records rationale and rejected alternatives.

## Decision 1 — Code generation tool: `xsdata`

- **Decision**: Generate Python bindings from the XSD with `xsdata` (the CLI
  `xsdata generate`), installed with the `[cli,lxml]` extras.
- **Rationale**: Named directly in the request and in the SMH delivery plan as
  the chosen Python binding tool. xsdata emits dataclass-based bindings, has a
  mature XSD code generator, and — critically for this demo — carries
  `xs:annotation/xs:documentation` through to **class and field docstrings**,
  which is the headline thing we want to show (FR-003a/FR-006a/SC-003a).
- **Alternatives considered**:
  - `generateDS` — older, less actively maintained, less idiomatic output.
  - `PyXB` — effectively unmaintained.
  - Hand-written dataclasses — defeats the purpose (the "programmer as
    bottleneck" antipattern the SMH plan explicitly retires).

## Decision 2 — Runtime model: dataclasses (default)

- **Decision**: Use xsdata's default **dataclass** output (`--output dataclasses`,
  the default), not the Pydantic plugin.
- **Rationale**: Zero extra runtime deps, fully typed, and xsdata ships its own
  `XmlParser`/`XmlSerializer` for dataclasses. Keeps the spike minimal and the
  generated code easy to read in review.
- **Alternatives considered**: `xsdata-pydantic` (adds runtime validation but a
  heavier dependency and a second validation story that would muddy the
  "validate against the XSD" gate); attrs plugin (no advantage here).

## Decision 3 — XSD validation + round-trip equivalence: `lxml`

- **Decision**: Use `lxml` for two jobs in the structural gate (US4):
  1. **Schema validation** — `lxml.etree.XMLSchema(xsd).assertValid(doc)` to
     validate both the input sample and the re-serialised output against the XSD.
  2. **Round-trip equivalence** — canonicalise input and re-serialised output
     with C14N (`lxml.etree.canonicalize` / `ElementTree.write(method="c14n")`)
     and compare the canonical byte strings; report any difference rather than
     asserting byte-identical raw XML.
- **Rationale**: `lxml` is already pulled in by `xsdata[lxml]`, is the mature
  XSD validator in the Python ecosystem, and C14N gives a principled notion of
  "equivalent" that ignores insignificant formatting (attribute order,
  whitespace) — matching the spec's "differences limited to insignificant
  formatting and explained" (SC-005a).
- **Alternatives considered**:
  - `xmlschema` library — also good, but adds a dependency where `lxml` is
    already present via xsdata.
  - Raw string compare of serialised XML — rejected: brittle against
    formatting/namespace-prefix differences and would produce false failures.

## Decision 4 — Environment delivery: dev container at repo root

- **Decision**: Provide `.devcontainer/devcontainer.json` at the repository root
  using a **pinned Microsoft devcontainers Python image** (`mcr.microsoft.com/
  devcontainers/python:1-3.12-bookworm`, pinned by digest at implement time). A
  `postCreateCommand` runs `pip install -r experiments/sonar-xsdata/requirements.txt`.
- **Rationale**: Root is where Codespaces looks, so "open this repo in a
  Codespace" Just Works (US1/FR-001). `postCreateCommand` makes the environment
  ready-to-run with no manual install (FR-002). The image is inert for the SPA's
  pnpm/Vite work, so it does not disturb existing development.
- **Alternatives considered**:
  - A custom `Dockerfile` — unnecessary; the prebuilt Python image plus a pip
    install is simpler and equally pinnable.
  - `features` block adding Node too — the SPA already runs in its own way; the
    spike doesn't need Node, so keep the image lean. (If the maintainer later
    wants one Codespace that serves both, that's a separate decision.)
  - Per-folder devcontainer — possible, but the stated goal is a one-click repo
    Codespace, so root config wins.

## Decision 5 — Pinning policy and exact versions

- **Decision**: Pin every external version. Concrete pins are recorded in
  `experiments/sonar-xsdata/requirements.txt` and echoed in the experiment
  README per Principle VI. The devcontainer image is pinned by digest. Exact
  patch numbers for `xsdata`, `lxml`, and `pytest` are resolved to the latest
  stable at **implement** time (when the environment can actually resolve them)
  and then frozen — the plan fixes the *policy and the libraries*, the
  implement step fixes the *digits*.
- **Rationale**: Honest pinning (Gate 5) without fabricating patch numbers now.
  `pip freeze` output is committed so any rebuild is reproducible (SC-006).
- **Alternatives considered**: A lockfile tool (`pip-tools`/`uv`) — nice but
  over-engineered for a single-purpose spike; a frozen `requirements.txt` from
  `pip freeze` is sufficient and transparent.

## Decision 6 — Generated code: commit it, but prove regeneration

- **Decision**: Commit the xsdata-generated package under
  `experiments/sonar-xsdata/generated/`, and provide `make generate` that
  cleans the output dir and regenerates from the XSD.
- **Rationale**: Committing lets a fresh Codespace and reviewers run/inspect the
  demo immediately, and lets tests assert that annotations rode through.
  `make generate` proves the artefacts are regenerable-by-construction and never
  hand-edited (the SMH distribution discipline), and cleaning first avoids the
  stale-file edge case in the spec.
- **Alternatives considered**: Gitignoring generated code and generating only at
  setup — rejected because reviewers couldn't see the docstring travel-through
  in the PR diff, which is half the point of the demo.

## Decision 7 — The mock schema's shape (annotation-rich)

- **Decision**: Author a small but realistic sonar-performance schema with every
  entity, field, and enumeration carrying an `xs:annotation/xs:documentation`,
  plus units captured in the documentation and at least one `xs:enumeration`
  (e.g. operating mode) and one constrained numeric type (e.g. a frequency or
  bearing range) so the generated types show docstrings, Enums, and typed
  fields. Detailed in `data-model.md`.
- **Rationale**: Maximises what the demo can *show* travelling through to code,
  while staying synthetic and non-sensitive (FR-003/FR-003a).
- **Alternatives considered**: A sprawling realistic schema — rejected as
  over-scope for a pilot; the point is breadth of construct types, not volume.

## Resolved unknowns

All Technical Context items are now concrete; no `NEEDS CLARIFICATION` remain.
The only values deferred are exact dependency patch numbers, deferred by
*policy* to implement-time freezing (Decision 5), not left unspecified.

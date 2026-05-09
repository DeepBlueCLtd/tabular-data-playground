# Feature Specification: Version pinning (#55)

**Backlog ID**: #55
**Input**: Pin Frictionless version and JSON Schema versions; record in
README (decision #11, Principle VI, `spec.md` §11 Phase 3, §13).

## User Scenarios

### US1 — Reproducible Frictionless install (P1)
The deployed app loads Pyodide and installs an exact, recorded
version of `frictionless` (and its transitive deps insofar as
micropip resolves them). A learner running the app today and a
year from today gets the same Frictionless behaviour against the
same lessons.

### US2 — Reproducible JSON Schema validation (P1)
The bundled JSON Schemas (data-package, table-schema, table-
dialect) are real snapshots of canonical specs at known URLs as
of the v1.0 freeze, not placeholders. The runtime upgrade path
(`liveUrl` fetch in `app/src/editor/json-schemas.ts`) still works,
but if it fails the bundled snapshot is the canonical fallback.

### US3 — Versions surfaced in the README (P2)
The pinned versions (`PYODIDE_VERSION`, `FRICTIONLESS_VERSION`,
JSON Schema sources + snapshot dates) are documented in the
README as part of the v1.0 freeze (#54 covers the rest of the
README; #55 contributes the version-pin section).

## Requirements
- **FR-001**: The Pyodide worker MUST install Frictionless at a
  pinned version (`micropip.install("frictionless==<X.Y.Z>")`).
  The version constant lives in `app/src/pyodide/config.ts`.
- **FR-002**: The bundled JSON Schemas under
  `app/src/editor/schemas/` MUST be real snapshots of the
  canonical schemas (data-package, table-schema, table-dialect),
  not placeholder stubs.
- **FR-003**: A "Pinned versions" section in the README MUST list
  the Pyodide version, the Frictionless version, and the JSON
  Schema canonical source URLs + snapshot dates.
- **FR-004**: `docs/limitations.md` "Bundled JSON Schemas are
  placeholders" MUST be retired or updated to reflect the new
  state (real snapshots, not placeholders).

## Success criteria
- **SC-001**: A fresh page load of the deployed app reports the
  pinned Frictionless version in the status bar and via the
  worker `ready` event.
- **SC-002**: Editing `datapackage.json`, `dialect.json`, or
  `schema.json` in Monaco surfaces validation errors driven by
  the canonical schemas, even with the runtime fetch blocked.

# Feature Specification: JSON Schema Validation in Monaco

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #14 — "JSON Schema validation in Monaco —
case-insensitive filename match: `datapackage.json` → Data Package,
`dialect.json` → Dialect, `schema.json`/`*.schema.json` → Table
Schema. Pinned snapshot bundled, runtime fetch with short timeout,
fall back to bundle (decisions #16, #40)."

## User Scenarios & Testing

### User Story 1 — Editing `datapackage.json` shows live validation (P1)

A user opens `/workspace/datapackage.json` in the editor. Monaco
shows red squigglies on missing required fields (`resources`) and
type mismatches. Hover surfaces the schema description.

### User Story 2 — Editing `schema.json` validates as Table Schema (P1)

The same Monaco gives field-type completion for a Table Schema
(`fields[].type` enum), driven by the bundled snapshot.

### User Story 3 — Editing `dialect.json` validates as Dialect (P1)

`delimiter`, `quoteChar`, etc. complete with documentation
strings.

### User Story 4 — Runtime fetch upgrades the schema in the background (P2)

On editor first mount, the loader attempts to fetch the canonical
schemas from `specs.frictionlessdata.io` with a 2 s timeout. On
success, Monaco's diagnostics options are reapplied with the live
schemas. On failure (timeout, CORS, offline) the bundled snapshot
is what users see.

### Edge Cases

- Filename match is case-insensitive per spec. Monaco fileMatch
  globs are case-sensitive in v1 — we enumerate the common
  case variants (`datapackage.json`, `Datapackage.json`,
  `DataPackage.json`, `DATAPACKAGE.json` etc.).
- The bundled schemas are deliberately minimal — they catch
  obvious mistakes (missing `resources`, wrong field type) but
  don't claim to be the full Frictionless spec. Runtime fetch
  brings in the canonical version.
- A failed runtime fetch does NOT show an error to the user.
  Validation degrades silently to the bundle.
- The schemas only apply within `/workspace/...` paths Monaco
  knows about (matched on the model URI).

## Requirements

- **FR-001**: New module `app/src/editor/json-schemas.ts` MUST
  register the three schemas with Monaco's JSON language
  service via `monaco.languages.json.jsonDefaults
  .setDiagnosticsOptions(...)`.
- **FR-002**: Bundled snapshots MUST live in
  `app/src/editor/schemas/{data-package,table-dialect,table-schema}.json`
  with `$id` set to the canonical
  `specs.frictionlessdata.io` URL.
- **FR-003**: `fileMatch` patterns MUST cover common case
  variants for each filename (lowercase, capitalised,
  CamelCase, ALL CAPS).
- **FR-004**: Runtime fetch MUST be attempted once on first
  registration. Each fetch has a 2 s `AbortController` timeout.
  On success, the live schema replaces the bundled one in
  Monaco's options.
- **FR-005**: `editor-area.tsx` MUST trigger the registration
  via Monaco's `onMount` callback so it runs only after Monaco
  loads.
- **FR-006**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.

## Success Criteria

- **SC-001**: Opening a stub `datapackage.json` with `{}` shows
  a "missing required: resources" diagnostic.
- **SC-002**: Opening a `schema.json` with a field of type
  `"unknown"` shows a "value not allowed" diagnostic listing the
  permitted types.
- **SC-003**: When network fetch succeeds, the schema in
  diagnostics is the canonical one (verifiable by checking
  `monaco.languages.json.jsonDefaults.diagnosticsOptions`).

## Assumptions

- `specs.frictionlessdata.io` serves schemas with permissive
  CORS. If not, runtime fetch quietly fails and we live on the
  bundle. (Documented in `docs/limitations.md`.)
- Bundled schemas are placeholders intended to ship the feature;
  they are NOT the source of truth. Each is annotated as such.
- The user mostly opens these files at lowercase canonical
  names; case-variant matching is best-effort.

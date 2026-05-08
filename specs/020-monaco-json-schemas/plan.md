# Implementation Plan: JSON Schema Validation in Monaco

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Bundle minimal placeholder JSON Schemas for Data Package,
Dialect, and Table Schema. Wire them into Monaco's JSON
diagnostics on editor mount with case-variant fileMatch globs.
Kick off a 2 s runtime fetch from `specs.frictionlessdata.io`;
on success, replace the schemas in place.

## Constitution Check

1. Research-first — pass.
2. Notes-section — N/A.
3. Destruction — N/A.
4. Backend — pass; runtime fetch is to a static spec site.
5. Pinning — pass; bundled snapshots live in the repo with
   commit history. Runtime fetch URLs are constants.
6. Limitations — pass; we note that bundles are placeholders.

All gates pass.

## Files touched

- `app/src/editor/schemas/data-package.json` — new.
- `app/src/editor/schemas/table-dialect.json` — new.
- `app/src/editor/schemas/table-schema.json` — new.
- `app/src/editor/json-schemas.ts` — new.
- `app/src/editor/editor-area.tsx` — wire `onMount`.
- `docs/limitations.md` — placeholder schema note.

## Phase 0 — Research

- Monaco's JSON language service is available via
  `monaco.languages.json.jsonDefaults`. `setDiagnosticsOptions`
  takes `{ validate, allowComments, schemas, enableSchemaRequest }`.
  `enableSchemaRequest` lets Monaco fetch `$ref`s by URL.
- `fileMatch` is matched against the model URI's path. Globs are
  case-sensitive; we enumerate variants.

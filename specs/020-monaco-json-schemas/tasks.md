# Tasks: JSON Schema Validation in Monaco (Backlog #14)

- [X] T001 Create `app/src/editor/schemas/data-package.json`,
  `table-dialect.json`, `table-schema.json` with placeholder
  schemas + canonical `$id`.
- [X] T002 Create `app/src/editor/json-schemas.ts` —
  `registerJsonSchemas(monaco)` that sets diagnostic options
  with the bundled schemas, then kicks off a 2 s runtime fetch
  per schema and re-registers on success.
- [X] T003 Update `editor-area.tsx` to call
  `registerJsonSchemas` from Monaco's `onMount`. Guard against
  multiple registrations.
- [X] T004 Add a one-liner to `docs/limitations.md` about the
  placeholder bundle.
- [X] T005 `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.
- [X] T006 Strikethrough `#14` in `backlog.md`; bump Updated.
- [X] T007 Three commits: `feat(#14)`, `docs(#14)`, `docs: backlog status`.

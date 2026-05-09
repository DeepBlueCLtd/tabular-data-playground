# Tasks: Version pinning (#55)

- [ ] T001 Wire `FRICTIONLESS_VERSION` from `config.ts` into the
  worker's `micropip.install("frictionless==<X.Y.Z>")` call.
- [ ] T002 Snapshot canonical Data Package JSON Schema into
  `app/src/editor/schemas/data-package.json`.
- [ ] T003 Snapshot canonical Table Schema into
  `app/src/editor/schemas/table-schema.json`.
- [ ] T004 Snapshot canonical Table Dialect schema into
  `app/src/editor/schemas/table-dialect.json` and update the
  matching `liveUrl` in `app/src/editor/json-schemas.ts`.
- [ ] T005 Add a "Pinned versions" stub to `README.md`.
- [ ] T006 Retire the placeholder note in `docs/limitations.md`;
  add a "pinned snapshots" replacement.
- [ ] T007 Run `pnpm lint`, `pnpm typecheck`, `pnpm build` clean.
- [ ] T008 Backlog status — #55 complete.

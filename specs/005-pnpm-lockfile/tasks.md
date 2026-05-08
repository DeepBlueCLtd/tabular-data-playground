---

description: "Tasks for backlog item #5 — pnpm Setup with Committed Lockfile"
---

# Tasks: pnpm Setup with Committed Lockfile (Backlog #5)

**Input**: spec.md, plan.md.
**Tests**: No automated tests (verification is `pnpm install --frozen-lockfile` + `pnpm run build`).

## Phase 1: Edits

- [X] T001 Add `"packageManager": "pnpm@10.33.0"` to `app/package.json`.
- [X] T002 Remove the `package-lock.json` stanza (and its preceding comment) from `app/.gitignore`.
- [X] T003 Delete the working-tree `app/package-lock.json` file (left over from #4's npm-based verification).

## Phase 2: Generate lockfile

- [X] T004 Run `pnpm install` in `app/` to generate `app/pnpm-lock.yaml` against the pinned dep list. Confirm `node_modules/` populates without warnings.
- [X] T005 Run `pnpm install --frozen-lockfile` in `app/` (a second install) and confirm no lockfile drift.
- [X] T006 Run `pnpm run build` in `app/` and confirm `app/dist/` is produced. Run `pnpm run typecheck` to confirm strict TS still passes.

## Phase 3: Documentation sync

- [X] T007 Update `app/README.md` so the documented install command is `pnpm install --frozen-lockfile`; runtime commands become `pnpm run dev`, `pnpm run build`, `pnpm run preview`, `pnpm run typecheck`. Add a one-line Corepack note.
- [X] T008 Update `specs/004-app-scaffold/quickstart.md` similarly so the prior item's quickstart matches.

## Phase 4: Backlog + close

- [X] T009 Update `backlog.md`: bump #5 from `proposed` → `complete`, update Updated date, add strikethrough.
- [X] T010 Commit per epic policy:
  - `feat(#5): pnpm setup with committed lockfile`
  - `docs(#5): spec/plan/tasks for pnpm-lockfile`
  - `docs: backlog status — #5 complete`

## Notes

- Lockfile size is expected ≤ 200 KB given seven direct deps; this is well within reasonable PR review bounds.
- `app/.gitignore` still excludes `node_modules/`, `dist/`, `.vite/`, `*.log`, `*.tsbuildinfo` — only the npm `package-lock.json` stanza is removed.

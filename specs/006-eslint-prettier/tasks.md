# Tasks: ESLint + Prettier (Backlog #6)

## Phase 1: Add deps + configs

- [X] T001 Add ESLint/Prettier devDependencies to `app/package.json` (versions per plan.md Notes); add `lint`, `lint:fix`, `format`, `format:check` scripts.
- [X] T002 Create `app/eslint.config.js` (flat config) configuring `@eslint/js` recommended, `typescript-eslint` recommended-type-checked-lite (or simply `recommended`), `eslint-plugin-react`, `react-hooks`, `react-refresh`, plus `eslint-config-prettier` last.
- [X] T003 Create `app/.prettierrc.json` with: `singleQuote: true`, `semi: true`, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`, `arrowParens: "always"`, `endOfLine: "lf"`.
- [X] T004 Create `app/.prettierignore` excluding `node_modules/`, `dist/`, `pnpm-lock.yaml`, `.vite/`.

## Phase 2: Install + verify

- [X] T005 `pnpm install` to refresh lockfile.
- [X] T006 `pnpm run lint` — must exit 0.
- [X] T007 `pnpm run format:check` — must exit 0 (or run `format` to apply, then re-check).
- [X] T008 `pnpm run typecheck && pnpm run build` — must still exit 0.

## Phase 3: Backlog + commit

- [X] T009 Strikethrough `#6` in `backlog.md`; bump Updated.
- [X] T010 Three commits: feat(#6), docs(#6), docs: backlog status.

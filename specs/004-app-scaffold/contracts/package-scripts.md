# Contract — `app/package.json` Script Surface

The scaffold exposes one external interface to the rest of the project:
the npm scripts in `app/package.json`. Items #5, #6, #33, and #35 will
add new scripts (e.g. `lint`, `format`, `test:e2e`) but MUST NOT
redefine the names below.

## Scripts

| Script | Command | Expected behaviour | Exit code |
|--------|---------|--------------------|-----------|
| `dev` | `vite` | Start the local dev server with HMR. Print the served URL on stdout. | Non-zero on port conflict or config error. |
| `build` | `tsc --noEmit && vite build` | Type-check, then emit production bundle to `app/dist/`. | 0 on success; non-zero on type errors or build errors. |
| `preview` | `vite preview` | Serve `app/dist/` for local inspection. | Non-zero on missing `dist/`. |
| `typecheck` | `tsc --noEmit` | Type-check without emitting. | 0 on success; non-zero on type errors. |
| `test` | `tsc --noEmit` | Alias for `typecheck` until Vitest is wired. | Same as `typecheck`. |

## Stability guarantees

- **`dev`, `build`, `preview`, `typecheck`, `test`** are stable script
  names for the duration of E1. Later items may extend their command
  bodies (e.g. `build` may grow a pre-build asset step) but MUST NOT
  rename them.
- **`test`** will eventually be redefined to run Vitest by a later
  infrastructure item. When that happens, the redefinition MUST keep
  the existing exit-code semantics (exit 0 on success).

## Out of scope for #4

- `lint`, `format` — owned by item #6.
- `test:e2e` — owned by item #35.
- Any pnpm-workspace or root-level scripts — owned by item #5.

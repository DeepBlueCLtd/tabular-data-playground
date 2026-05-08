# app/ — Frictionless Data Explorer (IDE shell)

This is the Vite + TypeScript + React 18 web app for the Frictionless
Data Explorer research artefact. It is the IDE shell that hosts the
lessons in E2.

For the product specification and rationale, see [`../spec.md`](../spec.md).
For the project-level README (deferred to E3 freeze per `spec.md` §11
Phase 3), see backlog item #54.

## Commands

```bash
# install (later replaced by `pnpm install --frozen-lockfile` in item #5)
npm install

# dev server with HMR (default http://localhost:5173)
npm run dev

# production build → app/dist/
npm run build

# preview the production build locally
npm run preview

# type-check only
npm run typecheck   # alias of `npm test` until Vitest wires up
```

## Layout

The directory tree under `app/` mirrors `spec.md` §9 exactly. Empty
subdirectories (`src/components/`, `src/shell/`, `src/pyodide/`,
`src/fs/`, `src/lessons/`) are tracked with `.gitkeep` files; later E1
items will fill them in.

## Deployment

The Vite `base` is parameterised via the `VITE_BASE_PATH` environment
variable. Local dev uses `/`. Item #34 will set
`VITE_BASE_PATH=/tabular-data-playground/` for the GitHub Pages
deploy.

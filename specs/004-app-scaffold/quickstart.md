# Quickstart — App Scaffold

A contributor cloning the repo wants to confirm the scaffold runs.

## Boot the dev server

```bash
cd app
pnpm install --frozen-lockfile   # uses the committed pnpm-lock.yaml (item #5)
pnpm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`). You
should see a single line: **Frictionless Data Explorer — scaffold
ready.**

If you see that line and the browser console is clean, the scaffold is
healthy.

## Produce a production build

```bash
cd app
pnpm run build       # tsc --noEmit && vite build
```

Bundle lands under `app/dist/`. Serve it locally with:

```bash
pnpm run preview
```

## Type-check only

```bash
cd app
pnpm run typecheck   # alias: pnpm test (until Vitest is wired)
```

## Configure the deployment base path

For local dev, leave `VITE_BASE_PATH` unset (defaults to `/`). When
item #34 wires GitHub Pages, the deploy workflow will set
`VITE_BASE_PATH=/<repo>/` in the build step.

```bash
VITE_BASE_PATH=/tabular-data-playground/ pnpm run build
```

## Layout reference

The directory tree under `app/` mirrors `spec.md` §9 exactly. Empty
subdirectories (`src/components/`, `src/shell/`, `src/pyodide/`,
`src/fs/`, `src/lessons/`) are tracked with `.gitkeep` files; later
E1 items will fill them in.

# Implementation Plan: Pyodide Loader (Web Worker)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Spawn one Web Worker per page load that fetches Pyodide v0.27.7 from
the pinned CDN and installs Frictionless 5.19.0 via micropip. Expose
status via React context: `idle | loading | ready | error`. Lazy
load after first paint. No npm dep on Pyodide — runtime CDN, the same
shape spike A used. v1 protocol covers `load / ready / error`;
command and FS messages land with #28.

## Constitution Check

1. Research-first — pass (Pyodide is the runtime that makes the whole
   evaluation possible).
2. Notes-section — N/A (infra).
3. Destruction — pass.
4. Backend — pass; the CDN serves static assets only, no app server,
   no telemetry.
5. Pinning — pass; `PYODIDE_VERSION` and `FRICTIONLESS_VERSION`
   constants are the pin and are recorded in
   `docs/architecture.md`.
6. Limitations — pass; sharp edges already in `docs/limitations.md`
   (Pyodide quirks, no SharedArrayBuffer, etc.).

All gates pass. No Complexity Tracking entries.

## Technical Context

- **Worker style**: Vite's `new Worker(new URL('./worker.ts',
  import.meta.url), { type: 'module' })`. Inside the worker, use
  `importScripts(`${PYODIDE_INDEX_URL}pyodide.js`)` — Pyodide ships a
  UMD that exposes `loadPyodide` on `self`. Both module-worker and
  classic `importScripts` are supported under Vite 6.
- **Lazy trigger**: `useEffect(() => { const t = setTimeout(start, 0);
  return () => clearTimeout(t); }, [])`. After mount, yield to first
  paint, then create the worker.
- **Singleton**: the worker is created inside the provider's
  `useEffect`. The provider itself sits at the React tree root, so it
  mounts once. A guard ref ensures we don't accidentally double-create
  in StrictMode dev double-invoke.
- **Error surface**: the worker posts `{ type: 'error', message }`
  on any caught exception during load. The provider keeps the worker
  alive on success; on error it terminates the worker so resources
  release, and exposes `error` for the UI.
- **`reload()` stub**: present but no-op until #30 fills it in. The
  type signature is locked in v1 so #30 doesn't change the public API.

## Notes — Pinned versions

| Component | Version | Notes |
|-----------|---------|-------|
| Pyodide | 0.27.7 | CDN URL is the pin. Same as spike A. |
| Frictionless | 5.19.0 | Installed via `micropip.install('frictionless')`. Recorded in `docs/architecture.md`. |

## Files touched

- `app/src/pyodide/config.ts` — new; CDN URL + versions.
- `app/src/pyodide/protocol.ts` — new; typed messages.
- `app/src/pyodide/worker.ts` — new; Web Worker.
- `app/src/pyodide/pyodide-context.ts` — new; context type.
- `app/src/pyodide/pyodide-provider.tsx` — new; provider component.
- `app/src/pyodide/use-pyodide.ts` — new; consumer hook.
- `app/src/App.tsx` — wrap in `<PyodideProvider>`.

## Phase 0 — Research

- **Worker module type** — Vite supports both classic and module
  workers. We use module workers for ergonomic TS imports of
  `protocol.ts` and `config.ts`. Pyodide is loaded *inside* the worker
  via `importScripts` (legacy global), which is allowed in module
  workers in modern browsers but rejected in some environments. If
  this becomes a problem, fallback is `await import(...)`/`fetch +
  Function('return ' + src)`. Spike A used `<script>` tag on main
  thread; we move to `importScripts` for the worker because Pyodide's
  recommended pattern in workers is exactly that.
- **Why no npm `pyodide` package** — the npm package shadows the CDN
  bundle and makes the bundle size jump dramatically. Spike A
  established that the CDN approach works. Constitution Principle VI
  is satisfied because the URL is the pin.
- **`crossOriginIsolated`** — not required for the loader; spike A's
  run record showed Pyodide loads without it. SharedArrayBuffer is
  out of scope for v1.
- **TypeScript for `loadPyodide`** — within the worker we declare it
  via `declare const loadPyodide: (...) => Promise<...>;` and a small
  `PyodideInterface` shape (only what the worker needs).

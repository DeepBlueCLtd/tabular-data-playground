# Feature Specification: Pyodide Loader (Web Worker)

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #27 — "Pyodide loader — load from CDN, version
pinned, hybrid load (after lesson panel paints); architecture (main
thread vs Web Worker) determined by item #3. (decisions #5, #10)"

The architecture choice from #3 is **WORKER-RECOMMENDED** per
`docs/architecture.md`: Pyodide runs in a Web Worker on every browser.

## User Scenarios & Testing

### User Story 1 — Pyodide loads in the background after first paint (P1)

A user opens the app. The shell renders immediately. Shortly after,
Pyodide is loaded in a Web Worker and Frictionless is installed via
micropip; the user can see this state via #29's loading UI.

**Independent Test**: Open the dev server. Watch the network /
DevTools: a Web Worker spins up, `pyodide.js` is fetched from the
pinned CDN URL, the worker reports `ready`. The main thread receives
the `ready` message and exposes `status === 'ready'` via
`usePyodide()`.

### User Story 2 — Pyodide is loaded only once (P1)

Subsequent components calling `usePyodide()` see the already-ready
status; no second worker is created. The provider is a singleton.

**Independent Test**: Mount two components that both consume
`usePyodide()`. Inspect the worker count (DevTools) — exactly one.

### User Story 3 — Errors surface as state, not exceptions (P2)

If the CDN is unreachable or micropip install fails, the provider
moves to `status === 'error'` with a readable `error.message`. The
rest of the app keeps working.

**Independent Test**: Block the Pyodide CDN URL in DevTools network
panel; reload. Status becomes `error`; the editor and tree continue to
render their loading-gated states (handled by #29).

### Edge Cases

- The worker is loaded **lazily**, after first paint, to keep
  time-to-interactive low. Implementation: kick off load via a
  `useEffect` in the provider that runs after mount + a `setTimeout(0)`
  to yield to the browser's first paint. Anything more elaborate
  (`requestIdleCallback`) is overkill for v1.
- Pyodide and Frictionless versions are pinned in a single `config.ts`
  module, mirrored from spike A's `pyodide.config.js`.
- `crossOriginIsolated` is **not required** for this loader (no
  SharedArrayBuffer usage); spike A's run record showed this works.
  Documented in `docs/limitations.md`.
- The worker uses classic `importScripts` to load Pyodide (not ES
  modules); Pyodide v0.27.x ships a UMD bundle that's
  `importScripts`-compatible.
- Reload-runtime (#30) terminates and respawns the worker; out of
  scope for #27 but the provider exposes a `reload()` method as a
  no-op stub so #30 can fill it in without changing the public API.

## Requirements

- **FR-001**: `app/src/pyodide/config.ts` MUST export
  `PYODIDE_VERSION = '0.27.7'`,
  `PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'`,
  and `FRICTIONLESS_VERSION = '5.19.0'`.
- **FR-002**: `app/src/pyodide/worker.ts` MUST be a Web Worker module
  that, on a `'load'` message: imports Pyodide via `importScripts(<url>/pyodide.js)`,
  calls `loadPyodide({ indexURL })`, calls `loadPackage('micropip')`,
  installs `frictionless` via micropip, and posts `{ type: 'ready' }`
  back. On error it posts `{ type: 'error', message }`.
- **FR-003**: `app/src/pyodide/protocol.ts` MUST define typed message
  shapes for the worker ↔ main exchange. v1 includes only `load`,
  `ready`, `error` — command/FS messages land with #28.
- **FR-004**: `app/src/pyodide/pyodide-provider.tsx` MUST render its
  children, lazily create the worker after first paint, and expose
  `{ status, error, reload }` via context. `status` is one of
  `'idle' | 'loading' | 'ready' | 'error'`.
- **FR-005**: `app/src/pyodide/use-pyodide.ts` MUST export
  `usePyodide()` returning the context value; throws if used outside
  the provider.
- **FR-006**: The provider MUST NOT create more than one worker per
  page load (until #30 implements reload).
- **FR-007**: `App.tsx` MUST be wrapped in `<PyodideProvider>` (inside
  `<ThemeProvider>`).
- **FR-008**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.
- **FR-009**: Pyodide is **not** added as an npm dependency. It is
  fetched from the pinned CDN at runtime (matches spike A and
  Constitution Principle VI; the URL is the pin).

## Success Criteria

- **SC-001**: From a clean load, the provider transitions
  `idle → loading → ready` within ~5 s on a typical broadband connection.
- **SC-002**: A network failure transitions to `error` with a readable
  message, and the rest of the UI still renders.
- **SC-003**: Bundle size growth on the main thread is under 5 KB
  gzipped (the worker bundle is separate and downloads lazily).

## Assumptions

- Pyodide v0.27.7 (matching spike A) is the target. If this needs to
  bump, change `config.ts` only.
- Frictionless 5.19.0 is the target (matching architecture.md).
- The Vite worker convention (`new Worker(new URL('./worker.ts',
  import.meta.url), { type: 'module' })`) builds correctly on Vite 6.
- Editor (#13) and file tree (#15) are gated on `status === 'ready'`
  per the user's choice on #11's backing (IDBFS via Pyodide).
- The "lesson panel paints" trigger is approximated by `setTimeout(0)`
  in `useEffect`; a future refinement could observe the real paint
  with `requestAnimationFrame` chained to `requestIdleCallback`.

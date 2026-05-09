# tabular-data-playground

Early experiments in support of tabular data management.

## Pinned versions (v1.0 freeze)

The deployed playground is a research artefact: pinned and frozen
on purpose (Constitution Principle VI). The pins are the contract
the eight lessons in `content/lessons/` were authored against.

| Component | Version | Source |
|-----------|---------|--------|
| Pyodide | `0.27.7` | `app/src/pyodide/config.ts` (`PYODIDE_VERSION`); served from `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/`. |
| Frictionless | `5.19.0` | `app/src/pyodide/config.ts` (`FRICTIONLESS_VERSION`); installed at runtime via `micropip.install("frictionless==5.19.0")` in the Pyodide worker. |
| Data Package JSON Schema | snapshot 2026-05-09 | Bundled from `https://specs.frictionlessdata.io/schemas/data-package.json` to `app/src/editor/schemas/data-package.json`. |
| Table Schema JSON Schema | snapshot 2026-05-09 | Bundled from `https://specs.frictionlessdata.io/schemas/table-schema.json` to `app/src/editor/schemas/table-schema.json`. |
| Table Dialect JSON Schema | snapshot 2026-05-09 (v2) | Bundled from `https://datapackage.org/profiles/2.0/tabledialect.json` to `app/src/editor/schemas/table-dialect.json` (`specs.frictionlessdata.io` returns 404 for dialect; `datapackage.org` is the canonical home). |

The editor still attempts a runtime fetch of the canonical schemas
on mount with a short timeout and uses the live copy if it
arrives; the bundled snapshots are the offline / outage fallback.
See `docs/limitations.md` for the full pinning posture.

JavaScript dependencies are pinned via `pnpm-lock.yaml`; CI uses
`--frozen-lockfile`. The Monaco editor assets load from jsdelivr
at a pinned `monaco-editor@<version>` URL — the URL is the pin.

**Do not bump pins without re-walking lesson 6** (Transform), the
most version-fragile lesson in the curriculum.

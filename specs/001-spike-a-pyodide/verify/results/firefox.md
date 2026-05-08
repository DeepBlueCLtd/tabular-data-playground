### Spike A — Pyodide + Frictionless install proof

**Browser**: firefox (Playwright headless) — Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0
**Date**: 2026-05-08
**Outcome**: PASS
**Total elapsed**: 30527 ms
**crossOriginIsolated**: false

**Versions**:

- Pyodide pinned URL: `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js`
- Pyodide runtime version: `0.27.7`
- Frictionless: `5.19.0`

**Steps**:

| # | Step | Elapsed (ms) | Exit | Stdout (first line) |
|---|------|--------------|------|---------------------|
| 1 | pyodide_load | 8309 | 0 | Pyodide 0.27.7 loaded. |
| 2 | micropip_install_frictionless | 10412 | 0 | frictionless installed via micropip |
| 3 | frictionless_version | 8038 | 0 | 5.19.0 |
| 4 | frictionless_validate | 3768 | 0 | ─────────────────────────────────── Dataset ──────────────────────────────────── |

**Notes / sharp edges observed**:

- Verified via Playwright headless (`specs/001-spike-a-pyodide/verify/run-spikes.mjs`).
- crossOriginIsolated === false (expected on GitHub Pages and locally without COOP/COEP).

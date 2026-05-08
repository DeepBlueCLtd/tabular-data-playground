### Spike A — Pyodide + Frictionless install proof

**Browser**: chromium (Playwright headless) — Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.37 Safari/537.36
**Date**: 2026-05-08
**Outcome**: PASS
**Total elapsed**: 8435 ms
**crossOriginIsolated**: false

**Versions**:

- Pyodide pinned URL: `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js`
- Pyodide runtime version: `0.27.7`
- Frictionless: `5.19.0`

**Steps**:

| # | Step | Elapsed (ms) | Exit | Stdout (first line) |
|---|------|--------------|------|---------------------|
| 1 | pyodide_load | 2234 | 0 | Pyodide 0.27.7 loaded. |
| 2 | micropip_install_frictionless | 3092 | 0 | frictionless installed via micropip |
| 3 | frictionless_version | 2040 | 0 | 5.19.0 |
| 4 | frictionless_validate | 1067 | 0 | ─────────────────────────────────── Dataset ──────────────────────────────────── |

**Notes / sharp edges observed**:

- Verified via Playwright headless (`specs/001-spike-a-pyodide/verify/run-spikes.mjs`).
- crossOriginIsolated === false (expected on GitHub Pages and locally without COOP/COEP).

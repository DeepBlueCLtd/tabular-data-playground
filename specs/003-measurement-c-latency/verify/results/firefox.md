### Measurement C — Pyodide latency budget — firefox (Playwright headless)

**Browser**: Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0
**Date**: 2026-05-08
**Verdict**: **WORKER-RECOMMENDED**
**Verdict reason**: cold 3718 ms vs limit 3000; warm median 328 ms vs limit 250 — at least one over
**crossOriginIsolated**: false

**Versions**:

- Pyodide pinned URL: `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js`
- Pyodide runtime: `0.27.7`
- Frictionless: `5.19.0`

**Setup (context only)**:

- pyodide_load: 8234 ms
- micropip_install: 10781 ms

**Cold call**: 3718 ms

**Warm calls**:

- count completed: 10
- median: 328 ms
- p95: 334 ms
- raw: [325, 334, 327, 318, 329, 331, 334, 329, 326, 322]

**Error**: (none)

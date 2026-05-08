### Measurement C — Pyodide latency budget — chromium (Playwright headless)

**Browser**: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.37 Safari/537.36
**Date**: 2026-05-08
**Verdict**: **MAIN-THREAD-OK**
**Verdict reason**: cold 995 ms < 3000 and warm median 66 ms < 250 — within budget
**crossOriginIsolated**: false

**Versions**:

- Pyodide pinned URL: `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js`
- Pyodide runtime: `0.27.7`
- Frictionless: `5.19.0`

**Setup (context only)**:

- pyodide_load: 2157 ms
- micropip_install: 3156 ms

**Cold call**: 995 ms

**Warm calls**:

- count completed: 10
- median: 66 ms
- p95: 75 ms
- raw: [73, 67, 62, 61, 62, 65, 62, 75, 70, 66]

**Error**: (none)

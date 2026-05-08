# Contract — Measurement C Record

Output for paste into `docs/architecture.md`:

````markdown
### Measurement C — Pyodide latency budget — <browser>

**Browser**: <UA>
**Date**: <YYYY-MM-DD>
**Verdict**: MAIN-THREAD-OK | WORKER-RECOMMENDED | INCONCLUSIVE
**Verdict reason**: <one sentence>

**Versions**:

- Pyodide pinned URL: `<URL>`
- Pyodide runtime: `<X.Y.Z>`
- Frictionless: `<X.Y.Z>`

**Setup (context only)**:

- pyodide_load: <ms>
- micropip_install: <ms>

**Cold call** (first `frictionless validate sample.csv`): <ms>

**Warm calls** (subsequent `frictionless validate sample.csv`):

- count completed: <N>
- median: <ms>
- p95: <ms>
- raw: [<ms>, <ms>, …]

**Notes / sharp edges observed**:

- <free-form>
````

# Data Model — Measurement C

## Measurement Record

| Field | Type | Description |
|-------|------|-------------|
| `browser` | string | UA string. |
| `pyodide.pinned_url` | string | From Spike A's `pyodide.config.js`. |
| `pyodide.runtime_version` | string | `pyodide.version` at runtime. |
| `frictionless.version` | string | First non-empty line from `frictionless --version`. |
| `setup.pyodide_load_ms` | int | Time from before `loadPyodide` to after it resolves. Reported for context only. |
| `setup.micropip_install_ms` | int | Time for `micropip.install("frictionless")`. Context only. |
| `cold.duration_ms` | int | First `validate` call. Threshold target. |
| `warm.durations_ms` | int[] | All warm calls, in order. |
| `warm.completed` | int | `warm.durations_ms.length`. |
| `warm.median_ms` | int \| null | Median of `warm.durations_ms`. |
| `warm.p95_ms` | int \| null | 95th percentile (nearest-rank). |
| `verdict` | enum | `MAIN-THREAD-OK \| WORKER-RECOMMENDED \| INCONCLUSIVE`. |
| `verdict_reason` | string | One sentence. |
| `error` | string \| null | Captured exception summary if a call failed; null otherwise. |

## Verdict logic

```
if any required field is missing or any call errored:
    INCONCLUSIVE
elif warm.completed < 5:
    INCONCLUSIVE — "fewer than 5 warm calls completed"
elif cold.duration_ms < 3000 and warm.median_ms < 250:
    MAIN-THREAD-OK — "cold ${cold} ms, warm median ${median} ms — within budget"
else:
    WORKER-RECOMMENDED — "cold ${cold} ms (limit 3000), warm median ${median} ms (limit 250)"
```

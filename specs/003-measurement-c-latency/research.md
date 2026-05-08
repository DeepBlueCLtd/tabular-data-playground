# Research — Measurement C

## R1. What "cold" and "warm" mean

**Decision**: "Cold" = the first invocation of `frictionless` in this
page session, AFTER Pyodide is loaded and `frictionless` is installed
via `micropip`. Pyodide-load and micropip-install are NOT folded into
the cold-call number — those are separate setup costs measured for
context but excluded from the threshold check (the threshold concerns
*per-command* responsiveness once the runtime is hot enough to use).

**Rationale**: The threshold in `spec.md` §10 R3
(`warm < 250 ms median`) is about user-perceived responsiveness during
a lesson, not first-page-load cost. The cold-call number captures
Frictionless's own warm-up (imports, JIT, constructor caches), which
is what the user pays on the first command typed in a session.

## R2. Sample shape

**Decision**: Reuse the same CSV shape as Spike A (id/name/joined,
~7 rows). Bundle it locally in `app/spikes/measurement-c/sample.csv`
to keep the measurement page self-contained.

**Rationale**: Cross-spike comparability. Different shapes would
make Spike A's totals and Measurement C's per-call numbers harder
to reason about together.

## R3. How many warm calls

**Decision**: Default N = 10, page-configurable. Verdict floor at 5
completed warm calls (`INCONCLUSIVE` below that). Numbers reported:
all individual durations, median, p95.

**Rationale**: 10 is enough to compute a useful median without
making the page slow. p95 from 10 samples is rough but informative.
The author can dial N up if the numbers near the threshold call for
it.

## R4. Headless vs headed measurement

**Decision**: Run the Playwright headless harness on Chromium and
Firefox to capture an automated number for the recorded outcome.
Surface explicitly that headless ≠ headed, and that the v1
go/no-go is the headed number on the author's actual machine.

**Rationale**: Both are useful. Headless is reproducible and lands
in CI later; headed is the user-facing number. Recording both keeps
the recommendation honest.

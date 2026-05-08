# Research — Spike B (Mini-shell Pipes Prototype)

Phase 0 of `plan.md`. Each item is captured as Decision / Rationale /
Alternatives.

## R1. xterm.js version to pin

**Decision**: Pin `xterm.js` to a recent stable release loaded from
`https://cdn.jsdelivr.net/npm/@xterm/xterm@<version>/`. The exact
version is recorded in `xterm.config.js` and surfaced on the page
(spec FR-002, FR-009). Use the new `@xterm/xterm` scoped package
(the rename from the legacy `xterm` package on npm has been in
effect since 2024); this also matches what E1 will install.

**Rationale**: Constitution Principle VI mandates pinning. The
`@xterm/xterm` scope is what the project will eventually depend on
via pnpm (Constitution Technology Constraints).

**Alternatives considered**:

- *Vendor xterm into the repo*: rejected — bloat, no upside.
- *Use the legacy `xterm` package*: rejected — it's no longer the
  recommended path and will diverge from the eventual pnpm install.

## R2. Pipe semantics (streaming vs buffered)

**Decision**: Serialised + fully-buffered pipes. Each pipe stage
returns an `AsyncIterable<Uint8Array>`; the executor consumes a
stage's output completely (concatenating chunks, capped at 1 MiB),
then passes the resulting `Uint8Array` to the next stage as its
single-chunk stdin. No backpressure, no parallel stages.

**Rationale**: Matches `spec.md` §6 decision #4 (serialised + buffered
pipes are acceptable for v1). Streaming with backpressure is harder
to get right in vanilla JS without a real readable-stream pipeline,
and the user-facing semantics (linear shell pipelines on small text)
do not benefit from it. The 1 MiB cap is a research-mode safety belt;
it can be lifted in E1 once needed.

**Alternatives considered**:

- *True ReadableStream piping*: rejected for the spike — Node-style
  `Readable.pipe` semantics aren't natively available in the browser
  in a way that interleaves with our builtin functions cleanly. Worth
  revisiting in E1 only if a real need surfaces.
- *Worker per stage*: rejected — orders of magnitude too much
  machinery for a research artefact.

## R3. Self-check shape

**Decision**: A `runSelfCheck()` function on `main.js` runs at page
load *before* enabling the interactive prompt. It drives the shell
through four assertions (per spec FR-007) and records the outcome on
the page. Each assertion is a `{ name, command, then(state) → bool, why }`
record so the displayed FAIL state names which assertion failed and
why. After the self-check ends (PASS or FAIL), the prompt is enabled
so a human can reproduce manually.

**Rationale**: Self-checks are the only way for a static page to
make a credible, reader-visible PASS claim about behaviour beyond
"it loaded". Encoding the assertions as data (not assertions inside
arbitrary code) keeps the run-record easy to render and copy.

**Alternatives considered**:

- *Vitest*: out of scope for a static spike (no build step, no test
  runner). E1 brings Vitest in.
- *Just trust the human reader*: weaker evidence; the deliverable
  for `docs/architecture.md` is much thinner without machine-checked
  assertions.

## R4. Tokeniser scope

**Decision**: A small hand-rolled tokeniser (~70–100 LoC) that
emits `{ type: 'word' | 'pipe' | 'redirect' | 'newline', value }`
tokens. Single quotes (`'…'`) preserve everything literally; double
quotes (`"…"`) preserve everything except `\` (which escapes `\` and
`"`); backslash outside quotes escapes the next character.
Whitespace separates words. Pipe `|` and redirect `>` are
single-character operators.

**Rationale**: Matches `spec.md` §6 mini-shell-tokeniser intent
(item #22 in backlog). Hand-rolled keeps the scope contained and
makes the rejected-features list explicit.

**Alternatives considered**:

- *Use a parser-combinator library*: rejected — extra dependency for
  no real win at this scale.
- *Skip tokenisation, regex on the line*: rejected — quoting is the
  hard part and you can't regex it correctly.

## R5. Rejected features — surface vs strip

**Decision**: The shell rejects `&&`, `||`, `;`, `&`, `(`, `)`, `$(`,
`${`, `<`, `>>`, `*`, `?`, `~`, and tab completion at parse time
with a one-line message naming the rejected feature. Rejection
happens after tokenisation but before execution; the self-check
asserts at least one rejection produces the expected message.

**Rationale**: Constitution Principle VII — surface absences rather
than silently strip. Lessons later cite this list explicitly so
learners aren't surprised when they paste a recipe that uses `&&`.

**Alternatives considered**:

- *Silently treat unsupported tokens as words*: rejected — would
  produce confusing failures downstream and violate Principle VII.

## R6. Builtins scope

**Decision**: Implement `echo`, `cat`, `ls`, `pwd` as builtins.
`echo` and `cat` are required by the pass criterion; `ls` and `pwd`
are cheap and make the prompt feel real to a human reader.
`cd`, `mkdir`, `rm` are deferred to E1 (item #25).

**Rationale**: `echo` + `cat` are the minimum for the spec's pass
criterion. Adding `ls` and `pwd` costs negligible code and improves
reproducibility; a reader can confirm the FS state without reading
JS.

**Alternatives considered**:

- *Just echo + cat*: viable; adding ls/pwd is a small win. Either is
  acceptable.

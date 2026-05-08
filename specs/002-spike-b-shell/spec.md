# Feature Specification: Spike B — Mini-shell Pipes Prototype

**Feature Branch**: `claude/epic-e0-Vrtop` (epic E0; per-item branches not used)
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "Spike B — Mini-shell pipes prototype. A stripped-down xterm.js terminal wired to a custom JS shell that supports `echo`, `cat`, `>` redirection, and `|` pipes. Pass criterion: typing `echo hello | cat > out.txt` writes `hello\n` to a virtual filesystem; a follow-up `cat out.txt` echoes it back."

**Source**: `spec.md` §10 R2, §11 Phase 0; `backlog.md` item #2.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Reproduce the pipes proof in a fresh browser (Priority: P1)

The author opens the Spike B page, sees an xterm.js prompt, types
`echo hello | cat > out.txt`, presses Enter, and gets a fresh prompt
back with no error. They then type `cat out.txt` and see `hello`
echoed back. The page's PASS banner lights up because both the
pipeline and the redirect produced the expected effect on the virtual
filesystem.

**Why this priority**: This is the only user story. The spike's
deliverable is "yes, we can build a usable shell with pipes and
redirection on top of plain browser APIs and xterm.js" or "no,
streaming pipes don't work cleanly and the v1 terminal must drop
them". Either outcome closes a Phase 0 risk before E1 starts.

**Independent Test**: Open the spike page in latest Chrome / Firefox;
type `echo hello | cat > out.txt`; type `cat out.txt`; observe the
expected `hello` output and the PASS banner. The page is the test
artefact; the manual reproduction is what closes the spike.

**Acceptance Scenarios**:

1. **Given** the spike page is loaded and the terminal prompt is
   visible, **When** the user types `echo hello | cat > out.txt` and
   presses Enter, **Then** the prompt returns with no error message
   and the virtual FS contains a file at the workspace path
   `out.txt` whose contents are exactly `hello\n` (UTF-8).
2. **Given** the previous step completed, **When** the user types
   `cat out.txt` and presses Enter, **Then** the terminal renders
   `hello` followed by a newline and a fresh prompt.
3. **Given** the spike page is loaded fresh (no prior commands run),
   **When** the user types `echo hi | cat`, **Then** the terminal
   renders `hi` and a fresh prompt — pipes work without redirection.
4. **Given** any failure in the spike's automated self-check (the
   PASS/FAIL banner exposed by the page), **When** the page finishes
   running its self-check, **Then** the FAIL state is visible on the
   page along with which assertion failed and why.
5. **Given** an attempt to use a feature deliberately out of scope
   (e.g. `&&`, `;`, `$VAR`, subshells, globs), **When** the user
   types it, **Then** the shell rejects it with a clear,
   one-line message naming what was rejected and why, and the
   prompt returns.

### Edge Cases

- An unknown command (e.g. `frobnicate`) prints a clear
  "command not found: frobnicate" message and returns exit-code != 0.
- Reading a nonexistent file via `cat missing.txt` prints a clear
  "no such file" message; pipelines including such a stage propagate
  the failure (the writer of the redirect either creates an empty
  file, or does not create one, but the behaviour is documented).
- Ctrl+C while no command is running clears the current input line.
  Mid-command Ctrl+C is **not** in scope (cancellation belongs to
  E1 item #31, contingent on Measurement C).
- Quoting and escapes: `echo "hello world"` prints `hello world`;
  `echo 'a|b'` prints `a|b` (no parsing as pipe). Backslash-escapes
  outside quotes (e.g. `echo a\ b`) are tokeniser-level and tested.
- Whitespace and empty pipeline stages (e.g. `echo hi |`) are
  rejected at parse time with a clear message; they do not crash
  the shell.
- Very large stdin: outside the spike's scope; pipes are buffered,
  not unbounded streamed, and the spike caps any single buffer at
  ~1 MiB to keep the prototype safe in a research context.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The spike MUST be a single static page (no backend, no
  build-step) loadable from a static host. Build-step-free is the
  same constraint as Spike A — the spike must be runnable via
  `python3 -m http.server` from inside its own directory.
- **FR-002**: The page MUST host an `xterm.js` terminal whose
  pinned version is recorded on the page and in
  `docs/architecture.md` (Constitution Principle VI).
- **FR-003**: The shell MUST support a `tokeniser → parser →
  executor` pipeline with these features and **only** these:
  - Builtins: `echo`, `cat` (and `ls` and `pwd` if cheap; otherwise
    deferred). No external commands.
  - Redirection: `>` (truncate-write) only. `>>`, `<`, `2>`, `&>` are
    explicitly out of scope.
  - Pipelines: `cmd1 | cmd2 | … | cmdN` where each stage is a
    builtin. Stages run serialised with full-stage buffering — the
    output of stage *i* is fully materialised before stage *i+1*
    starts (per `spec.md` §6 decision #4).
  - Quoting: single quotes, double quotes, and backslash escapes
    outside quotes (decision-level requirement; matches `spec.md` §6
    intent for v1).
- **FR-004**: The shell MUST reject all of `&&`, `||`, `;`, `&`, `(`,
  `)`, `$(`, `${`, `<`, `>>`, `*`, `?`, `~`, and tab completion at
  parse time with a one-line message; it MUST NOT silently strip
  them (Constitution Principle VII — surfacing the absence is part
  of the deliverable).
- **FR-005**: The virtual FS MUST be a single in-memory store keyed
  by absolute path strings, holding `Uint8Array` payloads. Workspace
  root is `/workspace`; the prompt's working directory starts at
  `/workspace`. The store survives only for the page lifetime.
- **FR-006**: Pipe stage I/O MUST be modelled as async iterables (or
  equivalent) so that:
  - A producer can yield chunks at its own pace.
  - The executor materialises one stage's output and feeds it as the
    next stage's input.
  - The pass criterion `echo hello | cat > out.txt` results in
    `out.txt` containing exactly `hello\n`.
- **FR-007**: The page MUST present a **PASS / FAIL banner** that
  reflects an automated self-check it runs at load. The self-check
  drives the shell programmatically (without human keystrokes) and
  asserts:
  1. After `echo hello | cat > out.txt`, the FS contains
     `/workspace/out.txt` with bytes `hello\n`.
  2. After `cat out.txt`, the terminal output ends with `hello\n`.
  3. After `echo a | cat | cat`, the terminal output ends with
     `a\n` (multi-stage pipeline works).
  4. Typing `echo a && echo b` is rejected with a clear,
     non-crashing error.
- **FR-008**: The terminal interaction MUST permit a human to type
  the pass-criterion sequence after the self-check completes
  (terminal remains live; commands continue to work). This is the
  reproducibility hand-off to a reader.
- **FR-009**: The page MUST display the pinned `xterm.js` version
  and any addon versions (e.g. `xterm-addon-fit`) in a "Versions"
  block.
- **FR-010**: Sharp edges encountered during the spike (e.g.
  xterm-fit oddities, character-encoding gotchas, what's deferred
  from POSIX shell semantics) MUST be added to
  `docs/limitations.md` in the same change (Constitution
  Principle VII).
- **FR-011**: The recorded outcome — pinned versions, PASS/FAIL of
  each self-check assertion, and any sharp edges — MUST be captured
  in `docs/architecture.md` Phase 0 / Spike B section. The recorded
  outcome IS the deliverable, not the page itself.
- **FR-012**: The shell MUST NOT make any network calls beyond the
  pinned `xterm.js` CDN assets. No telemetry. (Constitution
  Principle IV.)

### Key Entities

- **Shell line**: a string the user typed, before tokenisation.
- **Token stream**: words and operators (`|`, `>`) produced by the
  tokeniser, with quoting/escapes resolved.
- **Pipeline AST**: an ordered list of `Command` nodes (one per pipe
  stage) plus an optional final `Redirect` node attached to the last
  command.
- **Command stage**: name + argv, producing an async iterable of
  `Uint8Array` chunks on stdout, plus a numeric exit-code.
- **Virtual FS entry**: `{ path: string, data: Uint8Array }` keyed
  by path in a `Map`. No directories; "directories" are inferred
  from key prefixes.
- **Run Record**: the captured PASS/FAIL outcome plus the
  per-assertion details and the pinned versions; copied into
  `docs/architecture.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader opens the page in latest Chrome from a
  cleared cache and reaches a PASS banner in under 30 seconds
  without opening devtools (the spike does no heavy install — most
  of the time is xterm.js paint).
- **SC-002**: The same reader reproduces PASS in latest Firefox
  without code changes.
- **SC-003**: The recorded `docs/architecture.md` Spike B entry
  contains: pinned `xterm.js` version, PASS/FAIL of each of the
  four self-check assertions on each browser, and a one-line
  go/no-go statement for proceeding to E1.
- **SC-004**: A FAIL state in the self-check is as legible as a
  PASS — the reader sees which assertion failed and which line of
  output diverged.
- **SC-005**: All sharp edges encountered are present in
  `docs/limitations.md` after the spike merges.

## Assumptions

- The author runs the spike on a developer-class machine. Mobile
  layout and slow-network behaviour are out of scope (spec §10 R8).
- "Latest Chrome" and "latest Firefox" follow the constitution's
  "latest 2 versions" support window.
- The spike is intentionally throwaway in code-quality terms
  (Constitution Principle I). The mini-shell that ships in E1
  (items #21–#26) will be re-implemented against the proper app
  structure. Anything worth carrying forward gets re-done there.
- "Serialised + buffered pipes" is acceptable per `spec.md` §6
  decision #4. True streaming with backpressure is out of scope for
  v1.
- The 1 MiB-per-buffer cap in the spike is a research-mode safety
  belt only; it is not a v1 product limit.
- POSIX-compliance is not a goal. The mini-shell is a tiny domain
  language that *resembles* a Unix shell enough to be teachable in
  the lessons (E2). Its rejected-feature list is part of the
  curriculum.

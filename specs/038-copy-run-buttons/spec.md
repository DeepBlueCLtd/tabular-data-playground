# Feature Specification: Copy + Run buttons on bash code blocks

**Feature Branch**: `claude/epic-e2-qp0Tr` (epic E2)
**Created**: 2026-05-08
**Status**: Draft
**Backlog ID**: #39
**Input**: Copy + Run buttons on bash code blocks — `<code>` renderer override on react-markdown injects an action bar; Run uses terminal's public API to write the command and trigger execution (decision #1, `spec.md` §7).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — One-click run from a lesson (Priority: P1)

A learner reads a lesson, sees a `bash` code block, and clicks **Run**.
The command is written into the terminal as if they had typed it (so
they can see what ran), executes, and the output appears below — no
copy-paste, no typo risk, no context switch.

**Why this priority**: This is the headline interaction of the
curriculum. Every lesson has multiple `frictionless …` invocations;
making each a one-click Run is the difference between a tutorial and
a worksheet.

**Independent test**: Open a lesson with a `bash` block containing
`frictionless --version`, click **Run**, confirm the terminal shows
the typed command, runs it, and prints the version.

**Acceptance Scenarios**:

1. **Given** a lesson is open with a `bash` code block, **When** the
   user clicks the **Run** button on that block, **Then** the
   terminal's display shows the command as if typed (with prompt and
   newline), and the command's stdout/stderr appear underneath.
2. **Given** the terminal already has user-typed text on the current
   line, **When** the user clicks **Run**, **Then** the terminal
   writes a fresh prompt + command on a new line; the user's
   in-progress text is preserved (not lost) — best-effort behaviour
   is acceptable, see Edge Cases.
3. **Given** the lesson body has multiple `bash` blocks in sequence,
   **When** the user clicks **Run** on one, then **Run** on another
   *after the first finishes*, **Then** both run in order; the second
   click is gated until the first completes (terminal's existing
   busy semantics — formal disabled state belongs to #40).

### User Story 2 — Copy-to-clipboard works regardless of runtime state (Priority: P1)

A learner clicks **Copy** on a `bash` block. The full command text is
on the clipboard. **Copy** works even before Pyodide finishes loading
(the clipboard API has no Pyodide dependency).

**Why this priority**: Copy is the fallback when Run is disabled
(slow start, runtime error, user wants to paste elsewhere).

**Independent test**: Before Pyodide is ready, click **Copy**; verify
clipboard contains the exact command body (no leading/trailing
prompt characters, no language-tag text).

**Acceptance Scenarios**:

1. **Given** Pyodide is still loading, **When** the user clicks
   **Copy**, **Then** the command is on the clipboard.
2. **Given** the user clicks **Copy**, **When** they paste,
   **Then** they see the literal command string with no extra
   characters.
3. **Given** the lesson has a multi-line `bash` block, **When**
   **Copy** is clicked, **Then** all lines are copied joined by `\n`.

### User Story 3 — Only `bash` blocks get the action bar (Priority: P2)

`json`, `python`, `yaml`, `csv`, plain code-blocks: no action bar. The
buttons are specifically for shell commands (`spec.md` §7).

**Why this priority**: P2 because the wrong outcome (action bar on
`json`) is mildly silly but not destructive.

**Acceptance Scenarios**:

1. **Given** a lesson contains a `python` code block, **When** the
   block is rendered, **Then** no Copy/Run bar is shown.
2. **Given** a `bash` block, **When** rendered, **Then** Copy and
   Run buttons appear above the block.

### Edge Cases

- **Run clicked while no command is currently in flight, but
  the terminal has user-typed text**: the running command is
  written on a new line; what happens to the in-progress text is
  best-effort (acceptable to lose; the Run command takes precedence).
  The disabled-state logic for "command in flight" lives in #40.
- **Run clicked while Pyodide hasn't finished loading**: button is
  disabled (formal disabled-state machine in #40; for #39, the
  Run handler short-circuits if the submit API isn't registered).
- **Clipboard write fails** (older browser, permission denied):
  surface a small inline error near the Copy button; don't crash.
- **`bash` block contains very long content (>10 KB)**: copy still
  works; for Run, the terminal accepts the full string but may
  visually truncate. This is the terminal's behaviour, not this
  item's concern.
- **`bash` block contains a `\n` newline mid-command**: the spec's
  mini-shell does not support multi-line commands (no continuation
  via `\`), so a newline ends the command. Run submits each line
  separately — but #39 keeps it simple: submit the entire block as
  one string and let the terminal's line discipline handle it. If
  this proves brittle in lesson authoring, document the constraint
  in `docs/limitations.md`.

## Requirements *(mandatory)*

### Functional Requirements

#### Where the buttons appear

- **FR-001**: The renderer MUST inject a horizontal action bar above
  every fenced code block whose language tag is exactly `bash`.
- **FR-002**: Code blocks tagged with any other language — including
  no tag — MUST NOT show the action bar.
- **FR-003**: The action bar MUST contain at minimum a **Copy**
  button and a **Run** button, in that order.

#### Copy

- **FR-004**: Clicking **Copy** MUST write the full code-block source
  (without prompt, language tag, or trailing newline) to the system
  clipboard via `navigator.clipboard.writeText`.
- **FR-005**: After a successful copy, the **Copy** button MUST
  briefly indicate success (e.g., visual swap to "Copied" for ~1 s),
  then return to "Copy".
- **FR-006**: If clipboard write fails (permission denied, older
  browser), the button MUST surface a brief inline error.

#### Run

- **FR-007**: Clicking **Run** MUST submit the code-block source as a
  single command line to the terminal's external submit API.
- **FR-008**: Submitting MUST cause the terminal to (a) display the
  command as a typed line (prompt + command + newline), and
  (b) execute it.
- **FR-009**: If the terminal's submit API is not registered (terminal
  not yet mounted, or Pyodide not yet ready), the **Run** button MUST
  be disabled. The user MAY still **Copy** in that state.
- **FR-010**: This item does NOT implement the in-flight or
  most-recently-clicked states — that is #40's surface. #39 leaves
  hooks (e.g., a `useTerminalSubmit()` returning `null` while
  unavailable) for #40 to layer on.

#### Pyodide-independence boundary

- **FR-011**: The Copy button MUST NOT depend on Pyodide.
- **FR-012**: The Run button MUST NOT itself import from
  `@/pyodide/*` (the existing ESLint rule under `app/src/lessons/**`
  enforces this); it depends on the terminal-submit store, which is
  in its own module under `app/src/terminal/`.

### Key Entities

- **Code-block source**: The text content of a fenced ```` ```bash ```` block.
- **Terminal submit API**: A module-level callback `(line: string) =>
  Promise<void>` registered by the terminal panel when ready and
  cleared on unmount. Consumers read it via a hook.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After clicking **Run** on a `bash` block, the
  terminal's display contains a new line that **starts with** the
  command text (the prompt prefix is the terminal's responsibility).
- **SC-002**: Clipboard text after **Copy** equals the code-block
  source byte-for-byte (no surrounding whitespace, no markdown
  fence markers, no language tag).
- **SC-003**: Non-bash code blocks (json/python/yaml/csv/unknown)
  render with no action bar — verifiable by selecting any
  `code:not(.language-bash)` and asserting it has no
  `[data-lesson-code-actions]` sibling.
- **SC-004**: With Pyodide artificially delayed, **Copy** still works
  and **Run** is visibly disabled.

## Assumptions

- The lesson loader (#38) already exposes `LessonCodeBlock`'s
  `renderActions(lang, source)` slot. This item provides the
  implementation that gets passed in.
- The terminal panel exists from E1 and will register a submit API
  when ready; this item adds the registration plumbing.
- Most-recently-clicked visual marking and busy-state disable both
  belong to #40, not here.
- One-line bash commands are the dominant case; multi-line bash
  blocks (rare in v1's curriculum) are submitted as-is and the
  terminal handles them.

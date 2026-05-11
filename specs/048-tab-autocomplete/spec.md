# Feature Specification: Terminal Tab Autocomplete

**Feature Branch**: `claude/add-terminal-autocomplete-WtkM7`
**Created**: 2026-05-11
**Status**: Draft
**Input**: User description: "it would be useful to have tab-autocomplete in the terminal, both for completing commands and for providing existing folder or file names. Hopefully there's a utility that can provide this."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete a command name (Priority: P1)

A learner is typing a command in the in-browser terminal and cannot
remember the exact name. They type the first few letters and press
Tab. The terminal expands the partial word to the full command name
if there is exactly one matching command, or to the longest shared
prefix if several commands match. A second Tab press while still
ambiguous prints the candidate list and redraws the prompt with what
they had typed so they can continue.

**Why this priority**: This is the most-used form of completion in
any shell and removes the largest source of typing friction —
remembering command names — which directly serves the lessons'
"paste a CSV, run a command" loop.

**Independent Test**: Open the terminal, type `e` and press Tab —
the line should expand to `echo `. Type `c` and press Tab twice —
the candidate list (`cat`, `cd`) prints and the prompt redraws with
`c` still in the editor.

**Acceptance Scenarios**:

1. **Given** an empty prompt, **When** the user types `ec` and
   presses Tab, **Then** the line becomes `echo ` (single match,
   trailing space appended).
2. **Given** an empty prompt, **When** the user types `c` and
   presses Tab once, **Then** the line becomes `ca` (longest common
   prefix of `cat` and `cd` is `c`, but if more commands start with
   `c` the prefix is whatever they all share; bell rings).
3. **Given** an ambiguous first-token completion, **When** the user
   presses Tab a second time without typing in between, **Then** the
   terminal prints the candidate list one per line (or
   space-separated), writes a fresh prompt, and rewrites the
   in-progress line with the cursor at the same position.

---

### User Story 2 - Complete a file or folder name (Priority: P1)

A learner has `cd`'d into a lesson folder and wants to `cat` a CSV
without typing its full name. They type `cat ti` and press Tab. The
terminal completes the filename from the virtual filesystem against
the current working directory.

**Why this priority**: Lessons are organised around files in the
VFS; completing file names is the second-most-common autocomplete
need. Without it, every `cat` / `frictionless` invocation requires
exact spelling, which slows lessons and produces avoidable
typo-driven errors.

**Independent Test**: With `/workspace/lessons/01-describe/titanic.csv`
in the VFS and the cwd set to `/workspace/lessons/01-describe`,
type `cat ti` then Tab — the line becomes `cat titanic.csv `.

**Acceptance Scenarios**:

1. **Given** cwd `/workspace/lessons/01-describe` containing
   `titanic.csv`, **When** the user types `cat ti` and presses
   Tab, **Then** the line becomes `cat titanic.csv ` (trailing
   space because the entry is a file).
2. **Given** cwd `/workspace` containing only the directory
   `lessons`, **When** the user types `cd les` and presses Tab,
   **Then** the line becomes `cd lessons/` (trailing slash because
   the entry is a directory; no trailing space).
3. **Given** cwd `/workspace/lessons` containing `01-describe/`
   and `02-validate/`, **When** the user types `cd 0` and presses
   Tab, **Then** the line becomes `cd 0` (no expansion because the
   common prefix is `0`) and the bell rings; pressing Tab again
   prints both candidates.
4. **Given** the user has typed a path with a directory prefix
   such as `cat lessons/01-describe/ti`, **When** they press Tab,
   **Then** completion happens against the directory
   `lessons/01-describe` (relative to cwd) and the line becomes
   `cat lessons/01-describe/titanic.csv `.

---

### User Story 3 - Complete mid-line without disturbing the tail (Priority: P2)

A learner has typed `cat  | head` and realised they forgot the
filename. They move the cursor between the two spaces after `cat`
and press Tab. The terminal completes against the empty token at
the cursor and inserts the result without disturbing the trailing
` | head`.

**Why this priority**: This is a quality-of-life refinement that
matches real-shell behaviour and avoids surprising users who edit
their command line. Important enough to be in the first release
because failing it (e.g. wiping the tail) would be a regression
relative to current line-editor behaviour.

**Independent Test**: Type `cat  | head`, move the cursor to the
position between the two spaces after `cat`, press Tab — if only
one file exists, that filename should be inserted at the cursor
and the tail ` | head` should remain after it.

**Acceptance Scenarios**:

1. **Given** the line `cat  | head` with the cursor positioned
   between the two spaces (column 5), **When** the user presses
   Tab and exactly one filename matches the empty token,
   **Then** that filename is inserted at the cursor, the cursor
   advances past it, and the trailing ` | head` is preserved.
2. **Given** any line, **When** the user presses Tab while a
   previous command is still running (terminal busy), **Then**
   nothing happens — no expansion, no candidate list, no bell.

---

### Edge Cases

- Empty token on first position (user pressed Tab with no input):
  treat as ambiguous — first Tab does nothing audible, second Tab
  lists all available commands.
- Empty token on a later position (user pressed Tab right after a
  space): complete against the current working directory's
  entries.
- Path with no directory part (e.g. `cat ti`): complete against
  the cwd.
- Path whose directory part does not exist (e.g. `cat foo/ba`
  where `foo/` does not exist): no candidates, ring the bell, do
  nothing.
- Token contains a leading slash (absolute path): complete against
  the absolute directory; if it resolves outside `/workspace`,
  treat as no candidates.
- Token contains shell-special characters (quotes, backslashes,
  pipes): out of scope for this feature; complete only when the
  token is a plain word (matches the mini-shell tokeniser's
  unquoted word rule).
- Candidate list contains many entries (≥ a screen of output):
  print as-is; pagination is out of scope.
- Tab pressed at the very start of the line with no characters
  typed: same as "empty token on first position" — second Tab
  lists every command.
- Token already matches an entry exactly (e.g. `cat titanic.csv`
  + Tab): single match completes by appending the trailing space
  / slash if not already present.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The terminal MUST treat the ASCII Tab character
  (`\t`, 0x09) as a request to autocomplete the token under the
  cursor.
- **FR-002**: When the cursor is in the first token of the
  current line (no unquoted whitespace precedes it), candidates
  MUST be the set of available shell command names. The set
  includes (a) every mini-shell builtin and (b) every Pyodide-
  backed command registered with the executor.
- **FR-003**: When the cursor is in any later token, candidates
  MUST be the entries of the virtual filesystem directory that
  the token's directory part resolves to. If the token has no
  directory part, candidates come from the current working
  directory.
- **FR-004**: When the cursor is in any later token, candidates
  MUST be filtered to entries whose name begins with the token's
  basename (case-sensitive match, consistent with the rest of the
  shell).
- **FR-005**: When there is exactly one matching candidate, the
  token under the cursor MUST be replaced with that candidate's
  full name. If the candidate is a directory, a trailing `/`
  MUST be appended. Otherwise, a trailing single space MUST be
  appended — unless the next character is already a space, in
  which case no space is added.
- **FR-006**: When there are multiple matching candidates, the
  token under the cursor MUST be replaced with the longest
  common prefix of all candidates' names (the bell character
  `\a` MUST be emitted at the same time as a discoverability
  cue). If the longest common prefix is identical to what the
  user already typed, no replacement happens but the bell still
  rings.
- **FR-007**: When the user presses Tab a second time
  consecutively (no other input between the two presses) while
  the candidate set still has more than one entry, the terminal
  MUST print the candidate list on a new line, then write a
  fresh prompt followed by the current line, with the cursor
  restored to the same logical position within the line.
- **FR-008**: When there are zero matching candidates, the
  terminal MUST ring the bell and make no other change.
- **FR-009**: Completion MUST respect the cursor position: only
  the token that contains the cursor is changed; text before
  and after that token in the line MUST be preserved exactly.
- **FR-010**: When the terminal is busy (a command is running),
  the Tab key MUST be ignored entirely — no expansion, no
  candidate list, no bell.
- **FR-011**: Tab handling MUST NOT interfere with the existing
  line-editor history navigation (Up/Down) or cursor movement
  (Left/Right/Home/End): the completed line MUST become the new
  active line for these operations.
- **FR-012**: The candidate list printed for ambiguous matches
  MUST display directories with a trailing `/` so the user can
  distinguish them from files at a glance.
- **FR-013**: When the token contains a directory part (e.g.
  `lessons/01-`), only the basename portion MUST be replaced;
  the directory part MUST remain unchanged.
- **FR-014**: The product specification MUST be amended:
  `spec.md` §10's "Rejected for v1" line currently lists tab
  completion as out of scope; that exclusion MUST be removed
  and the feature recorded as in scope, with a short note that
  it was added in a later iteration.

### Key Entities

- **Candidate**: An item that could complete the current token.
  Has a name (string) and a kind (`command`, `file`, or
  `directory`). The kind drives the trailing character (space
  vs. slash) and the suffix shown in the candidate list.
- **Token-under-cursor**: The substring of the current line,
  delimited by unquoted whitespace, that contains the cursor.
  Its start, end, basename, and directory-part are the inputs
  to completion.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can complete every command name used in
  the eight v1 lessons (`echo`, `pwd`, `cd`, `ls`, `cat`,
  `mkdir`, `rm`, plus any registered Pyodide commands) by
  typing at most the first letter and pressing Tab — verified by
  a unit test enumerating every command and checking
  uniqueness-after-one-letter where it applies.
- **SC-002**: For each of the eight v1 lessons, every filename
  referenced in the lesson markdown can be completed from inside
  its lesson folder with at most three typed characters before
  Tab — verified by an automated walkthrough test.
- **SC-003**: Pressing Tab in a busy terminal has zero observable
  effect: no character appears, no command line changes, no bell
  sounds — verified by an end-to-end test that runs a slow
  command and presses Tab repeatedly.
- **SC-004**: Mid-line Tab completion never modifies characters
  outside the token under the cursor — verified by a unit test
  that runs a fuzzed set of (line, cursor) pairs and asserts the
  prefix-before-token and suffix-after-token are byte-identical
  before and after.

## Assumptions

- The set of "shell command names" is exactly: every key of
  `BUILTINS` in `app/src/mini-shell/builtins.ts`, plus the names
  of any Pyodide-backed commands registered with the executor.
  No external `$PATH` lookup exists in this environment, and
  none is being introduced.
- File/folder completion is against the VFS only. No completion
  against host filesystem, lesson catalogue, or in-memory editor
  buffers.
- Case sensitivity for matching mirrors the rest of the shell
  (case-sensitive), to avoid surprising users who already rely
  on case-sensitive `cat`/`cd` arguments.
- Only "word" tokens (no quotes, no escapes) are completed in
  v1. A token that contains a quote character is treated as
  having no candidates — keeps the scope small and matches the
  mini-shell tokeniser's quoting rules.
- Tab in an empty first position completing to "every command"
  is acceptable noise; lessons don't depend on suppressing it.
- The bell character is the existing audible/visible bell that
  xterm.js emits by default; no new bell-handling configuration
  is introduced.
- This feature does not alter parser or executor behaviour; it
  is purely a line-editor extension that runs before the line
  is submitted.

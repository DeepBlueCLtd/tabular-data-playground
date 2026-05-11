# Implementation Plan: Terminal Tab Autocomplete

**Branch**: `claude/add-terminal-autocomplete-WtkM7` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/048-tab-autocomplete/spec.md`

## Summary

Add Tab-key autocomplete to the in-browser xterm.js terminal. First-token
completion enumerates the mini-shell command set (builtins + the two
hard-coded externals `frictionless` and `python`); later-token completion
reads VFS entries for the directory that the token's directory-part
resolves to (cwd if no directory-part). Single match → expand and append
`/` (dirs) or ` ` (files/commands); multiple matches → expand to the
longest common prefix and ring the bell; double-Tab while ambiguous prints
the candidate list and redraws the prompt with the in-progress line.

Implementation is contained to two layers: a new pure completion module
(`app/src/mini-shell/complete.ts`) that takes `(line, cursor, cwd, vfs,
commandNames) → CompletionResult`, and a `complete` callback wired from
`useShellRunner` (which already owns `cwd` and `vfs`) down to `TerminalView`
as a new prop. The terminal handler intercepts `\t` in `handleData`, calls
the callback, and rewrites the line via the same `LineEditor` machinery
that handles other edits.

## Technical Context

**Language/Version**: TypeScript 5.x (matches existing `app/tsconfig.json`)
**Primary Dependencies**: existing only — `@xterm/xterm` for the terminal, the in-repo `Vfs` interface, `BUILTINS` from `app/src/mini-shell/builtins.ts`. No new external deps.
**Storage**: N/A — completion reads VFS at call time; no persistent state.
**Testing**: `tsc --noEmit` (existing `pnpm test`) for type-check; Playwright e2e (`app/e2e/`) for behavioural coverage. The constitution lists Vitest for unit tests, but Vitest is not yet installed; this feature does not introduce it. See research §R3.
**Target Platform**: latest-2 Chrome/Firefox/Safari/Edge (constitution §Technology Constraints); CI runs Chromium-only Playwright.
**Project Type**: in-browser SPA (Vite + React 18), single project under `app/`.
**Performance Goals**: Tab keystroke → completion applied within one animation frame (≤16 ms) on the standard demo machine. VFS `readdir` is in-memory, so this is comfortably achievable.
**Constraints**: no backend; no new runtime dependencies; must work while Pyodide is still loading (command name list is static, doesn't depend on Pyodide readiness); must be a no-op while the terminal is busy.
**Scale/Scope**: target VFS directory ≤ ~50 entries (lesson folders); no pagination needed. Total feature ≈ 200 LoC implementation + ≈150 LoC tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Research-first** — *justified, see Complexity Tracking.* This is a
   usability affordance, not a Frictionless evaluation. It serves
   evaluation indirectly by reducing typing friction in the lessons that
   *do* evaluate Frictionless.
2. **Notes-section** — N/A. Not a lesson.
3. **Destruction** — ✅ pass. No flow overwrites or deletes content.
   Completion only reads.
4. **Backend** — ✅ pass. Pure in-browser; no network, no accounts, no
   telemetry.
5. **Pinning** — ✅ pass. No new external dependencies; uses existing
   xterm.js and in-repo VFS.
6. **Limitations** — ✅ pass *with action*. Two new sharp edges land in
   `docs/limitations.md` as part of this change: (a) quoted/escaped
   tokens are not completed in v1, (b) the audible bell on
   no-match/ambiguity is silent in default xterm.js configuration, so
   failure feedback is the absence of expansion rather than a sound.

**Re-evaluation after Phase 1**: gates above remain unchanged. The design
adds no new dependencies and no new destructive flows.

## Project Structure

### Documentation (this feature)

```text
specs/048-tab-autocomplete/
├── plan.md              # This file
├── research.md          # Phase 0 — design decisions
├── data-model.md        # Phase 1 — completion types
├── quickstart.md        # Phase 1 — manual verification recipe
└── tasks.md             # Phase 2 — created by /speckit-tasks
```

No `contracts/` directory: this feature exposes no external interface
(no HTTP API, no CLI surface, no public package boundary). The
`complete` callback is an internal prop type, captured in `data-model.md`.

### Source Code (repository root)

```text
app/
├── src/
│   ├── mini-shell/
│   │   ├── builtins.ts                # existing — source of builtin names
│   │   ├── execute.ts                 # existing — patched to export EXTERNAL_COMMANDS
│   │   ├── complete.ts                # NEW — pure completion logic
│   │   ├── parse.ts                   # existing — unchanged
│   │   ├── path-util.ts               # existing — reused for cwd resolution
│   │   ├── shell-runner.tsx           # existing — patched to expose complete callback
│   │   └── tokenise.ts                # existing — reused for word boundary rules
│   └── terminal/
│       ├── line-editor.ts             # existing — unchanged
│       └── terminal.tsx               # existing — patched to handle \t
└── e2e/
    └── terminal-autocomplete.spec.ts  # NEW — Playwright e2e
```

**Structure Decision**: single-project (Option 1). Code lives in the
existing `app/src/{mini-shell,terminal}` modules; no new top-level
directories. The completion module sits in `mini-shell/` because its
logic is shell-aware (knows command names, word boundaries, path
resolution) — putting it under `terminal/` would couple the dumb
terminal layer to mini-shell semantics.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| **Gate 1 (Research-first) borderline** | Tab completion does not directly evaluate Frictionless. It does reduce typing friction in every lesson that demonstrates Frictionless, so it serves evaluation indirectly. | Building a Frictionless-flavoured completion (e.g., `frictionless describe <Tab>` knows about table schemas) would over-engineer for one demo. Generic file/command completion is the standard shell behaviour learners expect. |

## Phase 0 — Research

Output: `research.md`. Key decisions captured below; full rationale in
that file.

- **R1 — Command source of truth.** Decision: export a new constant
  `EXTERNAL_COMMANDS = ['frictionless', 'python']` from
  `app/src/mini-shell/execute.ts` and refactor `runStage` to check
  membership in that array instead of hard-coded string equality. The
  completer imports both `Object.keys(BUILTINS)` and `EXTERNAL_COMMANDS`.
  Rationale: prevents the completer from drifting out of sync with the
  executor's accepted commands. Alternative rejected: duplicate the list
  inside `complete.ts`.

- **R2 — Bell behaviour.** Decision: emit `\a` (0x07) on no-match,
  longest-common-prefix expansion, and double-Tab — but don't change
  xterm.js's default `bellStyle`. The terminal therefore stays silent;
  the bell character is sent as a deliberate signal for future
  configuration without committing to a sound now. Logged in
  `docs/limitations.md`. Alternative rejected: enabling
  `bellStyle: 'sound'` adds an audio asset and is intrusive in a
  classroom setting.

- **R3 — Testing approach.** Decision: pure-function tests are written
  as Playwright e2e against the real terminal, plus type-level
  enforcement via `tsc --noEmit`. The completion module is designed
  pure so it *could* be unit-tested when Vitest lands, but this
  feature does not introduce Vitest. Alternative rejected: adding
  Vitest just for this feature is a pinning/lockfile change for one
  capability; constitution permits it (it's already in the slot) but
  it's gratuitous for ≈200 LoC.

- **R4 — Word-boundary rule.** Decision: the completer splits the
  line on **unquoted whitespace** (space + tab), matching the
  mini-shell tokeniser's notion of word boundaries. A token
  containing any quote character (`'`, `"`) or backslash is treated
  as "not completable" — return `{kind: 'none', bell: true}`. This
  matches spec FR scope and the Edge Cases list. Alternative
  rejected: implementing quoted-token completion adds tokeniser
  coupling that the lessons do not need.

- **R5 — Mid-line completion semantics.** Decision: the token under
  the cursor is the substring delimited by unquoted whitespace that
  *contains* the cursor (inclusive at both ends, so a cursor on a
  trailing space completes the next, empty token). The completion
  replaces only that substring; characters before and after are
  byte-preserved. Alternative rejected: completing only the
  "current word so far" up to cursor (ignoring text right of cursor
  within the same token) — rejected because it surprises users who
  position the cursor mid-token.

- **R6 — VFS readdir and trailing-slash detection.** Decision: call
  `vfs.readdir(dir)`, which already returns entries with `kind`
  (`file` or `dir`). The completer uses `kind === 'dir'` to choose
  the `/` suffix vs space suffix. No new VFS API needed.

- **R7 — Plumbing the completion callback.** Decision: add an
  `onComplete?: (line, cursor) => Promise<CompletionResult>` prop on
  `<TerminalView>`. `useShellRunner` builds and returns it alongside
  the existing `runLine`. `terminal.tsx` calls it on `\t` and applies
  the result via the existing `LineEditor` API + a new
  `rewriteLine`-style helper. Alternative rejected: a global
  store/context for cwd; needlessly couples two co-located
  components.

## Phase 1 — Design

### Data model

See `data-model.md`. Summary of the new types in `complete.ts`:

```ts
export type CompletionKind = 'command' | 'file' | 'dir';

export interface Candidate {
  name: string;
  kind: CompletionKind;
}

export type CompletionResult =
  | { kind: 'unique'; insertStart: number; insertEnd: number; insert: string; newCursor: number }
  | { kind: 'prefix'; insertStart: number; insertEnd: number; insert: string; newCursor: number; bell: true }
  | { kind: 'list'; insertStart: number; insertEnd: number; insert: string; newCursor: number; candidates: Candidate[]; bell: true }
  | { kind: 'none'; bell: true };

export interface CompleteInput {
  line: string;
  cursor: number;
  cwd: string;
  vfs: Vfs;
  commandNames: readonly string[]; // BUILTINS keys ∪ EXTERNAL_COMMANDS
  /** True if this is the second consecutive Tab on the same (line,cursor). */
  doubleTab: boolean;
}

export function complete(input: CompleteInput): Promise<CompletionResult>;
```

The terminal layer owns "is this a double-Tab?" tracking — it records
the (line, cursor) snapshot at the moment of the previous Tab and
clears it on any other input.

### Interfaces / contracts

No external contracts. Internal API surface:

- New exports from `app/src/mini-shell/execute.ts`:
  - `EXTERNAL_COMMANDS: readonly ['frictionless', 'python']`
- New module `app/src/mini-shell/complete.ts`:
  - `complete()` function and types above
- New prop on `<TerminalView>`:
  - `onComplete?: (line: string, cursor: number, doubleTab: boolean) => Promise<CompletionResult>`

### Quickstart

See `quickstart.md`. The manual verification recipe is:

1. `pnpm --filter app dev`, open the terminal panel.
2. Type `e`, press Tab → expects `echo `.
3. Type `c`, press Tab → expects `ca` (longest common prefix of `cat`,
   `cd` — actually `c`, so no expansion, bell rings). Press Tab again
   → expects candidate list, prompt redrawn with `c`.
4. `cd lessons/01-describe`, type `cat ti`, Tab → expects
   `cat titanic.csv `.
5. Type `cd l`, Tab → expects `cd lessons/`.
6. Run `python -c "import time; time.sleep(3)"`, press Tab during
   the wait → expects no effect.
7. Mid-line: type `cat  | head`, cursor between the two spaces, Tab
   → expects insertion at cursor with tail preserved.

### Agent context update

The `<!-- SPECKIT START -->` block in `CLAUDE.md` will be repointed
from `specs/042-lesson-authoring-docs/plan.md` to
`specs/048-tab-autocomplete/plan.md` so downstream `/speckit-tasks`
and `/speckit-implement` runs use this plan as the active reference.

## Phase 2 — Tasks

Generated by `/speckit-tasks`. Not part of this command's output.

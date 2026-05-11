# Research: Terminal Tab Autocomplete

Phase 0 research notes. Each item resolves a "NEEDS CLARIFICATION" or
records a deliberate design choice that the plan and tasks files
reference.

## R1 — Command source of truth

**Decision**: Export a new constant `EXTERNAL_COMMANDS` from
`app/src/mini-shell/execute.ts` and replace the two hard-coded
equality checks in `runStage()` with `EXTERNAL_COMMANDS.includes(head)`.
The completer then computes the full command set as
`[...Object.keys(BUILTINS), ...EXTERNAL_COMMANDS]`.

**Rationale**: `execute.ts:100` (`head === 'frictionless'`) and
`execute.ts:114` (`head === 'python'`) are the executor's
ground-truth allowlist for non-builtin commands. If we duplicated
this list inside `complete.ts`, adding a third external (e.g. a
future `csvkit`) would silently fail to autocomplete. Centralising
the list also gives `execute.ts` a single line to edit when adding
externals.

**Alternatives considered**:

- **Duplicate the list in `complete.ts`**: rejected — drift risk.
- **Introduce a registry pattern (map name → handler)**: rejected
  as over-engineering for two externals in a frozen-at-v1.0
  artefact.

## R2 — Bell behaviour

**Decision**: Emit `\a` (0x07) on no-match, on longest-common-prefix
expansion, and at the start of a double-Tab listing. Do **not**
modify xterm.js's `bellStyle` configuration; default xterm.js
behaviour is no audible/visual bell, so the user perceives the
failure as "no expansion happened". The escape character is sent
so that future configuration (or screen-reader integration) can
react without a code change.

**Rationale**: Adding a sound is intrusive in a classroom/demo
context (constitution Principle V — phased demonstrability — implies
the artefact is presented). The bell character is cheap, semantic,
and conventionally what shells emit.

**Alternatives considered**:

- **Set `bellStyle: 'sound'`**: rejected — needs an audio asset, is
  noisy in a public-demo context, and adds a pinning entry.
- **Flash the terminal background**: rejected — visual gimmick;
  xterm.js doesn't ship this and a custom add-on is out of scope.

**Limitations entry**: `docs/limitations.md` gets a line: "Tab
autocomplete signals failure (no match / ambiguous) by emitting
the ASCII bell character; the default xterm.js bell style is
silent, so failure feedback is the absence of expansion."

## R3 — Testing approach

**Decision**: Cover the feature with Playwright e2e against the
real terminal (`app/e2e/terminal-autocomplete.spec.ts`). Rely on
`tsc --noEmit` (the existing `pnpm test`) for type safety. Write
`complete.ts` as pure functions so unit tests can be added later
without refactoring when/if Vitest lands.

**Rationale**: The repository currently has no unit-test runner
configured (`app/package.json` `"test": "tsc --noEmit"`). Adding
Vitest is a pnpm-lockfile change and a CI configuration change,
which is disproportionate for ≈200 LoC of new code. The
constitution lists Vitest in its Technology Constraints slot, so
adding it is a permitted substitution-within-slot, not an
amendment — but the work is gratuitous for this feature alone.

Playwright already covers the terminal panel (see
`app/e2e/smoke.spec.ts`), so a new spec in that suite is the
path of least resistance and tests the *real* end-to-end Tab
behaviour including xterm.js rendering.

**Alternatives considered**:

- **Add Vitest + write `.test.ts` files next to sources**:
  rejected — extra ceremony for one feature; reconsider on the
  next feature that touches multiple pure modules.
- **Pure-function tests in `app/spikes/`**: rejected — spikes are
  one-off experiments, not regression coverage.

## R4 — Word-boundary rule

**Decision**: The completer treats the current line as a sequence
of tokens separated by **unquoted** whitespace (space or tab,
matching `app/src/mini-shell/tokenise.ts`). The "token under the
cursor" is the maximal whitespace-free substring containing the
cursor position; if the cursor is on whitespace, the token is
empty and begins at the cursor.

A token containing any quote character (`'`, `"`) or backslash
short-circuits to `{kind: 'none', bell: true}` — i.e., no
completion is attempted on quoted/escaped tokens in v1.

**Rationale**: Matches the mini-shell tokeniser's notion of words
without duplicating its quote-handling. The lessons don't use
quoted arguments for filenames (filenames in the lesson catalogue
contain no spaces by convention), so quoted completion is not on
the v1 critical path.

**Alternatives considered**:

- **Reuse `tokenise()` directly**: rejected — `tokenise()` throws
  on unterminated quotes and would force the completer to handle
  the throw; cheaper to detect quote characters at the byte level
  and bail.
- **Implement quote-aware completion**: rejected — out of v1
  scope per spec Edge Cases.

## R5 — Mid-line completion semantics

**Decision**: When the cursor is inside a token, the completer
treats the **entire token** (left of cursor + right of cursor) as
the prefix to match against. The replacement spans `[tokenStart,
tokenEnd)` of the line.

If the user has typed `cat tixxx | head` with the cursor in the
middle of `tixxx`, the prefix is `tixxx` (not `ti`); if zero
candidates match, the bell rings and nothing changes. If exactly
one matches, `tixxx` is replaced with the full filename.

**Rationale**: This matches GNU readline's behaviour and avoids
the surprising case where mid-token Tab silently truncates the
right half of the token.

**Alternatives considered**:

- **Use only the left-of-cursor substring as prefix, leave
  right-of-cursor in place**: rejected — produces garbled results
  like `cat titanic.csvxxx` from `cat tixxx`.
- **Always move cursor to end of token before completing**:
  rejected — surprising side-effect on cursor position.

## R6 — VFS readdir and trailing-slash detection

**Decision**: Use `vfs.readdir(dir)` (already present, returns
`{name, kind}[]`) to enumerate candidates. Suffix selection:

- `kind === 'dir'` → append `/`, do not append space.
- `kind === 'file'` → append a single space, unless the
  character immediately after the replacement is already a space.
- Command (first-token completion) → append a single space with
  the same "skip if already a space" rule.

**Rationale**: The `kind` field is already the executor's
authority for file vs. dir distinction (`cd` rejects non-dir
targets via `st.kind !== 'dir'` in `builtins.ts:48`). No new VFS
API needed.

## R7 — Plumbing the completion callback

**Decision**: Add a new optional prop on `<TerminalView>`:

```ts
onComplete?: (line: string, cursor: number, doubleTab: boolean)
  => Promise<CompletionResult>;
```

`useShellRunner` builds this callback using the cwd ref and the
vfs handle it already owns, and the consumer of `useShellRunner`
passes both `runLine` and `complete` to `<TerminalView>`. The
terminal's `handleData` intercepts `\t` (0x09), tracks
double-Tab state, calls the callback, and applies the result via
a small new helper analogous to `rewriteLine`.

**Rationale**: Mirrors the existing `onCommand` prop pattern.
Keeps `<TerminalView>` ignorant of shell semantics (it knows
"call this on Tab and apply the diff") and keeps `useShellRunner`
the single owner of `(vfs, cwd)`. No new context/store needed.

**Alternatives considered**:

- **Lift cwd into a Zustand store**: rejected — needless coupling
  between two co-located components.
- **Have `<TerminalView>` import `complete()` directly**:
  rejected — would force the terminal layer to import vfs and
  cwd plumbing, defeating its current simplicity.

## R8 — Double-Tab detection

**Decision**: The terminal layer holds a ref `lastTabRef` of type
`{ line: string; cursor: number } | null`. On Tab, if the current
`(line, cursor)` matches the ref exactly, pass `doubleTab=true`
to the completer; otherwise pass `false`. After every keystroke
*other than* Tab, clear the ref.

**Rationale**: Cheapest implementation that matches the GNU
readline contract: "two consecutive Tabs while ambiguous prints
the list".

## R9 — Empty-first-token Tab

**Decision**: Tab with an empty first token (cursor at column 0,
line empty) is `{kind: 'none', bell: true}` on the first press
and `{kind: 'list', candidates: <every command>, ...}` on the
second press. Aligns with R8 + spec edge cases.

## R10 — Spec amendment

**Decision**: `spec.md` §10 currently lists "tab completion" in
the v1 "Rejected for v1" line. The implementation task list will
remove that exclusion and add a short note recording that it
was added in iteration 048. This is captured as FR-014 in the
feature spec.

## Open items

None. All NEEDS CLARIFICATION markers from the feature spec are
resolved or deliberately deferred (the deferrals are documented
under Edge Cases / Assumptions).

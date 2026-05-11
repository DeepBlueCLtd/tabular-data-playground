---

description: "Tasks for terminal tab-autocomplete (spec 048)"
---

# Tasks: Terminal Tab Autocomplete

**Input**: Design documents from `/specs/048-tab-autocomplete/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: e2e tests are included per the testing strategy in
`research.md` §R3 (Playwright e2e against the rendered terminal; no
Vitest introduced). They are not "TDD-fail-first" — they sit alongside
the implementation in each user-story phase and are required to pass
at story checkpoint.

**Organization**: Tasks are grouped by user story so each story (US1,
US2, US3) can be implemented and verified independently. US1 and US2
are both P1 — US1 is the MVP slice because builtin completion works
before Pyodide is ready and is the most-used flow.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are absolute-from-repo-root (e.g. `app/src/mini-shell/complete.ts`)

## Path Conventions

This is a single-project repository under `app/`. Source under
`app/src/`, e2e tests under `app/e2e/`, docs under `docs/`. See
`plan.md` §"Project Structure" for the full tree.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the test fixture file. No new dependencies, no
project-init work.

- [X] T001 Create empty Playwright spec file `app/e2e/terminal-autocomplete.spec.ts` with the standard imports (`test`, `expect` from `@playwright/test`) and a single skipped placeholder test so the file is discovered by the suite from day one. Subsequent story phases fill it in.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wiring + types + skeleton that all three user stories
depend on. After this phase, pressing Tab in the terminal reaches a
placeholder completer that returns `{kind: 'none', bell: true}` for
every input — so no completion happens yet, but the Tab keystroke is
captured, the busy-guard works, the double-Tab tracking works, and
the prop/callback wiring is in place. **No user story work can begin
until this phase is complete.**

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Extract `EXTERNAL_COMMANDS = ['frictionless', 'python'] as const` in `app/src/mini-shell/execute.ts` and refactor `runStage()` to use `EXTERNAL_COMMANDS.includes(head)` instead of the two hard-coded `head === 'frictionless'` / `head === 'python'` string equality checks. Export the constant. (Research R1.)
- [X] T003 [P] Create `app/src/mini-shell/complete.ts` with the type exports from `data-model.md`: `CompletionKind`, `Candidate`, `CompleteInput`, `CompletionResult` (and the four result-variant interfaces). Export a `complete()` function whose body is a placeholder `return { kind: 'none', bell: true }`. No logic yet — types only.
- [X] T004 Add internal helpers in `app/src/mini-shell/complete.ts`: `tokenAtCursor(line, cursor): TokenSlice` (unquoted-whitespace split, cursor inside or on whitespace ⇒ empty token starting at cursor; flags `hasQuoteOrEscape` true if the token contains `'`, `"`, or `\\`), `splitTokenPath(token): {dir, base}`, `longestCommonPrefix(names): string`. These helpers are pure and unit-testable. (Research R4, R5.)
- [X] T005 Wire the completion callback in `app/src/mini-shell/shell-runner.tsx`. Add a memoised `complete` callback alongside `runLine` that imports `BUILTINS` and `EXTERNAL_COMMANDS`, reads `cwdRef.current` and `vfs`, and calls the new `complete()` function. Return `{ runLine, complete }` from `useShellRunner`. The callback signature is `(line: string, cursor: number, doubleTab: boolean) => Promise<CompletionResult>`. Depends on T002, T003, T004.
- [X] T006 Add an `onComplete?` prop on `<TerminalView>` in `app/src/terminal/terminal.tsx` matching the signature above. Pass it through from the consumer that uses `useShellRunner`. Identify that consumer via the existing `runLine` plumbing and update the same call site to also pass `complete`.
- [X] T007 In `app/src/terminal/terminal.tsx`, intercept the ASCII Tab character (`\t`, `\x09`) inside `handleData()`. Add a new ref `lastTabRef: { line: string; cursor: number } | null` and a helper `clearLastTab()`; clear the ref on every non-Tab keystroke path inside `handleData` (printable insert, backspace, arrow keys, Home/End, Enter). On Tab: (a) if `busyRef.current` is true, return without effect (per FR-010); (b) snapshot `(line, cursor)`, compute `doubleTab = lastTab?.line === line && lastTab?.cursor === cursor`, update `lastTabRef`; (c) `await onComplete?.(line, cursor, doubleTab)`; (d) apply the result via a new helper (T008). Depends on T006.
- [X] T008 In `app/src/terminal/terminal.tsx`, add a private helper `applyCompletion(term, line, result)` that, given a `CompletionResult`: (`none`) emits `\a`; (`unique` / `prefix`) writes `\a` if `bell` set, replaces `[insertStart, insertEnd)` in the `LineEditor` buffer with `result.insert`, repositions the cursor to `result.newCursor`, and redraws the prompt + line + cursor with the existing `rewriteLine` pattern; (`list`) emits `\a`, writes `\r\n`, prints candidate names separated by two spaces (dirs shown with trailing `/` per FR-012), writes `\r\n`, writes prompt + line, and positions the cursor with `\x1b[<n>D` if needed. Use `LineEditor`'s public setter (add one if missing: `setBuffer(buffer: string, cursor: number)`) so the editor's state stays consistent with what's on screen. Depends on T007.
- [X] T009 If T008 needs it, add a `setBuffer(buffer: string, cursor: number): void` method to `app/src/terminal/line-editor.ts` that overwrites the internal state. Keep `historyIndex` and `savedCurrent` untouched (a completion is not a history navigation). Add a docstring note.

**Checkpoint**: Foundation ready. Tab keystrokes reach a no-op
completer that emits the bell; double-Tab tracking works; busy-guard
respects in-flight commands. User story implementation can begin.

---

## Phase 3: User Story 1 - Complete a command name (Priority: P1) 🎯 MVP

**Goal**: Pressing Tab on the first token completes shell command
names (mini-shell builtins + the externals `frictionless` and
`python`).

**Independent Test**: With Pyodide unloaded, type `e` then Tab — line
becomes `echo `. Type `c` then Tab twice — bell rings, then a
candidate list (`cat`, `cd`) prints and the prompt redraws with `c`
in the buffer.

### Implementation for User Story 1

- [X] T010 [US1] In `app/src/mini-shell/complete.ts`, implement the first-token completion path inside `complete()`: if `tokenAtCursor.index === 0` and `!hasQuoteOrEscape`, filter `commandNames` by prefix-match against `token.text`; build a `Candidate[]` with `kind: 'command'` for each match (preserve input order: builtins first, externals after — `useShellRunner` already supplies the array in that order); then dispatch to the shared resolution helper (T012).
- [X] T011 [US1] In `app/src/mini-shell/complete.ts`, add a shared helper `resolve(candidates, token, doubleTab): CompletionResult` that encodes the zero/one/many decision tree from `data-model.md` §"Validation rules": zero → `none`; one → `unique` (suffix: `/` for `dir`, single space for `file`/`command`, with the "skip if next char is already space" rule using the full line context); many + `!doubleTab` → `prefix` (LCP, bell); many + `doubleTab` → `list` (sorted lexicographically, bell). The helper is shared between US1 and US2, so this task is part of US1 because US1 is the MVP and US2 builds on it.
- [X] T012 [US1] Refine the "trailing space" rule in T011: after the proposed `insertEnd` position, if `line.charAt(insertEnd) === ' '`, omit the trailing space from `insert`. The rule applies to `command` and `file` kinds; `dir` always appends `/` because `cd lessons/` is the natural cursor stop.
- [X] T013 [P] [US1] In `app/e2e/terminal-autocomplete.spec.ts`, add Playwright tests for the US1 acceptance scenarios from `spec.md`: (a) `e` + Tab → `echo ` with cursor at end; (b) `m` + Tab → `mkdir `; (c) `c` + Tab → bell + no expansion (LCP is `c`); (d) `c` + Tab + Tab → candidate list contains both `cat` and `cd`, prompt redrawn with `c` and cursor after `c`. Use the existing terminal locator from `app/e2e/smoke.spec.ts` for consistency. Run before Pyodide-ready to confirm builtins work pre-Pyodide.

**Checkpoint**: Builtin command completion works end-to-end. The
MVP is shippable at this point: lessons can already benefit from
faster `echo` / `cat` / `cd` / `ls` typing without needing
file-name completion.

---

## Phase 4: User Story 2 - Complete a file or folder name (Priority: P1)

**Goal**: Pressing Tab on any later token completes file/folder
names from the VFS against the directory that the token's
directory-part resolves to (cwd if none). Directories complete with
a trailing `/`, files with a trailing space.

**Independent Test**: In `cwd=/workspace/lessons/01-describe` with
`titanic.csv` present, type `cat ti` + Tab → `cat titanic.csv `.
With `cwd=/workspace`, type `cd l` + Tab → `cd lessons/`.

### Implementation for User Story 2

- [X] T014 [US2] In `app/src/mini-shell/complete.ts`, implement the later-token completion path inside `complete()`: if `tokenAtCursor.index > 0` and `!hasQuoteOrEscape`, call `splitTokenPath(token.text)` to get `{dir, base}`. Resolve `dir` against `cwd` using `resolveCwd` from `app/src/mini-shell/path-util.ts` — if it returns `null`, return `{kind: 'none', bell: true}`.
- [X] T015 [US2] Continue T014: call `await vfs.readdir(resolvedDir)`, filter entries whose `name.startsWith(base)`, map to `Candidate[]` with `kind: 'dir'` or `kind: 'file'` from the entry's `kind`. Dispatch to the shared `resolve()` helper (T011). Crucially, the `insertStart`/`insertEnd` must span only the `base` portion of the token (not the `dir/` prefix) — this implements FR-013. Compute as `insertStart = token.start + dir.length + (dir ? 1 : 0)` to account for the trailing slash in the directory part.
- [X] T016 [US2] Handle the `readdir` error path: if `vfs.readdir` throws (directory doesn't exist), return `{kind: 'none', bell: true}` — matches the spec edge case "Path whose directory part does not exist".
- [X] T017 [P] [US2] In `app/e2e/terminal-autocomplete.spec.ts`, add Playwright tests for the US2 acceptance scenarios: (a) `cd lessons/01-describe`, then `cat ti` + Tab → `cat titanic.csv ` with cursor at end; (b) `cd /workspace`, then `cd l` + Tab → `cd lessons/` (trailing slash, no trailing space); (c) `cd 0` with two matching lesson dirs + Tab once → bell + no further expansion (LCP === input); + Tab again → list with both directories shown trailing `/`; (d) `cat lessons/01-describe/ti` + Tab from `/workspace` → expands the `ti` basename to the full filename while leaving the `lessons/01-describe/` prefix verbatim; (e) `cat foo/ba` where `foo/` does not exist → bell + no change.

**Checkpoint**: At this point, US1 and US2 both work. The lessons'
golden path (`cd` → `cat` → `frictionless describe`) is fully
tab-completable.

---

## Phase 5: User Story 3 - Mid-line completion (Priority: P2)

**Goal**: Completion respects cursor position; the token under the
cursor is the one completed, and characters outside that token are
preserved byte-for-byte.

**Independent Test**: Type `cat  | head` (two spaces after `cat`).
Move the cursor with Left arrow to column 5 (between the two
spaces). Press Tab. If one file matches the empty token there, the
filename is inserted at the cursor; the trailing ` | head` is
preserved verbatim.

### Implementation for User Story 3

- [X] T018 [US3] Audit `tokenAtCursor()` in `app/src/mini-shell/complete.ts` (added in T004) against the spec's mid-line edge cases: (a) cursor on a whitespace character produces an empty token whose `start === end === cursor` and `index` is the count of whitespace-delimited tokens to the left; (b) cursor inside a token returns the full token (left + right of cursor), per Research R5; (c) cursor at end of line after a trailing space produces an empty token. Add or amend inline test scaffolding here only if needed — the e2e covers behaviour.
- [X] T019 [P] [US3] In `app/e2e/terminal-autocomplete.spec.ts`, add Playwright tests for US3: (a) the mid-line acceptance scenario above — verify byte-equality of the suffix ` | head` before and after Tab; (b) busy-terminal Tab: start a slow Pyodide command (`python -c "import time; time.sleep(2)"`), press Tab repeatedly during the wait, assert no buffer change and no bell-induced redraw; (c) Tab at the very end of `echo hello`: the token under the cursor is `hello`, which matches no command (first token would, but cursor is on token-2) and no VFS entry → bell + no change.

**Checkpoint**: All three user stories pass their independent tests.
Feature is functionally complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Spec amendment (FR-014), limitations doc updates per
constitution Gate 6, manual quickstart validation.

- [X] T020 [P] Amend `spec.md` §10 line 173: remove "tab completion" from the "Rejected for v1" list, and add a short trailing sentence noting it was added in iteration 048 (commit reference acceptable but not required). Satisfies FR-014.
- [X] T021 [P] Append two new lines to `docs/limitations.md` under an appropriate existing section (or a new "Terminal" subsection if none fits): (a) "Tab autocomplete does not handle quoted or backslash-escaped tokens; quoted/escaped tokens are treated as not completable." (b) "Tab autocomplete signals failure (no match / ambiguous prefix) by emitting the ASCII bell character; xterm.js's default bell style is silent, so failure feedback is the absence of expansion." Satisfies constitution Gate 6.
- [X] T022 Run `pnpm --filter app test` (tsc --noEmit) at repo root and confirm zero type errors. Run `pnpm --filter app test:e2e -- terminal-autocomplete.spec.ts` and confirm the new Playwright spec is green.
- [ ] T023 Walk through `specs/048-tab-autocomplete/quickstart.md` in a real browser. Each of sections A–H should pass. Record any deviations as additional limitations entries or bug-fix tasks; otherwise mark complete.
- [X] T024 Update `backlog.md`: add a new row for #48 with `Status = complete`, `Epic = post-v1.0`, `Updated = 2026-05-11`, `Total/Complexity` scores per the existing scoring rubric, and the standard strikethrough formatting that completed rows use. (Per CLAUDE.md per-item cycle step 9.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T001 is a single file scaffold.
- **Foundational (Phase 2)**: Depends on Setup. **Blocks all user stories.** Within Phase 2, T002/T003/T004 are independent ([P]); T005 depends on all three; T006 depends on T005; T007 depends on T006; T008 depends on T007; T009 is only needed if T008 requires the new editor method.
- **User Story 1 (Phase 3)**: Depends on Foundational. T010 → T011 → T012 are sequential (same file, shared helper). T013 is parallel to the implementation (different file).
- **User Story 2 (Phase 4)**: Depends on Foundational. Reuses `resolve()` from T011, so US2 is **soft-dependent** on US1 (T011 specifically). If US2 is delivered before US1 in a parallel-team scenario, T011 must move into Phase 2 instead — flagged but not the default.
- **User Story 3 (Phase 5)**: Depends on Foundational and US1+US2 (because mid-line completion must call a real completer to be observably correct).
- **Polish (Phase 6)**: T020/T021/T024 are documentation-only and [P]. T022/T023 depend on US1+US2+US3 being implemented.

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2.
- **US2 (P1)**: Soft-depends on US1's T011 (shared helper). Can run after Phase 2 if T011 is treated as Phase 2 work — see note above.
- **US3 (P2)**: Depends on US1 and US2 (it tests cross-cutting cursor behaviour through the same completer).

### Within Each User Story

- e2e test tasks are marked [P] because they touch a different file (`app/e2e/terminal-autocomplete.spec.ts`) and can be written in parallel with the implementation. They are not "write-first / fail-first" — they sit alongside the implementation and must pass at story checkpoint.
- Within `complete.ts`, tasks that touch the same function are sequential (T010 → T011 → T012; T014 → T015 → T016).

### Parallel Opportunities

- T002, T003, T004 in Phase 2 are independent.
- T013, T017, T019 (all in `terminal-autocomplete.spec.ts`) are independent of the implementation tasks in their phases, but **must not be appended to the same file in parallel** — co-ordinate by section or write them sequentially even though they're [P]. Practical advice: one developer per spec file.
- T020 and T021 are entirely independent documentation edits.

---

## Parallel Example: User Story 1

```bash
# After Phase 2 is complete, T013 (Playwright spec) can be written
# in parallel with T010–T012 (implementation):

Task: "T010 — implement command-name completion path in app/src/mini-shell/complete.ts"
Task: "T013 — Playwright tests for US1 acceptance scenarios in app/e2e/terminal-autocomplete.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001).
2. Complete Phase 2 (T002–T009) — foundational wiring.
3. Complete Phase 3 (T010–T013) — command-name completion.
4. **STOP and VALIDATE**: pre-Pyodide builtin completion works,
   ambiguous double-Tab lists. Demonstrable in a single screen
   recording.
5. Ship to `main` if approved — this is a useful increment even
   without file completion.

### Incremental Delivery

1. Setup + Foundational → wiring ready.
2. US1 → demo "tab completes commands" (MVP).
3. US2 → demo "tab completes filenames" (full default behaviour).
4. US3 → verify mid-line; expected to be a thin pass since the
   completer is cursor-position-correct by construction.
5. Polish → spec amendment, limitations doc, backlog update.

### Single-Author Strategy

This is solo work; no parallel team. The phases above are the
linear plan. The [P] markers signal "this could be parallelised by
a team", not "the author should context-switch".

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- [Story] label maps task to specific user story for traceability.
- Each user story should be independently completable and testable.
- e2e tests are required to pass at story checkpoint (not fail-first).
- Commit per task or logical group; commit messages follow
  `feat(#48): <short>` / `test(#48): <short>` / `docs(#48): <short>`.
- Stop at any checkpoint to validate independently in the browser.
- Avoid: vague tasks, same-file conflicts, cross-story dependencies
  that break independence beyond the documented soft-dependency
  between US2 and US1's T011.

---

description: "Task list for Spike B — Mini-shell pipes prototype"
---

# Tasks: Spike B — Mini-shell Pipes Prototype

**Input**: Design documents from `/specs/002-spike-b-shell/`
**Tests**: No automated test framework. The on-page self-check
(spec FR-007) IS the verification, plus the Playwright harness that
mirrors Spike A.

## Phase 1: Setup

- [X] T001 Create directory `app/spikes/spike-b/` and `app/spikes/spike-b/shell/`
- [X] T002 Author `app/spikes/spike-b/xterm.config.js` exporting `XTERM_VERSION`, `XTERM_CSS_URL`, `XTERM_JS_URL`

## Phase 2: Foundational

- [X] T003 [P] Author `app/spikes/spike-b/shell/vfs.js` — `Map<string, Uint8Array>` store with `cwd`, `read`, `write`, `list`, `cwdResolve(name)` per data-model.md
- [X] T004 [P] Author `app/spikes/spike-b/shell/tokenise.js` — emits `{ type, value, pos }` tokens per research.md R4 (single quotes literal, double quotes with `\\` and `\"` escapes, backslash escapes outside quotes, `|` and `>` operators)
- [X] T005 [P] Author `app/spikes/spike-b/shell/parse.js` — token stream → Pipeline AST per data-model.md; rejects features per research.md R5 with messages naming the operator
- [X] T006 [P] Author `app/spikes/spike-b/shell/builtins.js` — `echo`, `cat`, `ls`, `pwd` builtins; each takes `{ argv, stdin, vfs }` and returns `{ stdout: AsyncIterable<Uint8Array>, exit_code }`
- [X] T007 [P] Author `app/spikes/spike-b/shell/execute.js` — runs a Pipeline AST: serialised + buffered pipes per research.md R2 (1 MiB cap), redirect handler writes the last stage's buffered stdout to VFS

## Phase 3: User Story 1 — Reproduce the pipes proof in a fresh browser (P1) 🎯 MVP

- [X] T008 [US1] Author `app/spikes/spike-b/index.html` — terminal pane (xterm.js attached), Self-check status block, Versions block, Copy-results button, transcript readout
- [X] T009 [US1] Author `app/spikes/spike-b/main.js` — wires xterm.js + addon-fit, glues an input loop to the executor, runs the four self-check assertions defined in `contracts/self-check.md` BEFORE enabling the interactive prompt, populates the on-page table, computes outcome
- [X] T010 [US1] Implement Copy-results action in `main.js` — emits the markdown block from `contracts/self-check.md`

## Phase 4: Verification & E0 Record

- [X] T011 [US1] Author `specs/002-spike-b-shell/verify/run-spikes.mjs` — Playwright harness (mirrors Spike A's): serves `app/spikes/spike-b/`, opens Chromium and Firefox, waits for self-check banner, scrapes per-assertion results, writes `verify/results/<browser>.{md,json}` and `summary.json`
- [X] T012 [US1] Run the harness; both browsers must PASS
- [X] T013 [US1] Append Spike B section to `docs/architecture.md` with both run records and a one-line go/no-go (spec FR-011, SC-003)
- [X] T014 [US1] Update `docs/limitations.md` with any sharp edges encountered (Constitution Principle VII; spec FR-010, SC-005)

## Phase 5: Polish

- [X] T015 [P] Walk `quickstart.md` against actual files; correct drift
- [X] T016 [P] Cross-check spec FR-001..FR-012 and SC-001..SC-005 against delivered artefact

## Dependencies

- T001 → T002, T003..T007.
- Foundational (T003..T007) before US1 (T008..T010) — main.js imports from shell/.
- Verification (T011..T014) after US1.
- T013/T014 after T012 (real results required).

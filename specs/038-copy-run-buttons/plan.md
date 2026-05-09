# Implementation Plan: Copy + Run buttons (#39)

**Branch**: `claude/epic-e2-qp0Tr` (epic E2) | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)

## Summary

Wire a small terminal-submit store (`useSyncExternalStore`-based, no
new deps) so any descendant can ask the terminal to run a typed line.
The lesson code block's existing `renderActions(lang, source)` slot
(#38, decision #6) is fed a Copy + Run pair when `lang === 'bash'`.
Copy uses `navigator.clipboard`. Run is gated on the store returning
a non-null submit; the disable-on-busy + most-recently-clicked
visuals are #40.

## Technical Context

**Language/Version**: TypeScript, React 18.3.1.
**Primary Dependencies**: None new. `useSyncExternalStore` is React 18
core. Clipboard API is browser standard.
**Performance Goals**: Click → first paint of terminal line ≤ 100 ms.
**Constraints**: ESLint rule (`src/lessons/** must not import
@/pyodide/*`) holds — the Run button reaches Pyodide only via the
terminal-submit store, which itself imports from `@/pyodide` is fine
(it's `@/terminal/`).

## Constitution Check

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | Research-first | **PASS** | Code-block-to-terminal is a primary lesson interaction. |
| 2 | Notes-section | **N/A** | Infrastructure. |
| 3 | Destruction | **PASS** | Run executes shell commands which can be destructive (`rm`), but that's the mini-shell's surface, not this item's. Run merely types the command for the user; the user authored the lesson markdown. |
| 4 | Backend | **PASS** | Clipboard + in-app submit. |
| 5 | Pinning | **PASS** | No new deps. |
| 6 | Limitations | **PASS** | No new sharp edges. The "best-effort behaviour when terminal already has typed text" (Edge Cases) is documented in the spec, not promoted to `docs/limitations.md` (it's a UX nuance, not a constraint). |

## Project Structure

```text
specs/038-copy-run-buttons/
├── plan.md, research.md, tasks.md
├── checklists/
│   ├── requirements.md
│   └── copy-run.md
└── contracts/
    └── terminal-submit-api.md

app/src/terminal/
├── terminal.tsx              # MODIFY — accept onApi callback / setTerminalSubmit
├── terminal-submit-store.ts  # NEW — module-level store + useTerminalSubmit hook
└── line-editor.ts            # unchanged

app/src/lessons/
├── lesson-renderer.tsx       # MODIFY — pass renderCodeActions={CopyRunActions}
├── copy-run-actions.tsx      # NEW — Copy + Run for bash; null otherwise
└── lesson-code-block.tsx     # unchanged (slot is already there)
```

## Complexity Tracking

| Violation | Why | Simpler? |
|-----------|-----|----------|
| — | — | — |

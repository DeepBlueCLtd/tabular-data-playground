# Implementation Plan: Run button states (#40)

**Branch**: `claude/epic-e2-qp0Tr` (E2) | **Spec**: [spec.md](./spec.md)

## Summary

Extend the existing terminal-submit-store (#39) with two more
subscribable values: `running: boolean` and `lastRunSource: string |
null`. The terminal toggles `running` around its `dispatch` helper
(which serves both typed input and Run-button submits). The
`CopyRunBar` consumes the new hooks and: (a) disables Run when
`running`, (b) sets `data-lesson-code-active` on its host wrapper
when `lastRunSource === source`, (c) replaces "Run" with "Running…"
when its source is the active in-flight one.

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Research-first | PASS | Direct UX response to Principle II — author needs to know which block fired the running command. |
| Notes | N/A | Infra. |
| Destruction | PASS | UI-only. |
| Backend | PASS | None. |
| Pinning | PASS | No new deps. |
| Limitations | PASS | No new sharp edges. |

## Source-code shape

```text
app/src/terminal/
└── terminal-submit-store.ts   # MODIFY — add running + lastRunSource

app/src/terminal/terminal.tsx  # MODIFY — toggle running around dispatch

app/src/lessons/
├── copy-run-bar.tsx           # MODIFY — read running + lastRunSource
└── lesson-code-block.tsx      # MODIFY — apply data-lesson-code-active wrapper
```

## Complexity Tracking

| Violation | Why | Simpler? |
|-----------|-----|----------|
| — | — | — |

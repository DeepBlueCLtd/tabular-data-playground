# Plan: Definition of Done verification (#56)

## Summary
Walk `spec.md` §13 item by item, record pass/fail/deferred for
each, output as a checklist plus a one-paragraph summary on the
spec. Pure documentation; no code or workflow change.

## Constitution Check
| Gate | Status |
|------|--------|
| All | PASS — pure documentation. |

## Source-code shape
```
specs/046-dod-verification/checklists/dod.md   # NEW
```

## Approach
For each §13 item:
- Identify the artefact that verifies it (file, command, commit, deploy URL).
- Run the verification where possible on the epic branch
  (typecheck, lint, build, lesson source review, file presence).
- Mark items requiring the deployed site as NEEDS-DEPLOYED, to be
  re-checked after the epic PR merges and Pages publishes.
- Mark items blocked by #57 (the tag) as DEFERRED-TO-#57.

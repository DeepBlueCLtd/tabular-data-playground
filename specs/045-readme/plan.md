# Plan: README (#54)

## Summary
Rewrite `README.md` as the v1.0 entrypoint document. Folds in the
"Pinned versions" stub seeded by #55, adds framing, screenshot,
findings summary, setup, and cross-links. Pure documentation —
no code touched.

## Constitution Check
| Gate | Status |
|------|--------|
| All | PASS — pure documentation. |

## Source-code shape
```
README.md   # rewritten
```

## Approach
1. Open with one or two sentences naming the project and audience.
2. Add a screenshot (reuse one from `app/e2e/screenshots/`).
3. "Findings" section — one paragraph plus bullets distilled
   from each lesson's Notes & Observations.
4. "Pinned versions" — keep the table from #55 verbatim.
5. "Setup / development" — minimal pnpm script list.
6. "Further reading" — link to spec, constitution, the three
   docs, and the lessons folder.

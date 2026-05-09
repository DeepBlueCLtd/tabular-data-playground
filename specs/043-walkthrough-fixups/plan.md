# Plan: Solo-author walkthrough & fixups (#53)

## Summary
Process item: walk every lesson, fix issues found. Output is a set
of edits (lesson markdown, lesson `files/`, app source where
necessary) plus updated Notes & Observations sections. No new
modules, no new dependencies, no new architecture.

## Constitution Check
| Gate | Status |
|------|--------|
| Research-first | PASS — directly serves §11 Phase 3 polish exit criterion. |
| Notes-section | PASS — fills the Notes & Observations sections that Principle II requires. |
| Destruction | PASS — no destructive flow added or changed. |
| Backend | PASS — no servers/accounts/telemetry. |
| Pinning | PASS — no new external deps. |
| Limitations | PASS — any new sharp edge surfaced lands in `docs/limitations.md` in the same change. |

## Source-code shape
```
content/lessons/{01..08}/lesson.md     # MAY edit
content/lessons/{01..08}/files/**       # MAY edit
docs/limitations.md                      # MAY append on new sharp edges
app/src/**                               # MAY edit only for crash-class fixes surfaced by the walkthrough
```

## Approach
1. Run `pnpm lint`, `pnpm typecheck`, `pnpm build` first; fix anything red.
2. For each lesson 01–08:
   - Read `lesson.md` end-to-end; check files referenced exist;
     mentally execute each runnable block against the documented
     Frictionless v5 behaviour and the contents of `files/`.
   - Fix any concrete bugs (broken filenames, wrong commands, stale
     outputs) in place.
   - Confirm Notes & Observations is populated; expand with
     specifics where it is a placeholder.
3. After lesson edits, re-run `pnpm lint`, `pnpm build`,
   `pnpm test:e2e --reporter=line` if practical; otherwise note.
4. Append any new sharp edges to `docs/limitations.md`.
5. Commit `feat(#53): …` for code/lesson edits and
   `docs(#53): walkthrough fixups` for doc-only changes.

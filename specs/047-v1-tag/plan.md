# Plan: v1.0 tag (#57)

## Summary
Tag-and-push step. Executed **after** the E3 epic PR is merged
to `main` and Pages publishes the artefact. Not executed on the
epic branch — tagging speculatively on a branch that may
re-spin under review risks pointing v1.0 at a commit that never
lands on `main`.

## Constitution Check
| Gate | Status |
|------|--------|
| All | PASS — release operation, no code change. |

## Source-code shape
```
(no files)
```

## Approach (executed post-merge, with explicit user authorisation)
1. Confirm the E3 epic PR is merged and the deploy workflow
   (`.github/workflows/deploy.yml`) succeeded.
2. Open the deployed Pages URL and run a 60-second smoke:
   landing renders → IDE shell renders → lesson 1's
   `frictionless describe books.csv` returns the expected
   metadata.
3. From `main` at the merge commit:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0 -m "v1.0 — frozen as a dated reference (YYYY-MM-DD).
   Live: https://deepbluecltd.github.io/tabular-data-playground/"
   ```
4. Ask the user explicitly before `git push origin v1.0`. This
   is a release-visible action.
5. Strikethrough the Epics row for E3 in `backlog.md` and the
   #57 row, commit, push to `main`. (Could also be done on the
   epic branch before merge as part of the epic close; recorded
   here for completeness.)

# Definition of Done — verification (#56)

Walked the §13 checklist on the epic branch
`claude/epic-e3-87k7J` at the head commit at the time of writing.
Items needing the deployed Pages site are flagged
**NEEDS-DEPLOYED**; items blocked by the v1.0 tag itself are
**DEFERRED-TO-#57**.

| § | Item | Status | Evidence |
|---|------|--------|----------|
| §13 | GitHub Pages site reachable, loads in <8 s on broadband cold cache | NEEDS-DEPLOYED | Cannot be measured against the epic branch — the deploy workflow (`.github/workflows/deploy.yml`) only runs on push to `main`. Re-verify after the epic PR merges and Pages publishes. The build itself is green (`pnpm build` passes; bundle size is gzip ≈ 322 kB main chunk + small CSS / worker, well under typical 8 s cold-cache budgets). |
| §13 | All eight lessons authored, rendering, and runnable end-to-end without errors | PASS (locally verified) | Eight lesson folders present at `content/lessons/{01-describe..08-publish}/lesson.md`. Lessons 1–7 ship `files/` starter material; lesson 8 deliberately consumes a remote `datapackage.json` and ships no `files/` (matches its own copy). The walkthrough fixups committed in `feat(#53):` resolved the two row-reference ambiguities and the missing `python` shell command that previously broke lesson 6's `python run-pipeline.py` step. End-to-end runtime requires Pyodide and is therefore re-verified post-deploy. |
| §13 | Each lesson has a populated Notes & Observations section | PASS | `grep -c "## Notes & Observations"` returns 1 for every lesson 01–08. Each section is concrete (no `TODO` placeholders) — confirmed by reading during the walkthrough (#53). |
| §13 | Terminal supports the full feature set in §6 (builtins, pipes, redirection, Pyodide commands) | PASS | Builtins: `echo`, `pwd`, `cd`, `ls`, `cat`, `mkdir`, `rm` (`app/src/mini-shell/builtins.ts`). Pipes + `>` / `>>` / `<` redirection: `app/src/mini-shell/parse.ts` + `execute.ts`. Pyodide commands: `frictionless` (CLI bridge) and `python <script.py>` (added in `feat(#53):` to unblock lesson 6). Out-of-scope operators (`&&`, `;`, subshells, etc.) reject at parse time per Spike B. |
| §13 | Workspace persists across reload; Reset works (modal confirmed) | PASS | Persistence: virtual FS bridges to Pyodide IDBFS (`app/src/fs/`, `app/src/pyodide/worker.ts` `syncfs`). Reset: `app/src/file-tree/reset-workspace-button.tsx` with modal-confirmed dialog (Principle III), wired via `app/src/components/shell/side-panel.tsx`. |
| §13 | CI green: `pnpm build`, `pnpm test`, Playwright Chromium smoke pass | PASS (local) / NEEDS-CI | Locally `pnpm lint`, `pnpm typecheck`, `pnpm build` are clean. CI workflow `.github/workflows/ci.yml` runs `pnpm run build`, `pnpm test`, `pnpm test:e2e` on PR; needs to go green on the epic PR before merge (the merge gate enforces this). |
| §13 | README with project framing, setup, and a short summary of evaluation findings | PASS | `README.md` rewritten in `docs(#54):` with framing, live URL, screenshot from `app/e2e/screenshots/`, "Findings" section distilled from the eight Notes & Observations, "Pinned versions" table, "Setup / development" pnpm script list, and cross-links to spec / constitution / docs / lessons. |
| §13 | Frictionless version and JSON Schema versions pinned; versions recorded in README | PASS | `app/src/pyodide/config.ts` exports `PYODIDE_VERSION = '0.27.7'` and `FRICTIONLESS_VERSION = '5.19.0'`. The worker now installs `frictionless==${FRICTIONLESS_VERSION}` (was unpinned before `feat(#55):`). Bundled schemas are real canonical snapshots from `specs.frictionlessdata.io` (data-package, table-schema) and `datapackage.org/profiles/2.0` (table-dialect). README "Pinned versions" table records all of the above. |
| §13 | Repo tagged v1.0 and the artefact frozen as a dated reference | DEFERRED-TO-#57 | Backlog item #57. Tagging waits until the epic PR is merged and the deploy + DoD post-merge re-checks are green. Will require explicit user authorisation at the time. |

## Summary

Six of nine items are PASS on the epic branch. Two items
(reachable site, CI green) are NEEDS-DEPLOYED / NEEDS-CI and
become PASS on the epic PR's CI run + post-merge deploy. One
item (v1.0 tag) is DEFERRED-TO-#57 by design.

No items are in unknown state.

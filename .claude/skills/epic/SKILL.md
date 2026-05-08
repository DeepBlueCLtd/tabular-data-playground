---
name: "epic"
description: "Drive a whole epic (E0–E3) from backlog.md to a single PR — one branch, one merge. Use when the user says \"implement epic E<n>\", \"start E<n>\", or similar. Pass the epic ID as an argument, e.g. /epic E1."
argument-hint: "Epic ID, e.g. E1"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

`$ARGUMENTS` is the epic ID (e.g. `E1`). If empty, ask which epic to
work and stop.

## What this skill does

Runs the **"Working a whole epic in one pass"** loop documented in
`CLAUDE.md`. All items land on one branch (`epic/E<n>-<slug>`) and
ship as one PR at the end. This skill orchestrates speckit; it does
not replace `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, or
`/speckit-implement` — it invokes them per backlog item.

Read `CLAUDE.md` (sections "Spec-Driven Development" and "Working a
whole epic in one pass") and `.specify/memory/constitution.md` before
doing anything. Those are authoritative; if this skill disagrees with
them, they win.

## Outline

1. **Validate the argument.** Parse `$ARGUMENTS` as `E<n>`. If it is
   not one of the epics listed in `backlog.md` `## Epics`, stop and
   tell the user.

2. **Phase-0 gate.** If the requested epic is `E1`, `E2`, or `E3`,
   confirm `E0` is `complete` (strikethrough row in the Epics table
   AND Spike A, Spike B, Measurement C results recorded in
   `docs/architecture.md`). If not, stop and report what is missing.
   Do not start downstream epics on a red gate.

3. **Filter and order items.** From `backlog.md` select all items
   where `Epic = E<n>` and `Status ∈ {proposed, specified, planned,
   tasked}`. Sort by:
   1. dependency order (use IDs cited in Description fields, e.g.
      "determined by item #3"),
   2. then **Total** score descending,
   3. then Complexity ascending (Low first).
   Surface any `blocked` items separately and exclude them from the
   loop.

4. **Plan summary.** Use `TodoWrite` to create one todo per backlog
   ID (in execution order). Post a short message to the user listing:
   - the ordered queue,
   - any blocked / deferred items and why,
   - the proposed branch name `epic/E<n>-<slug>` (slug from the epic
     row).
   **Stop and ask for approval** with `AskUserQuestion` before doing
   any further work.

5. **Create the epic branch.** After approval, create
   `epic/E<n>-<slug>` from up-to-date `main`. Do **not** invoke
   `/speckit-git-feature` — epic mode uses one branch for all items.

6. **Per-item loop.** For each item in the ordered queue, on the
   epic branch:
   1. `/speckit-specify` with the backlog row description as input.
      Status → `specified`.
   2. `/speckit-clarify` if the item is not self-contained.
   3. `/speckit-plan`. If the Constitution Check fails without a
      justification recorded in Complexity Tracking, **stop**.
   4. `/speckit-tasks`. Status → `tasked`.
   5. `/speckit-analyze`. If it surfaces a new sharp edge, update
      `docs/limitations.md` in the same change (Principle VII).
   6. `/speckit-checklist` if the item touches a destructive flow,
      a new dependency, or a sharp edge.
   7. `/speckit-implement`.
   8. Commit per item (target: one commit per item) with messages
      `feat(#<id>): <summary>` for code and
      `docs(#<id>): spec/plan/tasks` for the speckit artefacts.
   9. Update `backlog.md`: status column, `Updated` date,
      strikethrough on completion. Commit with
      `docs: backlog status — #<id> <status>`.
   10. Mark the corresponding `TodoWrite` todo `completed`
       immediately. Do not batch.

7. **Re-plan triggers.** Pause the loop and tell the user before
   continuing if any of the following happen:
   - a downstream item's assumptions changed (e.g. Measurement C
     results redirect Pyodide placement),
   - an item escalates from "self-contained" to needing a decision
     in `spec.md`,
   - a constitution gate fails and the fix is not obvious,
   - the user would need to introduce a dependency not listed in
     the constitution's Technology Constraints (that is an
     amendment, not a PR).

8. **Long-running branch hygiene.** If `main` advances during the
   loop, **rebase** the epic branch onto `main` rather than merging
   `main` in, so the eventual PR reads cleanly.

9. **Phase exit verification.** Before opening the PR, verify the
   epic's exit criterion in `spec.md` §11 against the deployed Pages
   site, not just locally:
   - **E0**: Spike A + Spike B + Measurement C results recorded in
     `docs/architecture.md`; recommendation written; go/no-go
     stated.
   - **E1**: "paste a CSV, run `frictionless describe`, see output"
     works against the deployed site.
   - **E2**: landing page + eight lessons live, each with completed
     Notes & Observations.
   - **E3**: README, version pinning, limitations doc, v1.0 tag.
   If the criterion is not met, stop and tell the user.

10. **Close the epic.**
    1. Strikethrough the epic row in `backlog.md` `## Epics` and
       commit on the epic branch.
    2. Push the epic branch.
    3. Open a **single PR** titled `epic: E<n> — <title>`. The body
       MUST list every backlog ID merged (`- #<id> <title>`), link
       the demonstrable artefact (deployed URL, recorded
       measurements, etc.), and call out any limitations added in
       `docs/limitations.md`.
    4. After merge, delete the epic branch.
    5. **Stop.** Hand back to the user. Do not roll into E<n+1>
       (Principle V — phase boundaries are deliberate pause points).

## When to ask vs. proceed

- Proceed without asking on items whose Description is
  self-contained, scored `A=5`, and `Status = proposed`.
- Use `AskUserQuestion` when an item is `blocked`, scored `A ≤ 3`,
  depends on an unmade decision in `spec.md`, or would require
  introducing a dependency not in the constitution's Technology
  Constraints.
- Always ask before batching multiple backlog IDs onto one commit
  (the per-item commit cadence is the default) or skipping
  `/speckit-clarify`.

## Non-goals

- This skill does **not** create per-item branches or per-item PRs.
  That is single-item mode; use `/speckit-git-feature` directly.
- This skill does **not** auto-merge the epic PR. Review and merge
  are user actions.
- This skill does **not** modify the constitution. If a gate would
  block the epic and the fix is constitutional, stop and ask the
  user to run `/speckit-constitution`.

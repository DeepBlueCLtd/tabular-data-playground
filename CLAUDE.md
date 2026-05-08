<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/004-app-scaffold/plan.md`.
<!-- SPECKIT END -->

# Spec-Driven Development

This repository uses [Spec Kit](https://github.com/github/spec-kit) (the
`speckit-*` skills) to drive every change through a written spec, plan, and
task list before any code is touched. The product spec is `spec.md`; the
governing rules are in `.specify/memory/constitution.md`; the prioritised
work list is `backlog.md`.

## Authoritative documents

- `spec.md` — **the** product specification. Where it disagrees with the
  constitution, `spec.md` wins and the constitution is amended to align.
- `.specify/memory/constitution.md` — non-negotiable principles, technology
  constraints, and per-feature gates. Every plan is checked against it.
- `backlog.md` — epics (E0–E3) and ordered backlog items, each with a
  status column (`proposed → specified → planned → tasked → implementing
  → complete`). This is the canonical view of what work exists and where
  each item is in the SDD cycle.
- `specs/<feature>/` — per-feature artefacts created by the speckit skills:
  `spec.md`, `plan.md`, `tasks.md`, optional `checklists/`.

## The per-item cycle

Every backlog item flows through the same sequence of skills. Do **not**
skip steps; the gates are how the constitution stays enforced.

1. `/speckit-git-feature` — create a feature branch (sequential numbering,
   per `.specify/init-options.json`). **Skip when working an epic in one
   pass** — the epic branch is already in place; see "Working a whole
   epic in one pass" below.
2. `/speckit-specify` — turn the backlog row into a feature spec under
   `specs/<NNN-slug>/spec.md`. Status → `specified`.
3. `/speckit-clarify` *(optional but preferred)* — resolve underspecified
   areas before planning. Skip only when the item is genuinely
   self-contained.
4. `/speckit-plan` — produce `plan.md` and run the **Constitution Check**
   (Research-first, Notes-section, Destruction, Backend, Pinning,
   Limitations gates). Status → `planned`. Any unjustified violation
   blocks `/speckit-tasks`.
5. `/speckit-tasks` — generate `tasks.md`, dependency-ordered. Status →
   `tasked`.
6. `/speckit-analyze` — non-destructive cross-artefact consistency check
   across `spec.md`, `plan.md`, `tasks.md`. Run before implementing.
7. `/speckit-checklist` *(optional)* — generate a feature-specific
   checklist when the item touches a destructive flow, a new dependency,
   or a sharp edge.
8. `/speckit-implement` — execute `tasks.md`. Status → `implementing`.
   In single-item mode, status moves to `complete` when the branch is
   merged and `spec.md` §13 is met. In epic mode, status moves to
   `complete` when the item's tasks all pass on the epic branch; the
   epic PR carries the merge.
9. Update `backlog.md`: bump the row's status and `Updated` date; add
   strikethrough on completion. Commit on the active branch (epic
   branch in epic mode).

The wrapped workflow `.specify/workflows/speckit/workflow.yml` runs
specify → plan → tasks → implement with review gates between specify and
plan, and between plan and tasks. Use it for single items when you want
the gates enforced automatically.

## Constitution gates (recap)

`/speckit-plan` will fail loudly if any gate is violated without
justification:

1. Research-first — does this serve evaluating Frictionless?
2. Notes-section — every lesson template carries a Notes & Observations
   section.
3. Destruction — any overwrite/delete flow needs modal confirmation.
4. Backend — no servers, accounts, or telemetry.
5. Pinning — new external deps land pinned and recorded.
6. Limitations — new sharp edges go into `docs/limitations.md` in the
   same change.

If a gate flags a real concern, fix the spec or plan; if it flags a
deliberate exception, justify it in the plan's Complexity Tracking
section before running `/speckit-tasks`.

# Working a whole epic in one pass

Backlog items are grouped under epics (E0–E3). Each epic ends at a
publicly demonstrable artefact (Principle V — Phased Demonstrability),
so an epic is the right batching unit when you want to make a visible
jump rather than ship a single item.

The epic loop below processes a slice of the backlog without losing the
per-item gates. To trigger it, run **`/epic E<n>`** (e.g. `/epic E1`);
the skill at `.claude/skills/epic/SKILL.md` orchestrates this loop.

## Before starting an epic

1. **Pick the epic.** Read its row in `backlog.md` and the matching
   section of `spec.md` §11.
2. **Filter and order.** Select all items where `Epic = E<n>` and
   `Status ∈ {proposed, specified, planned, tasked}`. Sort by:
   1. dependency order (use the IDs cited in Description fields, e.g.
      "determined by item #3"),
   2. then **Total** score descending,
   3. then Complexity ascending (Low first) to surface quick wins.
   Capture this as a TodoWrite list — one todo per backlog ID — so the
   plan is visible to the user.
3. **Surface blockers.** Items with status `blocked` (e.g. #31) or
   marked "determined by item #N" must wait. State the blockers in the
   opening message before doing any work.
4. **Confirm the epic gate.** For E0 specifically, the Phase 0 gate in
   the constitution requires Spike A, Spike B, and Measurement C to
   pass before any E1 work begins. Do not start E1 items if E0 is not
   green.
5. **Branching strategy.** When implementing a whole epic in one
   session, use **one branch per epic** named
   `epic/E<n>-<slug>` (e.g. `epic/E1-ide-shell`). All items in the
   epic land on that branch and ship together in a single PR at epic
   close. Create the branch once, up front — do **not** invoke
   `/speckit-git-feature` per item; that skill is for single-item
   work outside of epic mode. The trade-off: the PR is large, but the
   epic is the demonstrable unit (Principle V), so reviewing it as a
   whole matches how it will be evaluated.

   Single-item mode (one branch per backlog item, merged
   independently) is still available for one-off changes outside an
   epic push, or for hotfixes.

## Per-item loop within the epic

All work below happens on the single `epic/E<n>-<slug>` branch. Items
do not get their own branches and are not merged independently.

For each item in the ordered list:

1. Run the per-item cycle above end-to-end on the epic branch,
   skipping step 1 (`/speckit-git-feature`).
2. Commit per item, not per skill — one commit per item is the target
   granularity. Suggested message:
   `feat(#<id>): <short description>` for code,
   `docs(#<id>): spec/plan/tasks` for the speckit artefacts under
   `specs/<NNN-slug>/`. Keep commits clean so the epic PR reads as a
   sequence of items.
3. Mark the corresponding TodoWrite todo `completed` as soon as the
   item's tasks all pass on the epic branch — do not wait for the
   epic PR to merge, and do not batch multiple completions.
4. Update `backlog.md`: status column, `Updated` date, strikethrough
   on completion. Commit with `docs: backlog status — #<id> <status>`.
5. If `/speckit-analyze` or implementation surfaces a new sharp edge,
   stop and update `docs/limitations.md` in the same change
   (Principle VII).
6. If a downstream item's assumptions changed (e.g. Measurement C
   results redirect Pyodide placement), pause the loop, re-score and
   re-order the remaining items, and tell the user before continuing.
7. If the epic branch grows long-running, rebase onto `main`
   periodically rather than merging `main` in, to keep the eventual
   PR readable.

## Closing the epic

An epic is **not** complete until its phase exit criterion in
`spec.md` §11 is demonstrably met:

- **E0 done** = Spike A, Spike B, and Measurement C results recorded
  in `docs/architecture.md`; recommendation written; go/no-go stated.
- **E1 done** = "paste a CSV, run `frictionless describe`, see output"
  works against the deployed Pages site.
- **E2 done** = landing page + eight lessons live, each with completed
  Notes & Observations.
- **E3 done** = README, version pinning, limitations doc, v1.0 tag.

Verify the criterion in a real browser against the deployed site, not
just locally. Then:

1. Strikethrough the epic row in the `## Epics` table of
   `backlog.md` and commit on the epic branch.
2. Push the epic branch and open a **single PR** titled
   `epic: E<n> — <title>`. The PR description MUST list every backlog
   ID included (each as `- #<id> <title>`), link the demonstrable
   artefact (deployed URL, recorded measurements, etc.), and call out
   any limitations added in `docs/limitations.md`. This is the only
   merge gate for the epic; per-item PRs are not used in epic mode.
3. After merge, delete the epic branch.
4. Stop and hand back to the user before starting the next epic — do
   not roll straight into E<n+1>. Phase boundaries are deliberate
   pause points (Principle V).

## When to ask vs. when to proceed

- Proceed without asking on items whose Description is
  self-contained, scored `A=5` (Autonomy), and `Status = proposed`.
- Ask the user (use `AskUserQuestion`) when an item is `blocked`,
  scored `A ≤ 3`, depends on an unmade decision in `spec.md`, or
  would require introducing a dependency not listed in the
  constitution's Technology Constraints (that is an amendment, not a
  PR).
- Always ask before batching multiple backlog IDs onto one branch or
  skipping `/speckit-clarify`.

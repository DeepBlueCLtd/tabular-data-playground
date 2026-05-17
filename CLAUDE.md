<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the spec at
`spec.md` and the constitution at `.specify/memory/constitution.md`.
Active per-item plans live under `specs/<NNN-slug>/plan.md`.
<!-- SPECKIT END -->

# Spec-Driven Development on a Project Board

This repository drives every change through a written spec, plan, and
task list before any code is touched, using the
[Spec Kit](https://github.com/github/spec-kit) `speckit-*` skills.

Work is **tracked on a GitHub Project board**, not in a flat-file
backlog. The methodology — Status state machine, Phase decision table,
two-branch-per-issue convention, polling orchestrator — is documented
at <https://github.com/DeepBlueCLtd/backlog-navigator> (`METHODOLOGY.md`
and `docs/adopt-methodology.md`). The cutover from the previous
`backlog.md` file is recorded in `docs/migration/to-project-board.md`;
the archived backlog lives at `docs/history/backlog.md.archived`.

## Authoritative documents

- `spec.md` — **the** product specification. Where it disagrees with the
  constitution, `spec.md` wins and the constitution is amended to align.
- `.specify/memory/constitution.md` — non-negotiable principles,
  technology constraints, and per-feature gates. Every plan is checked
  against it.
- **The GitHub Project board** — the canonical view of what work exists
  and where each item is in the SDD cycle. Replaces the old `backlog.md`.
- `specs/<NNN-slug>/` — per-item artefacts produced by the speckit
  skills: `spec.md`, `plan.md`, `tasks.md`, optional `checklists/`.

## The two state machines

Work moves through **two orthogonal state machines** on the Project
board. Status is dragged by a maintainer; Phase is advanced by the
orchestrator.

### Status (maintainer-controlled)

`Triage → In Design → Ready → Doing → Done`

| Status | Meaning | Who moves it |
|--------|---------|--------------|
| Triage | New issue, awaiting Category/Complexity/V/M/A | Auto on issue open; maintainer scores and drags out |
| In Design | Spec/plan/tasks being authored by the orchestrator | Maintainer drags in; drags to Ready when design PR merges |
| Ready | Designed, awaiting capacity | Maintainer |
| Doing | Implementation in progress | Maintainer drags in to trigger `/speckit-implement` |
| Done | Issue closed | Auto when issue closes |

### Phase (orchestrator-controlled)

`(empty) → Spec drafting → Plan drafting → Tasks drafting →
(Decomposing, epics only) → Designed → Implementing`

The orchestrator (`/loop 15m /backlog-poll`) advances Phase one step per
tick per item, keying off the Phase field via the Project API (never
the working tree):

| Status | Current Phase | Orchestrator action |
|--------|---------------|---------------------|
| In Design | (empty) | Create design branch `<NNN>-<slug>`; run `/speckit-specify`; open design PR; Phase = Spec drafting |
| In Design | Spec drafting | If `[NEEDS CLARIFICATION]` markers exist, run `/speckit-clarify`; else run `/speckit-plan`; Phase = Plan drafting |
| In Design | Plan drafting | Run `/speckit-tasks`; Phase = Tasks drafting |
| In Design | Tasks drafting | Non-epic: Phase = Designed. Epic: run `/speckit-taskstoissues`; Phase = Decomposing |
| In Design | Decomposing | Verify sub-issues filed; Phase = Designed |
| In Design | Designed | Halt; notify maintainer that design is done |
| Doing | Designed | Create impl branch `<NNN>-<slug>-impl`; run `/speckit-implement`; open implementation PR with `Closes #NNN`; Phase = Implementing |
| Doing | Implementing | Hold; wait for PR merge → issue closes → Status → Done |

A maintainer may invoke any `speckit-*` skill manually; the orchestrator
resumes from whatever the Phase field shows.

## Branch convention

**Two branches per issue, two PRs per issue:**

1. **Design branch** `<NNN>-<slug>` — created on the first
   `/speckit-specify` run; accumulates `spec.md`, `plan.md`, `tasks.md`
   commits under `specs/<NNN-slug>/`. Single design PR opens and stays
   open through iterations; merges to `main` when Phase = Designed and
   the maintainer approves.
2. **Implementation branch** `<NNN>-<slug>-impl` — created when Status
   moves to Doing. Implementation PR opens with `Closes #NNN`; merges
   after code review.

Separation enables independent review cycles for design intent and code.
**Do not** combine multiple issues onto one branch; that was the old
epic-mode batching pattern and is incompatible with the per-issue state
machine. Real epics use GitHub sub-issues instead — see "Epics and
sub-issues" below.

## Constitution gates

`/speckit-plan` runs the Constitution Check and fails loudly if any
gate is violated without justification:

1. **Research-first** — does this serve evaluating Frictionless?
2. **Notes-section** — every lesson template carries a Notes &
   Observations section.
3. **Destruction** — any overwrite/delete flow needs modal confirmation.
4. **Backend** — no servers, accounts, or telemetry.
5. **Pinning** — new external deps land pinned and recorded.
6. **Limitations** — new sharp edges go into `docs/limitations.md` in
   the same change.

If a gate flags a real concern, fix the spec or plan. If it flags a
deliberate exception, justify it in the plan's Complexity Tracking
section before `/speckit-tasks` runs.

## Orchestration

The polling orchestrator runs from a long-lived Claude Code session:

```
/backlog-worker-start          # claims a worker identity, then:
/loop 15m /backlog-poll        # tick every 15 minutes
```

Per tick, `/backlog-poll`:

1. Skips if `.claude/in-flight/` has unresolved question locks.
2. Fetches Project state via GraphQL (Status, Phase, V/M/A, Owner,
   sub-issues per item).
3. Recomputes `Total = V + M + A` for drifted items.
4. For each item: consults the (Status, Phase) pair and advances one
   phase per tick using the table above.
5. Claims unowned actionable items by writing its identity to `Owner`
   (re-reads to confirm, preventing races).
6. Releases `Owner` at human-review gates (Phase → Designed; PR opened
   for review).

**Key invariant**: decisions key off API state (the Phase field), not
working-tree state. Long-running branches with unmerged work never
re-trigger.

When blocked on maintainer input, the orchestrator writes a question to
`.claude/in-flight/<issue-number>.md`, asks in chat, and exits;
subsequent ticks are no-ops until the lock is removed.

## Epics and sub-issues

Epics are parent issues. They go through the same design phases as
regular items (`specify` → optional `clarify` → `plan` → `tasks`). They
differ at the final design step: `/speckit-taskstoissues` files each
task as a child sub-issue under the epic. Each sub-issue lands in
Triage, gets its own scoring, and progresses independently.

Status independence: children progress individually; the epic parent
stays in In Design until all children are Ready, then moves Ready →
Doing → Done in step. GitHub enforces that an epic cannot close until
all children close.

This replaces the previous "one branch per epic, single PR at epic
close" pattern.

## When to ask vs. when to proceed

- Proceed without asking when the issue is `Category = Feature`,
  `A ≥ 4`, and the description is self-contained.
- Ask the maintainer (`AskUserQuestion`) when an item is blocked,
  scored `A ≤ 3`, depends on an unmade decision in `spec.md`, or would
  introduce a dependency not listed in the constitution's Technology
  Constraints (that is a constitution amendment, not a PR).
- Always ask before deviating from the two-branch convention or
  skipping the design PR.

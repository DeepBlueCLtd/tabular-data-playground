# Migration plan: `backlog.md` → GitHub Project Board

Source of the target methodology: <https://github.com/DeepBlueCLtd/backlog-navigator>
(`METHODOLOGY.md` and `docs/adopt-methodology.md`).

This file is an investigation deliverable, not a runbook executed yet.
Nothing here has been applied to the repo.

## Why the switch

`backlog.md` served us through v1.0. Going forward the project-board model
promoted by `backlog-navigator` provides:

- GitHub Issues as backlog items, one Project per repo as the view.
- A clean separation between **Status** (human-controlled state machine)
  and **Phase** (orchestrator-controlled spec-kit progression).
- A polling orchestrator (`/loop 15m /backlog-poll`) that advances Phase
  by invoking the right `speckit-*` skill, leaving Status drags to a
  maintainer.
- A two-branch-per-issue flow (design PR, then implementation PR) instead
  of the current one-branch-per-epic flow.

## Current state of this repo (2026-05-17)

- `backlog.md` is fully struck through; every item E0–E3 and #1–#57 plus
  the post-v1.0 #48 tab-autocomplete row is `complete`.
- `v1.0` is tagged.
- `.claude/skills/` already holds `speckit-*` skills.
- `.specify/` is initialised; `specs/<NNN-slug>/` exists for every item.
- `CLAUDE.md` codifies an **epic-mode** workflow (one branch per epic,
  single PR). That conflicts with the new model and will be rewritten.

Net effect: **no open backlog items to migrate**. Migration is archival
plus infrastructure bootstrap.

## Target model (recap from `METHODOLOGY.md`)

**Status (maintainer):** `Triage → In Design → Ready → Doing → Done`.

**Phase (orchestrator):** `(empty) → Spec drafting → Plan drafting →
Tasks drafting → (Decomposing, epics only) → Designed → Implementing`.

**Project fields:** `Status, Phase, Owner, Category, Complexity, V, M, A,
Total` (Total = V + M + A, recomputed each tick).

**Branches per issue:**
- Design branch `<NNN>-<slug>` — accumulates spec, plan, tasks; design PR
  merges when Phase = Designed.
- Implementation branch `<NNN>-<slug>-impl` — implementation PR with
  `Closes #NNN`; merges after review.

**Orchestration:** long-lived Claude Code session running
`/loop 15m /backlog-poll`. Decisions key off the API Phase field, never
working-tree state.

## Step-by-step plan

### 1. Bootstrap infrastructure

From the repo root:

```sh
gh auth refresh -s repo,project,read:org   # if needed
curl -fsSL https://raw.githubusercontent.com/DeepBlueCLtd/backlog-navigator/main/scripts/setup-project.sh \
  | bash -s DeepBlueCLtd tabular-data-playground "Tabular Data Playground"
```

This creates:

- A public GitHub Project under `DeepBlueCLtd`.
- Eight custom fields (Status, Phase, Owner, Category, Complexity,
  V, M, A, Total).
- `.github/ISSUE_TEMPLATE/backlog-item.yml` — minimal "Description" only.
- `.claude/backlog-poll.config.json` — orchestrator config.
- `.claude/skills/backlog-worker-start/SKILL.md` and
  `.claude/skills/backlog-poll/SKILL.md`.

The upstream script also drops in `.github/workflows/add-to-project.yml`
(an `actions/add-to-project@v1` workflow). **Delete that file** before
committing — this repo uses the Project's built-in *Auto-add to project*
workflow instead, which avoids needing a `PROJECT_TOKEN` PAT (see
step 2). The built-in workflow does the same job:
`org-level write to a v2 Project from a repo-level event`.

```sh
rm -f .github/workflows/add-to-project.yml
```

Verify:

```sh
ls .claude/backlog-poll.config.json \
   .claude/skills/backlog-worker-start/SKILL.md \
   .claude/skills/backlog-poll/SKILL.md \
   .github/ISSUE_TEMPLATE/backlog-item.yml

gh project field-list <project-number> --owner DeepBlueCLtd \
  | jq -r '.fields[].name' | sort
```

Expected field list: `A, Category, Complexity, M, Owner, Phase, Status,
Total, V`.

> The setup script pulls `backlog-poll` and `backlog-worker-start` from
> `main`. Consider pinning to a commit SHA after bootstrap so the
> orchestrator skills don't drift.

### 2. GitHub UI configuration (cannot be scripted)

At `https://github.com/orgs/DeepBlueCLtd/projects/<n>`:

1. Settings → Status field → Manage options. Order **must** be:
   `Triage, In Design, Ready, Doing, Done`.
2. Project Workflows (top-right):
   - **Auto-add to project** → enable; add
     `DeepBlueCLtd/tabular-data-playground`; filter `is:issue`
     (drop the PR filter unless you want PRs on the board too).
   - **Item added to project** → enable, Status = Triage.
   - **Item closed** → enable, Status = Done.
3. Smoke test: open a throwaway issue; confirm it appears in `Triage`
   within ~30 s; close it; confirm it moves to `Done`.

No PAT, no repo secret, no `.github/workflows/add-to-project.yml`. The
three built-in Project workflows above are the whole intake chain.

### 3. Spec-kit re-init (probably a no-op)

Spec-kit is already installed in `.claude/skills/speckit-*/` and
`.specify/`. Re-run only if the orchestrator skills depend on a newer
skill manifest:

```sh
uv tool run --from git+https://github.com/github/spec-kit.git \
    specify init . --integration claude --force
```

### 4. Archive `backlog.md`

Move the file rather than delete it; the historical scoring and item
descriptions are valuable context.

```sh
mkdir -p docs/history
git mv backlog.md docs/history/backlog.md.archived
```

Add a short banner at the top of the archived file noting the cutover
date and pointing to the Project board URL.

### 5. Update `README.md`

Add a "Project board" link near the top. The methodology recommends
prominent linking since the Project is public.

### 6. Rewrite `CLAUDE.md`

The current `CLAUDE.md` is built around epic-mode (one branch per epic,
single PR at close). That model is incompatible with the orchestrator's
per-issue, two-branch flow. Rewrite:

- **Keep:** Authoritative documents list (drop `backlog.md`, point at
  the Project board URL instead); constitution gates section;
  spec-driven principle.
- **Replace:** "The per-item cycle" and "Working a whole epic in one
  pass" sections with:
  - The Status state machine and who controls each transition.
  - The Phase decision table from `METHODOLOGY.md`.
  - The two-branch-per-issue rule (`<NNN>-<slug>` then
    `<NNN>-<slug>-impl`).
  - The Epic → sub-issue convention (`/speckit-taskstoissues`).
  - Pointer to the `backlog-poll` / `backlog-worker-start` skills.
- **Delete:** strikethrough/Updated-date conventions specific to
  `backlog.md`; the `docs(#<id>): spec/plan/tasks` per-item commit
  prescription (still fine as a habit, but no longer required by a
  flat-file backlog).

### 7. Start a worker

In a long-lived Claude Code session:

```
/backlog-worker-start
```

Expected: petname identity assigned, `/loop 15m /backlog-poll` started.
Now file the first real issue and watch the Phase field advance.

## Open questions and caveats

- **Long-lived session requirement.** `/backlog-poll` only runs while a
  Claude Code session is alive. If the project goes dormant, Phase
  advancement halts; nothing breaks, but tickets sit. Trade-off is
  spelled out in `METHODOLOGY.md` — webhooks were rejected on purpose.
- **Skill drift.** `backlog-poll` and `backlog-worker-start` are pulled
  from `backlog-navigator@main` at install time. After bootstrap,
  consider committing a pinned copy under `.claude/skills/` or recording
  the upstream SHA somewhere referenced by the constitution.
- **Public Project visibility.** The methodology defaults to public.
  Confirm this is fine for `tabular-data-playground` before bootstrap;
  it almost certainly is (the repo is already public, v1.0 is shipped),
  but flag it explicitly.
- **No auto-merge.** Both design PR and implementation PR require human
  review. Don't try to short-circuit this on the first run.
- **Constitution amendments.** `.specify/memory/constitution.md`
  currently references `backlog.md` and the epic-mode workflow. After
  CLAUDE.md is rewritten, sweep the constitution for the same wording
  and amend in the same change (per the spec's "spec.md wins, amend
  constitution to align" rule).

## What this plan deliberately omits

- **Migration of completed items as closed issues.** Skipped — the
  archived markdown serves history better than ~58 closed issues would,
  and there are no open items to file.
- **Running the bootstrap script in this session.** Skipped per user
  decision. The script needs an interactive PAT and creates a public
  Project; better done by a human with their own credentials.

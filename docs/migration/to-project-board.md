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

### 1. Infrastructure already in-tree

The bootstrap-script approach has been **replaced** by vendoring the
relevant files directly. The following are already committed on
`claude/investigate-project-board-Wnzjy`:

- `.github/ISSUE_TEMPLATE/backlog-item.yml` — minimal "Description" only.
- `.claude/backlog-poll.config.json.example` — template; copy to
  `.claude/backlog-poll.config.json` and fill in `project_number` once
  the Project exists.
- `.claude/skills/backlog-poll/SKILL.md` and
  `.claude/skills/backlog-worker-start/SKILL.md` — orchestrator skills.
- `.claude/skills/UPSTREAM.md` — records the upstream SHA the skills
  were pinned to (`cb93f13680526349dbcfadb0891215cec11797e6` as of
  2026-05-17) and how to update.
- `.claude/skills/epic/` — **removed**; obsolete under the per-issue
  model.

The upstream `setup-project.sh` is **not** run. Skipping it avoids the
`actions/add-to-project@v1` workflow (which needs a `PROJECT_TOKEN`
PAT) and the silent-skill-fetch (which would un-pin the orchestrator).

### 2. Create the Project and its fields

You need a Project (with eight custom fields) and the `Owner` to write
into the config file. Two ways to do this; pick one.

#### 2a. Via `gh` CLI (faster, fewer clicks)

Requires `gh` auth scopes `repo, project, read:org`:

```sh
gh auth refresh -s repo,project,read:org   # if needed
PROJECT_JSON=$(gh project create --owner DeepBlueCLtd \
  --title "Tabular Data Playground" --format json)
PROJECT_NUMBER=$(echo "$PROJECT_JSON" | jq -r '.number')
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')
echo "Project #$PROJECT_NUMBER created."

# Eight custom fields (Status is created by default; the other eight
# we add here):
gh project field-create "$PROJECT_NUMBER" --owner DeepBlueCLtd \
    --name "Owner" --data-type TEXT
gh project field-create "$PROJECT_NUMBER" --owner DeepBlueCLtd \
    --name "Phase" --data-type SINGLE_SELECT \
    --single-select-options "Spec drafting,Plan drafting,Tasks drafting,Decomposing,Designed,Implementing"
gh project field-create "$PROJECT_NUMBER" --owner DeepBlueCLtd \
    --name "Category" --data-type SINGLE_SELECT \
    --single-select-options "Feature,Enhancement,Tech Debt,Bug,Documentation,Spike"
gh project field-create "$PROJECT_NUMBER" --owner DeepBlueCLtd \
    --name "Complexity" --data-type SINGLE_SELECT \
    --single-select-options "Low,Medium,High"
for f in V M A Total; do
  gh project field-create "$PROJECT_NUMBER" --owner DeepBlueCLtd \
      --name "$f" --data-type NUMBER
done

# Make the Project public (required by the methodology):
gh api graphql -f query='
mutation($projectId: ID!) {
  updateProjectV2(input: { projectId: $projectId, public: true }) {
    projectV2 { id public }
  }
}' -f projectId="$PROJECT_ID"
```

#### 2b. Via the UI

`https://github.com/orgs/DeepBlueCLtd/projects/new` → blank Project →
title "Tabular Data Playground" → Settings (⋯) → Visibility: Public →
add each of the eight fields manually with the names, types, and
options listed above.

### 3. Configure Status options and built-in workflows (UI)

At `https://github.com/orgs/DeepBlueCLtd/projects/<n>`:

1. Settings → Status field → Manage options. Order **must** be:
   `Triage, In Design, Ready, Doing, Done`.
2. Workflows (top-right):
   - **Auto-add to project** → enable; add
     `DeepBlueCLtd/tabular-data-playground`; filter `is:issue`
     (drop the PR filter unless you want PRs on the board too).
   - **Item added to project** → enable, Status = Triage.
   - **Item closed** → enable, Status = Done.
3. Smoke test: open a throwaway issue; confirm it appears in `Triage`
   within ~30 s; close it; confirm it moves to `Done`.

No PAT, no repo secret, no `.github/workflows/add-to-project.yml`. The
three built-in Project workflows above are the whole intake chain.

### 4. Wire up the orchestrator config

```sh
cp .claude/backlog-poll.config.json.example .claude/backlog-poll.config.json
# Edit and replace project_number: 0 with the real number from step 2.
```

Verify the orchestrator's preflight will succeed:

```sh
jq '.' .claude/backlog-poll.config.json   # must parse, project_number > 0
ls .specify/                              # spec-kit must be present
```

### 5. Update README.md with the real Project URL

`README.md` currently has a placeholder:

> Replace this line with the Project URL once the board is created.

Edit the "GitHub Project board" bullet under "Further reading" and put
the actual Project URL in place.

### 6. Already done on this branch

The following are committed on
`claude/investigate-project-board-Wnzjy` and do not need redoing:

- `backlog.md` → `docs/history/backlog.md.archived` with banner.
- `CLAUDE.md` rewritten for the Status/Phase state machines and the
  two-branch convention. Epic-mode workflow removed.
- `README.md` "Further reading" rewritten (still needs the URL fill-in
  above).
- `.github/ISSUE_TEMPLATE/backlog-item.yml`,
  `.claude/backlog-poll.config.json.example`,
  `.claude/skills/backlog-poll/`,
  `.claude/skills/backlog-worker-start/`,
  `.claude/skills/UPSTREAM.md` added.
- `.claude/skills/epic/` removed.

### 7. Merge this branch to main

The branch is the cutover. Once it lands on `main`, the methodology is
live for any new issue filed on the Project.

### 8. Start a worker

In a long-lived Claude Code session at the repo:

```
/backlog-worker-start
```

Expected: petname identity assigned, `/loop 15m /backlog-poll` started.
File the first real issue and watch the Phase field advance.

## Open questions and caveats

- **Long-lived session requirement.** `/backlog-poll` only runs while a
  Claude Code session is alive. If the project goes dormant, Phase
  advancement halts; nothing breaks, but tickets sit. Trade-off is
  spelled out in `METHODOLOGY.md` — webhooks were rejected on purpose.
- **Skill drift.** Pinned to upstream SHA
  `cb93f13680526349dbcfadb0891215cec11797e6` in
  `.claude/skills/UPSTREAM.md`. Update procedure documented there.
- **Public Project visibility.** The methodology defaults to public.
  Confirm this is fine before step 2; the repo is already public and
  v1.0 is shipped, so it almost certainly is.
- **No auto-merge.** Both design PR and implementation PR require human
  review. Don't try to short-circuit this on the first run.
- **Constitution sweep.** `.specify/memory/constitution.md` was checked
  during the doc updates and contains no `backlog.md` or epic-mode
  references, so no amendment is needed. Re-verify if anything else
  changes that touches those concepts.

## What this plan deliberately omits

- **Migration of completed items as closed issues.** Skipped — the
  archived markdown serves history better than ~58 closed issues would,
  and there are no open items to file.
- **Running setup-project.sh in this session.** Replaced by vendoring.
  The script's only non-vendorable side-effect — creating the GitHub
  Project itself — is now step 2, which needs the user's own `gh`
  credentials or UI clicks.

# Vendored orchestrator skills

The `backlog-poll/` and `backlog-worker-start/` skills under this
directory are **vendored** from the upstream methodology repo. They are
not first-party to this codebase; treat them as third-party source that
happens to live in-tree.

## Source

- Repo: <https://github.com/DeepBlueCLtd/backlog-navigator>
- Branch: `main`
- Pinned commit: `cb93f13680526349dbcfadb0891215cec11797e6`
- Vendored on: 2026-05-17

Files vendored:

- `backlog-poll/SKILL.md`
- `backlog-worker-start/SKILL.md`

## Why vendored instead of fetched at install time

The upstream `setup-project.sh` fetches these skills from `main` at
install time, which means the orchestrator could silently change
behaviour on any upstream commit. Vendoring pins behaviour to a known
SHA and makes upgrades visible in the diff.

## Updating

To pull a newer version of the skills:

```sh
SHA=<new-sha>
for skill in backlog-poll backlog-worker-start; do
  curl -fsSL "https://raw.githubusercontent.com/DeepBlueCLtd/backlog-navigator/${SHA}/.claude/skills/${skill}/SKILL.md" \
    -o ".claude/skills/${skill}/SKILL.md"
done
```

Then update the **Pinned commit** line above to `<new-sha>` in the same
commit. Review the diff carefully — these skills are what the polling
loop executes against the Project.

## Do not edit in place

Local edits to vendored skill files will be overwritten on the next
update. If you need a behaviour change, fork upstream or wrap the skill
with a local one rather than editing the vendored file.

# Tasks: CI on PR (Backlog #33)

- [X] T001 Create `.github/workflows/ci.yml` per plan.
- [X] T002 Validate YAML syntax (basic parse via `python -c "import yaml; yaml.safe_load(...)"` or grep).
- [X] T003 Strikethrough `#33` in `backlog.md`.
- [X] T004 Three commits: feat(#33), docs(#33), docs: backlog status.
- [X] T005 Push and let GitHub Actions execute the workflow on the epic branch's next PR (when E1 closes). The first execution is implicit; a green run is verified by reviewers when the PR opens.

> Note: This item cannot fully self-verify on a feature branch — the workflow runs only on PR or push-to-main. Local YAML validity + sensible action pins is the verification surface. SC-001/SC-002 (run-time budgets) are observed when the epic PR opens.

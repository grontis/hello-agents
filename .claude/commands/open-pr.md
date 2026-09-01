---
description: Pull request stage. Pushes the branch and opens a PR described from the plan, review and QA report. The last stage of the pipeline.
argument-hint: "[extra context for the PR description]"
disable-model-invocation: true
---

Use the pr subagent to push the branch and open the pull request.

**Handoff rule (read before invoking):** This is the final serial stage of the pipeline (architect → coder → code-reviewer → qa → pr). Run only the pr subagent this turn. When it finishes, present its report and the pull request URL and **STOP** — there is no next stage.

Read the QA report from `.agentwork/qa/` — verify `status` is `pass` or `pass-with-notes` before opening anything. Read the code review from `.agentwork/code-review/`, the implementation summary from `.agentwork/coder/`, and the architect plan from `.agentwork/architect/`; those four documents are what the pull request description is written from. Read `.agentwork/session.yaml` for artifact paths. Use templates from `.claude/templates/`.

Run the preflight checks before touching the remote: on a feature branch, no uncommitted changes to tracked files, at least one commit ahead of the base. Any failure means `status: blocked` and no push. Never force-push. Save the report to `.agentwork/pr/`, with the URL `gh` printed in its front matter.

Additional context: $ARGUMENTS

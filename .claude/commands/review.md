Use the code-reviewer subagent to review the current implementation.

Read the coder's implementation summary from `.agentwork/coder/` — verify it has `status: implemented`. Read the architect plan from `.agentwork/architect/` if it exists. Read `.agentwork/session.yaml` for artifact paths. Use templates from `.claude/templates/`.

Review all modified files for bugs, security issues, anti-patterns, and plan adherence. Save the review report to `.agentwork/code-review/`.

Additional context: $ARGUMENTS

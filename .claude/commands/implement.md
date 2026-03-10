Use the coder subagent to implement the approved plan.

Read the implementation plan from `.agentwork/architect/` — verify it has `status: ready`. Read `.agentwork/session.yaml` for artifact paths. Use templates from `.claude/templates/`.

Before implementing, check for review/QA reports:

1. If there is a code review report in `.agentwork/code-review/` with `status: changes-required`, read it and present a summary of findings to the user. **Wait for the user to confirm** before proceeding to fix the issues.
2. If there is a QA report in `.agentwork/qa/` with `status: fail`, read it and present a summary of failures to the user. **Wait for the user to confirm** before proceeding to fix the issues.
3. If both exist, present both summaries together and wait for confirmation once.

Only after the user confirms (or if no reports exist), proceed with implementation.

Write unit tests, verify all pass. Save implementation summary to `.agentwork/coder/`.

Additional context: $ARGUMENTS

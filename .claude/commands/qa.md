Use the qa subagent to verify the implementation.

Read the coder's summary from `.agentwork/coder/` — verify `status: implemented`. Read the architect plan and code review report if they exist. Read `.agentwork/session.yaml` for artifact paths. Use templates from `.claude/templates/`.

Run all existing tests, write and run integration tests, validate every requirement from the plan. Save the QA report to `.agentwork/qa/`. If the feature has user-facing behavior, also create a manual QA guide.

Additional context: $ARGUMENTS

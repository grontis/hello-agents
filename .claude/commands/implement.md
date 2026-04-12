Use the coder subagent to implement the approved plan.

**Handoff rule (read before invoking):** This is one serial stage of a four-stage pipeline (architect → coder → code-reviewer → qa). Run only the coder subagent this turn. When it finishes, present its summary and artifact path and **STOP** — do not invoke `/code-review` or `/qa` in the same turn, even if the change looks trivial, and never launch them in parallel with this stage. Wait for explicit user approval before moving to any next stage.


Read the architect plan from `.agentwork/architect/PLAN_[slug]_YYYY-MM-DD.md` — verify `status: ready`. The Selected Approach section is the source of truth (implementation steps, acceptance criteria, testing strategy). There is no separate implementation-plan file.

Read `.agentwork/session.yaml` for artifact paths. Use templates from `.claude/templates/`.

Before implementing, check for review/QA reports:

1. If there is a code review report in `.agentwork/code-review/` with `status: changes-required`, read it and present a summary of findings to the user. **Wait for the user to confirm** before proceeding to fix the issues.
2. If there is a QA report in `.agentwork/qa/` with `status: fail`, read it and present a summary of failures to the user. **Wait for the user to confirm** before proceeding to fix the issues.
3. If both exist, present both summaries together and wait for confirmation once.

Only after the user confirms (or if no reports exist), proceed with implementation. If the request came straight from the user (no plan exists — typical for trivial changes the architect redirected here), implement directly from the user's instructions.

Write unit tests, verify all pass. Save implementation summary to `.agentwork/coder/`.

Additional context: $ARGUMENTS

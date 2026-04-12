Use the qa subagent to verify the implementation.

**Handoff rule (read before invoking):** This is one serial stage of a four-stage pipeline (architect → coder → code-reviewer → qa). Run only the qa subagent this turn. When it finishes, present its report and verdict and **STOP** — do not invoke `/implement` or `/code-review` in the same turn, even if QA passes, and never launch them in parallel with this stage. Wait for explicit user approval before any follow-up stage.


Read the coder's summary from `.agentwork/coder/` — verify `status: implemented`. Read the architect plan from `.agentwork/architect/PLAN_[slug]_YYYY-MM-DD.md` if it exists — the Selected Approach section's Acceptance Criteria is what you validate against. Read the code review report if one exists. Read `.agentwork/session.yaml` for artifact paths. Use templates from `.claude/templates/`.

Run all existing tests, write and run integration tests, validate every acceptance criterion from the plan. Save the QA report to `.agentwork/qa/`. If the feature has user-facing behavior, also create a manual QA guide.

Additional context: $ARGUMENTS

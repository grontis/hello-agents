Use the code-reviewer subagent to review the current implementation.

**Handoff rule (read before invoking):** This is one serial stage of a four-stage pipeline (architect → coder → code-reviewer → qa). Run only the code-reviewer subagent this turn. When it finishes, present its report and verdict and **STOP** — do not invoke `/implement` or `/qa` in the same turn, even if the review passes cleanly, and never launch them in parallel with this stage. Wait for explicit user approval before moving to any next stage.


Read the coder's implementation summary from `.agentwork/coder/` — verify it has `status: implemented`. Read the architect plan from `.agentwork/architect/PLAN_[slug]_YYYY-MM-DD.md` if it exists — the Selected Approach section defines what was supposed to be built. Read `.agentwork/session.yaml` for artifact paths. Use templates from `.claude/templates/`.

Review all modified files for bugs, security issues, anti-patterns, and plan adherence. Save the review report to `.agentwork/code-review/`.

Additional context: $ARGUMENTS

Explore solutions for this task and produce a single plan document.

$ARGUMENTS

**Routing:**
- If `$ARGUMENTS` contains the flag `--deep`, invoke the **`architect-deep`** subagent (Opus-backed, for complex or cross-cutting design work). Strip the `--deep` token from the task description you pass to the subagent.
- Otherwise, invoke the **`architect`** subagent (Sonnet-backed, default).

Both variants follow the same workflow: read `.agentwork/session.yaml`, run complexity triage first, scope research to the complexity level, and save a single `PLAN_[slug]_YYYY-MM-DD.md` artifact to `.agentwork/architect/` using the template at `.claude/templates/ARCHITECT_PLAN_TEMPLATE.md`.

After the architect presents solutions (medium/large) or a single proposal (small), wait for me to confirm before finalizing the plan to `status: ready`. Trivial requests should be redirected straight to `/implement` with no plan document.

**Handoff rule (read before invoking):** This is one serial stage of a four-stage pipeline (architect → coder → code-reviewer → qa). Run only the architect subagent this turn. When it finishes, present its plan summary and **STOP** — do not invoke `/implement`, `/code-review`, or `/qa` in the same turn, and never launch them in parallel with this stage. Wait for my explicit approval before moving to any next stage.

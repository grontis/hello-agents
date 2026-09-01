---
description: Task-generation stage. Turns the approved project spec into TASKS.yaml for human review. One-shot.
argument-hint: "[extra context for planning]"
disable-model-invocation: true
---

Use the task-planner subagent to generate proposed tasks from the project spec.

**Handoff rule (read before invoking):** This is one serial stage of the project pipeline (spec conversation → task generation). Run only the task-planner subagent this turn. When it finishes, present its summary and **STOP** — the batch is reviewed and applied from the app, not from the terminal, and nothing here creates tasks.

Read the project spec from `.agentwork/spec-author/` — verify `status: proposed` before planning; tasks derived from an unapproved spec answer a question nobody asked yet. Read `.agentwork/CHANGES_REQUESTED.md` if present — a revision means a human rejected the previous batch and that file says why. Read `.agentwork/session.yaml` for artifact paths. Follow `.claude/templates/TASKS_TEMPLATE.yaml` exactly: the file is machine-ingested and rejected whole on any deviation.

Save to `.agentwork/task-planner/TASKS_[slug]_YYYY-MM-DD.yaml` with `status: proposed` — or `status: blocked` naming what is missing, when the spec is too vague to derive tasks from honestly.

Additional context: $ARGUMENTS

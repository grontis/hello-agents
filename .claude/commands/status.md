---
description: Report current pipeline status from session.yaml, the progress log, and each artifact's status.
disable-model-invocation: true
---

Check the current pipeline status.

1. Read `.agentwork/session.yaml` if it exists — report the current `feature_slug` and which artifacts exist. If it does not exist, there is no active pipeline session; say so and stop.
2. Read the last several rows of `.agentwork/progress-log.md` if it exists — summarize the most recent activity. If it does not exist, no pipeline agent has run yet.
3. For each existing artifact listed in `session.yaml`, read its `status` field from the YAML front matter.
4. Summarize: which pipeline stages are complete, what the current stage is, and what the logical next step would be.

Present a concise status table and recommend the next action.

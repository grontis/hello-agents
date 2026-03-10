Check the current pipeline status.

1. Read `.agentwork/session.yaml` if it exists — report the current feature and which artifacts exist.
2. Read `.agentwork/progress-log.md` if it exists — show the most recent entries.
3. For each existing artifact, read its `status` field from the YAML front matter.
4. Summarize: which pipeline stages are complete, what the current stage is, and what the logical next step would be.

Present a concise status table and recommend the next action.

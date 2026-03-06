## Artifact System

Agents communicate through markdown artifacts in `.agentwork/`:

```
.agentwork/
├── architect/      # SOLUTIONS_[slug]_YYYY-MM-DD.md
├── coder/          # IMPLEMENTATION_[slug]_YYYY-MM-DD.md
├── code-review/    # CODE_REVIEW_[slug]_YYYY-MM-DD.md
├── qa/             # QA_REPORT_[slug]_YYYY-MM-DD.md
├── session.yaml    # Active feature state — read this first
└── progress-log.md # Cross-agent audit trail
```

Each agent reads previous agents' artifacts for context instead of relying on chat history.

**Artifact Rules:**
- **Naming:** `[TYPE]_[feature-slug]_YYYY-MM-DD.md`
- **Location:** Always save to your agent's subdirectory under `.agentwork/`
- **References:** When handing off, specify the full artifact path
- **Templates:** Read from `.github/agents/templates/` for report structure

## Session State

`.agentwork/session.yaml` tracks the current feature and artifact paths so agents don't need to glob:

```yaml
feature_slug: my-feature
artifacts:
  architect: .agentwork/architect/SOLUTIONS_my-feature_2026-03-06.md
  coder: .agentwork/coder/IMPLEMENTATION_my-feature_2026-03-06.md
  code_review: ~
  qa: ~
```

Read this file first in every Context section. Each agent writes its artifact path into the relevant field after saving.

## Context Isolation

Base all work exclusively on the files referenced in your Context section. Disregard any prior conversation history, chat messages, or context from previous agent interactions. Only read artifacts relevant to your role and the current pipeline stage.

## Gateway Checks

Before doing any work, verify that your required input file has the expected status in its YAML front matter (each agent's Context section specifies the exact status to check). If the status does not match, stop and ask the user how to proceed. Do not guess, assume, or proceed with incomplete inputs.

## Status Management

Each artifact document has a `status` field in its YAML front matter. When your work is complete, set the `status` field to the appropriate terminal status as defined in your agent's workflow. Never flip the status before the document is fully written.

## Revision Tracking & Circuit Breakers

Documents that go through review cycles track a `revision` field in YAML front matter. Each cycle increments the revision. **If a document reaches revision 3 or greater, stop.** Summarize the unresolved points of disagreement and present them to the user to decide how to proceed.

## File Scope

Only modify the files explicitly listed in your agent's Rules section. Never modify files owned by other agents, even if you can see them.

## Output Self-Validation

Before marking any document as complete, re-read your output and verify that every section defined in the template has been filled in. If any section is empty or contains only template placeholder text, do not mark the document as done — finish the section or document why it was intentionally left empty.

## Progress Tracking

Every agent must update `.agentwork/progress-log.md` at two points during execution:

1. **On start** — Append a row: `| <ISO 8601 timestamp> | <Agent Name> | Started | — | <what you are about to do> |`
2. **On finish** — Append a row: `| <ISO 8601 timestamp> | <Agent Name> | Completed/Stopped/Escalated | <brief result> | <additional context> |`

This file is append-only. Never edit or remove existing entries. If the file does not exist, create it with the table header:
```
| Timestamp | Agent | Action | Outcome | Details |
|-----------|-------|--------|---------|---------|
```

## User Checkpoints

Three non-negotiable checkpoints where the user decides:
1. **After Architect** — user selects a solution
2. **After Code Reviewer** — user accepts review or requests changes
3. **After QA** — user accepts results or requests fixes

Never skip these. The user is always in control.

## Code Standards

- Follow existing project patterns and conventions over personal preference
- Match the code style already present in the codebase
- Don't introduce new dependencies without justification
- Validate inputs at boundaries, handle errors explicitly
- Write for readability and maintainability

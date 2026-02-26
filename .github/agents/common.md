# Shared Agent Context

## Artifact System

Agents communicate through markdown artifacts in `.agentwork/`:

```
.agentwork/
├── architect/      # SOLUTIONS_[slug]_YYYY-MM-DD.md
├── coder/          # IMPLEMENTATION_[slug]_YYYY-MM-DD.md
├── code-review/    # CODE_REVIEW_[slug]_YYYY-MM-DD.md
└── qa/             # QA_REPORT_[slug]_YYYY-MM-DD.md
```

Each agent reads previous agents' artifacts for context instead of relying on chat history.

## Gather Context (All Agents)

Before starting work:
1. Read the Architect's plan from `.agentwork/architect/` (if it exists)
2. Read the Coder's implementation summary from `.agentwork/coder/` (if applicable)
3. Read the Code Review report from `.agentwork/code-review/` (if applicable)
4. Note any deviations flagged by previous agents

Only read artifacts relevant to your role and the current pipeline stage.

## Artifact Rules

- **Naming:** `[TYPE]_[feature-slug]_YYYY-MM-DD.md`
- **Location:** Always save to your agent's subdirectory under `.agentwork/`
- **References:** When delegating or handing off, specify the full artifact path
- **Templates:** Read from `.github/agents/templates/` for report structure

## Agent Handoff Protocol

Every handoff must include:
- What to do
- Where to find relevant artifacts
- Where to save output
- Constraints from previous steps

## User Checkpoints

Three non-negotiable checkpoints where the user decides:
1. **After Architect** — user selects a solution
2. **After Code Reviewer** — user accepts review or requests changes
3. **After QA** — user accepts results or requests fixes

Never skip these. The user is always in control.

## Code Standards (All Agents)

- Follow existing project patterns and conventions over personal preference
- Match the code style already present in the codebase
- Don't introduce new dependencies without justification
- Validate inputs at boundaries, handle errors explicitly
- Write for readability and maintainability

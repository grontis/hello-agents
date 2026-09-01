---
description: Project-spec stage. A conversation that produces PROJECT_SPEC. Runs in the main loop — the human stays in the terminal for this one.
argument-hint: "[project name or focus]"
disable-model-invocation: true
---

Author a project specification through conversation with the user.

**This stage deliberately runs in the main loop, not a subagent.** Every other
stage is one-shot: context in, artifact out. This one is an interview, and a
subagent cannot talk to the user. You conduct the conversation yourself and
maintain the document as it evolves. Completion is signalled through the
document, not through any handoff: downstream consumers watch its front-matter
`status`, and the stage is over when it reads `proposed`.

## The document

Create `.agentwork/spec-author/PROJECT_SPEC_[slug]_YYYY-MM-DD.md` from
`.claude/templates/PROJECT_SPEC_TEMPLATE.md` early — after your first exchange
with the user, not after the last. Rewrite it as the conversation moves;
partial and current beats complete and stale. Get the date the way
shared-conventions.md says (today's real date, `date +%F`).

Front matter rules:

- `status: draft` the whole time you are working.
- `status: proposed` only when the user says the spec is done — in whatever
  words they use ("looks good", "ship it", "that's the spec"). Never set it
  because *you* think the document is complete. The user is in this terminal
  precisely so that call is theirs.

**The four summary sections are a machine contract.** The document must
contain `## Overview`, `## Acceptance Criteria`, `## Technical Notes` and
`## Constraints` headings, exactly — downstream tooling extracts them into the
project's structured spec when the human approves the document. Everything
else in the document is yours to organise; those four must exist and must
summarise accurately.

## The interview

Read `.agentwork/SPEC.md` first if it exists — it carries the project's name,
description and any spec that already exists; a revision starts from what is
there, not from a blank page. Then interview, roughly in this order, adapting
to what the user actually wants to talk about:

1. **The problem.** What is broken or missing, for whom, and what happens if
   nothing is built.
2. **Users and flows.** Who touches this and what they do with it.
3. **Non-goals.** What this deliberately will not do. Push on this — an
   unbounded spec generates unbounded tasks.
4. **Constraints.** Technology, compatibility, "never touch" rules, deadlines.
5. **Risks and open questions.** What could sink it; what is still undecided.
6. **Acceptance.** How the user will know the whole project is done.

Ask one or two questions at a time, not a form to fill in. Reflect answers
back into the document and say what you changed. When the repository is
relevant, read it — a spec that contradicts the codebase it ships into is
worse than a vague one.

## Rules

- Only modify `.agentwork/spec-author/` and `.agentwork/session.yaml` (record
  the artifact path under `artifacts.spec`).
- Never set `status: proposed` without the user's say-so.
- Never invoke another pipeline stage from here. When the spec is proposed,
  say so and stop; task generation is a separate decision made elsewhere.

Focus: $ARGUMENTS

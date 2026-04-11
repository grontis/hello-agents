# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This repository contains **no application code, build system, or test suite**. It is a collection of Claude Code configuration — subagent definitions, slash commands, report templates, and a domain skill. The "source code" is the prompts and conventions themselves. Treat `.md` files as the deliverable.

When asked to "build", "test", or "run" something, clarify with the user — there is nothing to compile. Verification here means reading the markdown for internal consistency against `shared-conventions.md`.

## The 4-agent pipeline

`.claude/agents/` defines a four-stage development pipeline invoked via slash commands in `.claude/commands/`:

| Stage | Agent | Command | Model | Writes to |
|---|---|---|---|---|
| Design | `architect` | `/architect <feature>` | sonnet | `.agentwork/architect/PLAN_<slug>_<date>.md` |
| Design (deep) | `architect-deep` | `/architect --deep <feature>` | opus | `.agentwork/architect/PLAN_<slug>_<date>.md` |
| Build  | `coder`     | `/implement`           | sonnet | `.agentwork/coder/IMPLEMENTATION_<slug>_<date>.md` |
| Review | `code-reviewer` | `/code-review`     | haiku | `.agentwork/code-review/CODE_REVIEW_<slug>_<date>.md` |
| Verify | `qa`        | `/qa`                  | sonnet | `.agentwork/qa/QA_REPORT_<slug>_<date>.md` |

`/status` reports current pipeline progress. Each agent runs as an isolated subprocess — it does **not** see chat history and communicates only through artifact files.

**Architect model tiering:** The default `architect` runs on Sonnet. The Opus-backed `architect-deep` variant is opt-in via `/architect --deep` and is for genuinely complex system design. `architect-deep.md` reads `architect.md` at runtime so there is one canonical workflow.

**Single plan document:** The architect produces one `PLAN_<slug>_<date>.md` per feature. It holds the complexity triage, solution proposals (when the complexity is medium/large), the selected approach, and the detailed implementation steps. Its `status` field progresses `draft` → `proposed` → `ready` (or `changes-required` on revision cycles). Do **not** reintroduce a separate implementation-plan file.

## The artifact protocol (critical context)

The pipeline's coherence depends on a shared protocol documented in `.claude/agents/shared-conventions.md`. Any change to an agent file must stay consistent with this document. Key invariants:

- **`.agentwork/session.yaml`** is the entry point — it stores `feature_slug` and artifact paths so agents skip globbing. Every agent reads it first.
- **`.agentwork/progress-log.md`** is an append-only audit trail. Never edit or remove rows.
- **YAML front matter** on every artifact tracks `status` (architect plan: `draft` → `proposed` → `ready` or `changes-required`; reviews/QA: `approved`/`changes-required`/`pass`/`fail`) and `revision`. **Revision ≥ 3 halts the pipeline** and escalates to the user (circuit breaker).
- **Gateway checks**: each agent verifies its input artifact has the expected `status` before starting; mismatch means stop and ask.
- **File scope**: each agent's `Rules` section whitelists the files it may modify. Do not widen this scope casually.
- **User checkpoints are non-negotiable** after architect, code-reviewer, and qa. Agents must STOP and wait; they never auto-invoke the next stage. The words "invoke/call/run" in a Next Steps section are instructions to the *user*, not self-directives.

`.agentwork/` is gitignored — it is runtime state, not source.

## When editing agents

- Each agent file has a short "Shared Conventions" preamble duplicating key rules from `shared-conventions.md`. When updating conventions, update both `shared-conventions.md` **and** the preambles in the agent files so they don't drift. (The `architect-deep` variant is exempt — it reads `architect.md` at runtime and has no preamble of its own.)
- Templates in `.claude/templates/` are referenced by path from the agent prompts. Renaming a template requires updating every referring agent and slash command.
- Slash commands in `.claude/commands/` are thin wrappers that delegate to the matching subagent — keep them terse and let the agent definition carry the behavior.
- The `.claude/` tree is intentionally self-contained: it can be copied into any project to get the pipeline. Don't introduce dependencies on paths outside `.claude/`, `.agentwork/`, or `skills/`.

Git status at repo init shows a deleted `.github/agents/` tree — an earlier GitHub Copilot version of the same pipeline was removed. Do not resurrect those paths.

## The game-engine-architect skill

`skills/game-engine-architect/` is an independent skill (not part of the pipeline) providing architectural guidance distilled from Jason Gregory's *Game Engine Architecture* (2nd ed.). `SKILL.md` is the entry point; subsystem-specific guidance lives in `references/` and should be loaded on demand, not preloaded. Citations use the form `[GEA §5.2 / p.239]` — preserve this format when adding content.

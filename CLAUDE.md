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
| Review | `code-reviewer` | `/code-review`     | sonnet | `.agentwork/code-review/CODE_REVIEW_<slug>_<date>.md` |
| Verify | `qa`        | `/qa`                  | sonnet | `.agentwork/qa/QA_REPORT_<slug>_<date>.md` |

`/status` reports current pipeline progress. Each agent runs as an isolated subprocess — it does **not** see chat history and communicates only through artifact files.

**Architect model tiering:** The default `architect` runs on Sonnet. The Opus-backed `architect-deep` variant is opt-in via `/architect --deep` and is for genuinely complex system design. `architect-deep.md` reads `architect.md` at runtime so there is one canonical workflow.

**Single plan document:** The architect produces one `PLAN_<slug>_<date>.md` per feature. It holds the complexity triage, solution proposals (when the complexity is medium/large), the selected approach, and the detailed implementation steps. Its `status` field progresses `draft` → `proposed` → `ready` (or `changes-required` on revision cycles). Do **not** reintroduce a separate implementation-plan file.

## The artifact protocol (critical context)

The pipeline's coherence depends on a shared protocol documented in `.claude/agents/shared-conventions.md`. Any change to an agent file must stay consistent with this document. Key invariants:

- **`.agentwork/session.yaml`** is the entry point — it stores `feature_slug` and artifact paths so agents skip globbing. Every agent reads it first.
- **`.agentwork/progress-log.md`** is an append-only audit trail. It is written **automatically by the `SubagentStart`/`SubagentStop` hooks** (`.claude/hooks/progress-log.mjs`), not by the agents — never edit or remove rows.
- **YAML front matter** on every artifact tracks `status` and `revision`. Canonical status values: architect plan `draft` → `proposed` → `ready` (or `changes-required`); code review `approved`/`changes-required`/`needs-discussion`; QA `pass`/`fail`/`pass-with-notes`. **Revision ≥ 3 halts the pipeline** and escalates to the user (circuit breaker).
- **Gateway checks**: each agent verifies its input artifact has the expected `status` before starting; mismatch means stop and ask. A `UserPromptExpansion` hook (`.claude/hooks/gateway.mjs`) additionally enforces the clearest stage-skips *before* a command runs — but it is deliberately fail-open, so the agent-level prose check remains the real contract.
- **File scope**: each agent's `Rules` section whitelists the files it may modify. Do not widen this scope casually.
- **User checkpoints are non-negotiable** after architect, coder, code-reviewer, and qa. Every handoff stops for user approval regardless of how simple the change looks. Agents must STOP and wait; they never auto-invoke the next stage. The words "invoke/call/run" in a Next Steps section are instructions to the *user*, not self-directives.
- **Pipeline stages run strictly serially.** Never run `/implement`, `/code-review`, and `/qa` in parallel or back-to-back in the same turn. One stage per turn, artifact surfaced, user confirms, then the next stage. This applies to the orchestrator session just as much as to the subagents.

`.agentwork/` is gitignored — it is runtime state, not source.

## When editing agents

- Agent files no longer inline a copy of the shared rules. Each agent's "Shared Conventions" section is a one-line directive to **read `.claude/agents/shared-conventions.md` at runtime** and follow it (the same pattern `architect-deep` uses for `architect.md`). This means `shared-conventions.md` is the *single* place to edit shared rules — there are no preambles to keep in sync, so the old drift hazard is gone. Don't reintroduce inline copies.
- Templates in `.claude/templates/` are referenced by path from the agent prompts. Renaming a template requires updating every referring agent and slash command.
- Slash commands in `.claude/commands/` are thin wrappers that delegate to the matching subagent — keep them terse and let the agent definition carry the behavior.
- The `.claude/` tree is intentionally self-contained: it can be copied into any project to get the pipeline. Don't introduce dependencies on paths outside `.claude/`, `.agentwork/`, or `skills/`.

## Hooks, settings, and memory

- **`.claude/settings.json`** wires three hook events (`SubagentStart`, `SubagentStop`, `UserPromptExpansion`) across two scripts, and grants the pipeline `allow` permissions to `Write`/`Edit` under `.agentwork/**` and `.claude/agent-memory/**` so agents can persist artifacts and memory without a prompt on every run. The hooks are enhancements layered on top of the prose protocol, not replacements for it — all are **fail-open**, so a missing `settings.json` (or a copied tree without it) degrades safely to the prose-only behavior (you'll just be prompted to approve `.agentwork/` writes).
  - `SubagentStart` + `SubagentStop` → `.claude/hooks/progress-log.mjs` auto-maintains `.agentwork/progress-log.md`. Agents must **not** write that file themselves.
  - `UserPromptExpansion` (matcher `implement|code-review|qa`) → `.claude/hooks/gateway.mjs` blocks the clearest stage-skips *before* the command expands (e.g. `/code-review` when the coder summary isn't `implemented`). It blocks only unambiguous violations and allows everything else, including the trivial direct-implement path and fix cycles.
- **Hook scripts are Node (`.mjs`)**, not bash — this keeps the win32-targeted, copy-portable `.claude/` tree cross-platform. They require `node` on the PATH and use the `CLAUDE_PROJECT_DIR` env var for absolute paths.
- **`memory: project`** is set on every pipeline agent so each builds durable, project-specific knowledge across sessions in `.claude/agent-memory/<agent>/MEMORY.md` (gitignored — it is learned runtime state, while the enabling frontmatter is committed). Note the mild tension with the pipeline's context-isolation ethos: memory carries *durable project facts* between runs, not transient chat history. If you want strict per-run reproducibility, remove the `memory` frontmatter.
- **`/status` reads the live state itself** — it instructs the model to read `.agentwork/session.yaml`, the tail of `.agentwork/progress-log.md`, and each artifact's `status` front matter, then summarize. (It deliberately does *not* use `` !`shell` `` context injection: a single command can't both read-a-file-if-present and exit cleanly when absent without control-flow that the injection permission-checker rejects, and shelling out would reintroduce the cross-platform dependency the Node hooks avoid.)

Git status at repo init shows a deleted `.github/agents/` tree — an earlier GitHub Copilot version of the same pipeline was removed. Do not resurrect those paths.

## The game-engine-architect skill

`skills/game-engine-architect/` is an independent skill (not part of the pipeline) providing architectural guidance distilled from Jason Gregory's *Game Engine Architecture* (2nd ed.). `SKILL.md` is the entry point; subsystem-specific guidance lives in `references/` and should be loaded on demand, not preloaded. Citations use the form `[GEA §5.2 / p.239]` — preserve this format when adding content.

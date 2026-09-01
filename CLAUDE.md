# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This repository contains **no application code, build system, or test suite**. It is a collection of Claude Code configuration — subagent definitions, slash commands, report templates, and a domain skill. The "source code" is the prompts and conventions themselves. Treat `.md` files as the deliverable.

When asked to "build", "test", or "run" something, clarify with the user — there is nothing to compile. Verification here means reading the markdown for internal consistency against `shared-conventions.md`.

## The 5-agent pipeline

`.claude/agents/` defines a five-stage development pipeline invoked via slash commands in `.claude/commands/`:

| Stage | Agent | Command | Model | Writes to |
|---|---|---|---|---|
| Design | `architect` | `/architect <feature>` | inherit | `.agentwork/architect/PLAN_<slug>_<date>.md` |
| Design (deep) | `architect-deep` | `/architect --deep <feature>` | fable | `.agentwork/architect/PLAN_<slug>_<date>.md` |
| Build  | `coder`     | `/implement`           | inherit | `.agentwork/coder/IMPLEMENTATION_<slug>_<date>.md` |
| Review | `code-reviewer` | `/review-code`     | inherit | `.agentwork/code-review/CODE_REVIEW_<slug>_<date>.md` |
| Verify | `qa`        | `/qa`                  | inherit | `.agentwork/qa/QA_REPORT_<slug>_<date>.md` |
| Ship   | `pr`        | `/open-pr`             | inherit | `.agentwork/pr/PR_<slug>_<date>.md` |

`/status` reports current pipeline progress. The review stage's command is deliberately named `/review-code` — **not** `/code-review` — so it doesn't shadow Claude Code's built-in `/code-review` (and `/code-review ultra`) surface; don't rename it back. Each agent runs as an isolated subprocess — it does **not** see chat history and communicates only through artifact files.

**Model tiering — inherit by design:** The pipeline agents deliberately carry **no `model:` frontmatter**, so each inherits the session's model. The session model (`/model`) is the pipeline's tier knob: a Sonnet session runs an economical pipeline, a Fable session runs a premium one — same files either way. Do not re-add `model:` pins to these agents; `CLAUDE_CODE_SUBAGENT_MODEL` is the per-session override if one is ever needed. The one exception is `architect-deep` (`model: fable`, `effort: max`), opt-in via `/architect --deep` for genuinely complex system design — from a cheaper session it escalates design to the strongest model; from a Fable session it means "max effort". `architect-deep.md` reads `architect.md` at runtime so there is one canonical workflow. (History: the pipeline originally pinned Sonnet everywhere with an Opus-backed deep tier; it was re-tiered in Aug 2026 once Fable-tier sessions became the norm and per-stage quality crutches stopped paying for themselves.)

**Effort tiers:** `coder` sets `effort: xhigh` (the documented best setting for coding/agentic work); `architect-deep` sets `effort: max`; `qa` sets `effort: high`; `architect` and `code-reviewer` inherit the session default. Keep these in the agent frontmatter, not in prose. (On Fable, thinking is always on and `effort` is the lever that controls its depth — these pins remain meaningful regardless of which model the session runs.)

**The PR stage writes no code.** `pr` pushes the branch and opens the pull
request, and its description is written *from* the plan, review and QA report —
that is the payoff for having produced them. It never force-pushes, never
commits, and never pushes to the base branch; a dirty tree or a failed QA
gateway means `status: blocked` and no pull request. Its `pr_url` front-matter
field is what downstream consumers read, so it must be the URL `gh` actually
printed.

**Single plan document:** The architect produces one `PLAN_<slug>_<date>.md` per feature. It holds the complexity triage, solution proposals (when the complexity is medium/large), the selected approach, and the detailed implementation steps. Its `status` field progresses `draft` → `proposed` → `ready` (or `changes-required` on revision cycles). Do **not** reintroduce a separate implementation-plan file.

## Choosing a mode: solo vs. pipeline

The pipeline is one of two supported ways of working, not the default for everything. Pick per task:

- **Solo mode (no pipeline):** work in the main loop directly — plan mode for design approval, direct implementation, then the built-in `/code-review` (or `/code-review ultra` for a cloud multi-agent review) as the quality gate. Prefer this for small-to-medium changes, especially in a strong-model (Fable/Opus) session: staged handoffs are pure overhead there, since the model plans and self-verifies. Do not spin up the pipeline agents just because they exist.
- **Pipeline mode (`/architect` → `/implement` → `/review-code` → `/qa` → `/open-pr`):** use for large or multi-session features where the pipeline's *unique* value applies — durable plan/review/QA artifacts in `.agentwork/`, enforced user checkpoints between stages, an audit trail, and revision/circuit-breaker discipline. The pipeline exists for **process and artifacts**, not as a quality crutch for weaker models.

Rule of thumb: if the work wouldn't benefit from a written plan document a human signs off on, use solo mode. When in doubt on a request that names neither mode, ask which the user wants rather than defaulting to the pipeline.

## The artifact protocol (critical context)

The pipeline's coherence depends on a shared protocol documented in `.claude/agents/shared-conventions.md`. Any change to an agent file must stay consistent with this document. Key invariants:

- **`.agentwork/session.yaml`** is the entry point — it stores `feature_slug` and artifact paths so agents skip globbing. Every agent reads it first.
- **`.agentwork/progress-log.md`** is an append-only audit trail. It is written **automatically by the `SubagentStart`/`SubagentStop` hooks** (`.claude/hooks/progress-log.mjs`), not by the agents — never edit or remove rows.
- **YAML front matter** on every artifact tracks `status` and `revision`. Canonical status values: architect plan `draft` → `proposed` → `ready` (or `changes-required`); code review `approved`/`changes-required`/`needs-discussion`; QA `pass`/`fail`/`pass-with-notes`. **Revision ≥ 3 halts the pipeline** and escalates to the user (circuit breaker).
- **Gateway checks**: each agent verifies its input artifact has the expected `status` before starting; mismatch means stop and ask. A `UserPromptExpansion` hook (`.claude/hooks/gateway.mjs`) additionally enforces the clearest stage-skips *before* a command runs — but it is deliberately fail-open, so the agent-level prose check remains the real contract.
- **File scope**: each agent's `Rules` section whitelists the files it may modify. Do not widen this scope casually.
- **User checkpoints are non-negotiable** after architect, coder, code-reviewer, and qa. Every handoff stops for user approval regardless of how simple the change looks. Agents must STOP and wait; they never auto-invoke the next stage. The words "invoke/call/run" in a Next Steps section are instructions to the *user*, not self-directives.
- **Pipeline stages run strictly serially.** Never run `/implement`, `/review-code`, and `/qa` in parallel or back-to-back in the same turn. One stage per turn, artifact surfaced, user confirms, then the next stage. This applies to the orchestrator session just as much as to the subagents.

`.agentwork/` is gitignored — it is runtime state, not source.

## When editing agents

- Agent files no longer inline a copy of the shared rules. Each agent's "Shared Conventions" section is a one-line directive to **read `.claude/agents/shared-conventions.md` at runtime** and follow it (the same pattern `architect-deep` uses for `architect.md`). This means `shared-conventions.md` is the *single* place to edit shared rules — there are no preambles to keep in sync, so the old drift hazard is gone. Don't reintroduce inline copies.
- Templates in `.claude/templates/` are referenced by path from the agent prompts. Renaming a template requires updating every referring agent and slash command.
- Slash commands in `.claude/commands/` are thin wrappers that delegate to the matching subagent — keep them terse and let the agent definition carry the behavior.
- The `.claude/` tree is intentionally self-contained: it can be copied into any project to get the pipeline. Don't introduce dependencies on paths outside `.claude/`, `.agentwork/`, or `skills/`.
- **`.claude/bundle.meta.json` is a machine-readable description of the pipeline** and must stay truthful. It names each stage's agent, slash command, artifact glob, and the front-matter `status` values that mean *finished* (`accept`), *finished with a negative verdict* (`blocking`), and *still working* (`inProgress`). Changing an agent's output path, its command name, or its status vocabulary means editing this file **in the same commit**. Note that `accept` deliberately includes the negative verdicts for `REVIEW` and `QA` — a review that finds problems is a completed review; `blocking` is what marks the verdict as negative.

## Downstream consumers

This tree is not only read by Claude Code in this repo. The [godostuff](https://github.com/grontis/godostuff-app) claude-worker vendors it as a versioned bundle (`bundles/standard/`) and copies it into every agent workspace, and its orchestrator reads `bundle.meta.json` to know what stages exist and when one has finished. Two consequences:

- **`bundle.meta.json` is an API.** See the bullet above.
- **Artifact front matter is load-bearing.** An agent that stops writing `status` and `revision` breaks a product, not just an audit trail.

The vendored copy is generated by `scripts/sync-bundle.sh` in the claude-worker repo, which reads this `.claude/` tree directly. Never hand-edit the copy there; edit here and re-sync.

## Hooks, settings, and memory

- **`.claude/settings.json`** wires three hook events (`SubagentStart`, `SubagentStop`, `UserPromptExpansion`) across two scripts, and grants the pipeline `allow` permissions to `Write`/`Edit` under `.agentwork/**` and `.claude/agent-memory/**` so agents can persist artifacts and memory without a prompt on every run, plus read-only git commands (`git status`/`diff`/`log`/`show`) so the code-reviewer can inspect the real diff without prompting. The reviewer's Bash access is restricted by its Rules section to those read-only git commands — keep the permission list and that prose rule in sync. The hooks are enhancements layered on top of the prose protocol, not replacements for it — all are **fail-open**, so a missing `settings.json` (or a copied tree without it) degrades safely to the prose-only behavior (you'll just be prompted to approve `.agentwork/` writes).
  - `SubagentStart` + `SubagentStop` → `.claude/hooks/progress-log.mjs` auto-maintains `.agentwork/progress-log.md`. Agents must **not** write that file themselves.
  - `SubagentStop` also runs `.claude/hooks/stage-event.mjs`, which tells a hosting claude-worker that a named agent finished, so it can resolve that agent's artifact immediately instead of waiting out a poll. Outside a worker the environment (`CLAUDE_WORKER_STAGE_URL`) is absent and it exits silently, so a plain editor session is unaffected. Like every hook here it is fail-open, and it cannot assert an outcome — the worker reads the artifact off disk and reports what is actually written there.
  - `UserPromptExpansion` (matcher `implement|review-code|qa`) → `.claude/hooks/gateway.mjs` blocks the clearest stage-skips *before* the command expands (e.g. `/review-code` when the coder summary isn't `implemented`). It blocks only unambiguous violations and allows everything else, including the trivial direct-implement path and fix cycles.
- **Hook scripts are Node (`.mjs`)**, not bash — this keeps the win32-targeted, copy-portable `.claude/` tree cross-platform. They require `node` on the PATH and use the `CLAUDE_PROJECT_DIR` env var for absolute paths.
- **`memory: project`** is set on every pipeline agent so each builds durable, project-specific knowledge across sessions in `.claude/agent-memory/<agent>/MEMORY.md` (gitignored — it is learned runtime state, while the enabling frontmatter is committed). Note the mild tension with the pipeline's context-isolation ethos: memory carries *durable project facts* between runs, not transient chat history. If you want strict per-run reproducibility, remove the `memory` frontmatter.
- **`/status` reads the live state itself** — it instructs the model to read `.agentwork/session.yaml`, the tail of `.agentwork/progress-log.md`, and each artifact's `status` front matter, then summarize. (It deliberately does *not* use `` !`shell` `` context injection: a single command can't both read-a-file-if-present and exit cleanly when absent without control-flow that the injection permission-checker rejects, and shelling out would reintroduce the cross-platform dependency the Node hooks avoid.)

Git status at repo init shows a deleted `.github/agents/` tree — an earlier GitHub Copilot version of the same pipeline was removed. Do not resurrect those paths.

## The game-engine-architect skill

`skills/game-engine-architect/` is an independent skill (not part of the pipeline) providing architectural guidance distilled from Jason Gregory's *Game Engine Architecture* (2nd ed.).

**The root `skills/` directory is a library, not a live install.** It is deliberately kept outside `.claude/` so projects that adopt the agents don't automatically inherit every skill. Claude Code only discovers skills at `.claude/skills/<name>/SKILL.md` (project) or `~/.claude/skills/<name>/` (personal) — it never scans a repo-root `skills/` directory. To use a skill from this library, copy its folder (SKILL.md plus `references/`) into the target project's `.claude/skills/`. `SKILL.md` is the entry point; subsystem-specific guidance lives in `references/` and should be loaded on demand, not preloaded. Citations use the form `[GEA §5.2 / p.239]` — preserve this format when adding content.

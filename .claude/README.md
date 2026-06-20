# Claude Code Agents — Getting Started

This directory contains custom subagents for Claude Code that implement a
4-agent development pipeline (design → build → review → verify), coordinated
entirely through file-based artifacts.

---

## How to invoke the pipeline

You talk to Claude normally and drive each stage explicitly:

1. **Use a slash command** — the fastest way to invoke a stage (`/architect`,
   `/implement`, `/code-review`, `/qa`, `/status`)
2. **Ask Claude to delegate** — tell it which agent to use in plain English

The pipeline commands are **user-invoked only** (`disable-model-invocation: true`),
so Claude won't silently auto-run a stage for you — that's part of what keeps
the pipeline strictly serial and user-gated. The agents run as subprocesses with
their own context window and tool restrictions, then hand results back through
artifact files.

---

## The Four Agents

| Agent | Role | Model | Slash Command |
|---|---|---|---|
| `architect` | Explores solutions, creates a single plan document. No code. | sonnet | `/architect` |
| `architect-deep` | Opus-backed variant for complex/cross-cutting design. Same workflow. | opus | `/architect --deep` |
| `coder` | Implements the plan, writes unit tests, verifies they pass. | sonnet | `/implement` |
| `code-reviewer` | Reviews code for bugs, security, best practices. No fixes. | sonnet | `/code-review` |
| `qa` | Writes integration tests, runs full suite, validates requirements. | sonnet | `/qa` |

**Bonus:** `/status` — check pipeline progress at any time.

---

## Slash Commands (Recommended)

The fastest way to use the pipeline. Each command invokes the right agent
with the correct context, artifact paths, and template references built in.

```
/architect Add user authentication with OAuth2
```

```
/implement
```

```
/code-review
```

```
/qa
```

```
/status
```

Commands accept optional arguments for extra context:
```
/implement Focus on error handling for the OAuth callback
```

### Alternative — Explicit delegation

You can still invoke agents manually:

```
Use the architect subagent to explore solutions for adding user authentication.
```

### Alternative — Natural language

Just describe what you want. Claude reads the agent descriptions and picks
the right one automatically:

```
Explore 2-3 approaches for adding a caching layer to the API.
```

---

## Full Workflow Walkthrough

### Step 1 — Design (Architect)

```
/architect [describe your feature]
```

The architect will:
- Classify the request by complexity (`trivial` / `small` / `medium` / `large`)
- Scope research to that complexity — no over-exploration for simple changes
- Trivial: redirect you straight to `/implement` (no plan written)
- Small: one proposal, plan goes straight to `status: ready`
- Medium/Large: propose 2-3 approaches with trade-offs, await your selection
- Save a single `PLAN_[slug]_YYYY-MM-DD.md` to `.agentwork/architect/`

For medium/large work, **you must choose a solution.** The architect will
prompt you. After you select one, it fills in the Selected Approach section
of the same plan document and sets `status: ready`.

**For complex or cross-cutting design work**, use `/architect --deep` —
this routes to the Opus-backed `architect-deep` variant. Everything else
about the workflow is identical.

### Step 2 — Implement (Coder)

```
/implement
```

The coder will:
- Read the architect's plan as the source of truth
- Implement the feature following existing project patterns
- Write unit tests and verify they all pass
- Save a summary to `.agentwork/coder/`

When done, it presents options — pick one:
- Proceed to code review (`/code-review`)
- Skip to QA (`/qa`)
- Escalate back to architect (if blocked)

### Step 3 — Review (Code Reviewer)

```
/code-review
```

The reviewer will:
- Check against the architect's plan and coder's summary
- Review all modified files for bugs, security issues, anti-patterns
- Save a report to `.agentwork/code-review/` with a verdict

**You must review the findings.** Then either:
- Route fixes back to the coder (`/implement`)
- Proceed to QA (`/qa`)

### Step 4 — QA

```
/qa
```

QA will:
- Run all existing unit tests
- Write and run integration tests
- Validate every requirement from the architect's plan
- Save a report to `.agentwork/qa/`

**You decide the outcome** — accept, request fixes, or re-run after fixes.

---

## Artifacts and Progress Tracking

All agent outputs are saved under `.agentwork/` (gitignored):

```
.agentwork/
├── architect/      # PLAN_[feature]_YYYY-MM-DD.md (single doc: proposals + selected approach + steps)
├── coder/          # IMPLEMENTATION_[feature]_YYYY-MM-DD.md
├── code-review/    # CODE_REVIEW_[feature]_YYYY-MM-DD.md
├── qa/             # QA_REPORT_[feature]_YYYY-MM-DD.md
└── progress-log.md # Timestamped log of every agent action
```

Agents read each other's artifacts instead of relying on chat history. This
means you can close Claude Code, come back later, and resume by telling the
next agent where the artifacts are — or just run `/status` to see where you
left off.

---

## Templates

Report templates live in `.claude/templates/`. Agents reference these when
creating their artifact documents:

```
.claude/templates/
├── ARCHITECT_PLAN_TEMPLATE.md    # unified: proposals + selected approach + steps
├── IMPLEMENTATION_SUMMARY_TEMPLATE.md
├── CODE_REVIEW_TEMPLATE.md
├── QA_REPORT_TEMPLATE.md
└── MANUAL_QA_TEMPLATE.md
```

---

## Directory Structure

```
.claude/
├── agents/                  # Agent definitions
│   ├── architect.md         # sonnet (default)
│   ├── architect-deep.md    # opus (opt-in via /architect --deep)
│   ├── coder.md
│   ├── code-reviewer.md     # sonnet
│   ├── qa.md
│   └── shared-conventions.md  # read at runtime by every agent (single source of rules)
├── commands/                # Slash commands (user-invoked)
│   ├── architect.md         # /architect [--deep]
│   ├── implement.md         # /implement
│   ├── code-review.md       # /code-review
│   ├── qa.md                # /qa
│   └── status.md            # /status  (injects live session/log state)
├── templates/               # Report templates
│   ├── ARCHITECT_PLAN_TEMPLATE.md
│   ├── IMPLEMENTATION_SUMMARY_TEMPLATE.md
│   ├── CODE_REVIEW_TEMPLATE.md
│   ├── QA_REPORT_TEMPLATE.md
│   └── MANUAL_QA_TEMPLATE.md
├── hooks/                   # Node hook scripts (cross-platform, fail-open)
│   ├── progress-log.mjs     # auto-maintains .agentwork/progress-log.md
│   └── gateway.mjs          # blocks clear stage-skips before a command runs
├── settings.json            # wires the hooks
└── README.md                # This file
```

---

## Managing Agents

To see, create, or edit agents within Claude Code, use the `/agents` command:

```
/agents
```

This opens an interactive panel where you can:
- View all available agents (project-level and user-level)
- Create new agents with Claude's help
- Edit existing agent definitions

Project-level agents (`.claude/agents/`) are committed to version control and
shared with your team. User-level agents live at `~/.claude/agents/` and are
personal.

---

## Tips

**Agents are isolated.** Each subagent runs in its own context window. It
does not see your previous chat messages — it reads artifact files instead.
This is intentional and keeps agents focused.

**You are always in control.** The pipeline has four mandatory checkpoints
where you decide what happens next: after the architect, after the coder,
after code review, and after QA. Agents never auto-proceed.

**Circuit breaker.** If code bounces between coder and reviewer 3 times
without resolving, the agent stops and escalates to you. This prevents
infinite loops.

**Skip stages when appropriate.** For small changes, go straight to
`/implement` or skip code review and go directly to `/qa`. The agents are
independent — you control the routing.

**Hooks back up the audit trail and gates.** `.claude/settings.json` wires
`SubagentStart`/`SubagentStop` hooks that auto-write `.agentwork/progress-log.md`,
plus a `UserPromptExpansion` hook that blocks the clearest stage-skips before a
command runs. The log records each agent's start and finish; it does not
distinguish *how* a run ended (a clean finish, a circuit-breaker halt, and a
`blocked` exit all read as a finish row), so treat it as a timeline, not an
outcome ledger. All hooks are **fail-open** — without `settings.json` the
pipeline still works on its prose rules. Scripts are Node (`.mjs`) so they run
on Windows and Unix alike.

**Agents learn across sessions.** Every pipeline agent sets `memory: project`,
building durable project knowledge in `.claude/agent-memory/<agent>/MEMORY.md`
(gitignored). Remove the `memory` frontmatter if you prefer strict per-run
reproducibility.

**Self-contained.** The `.claude/` folder is fully self-contained — copy it
into any project to get the full pipeline.

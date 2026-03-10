# Claude Code Agents — Getting Started

This directory contains custom subagents for Claude Code that replicate the
4-agent development pipeline from `.github/agents/` (GitHub Copilot).

---

## GitHub Copilot vs Claude Code — Key Difference

In **GitHub Copilot**, you select an agent explicitly from a dropdown in the
chat panel, and it takes over that conversation turn.

In **Claude Code**, there is no dropdown. Instead, you talk to Claude normally
and either:

1. **Use a slash command** — the fastest way to invoke the pipeline
2. **Ask Claude to delegate** — tell it which agent to use in plain English
3. **Let Claude decide** — describe what you want and Claude picks the right
   subagent automatically based on the task

The agents run as subprocesses with their own context window and tool
restrictions, then hand results back to your main conversation.

---

## The Four Agents

| Agent | Role | Slash Command |
|---|---|---|
| `architect` | Explores solutions, creates implementation plans. No code. | `/architect` |
| `coder` | Implements the plan, writes unit tests, verifies they pass. | `/implement` |
| `code-reviewer` | Reviews code for bugs, security, best practices. No fixes. | `/review` |
| `qa` | Writes integration tests, runs full suite, validates requirements. | `/qa` |

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
/review
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
- Search your codebase for existing patterns
- Research relevant libraries/APIs
- Propose 2-3 approaches with trade-offs
- Save a solutions document to `.agentwork/architect/`

**You must choose a solution.** The architect will prompt you. After you
select one, it finalizes the implementation plan and sets `status: ready`.

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
- Proceed to code review (`/review`)
- Skip to QA (`/qa`)
- Escalate back to architect (if blocked)

### Step 3 — Review (Code Reviewer)

```
/review
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
├── architect/      # SOLUTIONS_[feature]_YYYY-MM-DD.md
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
├── SOLUTIONS_TEMPLATE.md
├── IMPLEMENTATION_PLAN_TEMPLATE.md
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
│   ├── architect.md
│   ├── coder.md
│   ├── code-reviewer.md
│   ├── qa.md
│   └── shared-conventions.md
├── commands/                # Slash commands (skills)
│   ├── architect.md         # /architect
│   ├── implement.md         # /implement
│   ├── review.md            # /review
│   ├── qa.md                # /qa
│   └── status.md            # /status
├── templates/               # Report templates
│   ├── SOLUTIONS_TEMPLATE.md
│   ├── IMPLEMENTATION_PLAN_TEMPLATE.md
│   ├── IMPLEMENTATION_SUMMARY_TEMPLATE.md
│   ├── CODE_REVIEW_TEMPLATE.md
│   ├── QA_REPORT_TEMPLATE.md
│   └── MANUAL_QA_TEMPLATE.md
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

**You are always in control.** The pipeline has three mandatory checkpoints
where you decide what happens next: after the architect, after code review,
and after QA. Agents never auto-proceed.

**Circuit breaker.** If code bounces between coder and reviewer 3 times
without resolving, the agent stops and escalates to you. This prevents
infinite loops.

**Skip stages when appropriate.** For small changes, go straight to
`/implement` or skip code review and go directly to `/qa`. The agents are
independent — you control the routing.

**Copilot agents still work.** The `.github/agents/` workflow is untouched.
Both systems coexist and use the same `.agentwork/` artifact directory.

**Self-contained.** The `.claude/` folder is fully self-contained — copy it
into any project to get the full pipeline. No dependency on `.github/`.

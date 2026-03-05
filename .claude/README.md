# Claude Code Agents — Getting Started

This directory contains custom subagents for Claude Code that replicate the
4-agent development pipeline from `.github/agents/` (GitHub Copilot).

---

## GitHub Copilot vs Claude Code — Key Difference

In **GitHub Copilot**, you select an agent explicitly from a dropdown in the
chat panel, and it takes over that conversation turn.

In **Claude Code**, there is no dropdown. Instead, you talk to Claude normally
and either:

1. **Ask Claude to delegate** — tell it which agent to use in plain English
2. **Let Claude decide** — describe what you want and Claude picks the right
   subagent automatically based on the task

The agents run as subprocesses with their own context window and tool
restrictions, then hand results back to your main conversation.

---

## The Four Agents

| Agent | Role | Equivalent Copilot Agent |
|---|---|---|
| `architect` | Explores solutions, creates implementation plans. No code. | `@architect` |
| `coder` | Implements the plan, writes unit tests, verifies they pass. | `@coder` |
| `code-reviewer` | Reviews code for bugs, security, best practices. No fixes. | `@code-reviewer` |
| `qa` | Writes integration tests, runs full suite, validates requirements. | `@qa` |

---

## How to Invoke Agents

### Option 1 — Explicit delegation (recommended when starting out)

Tell Claude directly which agent to use:

```
Use the architect subagent to explore solutions for adding user authentication.
```

```
Use the coder subagent to implement the plan at .agentwork/architect/.
```

```
Use the code-reviewer subagent to review the implementation.
```

```
Use the qa subagent to verify the implementation and run integration tests.
```

### Option 2 — Natural language (Claude auto-delegates)

Just describe what you want. Claude reads the agent descriptions and picks
the right one automatically:

```
Explore 2-3 approaches for adding a caching layer to the API.
```
→ Claude delegates to `architect`

```
Implement the approved plan from the architect.
```
→ Claude delegates to `coder`

```
Review the code the coder just wrote.
```
→ Claude delegates to `code-reviewer`

---

## Full Workflow Walkthrough

### Step 1 — Design (Architect)

Start a new task by invoking the architect:

```
Use the architect subagent to explore solutions for [your feature].
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
Use the coder subagent to implement the plan at .agentwork/architect/.
```

The coder will:
- Read the architect's plan as the source of truth
- Implement the feature following existing project patterns
- Write unit tests and verify they all pass
- Save a summary to `.agentwork/coder/`

When done, it presents three options — pick one:
- Proceed to code review (recommended)
- Skip to QA
- Escalate back to architect (if blocked)

### Step 3 — Review (Code Reviewer)

```
Use the code-reviewer subagent to review the implementation.
```

The reviewer will:
- Check against the architect's plan and coder's summary
- Review all modified files for bugs, security issues, anti-patterns
- Save a report to `.agentwork/code-review/` with a verdict

**You must review the findings.** Then either:
- Route fixes back to the coder
- Proceed to QA

### Step 4 — QA

```
Use the qa subagent to verify the implementation.
```

QA will:
- Run all existing unit tests
- Write and run integration tests
- Validate every requirement from the architect's plan
- Save a report to `.agentwork/qa/`

**You decide the outcome** — accept, request fixes, or re-run after fixes.

---

## Routing Between Agents

Each agent ends with a "Next Steps" block containing the exact prompt to
give the next agent. Copy it and run it. For example, after the architect
finishes you will see something like:

```
Implementation Ready

The plan is saved at .agentwork/architect/ with status: ready.

To implement, invoke the coder subagent:

> Implement the plan at .agentwork/architect/. Read the IMPLEMENTATION_PLAN
> section for the approved approach. Write unit tests, verify all pass.
> Save summary to .agentwork/coder/.
```

Paste that quoted prompt into the chat:

```
Use the coder subagent. Implement the plan at .agentwork/architect/...
```

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
next agent where the artifacts are.

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

Project-level agents (this directory: `.claude/agents/`) are committed to
version control and shared with your team. User-level agents live at
`~/.claude/agents/` and are personal.

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

**Skip stages when appropriate.** For small changes, go straight to coder
or skip code review and go directly to QA. The agents are independent — you
control the routing.

**Copilot agents still work.** The `.github/agents/` workflow is untouched.
Both systems coexist and use the same `.agentwork/` artifact directory.

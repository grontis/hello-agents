# Agent Team Guide

A team of AI agents designed to accelerate solo software development workflows. Each agent has a specialized role and is self-contained — they communicate through document artifacts in `.agentwork/`, and handoff buttons in the chat window let you route work between agents at key decision points.

## The Team

### 🏗️ [Architect](agents/architect.agent.md)
**Role:** Solution Explorer & Technical Planner  
**Use for:** Research, exploring multiple solutions, and creating implementation plans

Explores 2-3 viable approaches, documents them with trade-offs, and presents them for your selection. After you choose, creates a detailed implementation plan. Does NOT write code.

**Handoffs:** → Coder (Start Implementation)

### 💻 [Coder](agents/coder.agent.md)
**Role:** Implementation Specialist  
**Use for:** Writing code + unit tests, implementing features, fixing bugs

Writes production-quality code following your project's patterns. **Must write unit tests and verify they all pass** before handing off. Uses the Architect's plan as input when available.

**Handoffs:** → Code Reviewer (Send to Code Review) | → QA (Skip to QA) | → Architect (Escalate)

### 📋 [Code Reviewer](agents/code-reviewer.agent.md)
**Role:** Code Quality Reviewer  
**Use for:** Reviewing implementations for bugs, security issues, and anti-patterns

Reviews the Coder's work, creates a detailed report with actionable findings, and presents results for your acceptance. Does NOT fix code — routes back to Coder if changes needed.

**Handoffs:** → Coder (Route Fixes) | → QA (Proceed to QA)

### 🧪 [QA](agents/qa.agent.md)
**Role:** QA Engineer & Integration Tester  
**Use for:** Verifying tests, writing integration tests, validating against requirements

The final quality gate. Verifies unit tests, writes integration tests, runs the full suite, and validates the implementation meets requirements. Can route back to Coder if issues are found.

**Handoffs:** → Coder (Route Fixes) | → QA (Re-run QA)

---

## File Structure

```
.github/agents/
├── common.md              # Shared conventions all agents follow
├── architect.agent.md     # Solution designer
├── coder.agent.md         # Implementation specialist
├── code-reviewer.agent.md # Code quality reviewer
├── qa.agent.md            # QA engineer
├── README.md              # This file (human documentation)
└── templates/             # Report templates agents read at runtime
    ├── SOLUTIONS_TEMPLATE.md
    ├── IMPLEMENTATION_PLAN_TEMPLATE.md
    ├── IMPLEMENTATION_SUMMARY_TEMPLATE.md
    ├── CODE_REVIEW_TEMPLATE.md
    └── QA_REPORT_TEMPLATE.md
```

### Design Philosophy

Each agent is **self-contained** — it knows how to gather its own context, validate inputs via gateway checks, and present handoff buttons for the next step. There is no orchestrator; the user controls routing by clicking handoff buttons in the chat window.

Agent `.md` files are optimized for **token efficiency** — concise, structured instructions. Shared context is consolidated in [common.md](agents/common.md) to avoid duplication. Templates are referenced by path rather than embedded inline.

---

## Artifact System

Agents communicate through markdown documents saved in `.agentwork/`:

```
.agentwork/
├── architect/      # Solution proposals → Implementation plans
├── coder/          # Implementation summaries (what was built, test results)
├── code-review/    # Code review reports (findings, action items)
├── qa/             # QA reports (test results, integration test coverage)
└── progress-log.md # Cross-agent audit trail (timestamped entries)
```

**Why artifacts?**
- **Saves tokens** — agents read files instead of relying on chat context
- **Creates a paper trail** of decisions and findings
- **Enables async workflows** — review now, fix later
- **Consistent context** — each agent knows exactly where to find and save documents

### Status-Driven Workflow

Every artifact has YAML front matter with a `status` field. Each agent checks the upstream artifact's status before starting work (gateway checks). This prevents agents from running out of order or on incomplete work.

### Revision Tracking

Artifacts that go through review cycles track a `revision` number. If any review cycle reaches revision 3, the agent stops and escalates to the user — preventing infinite loops.

### Progress Log

Every agent logs timestamped start/stop entries to `.agentwork/progress-log.md`. This creates a full audit trail across all agents.

---

## How to Use

### Starting a Feature (Full Pipeline)

```
@architect explore solutions for implementing real-time chat
```
1. Architect explores solutions → **you select one** (handoff button: Start Implementation)
2. Coder implements + writes unit tests (handoff button: Send to Code Review)
3. Code Reviewer reviews → **you accept or request changes** (handoff button: Proceed to QA)
4. QA writes integration tests and validates → **you accept or request fixes**

### Direct Implementation (No Design Phase)

```
@coder implement user profile editing based on [requirements]
```
After implementation, use the handoff buttons to route to Code Review → QA.

### Quick Fix + Verify

```
@coder fix the bug in checkout calculation and add tests for the fix
```
Then click **Skip to QA** to verify.

### Design Only

```
@architect explore solutions for a scalable file upload system
```
Review the proposals. You can start implementation later by clicking the handoff button.

### Code Review + Fix Loop

```
@code-reviewer review the changes in src/auth/
```
If issues found, click **Route Fixes to Coder** → Coder fixes → click **Send to Code Review** to re-review.

---

## User Checkpoints

The workflow has three key points where you make decisions:

### 1. After Architect (Solution Selection)
The Architect presents 2-3 solutions with trade-offs. You:
- **Select one** — Architect finalizes the implementation plan, click **Start Implementation**
- **Request hybrid** — Combine elements from multiple solutions
- **Ask for more research** — Architect digs deeper

### 2. After Code Reviewer (Review Acceptance)
The Code Reviewer presents findings with severity levels. You:
- **Approve** — Click **Proceed to QA**
- **Request changes** — Click **Route Fixes to Coder**, then re-review
- **Discuss** — Talk through specific findings before deciding

### 3. After QA (Quality Acceptance)
QA presents test results and validation. You:
- **Accept (PASS)** — Feature is complete
- **Route to Coder (FAIL)** — Click **Route Fixes to Coder**, then **Re-run QA**
- **Accept with notes** — Ship with known minor items

---

## Quick Decision Guide

| I want to... | Start with |
|---|---|
| Build a new feature (complex) | `@architect` → follow handoff buttons |
| Build a feature (I know how) | `@coder` → `@code-reviewer` → `@qa` via handoffs |
| Fix a bug | `@coder` (includes tests) |
| Explore design options | `@architect` |
| Review existing code | `@code-reviewer` |
| Add integration tests | `@qa` |
| Address review feedback | `@coder` with review report |

---

## Key Conventions (from common.md)

- **Context Isolation** — Agents work from artifact files, not chat history
- **Gateway Checks** — Each agent verifies upstream status before starting
- **Output Self-Validation** — Agents verify every template section is filled before marking complete
- **File Scope** — Each agent may only modify files in its own artifact directory
- **Progress Tracking** — Every agent logs to `.agentwork/progress-log.md`
- **Circuit Breakers** — Review cycles stop at revision 3 and escalate to the user

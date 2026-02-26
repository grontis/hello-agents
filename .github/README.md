# Agent Team Guide

A team of AI agents designed to accelerate solo software development workflows. Each agent has a specialized role. They communicate through document artifacts in `.agentwork/`, and the workflow includes user checkpoints at key decision points.

## The Team

### 🎯 [Orchestrator](orchestrator.agent.md)
**Role:** Coordinator & Pipeline Manager  
**Use for:** Complex multi-step tasks that need multiple specialists

Manages the full pipeline: Architect → Coder → Code Reviewer → QA. Handles user checkpoints, routes fixes back to Coder when needed, and ensures artifacts flow between agents.

### 🏗️ [Architect](architect.agent.md)
**Role:** Solution Explorer & Technical Planner  
**Use for:** Research, exploring multiple solutions, and creating implementation plans

Explores 2-3 viable approaches, documents them with trade-offs, and presents them for your selection. After you choose, creates a detailed implementation plan. Does NOT write code.

### 💻 [Coder](coder.agent.md)
**Role:** Implementation Specialist  
**Use for:** Writing code + unit tests, implementing features, fixing bugs

Writes production-quality code following your project's patterns. **Must write unit tests and verify they all pass** before handing off. Uses the Architect's plan as input.

### 📋 [Code Reviewer](code-reviewer.agent.md)
**Role:** Code Quality Reviewer  
**Use for:** Reviewing implementations for bugs, security issues, and anti-patterns

Reviews the Coder's work, creates a detailed report with actionable findings, and presents results for your acceptance. Does NOT fix code — routes back to Coder if changes needed.

### 🧪 [QA](qa.agent.md)
**Role:** QA Engineer & Integration Tester  
**Use for:** Verifying tests, writing integration tests, validating against requirements

The final quality gate. Verifies unit tests, writes integration tests, runs the full suite, and validates the implementation meets requirements. Can route back to Coder if issues are found.

---

## File Structure

```
.github/agents/
├── common.md              # Shared context all agents reference (artifact system, standards)
├── orchestrator.agent.md  # Pipeline coordinator
├── architect.agent.md     # Solution designer
├── coder.agent.md         # Implementation specialist
├── code-reviewer.agent.md # Code quality reviewer
├── qa.agent.md            # QA engineer
├── README.md              # This file (human documentation)
└── templates/             # Lean report templates agents read at runtime
    ├── SOLUTIONS_TEMPLATE.md
    ├── IMPLEMENTATION_PLAN_TEMPLATE.md
    ├── IMPLEMENTATION_SUMMARY_TEMPLATE.md
    ├── CODE_REVIEW_TEMPLATE.md
    └── QA_REPORT_TEMPLATE.md
```

### Design Philosophy

The agent `.md` files are optimized for **token efficiency** — they contain concise, structured instructions that agents interpret well. Shared context is consolidated in [common.md](common.md) to avoid duplication. Templates are referenced by path rather than embedded inline.

This README serves as the **human-readable documentation** with full explanations, examples, and workflow patterns.

---

## Artifact System

Agents communicate through markdown documents saved in `.agentwork/`:

```
.agentwork/
├── architect/      # Solution proposals → Implementation plans
├── coder/          # Implementation summaries (what was built, test results)
├── code-review/    # Code review reports (findings, action items)
└── qa/             # QA reports (test results, integration test coverage)
```

**Why artifacts?**
- **Saves tokens** — agents read files instead of relying on chat context
- **Creates a paper trail** of decisions and findings
- **Enables async workflows** — review now, fix later
- **Consistent context** — each agent knows exactly where to find and save documents

**Templates** are available in [templates/](templates/) for reference. Agents read these at runtime when creating reports.

---

## How to Use

### Single Agent Workflows

For straightforward tasks, call the specialist directly:

```
# Research and design
@architect research approaches for implementing real-time chat
@architect explore solutions for a scalable file upload system

# Implementation (includes unit tests)
@coder implement user profile editing — follow the plan in .agentwork/architect/
@coder fix the bug in checkout calculation
@coder address findings in .agentwork/code-review/CODE_REVIEW_checkout_2026-02-25.md

# Code review
@code-reviewer review the changes in src/auth/

# QA and integration testing
@qa verify the authentication feature and write integration tests
```

### Full Pipeline (Orchestrator)

For complex features, let the Orchestrator manage the full team:

```
@orchestrator implement a paginated REST API for user management
@orchestrator add OAuth2 authentication with Google and GitHub providers
@orchestrator redesign the notification system for real-time delivery
```

The Orchestrator will:
1. Send the **Architect** to explore solutions → **you select one**
2. Send the **Coder** to implement + write unit tests (must pass)
3. Send the **Code Reviewer** to review → **you accept or request changes**
4. Send **QA** to write integration tests and validate → **you accept or request fixes**

---

## Workflow Patterns

### Pattern 1: Full Feature Pipeline
**When:** New features, complex changes, architectural decisions needed

```
@orchestrator implement [feature description]
```

Pipeline: Architect → [user selects] → Coder → Code Reviewer → [user accepts] → QA → [user accepts] → Done

### Pattern 2: Implementation + Quality
**When:** Clear requirements, no design exploration needed

```
@coder implement [feature] following [plan/description]
# Then:
@code-reviewer review the implementation
# Then:
@qa verify and write integration tests
```

### Pattern 3: Quick Fix + Verify
**When:** Bug fixes, small changes

```
@coder fix [bug description] and add tests for the fix
@qa verify the fix with integration tests
```

### Pattern 4: Design Only
**When:** Evaluating approaches before committing

```
@architect explore solutions for [problem]
# Review the proposals, select one, then later:
@coder implement following .agentwork/architect/SOLUTIONS_[slug]_YYYY-MM-DD.md
```

### Pattern 5: Review + Fix Loop
**When:** Addressing quality feedback

```
@code-reviewer review src/services/
# If issues found:
@coder address findings in .agentwork/code-review/CODE_REVIEW_[slug]_YYYY-MM-DD.md
# Re-review:
@code-reviewer re-review the changes
```

---

## User Checkpoints

The workflow has three key points where you make decisions:

### 1. After Architect (Solution Selection)
The Architect presents 2-3 solutions with trade-offs. You:
- **Select one** — Architect finalizes the implementation plan
- **Request hybrid** — Combine elements from multiple solutions
- **Ask for more research** — Architect digs deeper

### 2. After Code Reviewer (Review Acceptance)
The Code Reviewer presents findings with severity levels. You:
- **Approve** — Proceed to QA
- **Request changes** — Route back to Coder to fix issues
- **Discuss** — Talk through specific findings before deciding

### 3. After QA (Quality Acceptance)
QA presents test results and validation. You:
- **Accept (PASS)** — Feature is complete
- **Route to Coder (FAIL)** — Fix issues, then re-run QA
- **Accept with notes** — Ship with known minor items

---

## Quick Decision Guide

| I want to... | Use |
|---|---|
| Build a new feature (complex) | `@orchestrator` — full pipeline |
| Build a feature (I know how) | `@coder` → `@code-reviewer` → `@qa` |
| Fix a bug | `@coder` (includes tests) |
| Explore design options | `@architect` |
| Review existing code | `@code-reviewer` |
| Add integration tests | `@qa` |
| Address review feedback | `@coder` with review report |
| Get a second opinion on design | `@architect` |

---

## Best Practices

### Start Simple
Use single agents for focused tasks. Only bring in the Orchestrator when you need the full pipeline.

### Trust the Artifacts
Agents save their work to `.agentwork/`. Reference these files when routing between agents — it saves tokens and keeps context consistent.

### Use Checkpoints Wisely
The user checkpoints exist so you stay in control. Don't rubber-stamp — actually review the Architect's proposals and the Code Reviewer's findings.

### Clean Up Periodically
The `.agentwork/` directory accumulates artifacts. Consider adding it to `.gitignore` or cleaning up old files periodically.

### Let Agents Read, Not Repeat
Instead of pasting code into chat, point agents at files:
```
@code-reviewer review the changes in src/auth/ — see .agentwork/coder/IMPLEMENTATION_auth_2026-02-25.md for context
```

### Adding Language/Framework Best Practices
If you want agents to follow specific coding standards beyond what's in [common.md](common.md), create a best-practices document (e.g., `.github/agents/best-practices-typescript.md`) and reference it in your prompts. The agent files are intentionally lean — they rely on the LLM's built-in knowledge of language idioms and best practices.

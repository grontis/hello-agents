# Agent Team Guide

A streamlined team of AI agents designed to accelerate solo software development workflows. Each agent has a specialized role, and they can work independently or be coordinated for complex tasks.

## The Team

### 🎯 [Orchestrator](orchestrator.agent.md)
**Role:** Coordinator & Task Router  
**Use for:** Complex multi-step tasks that need multiple specialists

The Orchestrator breaks down complex work, delegates to the right agents, manages dependencies, and ensures tasks are completed in the correct order.

### 🏗️ [Architect](architect.agent.md)
**Role:** Solution Designer & Technical Planner  
**Use for:** Research, design decisions, and implementation planning

The Architect researches your codebase, evaluates approaches, designs solutions, and creates detailed implementation plans. Does NOT write code.

### 💻 [Coder](coder.agent.md)
**Role:** Implementation Specialist  
**Use for:** Writing code, implementing features, fixing bugs

The Coder writes production-quality code following your project's patterns and conventions. Senior engineer with 8+ years experience mindset.

### ✅ [Quality](quality.agent.md)
**Role:** Test Engineer & Code Reviewer  
**Use for:** Writing tests, reviewing code, ensuring quality

The Quality agent writes comprehensive tests and reviews code for bugs, security issues, and best practices.

---

## How to Use

### Single Agent Workflows

For straightforward tasks, call the specialist directly:

```
# Implementation tasks
@coder implement user profile editing functionality
@coder fix the bug in checkout calculation
@coder refactor the authentication service

# Design and planning
@architect research approaches for implementing real-time chat
@architect design a scalable file upload system
@architect create a plan for migrating to the new API

# Testing and review
@quality add tests for the UserService class
@quality review the changes in src/auth/
@quality check test coverage for the payment module
```

### Multi-Agent Workflows

For complex tasks, use the Orchestrator:

```
@orchestrator add user authentication with JWT tokens
@orchestrator implement a shopping cart with persistence
@orchestrator create a REST API for blog posts with full CRUD
```

**What happens:**
1. Orchestrator calls **Architect** to research and design
2. Architect returns an implementation plan
3. Orchestrator delegates tasks to **Coder** (sometimes in parallel)
4. Once implementation is done, **Quality** tests and reviews
5. Orchestrator reports back when everything is complete

---

## Decision Guide

### 🤔 Which Agent Should I Call?

```
┌─────────────────────────────────────┐
│ Is it a complex multi-step task?   │
│ (multiple components, unclear how  │
│  to implement, cross-cutting)      │
└──────────┬──────────────────────────┘
           │
     YES ──┤
           │         ┌──────────────────────┐
           └────────►│  @orchestrator       │
                     └──────────────────────┘
           │
      NO ──┤
           ▼
┌──────────────────────────────────────┐
│ What type of work is it?             │
└──────────┬───────────────────────────┘
           │
           ├─ Research/Design/Plan ──────► @architect
           │
           ├─ Write/Fix Code ────────────► @coder
           │
           └─ Test/Review ───────────────► @quality
```

### 📋 Task Examples by Agent

| Task | Agent | Example |
|------|-------|---------|
| Simple bug fix | `@coder` | "Fix the null pointer error in handleSubmit" |
| New feature (simple) | `@coder` | "Add a delete button to each item in the list" |
| New feature (complex) | `@orchestrator` | "Implement user notifications with email and in-app" |
| Refactoring | `@coder` | "Extract the validation logic into a separate utility" |
| Technical decision | `@architect` | "Should we use Redis or in-memory cache for sessions?" |
| Create tests | `@quality` | "Add unit tests for the authentication flow" |
| Code review | `@quality` | "Review the PR changes for security issues" |
| Full system design | `@orchestrator` | "Design and implement a file upload system with S3" |

---

## Workflow Patterns

### Pattern 1: Quick Implementation
**When:** You know what to build, just need it coded

```
@coder add a search filter to the products list
```

**Agent flow:**
1. Coder searches codebase for patterns
2. Implements following existing conventions
3. Tests the change
4. Reports back

---

### Pattern 2: Research First
**When:** Unfamiliar tech or multiple possible approaches

```
@architect research how to implement SSO with OAuth2
```

**Agent flow:**
1. Architect searches codebase for auth patterns
2. Looks up OAuth2 best practices
3. Evaluates approaches (libraries, DIY, etc.)
4. Recommends a solution with rationale

**Then you can:**
```
@coder implement the OAuth2 approach from the architect's plan
```

---

### Pattern 3: Full Feature Development
**When:** Complex feature touching multiple parts of the system

```
@orchestrator implement a commenting system for blog posts
```

**Agent flow:**
1. **Orchestrator** → **Architect**: Research and design
2. **Architect** returns plan with steps and file lists
3. **Orchestrator** → **Coder** (parallel tasks if possible):
   - Create database models
   - Build API endpoints
   - Add UI components
4. **Orchestrator** → **Quality**: Test and review
5. **Quality** adds tests, reviews code, reports issues
6. **Orchestrator** → **Coder**: Fix any issues found
7. **Orchestrator** reports completion

---

### Pattern 4: Quality Check with Report
**When:** You wrote code and want validation with a persistent report

```
@quality review my changes to the payment processing module
```

**Agent flow:**
1. Quality reads your changes
2. Checks for bugs, security issues, anti-patterns
3. Verifies test coverage
4. **Creates CODE_REVIEW_YYYY-MM-DD.md** with detailed findings
5. Provides structured feedback in chat (critical/important/suggestions)

**Then when ready to fix:**
```
@coder address the issues in CODE_REVIEW_2026-02-21.md
```

**Benefits:**
- Persistent report file you can reference later
- Checklist format for tracking progress
- Coder agent can work directly from the report
- Async workflow (review now, fix later)

---

### Pattern 5: Test-Driven Development
**When:** You want tests written first or alongside code

```
# Option A: Tests first
@quality write tests for a UserService that will have login, register, logout
@coder implement UserService to make those tests pass

# Option B: Code then tests
@coder implement UserService with login, register, logout
@quality add comprehensive tests for UserService
```

---

## Best Practices

### ✅ Do's

**Be Specific**
```
✅ "@coder add error handling to the uploadFile function in src/utils/upload.ts"
❌ "@coder fix uploads"
```

**Provide Context When Needed**
```
✅ "@architect design a caching strategy for our API. We have 10k users and responses are slow"
❌ "@architect add caching"
```

**Use Orchestrator for Multi-Step Work**
```
✅ "@orchestrator implement user authentication with social login"
❌ "@coder @architect @quality implement auth" (don't tag multiple agents)
```

**Let Agents Do Their Job**
```
✅ "@coder implement the login form"
❌ "@coder create a LoginForm component with useState for email, password..."
```

### ❌ Don'ts

**Don't Micro-Manage**
- Let Architect decide the approach after research
- Let Coder choose implementation details
- Let Quality determine what to test

**Don't Skip Steps**
- Don't ask Coder to design (use Architect first)
- Don't ask Architect to implement (use Coder after)

**Don't Call Multiple Agents At Once**
- Use Orchestrator to coordinate them
- Exception: Sequential manual workflow is fine

---

## Tips & Tricks

### 🔍 When You're Stuck

Not sure what to do? Start with research:
```
@architect analyze the current code structure and suggest next steps
```

### 🚀 Iterative Development

Break big projects into phases:
```
Phase 1: @orchestrator implement basic CRUD for users
Phase 2: @orchestrator add authentication
Phase 3: @orchestrator add role-based permissions
```

### 🧪 Test Coverage Gaps

Find what's not tested:
```
@quality analyze test coverage and identify gaps in src/services/
```

### 📚 Learning from Code

Understand unfamiliar code:
```
@architect explain how the current authentication system works
```

### 🐛 Debugging Complex Issues

For tricky bugs:
```
@architect investigate why users are getting logged out randomly
```
Then once root cause is found:
```
@coder fix the session timeout bug identified by architect
```

---

## Customization

These agents are designed to be generic and adaptable. As you use them:

### Adapt to Your Stack
The agents will learn your:
- Framework preferences (React, Vue, etc.)
- Code style and conventions
- Testing patterns
- Project structure

### Create Project-Specific Variants
For specialized projects, you can create variants:
- **coder-frontend.agent.md** - Specialized for React/Vue
- **coder-backend.agent.md** - Specialized for Node/Python
- **architect-api.agent.md** - Focused on API design

Copy an agent file and customize the instructions for your needs.

---

## Common Workflows

### New Feature End-to-End
```
1. @orchestrator implement [feature name]
2. Review the implementation
3. @quality review the code if you want extra assurance
4. Ship it
```

### Bug Investigation & Fix
```
1. @architect investigate [bug description]
2. @coder fix [the issue architect identified]
3. @quality add tests to prevent regression
```

### Code Quality Improvement
```
1. @quality review [file or module]
2. @coder address the critical and important issues
3. @quality verify the fixes
```

### Exploration & Prototyping
```
1. @architect research [technology/approach]
2. @coder create a proof-of-concept
3. Review and decide if it works
4. @orchestrator implement the full version (if proceeding)
```

---

## Troubleshooting

### Agent Seems Confused?
- Be more specific about what you want
- Provide more context about your project
- Break the task into smaller pieces

### Orchestrator Not Needed?
- For simple tasks, call specialists directly
- Orchestrator adds overhead for trivial work

### Code Doesn't Match Your Style?
- The agents learn from your codebase
- Ensure you have consistent existing code for them to follow
- Explicitly mention style preferences

### Want Different Behavior?
- Edit the agent `.md` files to customize instructions
- Add project-specific guidelines
- Create specialized variants

---

## Questions?

These agents are tools to accelerate your workflow. Use them pragmatically:
- Start simple (single agents)
- Graduate to complex (orchestrated workflows)
- Customize as needed
- Focus on shipping quality code faster

Happy coding! 🚀

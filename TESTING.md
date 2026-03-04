# Testing Your Agent Team

This guide walks through testing your agents with a simple Hello World API application. You'll verify each agent works correctly independently and that they chain together smoothly via handoff buttons.

## Prerequisites

- Agents are installed in `.github/agents/`
- You have VS Code with GitHub Copilot enabled
- You can tag agents with `@agent-name` in Copilot Chat
- Available agents: `@architect`, `@coder`, `@code-reviewer`, `@qa`

## Setup: Create a Test Project

We'll use a simple API as our test project. Choose your preferred language/framework:

### Option A: .NET (ASP.NET Core Minimal API)

```bash
mkdir test-api
cd test-api
dotnet new webapi -minimal -n TestApi
cd TestApi
```

The template creates `Program.cs`. Replace its contents with:
```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/", () => new { message = "Hello World" });

app.Run();
```

Run it:
```bash
dotnet run
# API will be available at http://localhost:5000 or https://localhost:5001
```

### Option B: Node.js + Express

```bash
mkdir test-api
cd test-api
npm init -y
npm install express
```

Create `server.js`:
```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Option C: Python + Flask

```bash
mkdir test-api
cd test-api
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install flask
```

Create `app.py`:
```python
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify(message='Hello World')

if __name__ == '__main__':
    app.run(debug=True)
```

### Option D: Go

```bash
mkdir test-api
cd test-api
go mod init test-api
```

Create `main.go`:
```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
)

type Response struct {
    Message string `json:"message"`
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(Response{Message: "Hello World"})
}

func main() {
    http.HandleFunc("/", helloHandler)
    log.Println("Server starting on :3000")
    log.Fatal(http.ListenAndServe(":3000", nil))
}
```

---

## Test 1: Architect Agent (Research & Planning)

**Goal:** Verify Architect can research code and create implementation plans.

### Test Case 1.1: Simple Planning

Open Copilot Chat and ask:

```
@architect create a plan to add a /users endpoint that returns a list of mock users
```

**Expected Output:**
- ✅ Architect searches/reads your existing code
- ✅ Identifies the language/framework you're using
- ✅ Creates a step-by-step implementation plan
- ✅ Specifies which files to create/modify
- ✅ Recommends approach that matches existing patterns
- ✅ Does NOT write actual code

**Validation:**
- [ ] Plan is specific (file names, function names)
- [ ] Plan matches your tech stack
- [ ] Steps are in logical order
- [ ] No actual code implementation provided

### Test Case 1.2: Technical Research

```
@architect research the best approach for adding request validation to our API
```

**Expected Output:**
- ✅ Searches codebase for existing validation
- ✅ Researches validation libraries for your framework
- ✅ Compares 2-3 approaches with trade-offs
- ✅ Recommends one approach with reasoning

**Validation:**
- [ ] Multiple approaches evaluated
- [ ] Recommendation is specific and justified
- [ ] Considers your existing tech stack

---

## Test 2: Coder Agent (Implementation)

**Goal:** Verify Coder can write code following existing patterns.

### Test Case 2.1: Add New Endpoint

```
@coder implement a /health endpoint that returns status: "ok" and timestamp
```

**Expected Output:**
- ✅ Reads existing code structure
- ✅ Follows existing patterns (same style, imports, etc.)
- ✅ Implements the requested endpoint
- ✅ Code is clean and production-quality
- ✅ May suggest testing it

**Validation:**
```bash
# Start your server
dotnet run                    # .NET
# or node server.js           # Node.js
# or python app.py            # Python
# or go run main.go           # Go

# In another terminal, test the endpoint
curl http://localhost:5000/health    # .NET (or :5001 for https)
# or curl http://localhost:3000/health  # Node/Go
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-21T..."
}
```

- [ ] Endpoint works as expected
- [ ] Code follows existing style
- [ ] No unnecessary changes to other code

### Test Case 2.2: Bug Fix

First, introduce a bug:

```
@coder intentionally break the /health endpoint by making it return a 500 error
```

Then fix it:

```
@coder fix the /health endpoint - it should return 200 with status ok
```

**Expected Output:**
- ✅ Identifies the issue
- ✅ Fixes it correctly
- ✅ Explains what was wrong

**Validation:**
- [ ] Endpoint now works correctly
- [ ] Fix is minimal and targeted

---

## Test 3: Code Reviewer Agent (Code Quality)

**Goal:** Verify Code Reviewer can analyze code and produce structured review reports.

### Test Case 3.1: Code Review

```
@code-reviewer review the code in [your main API file]
```

**Expected Output:**
- ✅ Reads implementation summary from `.agentwork/coder/` (if available)
- ✅ Systematic review of the code
- ✅ Identifies actual issues (if any)
- ✅ Categorizes: Critical / Important / Suggestions
- ✅ Provides specific, actionable feedback with file/line references
- ✅ Acknowledges good practices
- ✅ Creates review report in `.agentwork/code-review/`
- ✅ Presents **Route Fixes to Coder** or **Proceed to QA** handoff buttons

**Validation:**
- [ ] Review report saved to `.agentwork/code-review/`
- [ ] Report has YAML front matter with `status` and `revision` fields
- [ ] Feedback is specific (not vague)
- [ ] Suggestions make sense for your code
- [ ] Review includes both positives and improvements
- [ ] Handoff buttons appear in the chat

### Test Case 3.2: Review with Gateway Check

Test that the Code Reviewer enforces the gateway check on the Coder's implementation summary:

1. Do NOT create an implementation summary in `.agentwork/coder/`
2. Ask: `@code-reviewer review the implementation`

**Expected Output:**
- ✅ Code Reviewer checks for implementation summary status
- ✅ Stops and asks the user how to proceed (gateway check fail)

**Validation:**
- [ ] Agent does NOT proceed without the required upstream artifact
- [ ] Agent asks user for guidance instead of guessing

---

## Test 4: QA Agent (Testing & Validation)

**Goal:** Verify QA can write tests, run test suites, and validate against requirements.

### Test Case 4.1: Write Integration Tests

```
@qa add integration tests for the /health endpoint
```

**Expected Output:**
- ✅ Creates test file following project conventions
- ✅ Tests happy path (200 response, correct structure)
- ✅ Tests edge cases and error handling
- ✅ Uses appropriate testing framework
- ✅ Creates QA report in `.agentwork/qa/`
- ✅ Report includes verdict: PASS / FAIL / PASS WITH NOTES

**Validation:**
Run the tests:
```bash
dotnet test       # .NET
# or npm test     # Node.js
# or pytest       # Python
# or go test ./...  # Go
```

- [ ] Test file created in correct location
- [ ] Tests pass
- [ ] Tests actually validate functionality
- [ ] QA report saved to `.agentwork/qa/` with YAML status field

### Test Case 4.2: Validate Against Plan

If you ran the Architect test (1.1) and have a plan in `.agentwork/architect/`:

```
@qa verify the implementation against the architect's plan
```

**Expected Output:**
- ✅ Cross-references every requirement from the plan
- ✅ Flags anything missed or partial
- ✅ Presents **Route Fixes to Coder** handoff if issues found

---

## Test 5: Handoff Workflow (Agent Coordination)

**Goal:** Verify agents coordinate through handoff buttons and artifacts, not an orchestrator.

### Test Case 5.1: Full Feature Pipeline via Handoffs

Walk through the complete pipeline using handoff buttons:

```
Step 1: @architect create a plan to add a /users endpoint that returns a paginated list of users
```

- ✅ Architect presents solutions and asks you to select
- ✅ After you select, Architect finalizes implementation plan
- ✅ **Start Implementation** handoff button appears
- [ ] Click the **Start Implementation** handoff button

```
Step 2: Coder implements (triggered by handoff button)
```

- ✅ Coder reads the plan from `.agentwork/architect/`
- ✅ Implements the feature with unit tests
- ✅ Creates implementation summary in `.agentwork/coder/`
- ✅ **Send to Code Review** handoff button appears
- [ ] Click the **Send to Code Review** handoff button

```
Step 3: Code Reviewer reviews (triggered by handoff button)
```

- ✅ Code Reviewer reads plan and implementation summary
- ✅ Creates review report in `.agentwork/code-review/`
- ✅ **Proceed to QA** or **Route Fixes to Coder** handoff button appears
- [ ] Click **Proceed to QA** (or fix and re-review if needed)

```
Step 4: QA validates (triggered by handoff button)
```

- ✅ QA reads all artifacts from `.agentwork/`
- ✅ Writes integration tests, runs full suite
- ✅ Creates QA report in `.agentwork/qa/`

**Validation:**
```bash
curl "http://localhost:5000/users?page=1&limit=10"    # .NET
# or curl "http://localhost:3000/users?page=1&limit=10"  # Node/Go
```

- [ ] Endpoint works correctly
- [ ] Pagination is implemented
- [ ] Tests exist and pass
- [ ] Artifacts exist in all four `.agentwork/` subdirectories
- [ ] `.agentwork/progress-log.md` has entries from all agents

### Test Case 5.2: Fix Loop via Handoffs

Test the Coder ↔ Code Reviewer loop:

1. Have the Coder implement something with a deliberate gap (e.g., no input validation)
2. Send to Code Reviewer — it should flag the issue
3. Click **Route Fixes to Coder** → Coder fixes
4. Click **Send to Code Review** → Code Reviewer re-reviews

**Validation:**
- [ ] Code Reviewer creates report with `status: changes-required`
- [ ] Coder reads the report and addresses findings
- [ ] On re-review, Code Reviewer increments `revision` field
- [ ] Revision History in the report shows both cycles

---

## Test 6: Artifact System & Conventions

### Test Case 6.1: Status-Driven Workflow

Verify that YAML front matter status fields work correctly:

1. After running Test 1 (Architect), check: `cat .agentwork/architect/SOLUTIONS_*.md | head -10`
2. Verify the YAML front matter contains `status: proposed` (before selection) or `status: selected` (after)
3. After running Test 2 (Coder), check the implementation summary has `status: implemented`

**Validation:**
- [ ] Solutions document has valid YAML front matter with `status` and `revision`
- [ ] Implementation summary has `status: implemented` after completion
- [ ] Code review report has `status: approved` or `status: changes-required`
- [ ] QA report has `status: pass`, `status: fail`, or `status: pass-with-notes`

### Test Case 6.2: Progress Log

After running any agent, verify the progress log exists:

```bash
cat .agentwork/progress-log.md
```

**Expected:** A markdown table with timestamped entries from each agent that ran.

**Validation:**
- [ ] File exists at `.agentwork/progress-log.md`
- [ ] Has table header: Timestamp | Agent | Action | Outcome | Details
- [ ] Each agent logged a `Started` and `Completed`/`Stopped` entry
- [ ] Timestamps are ISO 8601 format

### Test Case 6.3: Circuit Breaker (Advanced)

Test the revision limit by forcing multiple review cycles. This requires some deliberate back-and-forth:

1. Have Coder implement something intentionally incomplete
2. Send to Code Reviewer → gets `changes-required`
3. Have Coder make a minimal fix, send back to review
4. Repeat until `revision` hits 3

**Expected:** On the 3rd cycle, the Code Reviewer stops and presents unresolved findings to the user instead of continuing.

**Validation:**
- [ ] Agent stops at revision 3
- [ ] Summarizes points of disagreement
- [ ] Hands decision to user

### Test Case 6.4: Context Isolation

Test that agents work from artifacts, not chat history:

1. In a fresh chat, tell the Coder about a feature in conversation (don't save it anywhere)
2. Ask: `@code-reviewer review the implementation`

**Expected:** Code Reviewer should look for artifacts in `.agentwork/`, not reference the chat conversation.

**Validation:**
- [ ] Agent reads from `.agentwork/` rather than relying on chat context
- [ ] If no artifacts found, agent asks user how to proceed

---

## Test Results Checklist

After completing all tests, verify:

### Architect Agent
- [ ] Creates detailed implementation plans
- [ ] Researches codebase and external docs
- [ ] Recommends specific approaches with trade-offs
- [ ] Does NOT write code
- [ ] Output is actionable for Coder
- [ ] Saves artifacts to `.agentwork/architect/` with YAML status
- [ ] Logs to progress log
- [ ] Presents **Start Implementation** handoff button

### Coder Agent
- [ ] Writes functional code
- [ ] Follows existing patterns and style
- [ ] Implements features correctly
- [ ] Fixes bugs accurately
- [ ] Writes unit tests (hard gate: all passing)
- [ ] Saves artifacts to `.agentwork/coder/` with YAML status
- [ ] Logs to progress log
- [ ] Presents **Send to Code Review** or **Skip to QA** handoff buttons

### Code Reviewer Agent
- [ ] Reviews code systematically
- [ ] Provides specific, actionable feedback with file/line references
- [ ] Categorizes issues by severity (Critical / Important / Suggestions)
- [ ] Does NOT write code or fix issues
- [ ] Saves artifacts to `.agentwork/code-review/` with YAML status
- [ ] Increments revision on re-reviews
- [ ] Stops at revision 3 (circuit breaker)
- [ ] Presents **Route Fixes to Coder** or **Proceed to QA** handoff buttons

### QA Agent
- [ ] Writes comprehensive integration tests
- [ ] Tests pass and validate functionality
- [ ] Validates against Architect's plan requirements
- [ ] Does NOT fix code — reports issues
- [ ] Saves artifacts to `.agentwork/qa/` with YAML status
- [ ] Presents **Route Fixes to Coder** handoff button when issues found

### Conventions & Artifact System
- [ ] Artifacts have YAML front matter with `status` and `revision`
- [ ] Gateway checks prevent agents from running out of order
- [ ] Progress log tracks all agent activity with timestamps
- [ ] Circuit breaker stops infinite loops at revision 3
- [ ] Context isolation: agents work from files, not chat history
- [ ] Handoff buttons appear and work correctly

### Overall Team
- [ ] Agents work independently
- [ ] Agents chain together via handoff buttons
- [ ] No role confusion (agents stay in their lane)
- [ ] Output quality is consistently good
- [ ] `.agentwork/` has a complete paper trail

---

## Troubleshooting

### Agent Not Responding / Wrong Agent Called

**Problem:** Tagged `@architect` but got generic response

**Solutions:**
- Verify agents are in `.github/agents/` directory
- Check agent file names match: `architect.agent.md`, `coder.agent.md`, `code-reviewer.agent.md`, `qa.agent.md`
- Restart VS Code to reload agent definitions
- Try using the exact name from the agent's YAML frontmatter

### Agent Ignoring Instructions

**Problem:** Architect is writing code, or Coder is designing

**Solutions:**
- Check the agent `.md` file has clear role boundaries
- Be more explicit in your request: "don't write code, just plan"
- The agent might be trying to be helpful — redirect them

### Handoff Buttons Not Appearing

**Problem:** Agent completes work but no handoff buttons show in chat

**Solutions:**
- Check that the agent's YAML frontmatter has `handoffs:` configured with `send: false`
- Verify the `agent:` field in each handoff matches the target agent's filename (e.g., `agent: coder` matches `coder.agent.md`)
- Ensure the agent's workflow ends at a clear terminal state where handoff is appropriate
- Restart VS Code to reload agent definitions

### Gateway Check Blocking Unexpectedly

**Problem:** Agent refuses to start, says upstream status doesn't match

**Solutions:**
- Check the upstream artifact's YAML front matter `status` field
- The previous agent may not have set the status correctly
- Manually update the `status` field in the artifact to unblock
- Example: set `status: implemented` in `.agentwork/coder/IMPLEMENTATION_*.md`

### Agents Conflicting on Same Files

**Problem:** Multiple agents tried to edit the same file simultaneously

**Solutions:**
- Complete each agent's work before clicking the handoff button
- Each agent should only modify files in its own `.agentwork/` subdirectory
- Source code should only be modified by the Coder agent

### Tests Created But Don't Run

**Problem:** QA created tests but they fail or don't execute

**Solutions:**
- Check test file is in correct location
- Verify testing framework is installed
- Agent might have created tests for wrong framework
- Ask: `@qa why are the tests failing?`

### Progress Log Missing Entries

**Problem:** `.agentwork/progress-log.md` doesn't have entries from all agents

**Solutions:**
- The agent may have failed before logging start—check for errors
- If the file doesn't exist, the first agent should create it
- Manually create the file with the table header if needed

---

## Next Steps

Once all tests pass:

1. **Clean up:** Delete the test API project or keep it as a sandbox
2. **Use on real projects:** Try agents on your actual development work
3. **Customize:** Edit agent `.md` files based on what you learned
4. **Check common.md:** Adjust shared conventions (gateway checks, progress tracking) to your needs
5. **Create variants:** Make specialized agents for your tech stack
6. **Document patterns:** Note which workflows and handoff paths work best for you

## Advanced Testing

Want to go further?

- Test with a real project (not hello world)
- Test error scenarios (bad input, missing dependencies)
- Test with different languages/frameworks
- Test the Coder's escalation path (deliberate blocker → Escalate to Architect handoff)
- Test circuit breakers by forcing 3 revision cycles
- Verify progress log completeness after a full pipeline run

---

## Feedback Loop

As you test, improve your agents:

**If agents are too verbose:** Edit their `.md` files to be more concise

**If agents miss context:** Check that the numbered Context steps cover the right files

**If code quality varies:** Add explicit style guidelines to Coder agent

**If tests are weak:** Enhance QA agent's integration test standards section

**If handoffs don't chain smoothly:** Check YAML status fields in artifacts — they're the glue between agents

**If agents loop forever:** The circuit breaker should stop at revision 3 — verify this is working

Remember: These agents are tools you control and customize. Test, iterate, and adapt them to your workflow!

---

## Quick Reference: Test Commands

```bash
# Single-agent tests
@architect create a plan for [feature]
@coder implement [specific task]
@code-reviewer review the implementation
@qa add integration tests for [component]

# Full pipeline via handoff buttons
1. @architect design [feature]
2. Click "Start Implementation" → Coder implements
3. Click "Send to Code Review" → Code Reviewer reviews
4. Click "Proceed to QA" → QA validates

# Fix loop via handoff buttons
1. @code-reviewer review the implementation
2. Click "Route Fixes to Coder" → Coder fixes
3. Click "Send to Code Review" → re-review

# Check artifacts
ls .agentwork/architect/ .agentwork/coder/ .agentwork/code-review/ .agentwork/qa/
cat .agentwork/progress-log.md
head -5 .agentwork/*/SOLUTIONS_*.md   # Check YAML status

# Verification commands (adjust for your language)
dotnet test / npm test / pytest / go test
curl http://localhost:5000/[endpoint]  # .NET (or :3000 for Node/Go)
```

Happy testing!

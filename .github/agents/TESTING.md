# Testing Your Agent Team

This guide walks through testing your agents with a simple Hello World API application. You'll verify each agent works correctly both independently and as a coordinated team.

## Prerequisites

- Agents are installed in `.github/agents/`
- You have VS Code with GitHub Copilot enabled
- You can tag agents with `@agent-name` in Copilot Chat

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

## Test 3: Quality Agent (Testing & Review)

**Goal:** Verify Quality can write tests and review code.

### Test Case 3.1: Write Tests

```
@quality add tests for the /health endpoint
```

**Expected Output:**
- ✅ Creates test file following project conventions
- ✅ Tests happy path (200 response, correct structure)
- ✅ May test edge cases
- ✅ Uses appropriate testing framework

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

### Test Case 3.2: Code Review

```
@quality review the code in [your main API file]
```

**Expected Output:**
- ✅ Systematic review of the code
- ✅ Identifies actual issues (if any)
- ✅ Categorizes: Critical ❌ / Important ⚠️ / Suggestions 💡
- ✅ Provides specific, actionable feedback
- ✅ Acknowledges good practices

**Validation:**
- [ ] Review is thorough and structured
- [ ] Feedback is specific (not vague)
- [ ] Suggestions make sense for your code
- [ ] Review includes both positives and improvements

---

## Test 4: Orchestrator (Multi-Agent Coordination)

**Goal:** Verify Orchestrator can coordinate multiple agents for complex tasks.

### Test Case 4.1: Full Feature Implementation

```
@orchestrator implement a /users endpoint that returns a paginated list of users with proper validation
```

**Expected Output:**

**Phase 1: Architecture**
- ✅ Orchestrator calls Architect first
- ✅ Architect researches and provides implementation plan

**Phase 2: Implementation**
- ✅ Orchestrator delegates coding to Coder
- ✅ Coder implements based on Architect's plan

**Phase 3: Quality Assurance**
- ✅ Orchestrator sends to Quality agent
- ✅ Quality writes tests and reviews

**Final Report:**
- ✅ Orchestrator summarizes what was completed
- ✅ Lists all files created/modified
- ✅ Confirms tests pass

**Validation:**
```bash
# Test the endpoint
curl "http://localhost:5000/users?page=1&limit=10"    # .NET
# or curl "http://localhost:3000/users?page=1&limit=10"  # Node/Go
```

- [ ] Endpoint works correctly
- [ ] Pagination is implemented
- [ ] Tests exist and pass
- [ ] Code follows project patterns

### Test Case 4.2: Complex Multi-Step Task

```
@orchestrator add request logging middleware and also add error handling to all endpoints
```

**Expected Output:**
- ✅ Orchestrator breaks this into phases
- ✅ May parallelize independent tasks (logging vs error handling)
- ✅ Coordinates Architect → Coder → Quality
- ✅ Manages file conflicts (same files may need multiple updates)
- ✅ Reports completion with summary

**Validation:**
```bash
# Make requests and check logs
curl http://localhost:5000/health              # .NET
curl http://localhost:5000/invalid-endpoint    # .NET
# or use :3000 for Node/Go
```

- [ ] Logging appears for all requests
- [ ] Error handling works (proper status codes, error messages)
- [ ] Tests updated/added
- [ ] No file conflicts or broken code

---

## Test 5: Agent Interaction Patterns

### Test Case 5.1: Sequential Workflow

Test that you can manually chain agents:

```
Step 1: @architect design an authentication system with JWT tokens

Step 2: @coder implement the auth system following the architect's plan

Step 3: @quality add tests for the auth system and review the implementation
```

**Validation:**
- [ ] Each agent stays in their lane (no role overlap)
- [ ] Later agents can reference earlier agents' work
- [ ] Final product is complete and tested

### Test Case 5.2: Agent Refinement

Test iterative improvement:

```
Step 1: @coder add a /products endpoint

Step 2: @quality review the /products code

Step 3: @coder fix the issues identified by the quality agent

Step 4: @quality verify the fixes
```

**Validation:**
- [ ] Quality identifies actual issues
- [ ] Coder addresses specific feedback
- [ ] Quality confirms resolution
- [ ] Iteration works smoothly

---

## Test Results Checklist

After completing all tests, verify:

### Architect Agent ✓
- [ ] Creates detailed implementation plans
- [ ] Researches codebase and external docs
- [ ] Recommends specific approaches
- [ ] Does NOT write code
- [ ] Output is actionable for Coder

### Coder Agent ✓
- [ ] Writes functional code
- [ ] Follows existing patterns and style
- [ ] Implements features correctly
- [ ] Fixes bugs accurately
- [ ] Code is clean and maintainable

### Quality Agent ✓
- [ ] Writes comprehensive tests
- [ ] Tests pass and validate functionality
- [ ] Reviews code systematically
- [ ] Provides specific, actionable feedback
- [ ] Categorizes issues appropriately

### Orchestrator Agent ✓
- [ ] Coordinates multiple agents effectively
- [ ] Breaks down complex tasks
- [ ] Manages dependencies correctly
- [ ] Prevents file conflicts
- [ ] Provides clear progress updates
- [ ] Delivers complete solutions

### Overall Team ✓
- [ ] Agents work independently
- [ ] Agents can be chained manually
- [ ] Orchestrator coordinates multi-step work
- [ ] No role confusion (agents stay in their lane)
- [ ] Output quality is consistently good

---

## Troubleshooting

### Agent Not Responding / Wrong Agent Called

**Problem:** Tagged `@architect` but got generic response

**Solutions:**
- Verify agents are in `.github/agents/` directory
- Check agent file names match: `architect.agent.md`, `coder.agent.md`, etc.
- Restart VS Code to reload agent definitions
- Try using full name: `@Architect` (capital A)

### Agent Ignoring Instructions

**Problem:** Architect is writing code, or Coder is designing

**Solutions:**
- Check the agent `.md` file has clear role boundaries
- Be more explicit in your request: "don't write code, just plan"
- The agent might be trying to be helpful - redirect them

### Orchestrator Not Delegating

**Problem:** Orchestrator does work itself instead of calling other agents

**Solutions:**
- Make task more explicitly multi-step: "design AND implement AND test"
- Check Orchestrator has `agent` tool enabled in its config
- Try phrasing: "@orchestrator coordinate the team to [task]"

### Agents Conflicting on Same Files

**Problem:** Multiple agents tried to edit the same file simultaneously

**Solutions:**
- This shouldn't happen with Orchestrator (it prevents this)
- If manually chaining, complete each agent's work before calling next
- Let Orchestrator handle the coordination

### Tests Created But Don't Run

**Problem:** Quality created tests but they fail or don't execute

**Solutions:**
- Check test file is in correct location
- Verify testing framework is installed
- Agent might have created tests for wrong framework
- Ask: "@quality why are the tests failing?"

---

## Next Steps

Once all tests pass:

1. **Clean up:** Delete the test API project or keep it as a sandbox
2. **Use on real projects:** Try agents on your actual development work
3. **Customize:** Edit agent `.md` files based on what you learned
4. **Create variants:** Make specialized agents for your tech stack
5. **Document patterns:** Note which workflows work best for you

## Advanced Testing

Want to go further?

- Test with a real project (not hello world)
- Test error scenarios (bad input, missing dependencies)
- Test with different languages/frameworks
- Stress test the orchestrator with very complex tasks
- Benchmark performance (simple task: single agent vs orchestrator)

---

## Feedback Loop

As you test, improve your agents:

**If agents are too verbose:** Edit their `.md` files to be more concise

**If agents miss context:** Add more specific instructions about researching first

**If code quality varies:** Add explicit style guidelines to Coder agent

**If tests are weak:** Enhance Quality agent's test strategy section

Remember: These agents are tools you control and customize. Test, iterate, and adapt them to your workflow!

---

## Quick Reference: Test Commands

```bash
# Simple single-agent tests
@architect create a plan for [feature]
@coder implement [specific task]
@quality add tests for [component]
@quality review [file]

# Orchestrated complex test
@orchestrator implement [full feature] with tests

# Manual coordination test
1. @architect design [feature]
2. @coder implement based on architect's plan
3. @quality test and review the implementation

# Verification commands (adjust for your language)
dotnet test / npm test / pytest / go test
curl http://localhost:5000/[endpoint]  # .NET (or :3000 for Node/Go)
dotnet format / npm run lint / flake8 / golint
```

Happy testing! 🧪

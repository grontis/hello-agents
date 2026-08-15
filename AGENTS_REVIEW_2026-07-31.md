# Agent Definitions Review — 2026-07-31

A review of the `.claude/` pipeline (agents, commands, hooks, templates) and the
`game-engine-architect` skill against the current state of Claude Code and the
Claude 5 model family (Fable 5, Opus 5, Sonnet 5). Platform facts below were
verified against the current Claude Code documentation (hooks guide, sub-agents,
skills, model-config) on the review date.

---

## Executive summary

The pipeline's architecture has aged well. Everything load-bearing was verified
as **still valid**: the `SubagentStart` / `SubagentStop` / `UserPromptExpansion`
hook events, the `{"decision": "block", "reason": ...}` blocking output,
`memory: project` frontmatter, `disable-model-invocation: true` on commands, and
the `sonnet` / `opus` model aliases (which now float to Claude Sonnet 5 and
Claude Opus 5 automatically — no edits needed to pick up the new models).

The issues found fall into three groups:

1. **One documentation gap**: the repo-root `skills/` directory is intentionally
   a *library* (kept outside `.claude/` so consuming projects choose which
   skills to adopt), but Claude Code only discovers skills at
   `.claude/skills/<name>/SKILL.md` — and nothing in the repo documents the
   required copy-in step, so a consumer could reasonably assume the skill works
   in place.
2. **A handful of consistency bugs**: a file-scope contradiction in
   `architect-deep.md`, a stale README comment, a `session.yaml` key-naming
   inconsistency, and a probable name collision between the project's
   `/code-review` command and the built-in `/code-review ultra`.
3. **Model-era tuning opportunities**: the prompts were written to constrain
   weaker, less obedient models. The Claude 5 generation follows instructions
   *more literally*, which changes what good prompting looks like — some
   defensive repetition can be trimmed, the code-reviewer needs a
   coverage-first instruction to avoid depressed recall, and new frontmatter
   levers (`effort`, `maxTurns`, the `fable` alias) are worth adopting.

---

## 1. Verified current — no action needed

| Item | Status |
|---|---|
| `SubagentStart` / `SubagentStop` hook events (matcher = agent type) | ✅ Valid |
| `UserPromptExpansion` hook event (matcher = command name; can block before the model sees the prompt) | ✅ Valid |
| Gateway blocking output `{"decision": "block", "reason": "..."}` on stdout | ✅ Correct format for this event |
| `memory: project` agent frontmatter → `.claude/agent-memory/<agent>/` | ✅ Valid (values: `user`, `project`, `local`) |
| `model: sonnet` / `model: opus` aliases | ✅ Valid — float to Claude Sonnet 5 / Claude Opus 5 |
| `disable-model-invocation: true` on commands | ✅ Valid and still the right field |
| Fail-open Node (`.mjs`) hooks for win32 portability | ✅ Sound design, no changes needed |
| Single-plan-document workflow, gateway status checks, circuit breaker | ✅ Internally consistent across agents, commands, and templates |

The two hook scripts are well-written: conservative, fail-open, and they only
block unambiguous violations. No functional problems found in either.

---

## 2. Defects and inconsistencies

### 2.1 The skills library needs a copy-in note (documentation gap)

`skills/` at the repo root is a deliberate design choice: it is a **library** of
skills held alongside the pipeline, kept outside `.claude/` so that projects
consuming the agents don't automatically inherit every skill. That rationale is
sound — but Claude Code only discovers skills at
**`.claude/skills/<skill-name>/SKILL.md`** (project) or `~/.claude/skills/`
(personal), and nothing in the repo currently says so. A consumer copying this
repo (or working inside it) could reasonably assume `skills/game-engine-architect/`
is live when it is never scanned.

**Fix:** document the adoption step — in `CLAUDE.md`'s skill section and the
README — e.g.: "the root `skills/` directory is a library; to use a skill,
copy its folder into the target project's `.claude/skills/` (or
`~/.claude/skills/` for personal use). Claude Code does not scan the repo-root
`skills/` directory."

The skill's *content* is in good shape — decision-oriented, progressive
disclosure via the reference index, a strong trigger-rich `description`. Two
optional modernizations: skills now support an `effort` frontmatter field, and
`when_to_use` if you ever want to split triggering guidance out of the
description. Neither is required.

### 2.2 `architect-deep.md` file-scope contradiction

`architect-deep.md` ends with:

> "Identical to the default architect: only `.agentwork/architect/`,
> `.agentwork/session.yaml`, and **`.agentwork/progress-log.md`**."

This contradicts both `shared-conventions.md` and `architect.md`, which state
the progress log is written **only by the hooks** and agents must never touch
it. This looks like a leftover from before the hook-based logging refactor.

**Fix:** delete `.agentwork/progress-log.md` from that sentence.

### 2.3 Stale README comment about `/status`

`.claude/README.md` line 212 annotates `status.md` with
"*(injects live session/log state)*". Per `CLAUDE.md` (and the command itself),
`/status` deliberately does **not** use `` !`shell` `` injection — the model
reads the files itself. The comment describes the design that was rejected.

**Fix:** change the annotation to something like "(reads live state itself; no
shell injection)".

### 2.4 `session.yaml` key inconsistencies

- `shared-conventions.md` documents the schema as `architect / coder /
  code_review / qa`, but `qa.md` step 8 writes an `artifacts.manual-qa` key that
  isn't in the documented schema — and it uses a hyphen where the other
  multi-word key (`code_review`) uses an underscore.
- **Fix:** add `manual_qa: ~` to the schema in `shared-conventions.md` and use
  the underscore form in `qa.md`, so the schema stays the single source of
  truth.

### 2.5 Probable `/code-review` name collision (verify)

Claude Code now ships a built-in `/code-review` surface (`/code-review` reviews
the working diff; `/code-review ultra` launches the multi-agent cloud review).
The project defines its own `/code-review` command. Project commands generally
shadow built-ins, which means users of this repo may lose access to the built-in
review (including ultra) — or, depending on resolution order, the pipeline stage
may not be the one that runs.

**Fix options:** (a) rename the pipeline command to `/review-stage` or
`/pipeline-review` and update `CLAUDE.md`, the reviewer agent's Next Steps
text, the coder's Next Steps text, the gateway matcher in `settings.json`, and
the README; or (b) verify in-session that the project command reliably wins and
document the shadowing as intentional. Given the built-in ultra review is
genuinely useful, (a) is recommended.

### 2.6 Minor: gateway `session.yaml` parsing

`gateway.mjs` extracts artifact paths with the regex `` `${key}:\s*(\S+)` ``
over the raw file. This works for the documented schema but is brittle if a
`feature_slug` or artifact filename ever contains `coder:` / `architect:` as a
substring, or if the YAML gains comments. Low risk; acceptable as-is given the
fail-open design. If you touch the file anyway, anchoring the regex to
line-start indentation (`` `^\s{2}${key}:` `` with the `m` flag) removes the
edge case.

---

## 3. Model-era updates (the main event)

### 3.1 Model tiering still works — but the landscape shifted

Because the frontmatter uses floating aliases, the pipeline already runs on the
Claude 5 generation: `sonnet` → **Claude Sonnet 5**, `opus` → **Claude Opus 5**.
Two consequences:

- **Sonnet 5 is dramatically stronger than the Sonnet the tiering was designed
  around** — it reaches what was previously Opus-tier quality on coding and
  agentic work. The decision to default the architect (and coder, reviewer, QA)
  to Sonnet holds up *better* than when it was made. The self-escalation bar in
  `architect.md` ("recommend `--deep` for large") can arguably be raised: plain
  Sonnet 5 now handles many designs that would have needed Opus before.
- **A new tier exists above Opus**: `fable` is now a valid `model:` alias
  (Claude Fable 5, Anthropic's most capable widely released model). Options:
  - Leave `architect-deep` on `opus` (Opus 5 is itself a step-change and half
    Fable's price) — reasonable default.
  - Or add a third tier: `/architect --deep` → Opus 5, and a `--max` /
    `--fable` flag routing to a `fable`-backed variant for genuinely novel,
    cross-cutting system design. Given `architect-deep` already delegates its
    entire body to `architect.md`, a third variant is ~10 lines of file.

### 3.2 New frontmatter levers worth adopting

Current sub-agent frontmatter supports fields that didn't exist when these
agents were written:

| Field | Suggested use here |
|---|---|
| `effort` | The highest-leverage new knob. Suggested: `architect-deep: xhigh`, `coder: xhigh` (documented best setting for coding/agentic work), `architect` / `code-reviewer`: default (`high`), `qa: high`. Lower effort on Claude 5 models still performs very well, so don't reflexively max everything. |
| `maxTurns` | A cheap mechanical backstop for the circuit-breaker philosophy — e.g. cap the coder/qa at a generous turn limit so a wedged run can't loop forever. |
| `permissionMode` | Could replace or complement the `settings.json` allow-list if you ever want per-agent permission posture. |
| `skills` | Agents can preload skills — e.g. give the architect and coder the `game-engine-architect` skill (once relocated) in game-engine projects. |
| `hooks` (per-agent) | Not needed — the settings-level hooks are cleaner for this design. |

### 3.3 Prompt tuning for more-literal models

The Claude 5 generation follows instructions substantially more literally than
the models these prompts were battle-hardened against. Three concrete
implications:

**(a) Code-reviewer recall — the most important prompt change.** Anthropic's
migration guidance is explicit: review harnesses that tell the model to be
selective ("Focus on substance over style preferences", severity gating at
report time) now see *depressed measured recall* — the model finds the bugs and
then declines to report ones it judges below the bar. Recommended addition to
`code-reviewer.md`:

> "Report every issue you find, including ones you are uncertain about or
> consider low-severity — do not filter for importance or confidence at
> reporting time. For each finding, include a confidence level and severity so
> the user and the Coder can triage. It is better to surface a finding that
> gets dismissed at the checkpoint than to silently drop a real bug."

This composes cleanly with the existing severity taxonomy: severity becomes a
*label*, not a *filter*. The user checkpoint after review is the downstream
filter this pattern assumes.

**(b) Defensive repetition can be trimmed.** The serial-execution / STOP rule is
currently stated in ~5 places: every command's "Handoff rule" block, every
agent's Next Steps, `shared-conventions.md` (two sections), and `CLAUDE.md`.
That redundancy was rational when models skipped checkpoints; with (i) the
gateway hook providing a deterministic gate and (ii) stronger instruction
following, one canonical statement (shared-conventions) plus a one-line pointer
in each command would suffice. Benefits: less context per invocation, and one
fewer place for future drift. This is optional — the repetition isn't *harmful*,
just no longer necessary — but if you keep it, keep it verbatim-identical
across files.

**(c) Aggressive emphasis reads as literal now.** Phrases like "CRITICAL: User
Review Required" and stacked "Never…" lists over-apply on literal models. The
checkpoint STOPs should stay emphatic (that's genuine policy, and the hooks
back it), but audit the smaller "Never" items — e.g. the reviewer's "Never
suggest alternative architectures" can suppress a legitimately necessary
"this approach is fundamentally broken" escalation. Consider softening to
"Review against the approved architecture; if you believe the approved approach
itself is defective, say so explicitly as a `needs-discussion` verdict rather
than redesigning."

Two smaller model-era notes:

- **Verbosity of artifacts.** Claude 5 models write longer documents by
  default. Consider adding one line to `shared-conventions.md` Code Standards:
  "Match artifact length to the task — cover the substance, no filler sections
  or restated boilerplate." (The templates' comments already scope by
  complexity, which helps.)
- **Self-verification.** Opus/Sonnet 5 verify their own work unprompted. The
  coder's test gate and QA's "never rubber-stamp" are real gates, keep them —
  but avoid *adding* "double-check your work" phrasing anywhere new; on this
  generation it causes over-verification churn.

### 3.4 Newer Claude Code surfaces worth knowing about (informational)

- **AskUserQuestion at checkpoints.** The architect's solution-selection
  checkpoint (pick A/B/C/hybrid) maps perfectly onto the harness's structured
  question UI. Since subagents can't reach the user directly, the improvement
  belongs in `commands/architect.md`: instruct the orchestrator that when the
  plan comes back `proposed`, it should present the solutions to the user via
  AskUserQuestion (options = solutions + "hybrid" + "revise") instead of prose.
  Same idea applies to the post-coder and post-review option menus.
- **Built-in Plan mode / `Plan` / `Explore` agents** now overlap with part of
  the architect's job. The pipeline's value-add over plan mode is the durable
  artifact + gateway + revision protocol, so no change needed — but the README
  could acknowledge the distinction so users know when to use which.
- **Command frontmatter has grown** (`agent`, `context: fork`, `model`,
  `allowed-tools`). The current thin-wrapper commands are still the right
  pattern; nothing to adopt urgently.

---

## 4. Smaller suggestions

1. **Give the code-reviewer read-only git access.** It currently has no
   Bash/shell tool, so it can only review files the coder *says* it changed. A
   reviewer that can run `git diff`/`git log` catches unreported changes.
   Options: add `Bash` with a Rules line restricting it to read-only git
   commands, plus `settings.json` allows for `Bash(git diff:*)`,
   `Bash(git log:*)`, `Bash(git status:*)`. (Trade-off: widens the tool surface
   of a deliberately read-only agent — defensible either way, but the current
   design silently trusts the coder's self-report.)
2. **Test-command permissions.** The coder/qa run test suites via Bash, which
   prompts every time in a fresh project. Since `.claude/` is meant to be
   copy-portable, consider documenting (README "Tips") that users should allow
   their test runner (`Bash(npm test:*)`, `Bash(pytest:*)`, etc.) in
   `settings.local.json`, or run the bundled `fewer-permission-prompts` flow.
3. **`valid-statuses` drift check.** Template front matter declares
   `valid-statuses`, but nothing enforces it. The gateway could optionally
   validate that a status it reads is in the template's declared set — cheap to
   add, catches typo'd statuses (`implmented`) that today silently pass the
   `s !== 'implemented'` check in the *blocking* direction (a typo actually
   causes a block today, which is fail-closed — fine, but the error message
   would confuse). Low priority.
4. **Progress-log outcome column.** The log writes `—` for Outcome on every
   row. `SubagentStop` hook input may include enough to distinguish clean
   completion; if not, leave as-is (README already documents the limitation
   honestly).

---

## 5. Prioritized action list

| # | Action | Priority | Effort |
|---|---|---|---|
| 1 | Document the skills-library adoption step (copy into `.claude/skills/` to use) in CLAUDE.md + README | **High** — discovery behavior is currently undocumented | Trivial |
| 2 | Fix `architect-deep.md` file-scope line (remove progress-log.md) | High — protocol contradiction | Trivial |
| 3 | Add coverage-first reporting instruction to `code-reviewer.md` | High — measurable recall impact on Claude 5 models | Small |
| 4 | Resolve `/code-review` collision with the built-in (rename or verify+document) | Medium | Small |
| 5 | Fix README `/status` annotation; align `manual_qa` session key + schema | Medium — doc hygiene | Trivial |
| 6 | Adopt `effort` frontmatter per agent; consider `maxTurns` backstops | Medium — free quality/cost lever | Small |
| 7 | Decide the Fable question: keep 2-tier architect, or add a `fable`-backed top tier | Medium — product decision | Small |
| 8 | Trim duplicated serial-execution prose to one canonical source | Low — optional simplification | Medium |
| 9 | Soften over-literal "Never" rules (reviewer architecture rule) | Low | Trivial |
| 10 | Reviewer git access, test-permission docs, gateway status validation | Low — quality-of-life | Small–Medium |

---

## 6. Outcome (applied 2026-07-31)

Decisions made and changes applied after review:

| # | Item | Decision / result |
|---|---|---|
| 1 | Skills library | **Reframed, not moved.** Root `skills/` is an intentional library kept outside `.claude/`. Documented the copy-into-`.claude/skills/` adoption step in CLAUDE.md and the README. |
| 2 | `architect-deep.md` file scope | ✅ Fixed — progress-log removed from the writable scope; hook ownership restated. |
| 3 | Reviewer coverage-first reporting | ✅ Applied — "severity is a label, not a filter" added; style-vs-substance rule now affects severity, not reporting. |
| 4 | Command collision | ✅ Renamed `/code-review` → **`/review-code`** (file git-mv'd, gateway matcher + `gateway.mjs` check updated, all doc/agent references updated, rationale noted in CLAUDE.md and README so it isn't renamed back). |
| 5 | Doc hygiene | ✅ Fixed — README `/status` annotation corrected; session key standardized to `artifacts.manual_qa` and added to the shared-conventions schema. |
| 6 | `effort` frontmatter | ✅ Applied — `coder: xhigh`, `architect-deep: xhigh`, `qa: high`; `architect` and `code-reviewer` inherit the default. Documented in CLAUDE.md. |
| 7 | Fable tier | **Declined** — keeping the two-tier architect (Sonnet default, Opus `--deep`). Decision recorded in CLAUDE.md; revisit if `--deep` proves insufficient. |
| 8 | Trim duplicated serial-execution prose | Deferred — optional simplification, not applied. |
| 9 | Over-literal "Never" rules | ✅ Applied — reviewer may now flag a defective approved approach via `needs-discussion` instead of being barred from architecture comments. |
| 10 | Reviewer git access | ✅ Applied — `Bash` added to code-reviewer tools with a read-only-git Rules restriction; `settings.json` allows `git status/diff/log/show`; workflow now diffs reality against the coder's file list. |

Still open: item 8 (prose dedup), plus the low-priority ideas in §4
(test-runner permission docs, gateway `valid-statuses` validation, progress-log
outcome column) and the §3.4 AskUserQuestion-at-checkpoints enhancement.

---

*Review conducted 2026-07-31. Platform facts verified against current Claude
Code docs (hooks-guide, sub-agents, skills, model-config) at review time.*

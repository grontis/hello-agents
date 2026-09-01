---
status: draft
revision: 0
valid-statuses: [draft, in-progress, opened, updated, blocked]
pr_url:
pr_number:
pr_title:
branch:
base:
draft: false
---

# Pull Request: [Feature Name]

**Date:** YYYY-MM-DD
**Opened by:** PR Agent
**QA Report:** .agentwork/qa/QA_REPORT_[slug]_YYYY-MM-DD.md
**Code Review:** .agentwork/code-review/CODE_REVIEW_[slug]_YYYY-MM-DD.md
**Implementation:** .agentwork/coder/IMPLEMENTATION_[slug]_YYYY-MM-DD.md
**Architect Plan:** .agentwork/architect/PLAN_[slug]_YYYY-MM-DD.md

> `pr_url` is the single field consumers depend on. Copy it exactly as `gh`
> printed it. If no pull request was opened, leave it empty and set
> `status: blocked` — an invented URL is worse than an absent one.

---

## Preflight

| Check | Result |
|---|---|
| On a feature branch (not the base) | |
| No uncommitted changes to tracked files | |
| At least one commit ahead of base | |
| Untracked files present (not blocking) | |

---

## Push

- **Branch:**
- **Base:**
- **Commits pushed:**
- **Command:**
- **Result:**

---

## Pull Request

- **URL:**
- **Number:**
- **Title:**
- **New or updated:**

---

## Description as submitted

> The body that was actually sent to GitHub, verbatim. Keeping a copy here
> means the description stays readable after the workspace is gone.

---

## Caveats carried forward

> Anything QA passed with notes, anything the reviewer accepted with
> reservations, anything deliberately deferred. These must appear in the pull
> request body too — this section is the record that they were not dropped.

---

## If blocked

- **What failed:**
- **What a human needs to do:**

---

## Revision History

| Revision | Date | Status | Notes |
|---|---|---|---|
| 0 | YYYY-MM-DD | draft | |

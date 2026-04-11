---
status: draft
revision: 0
complexity: small
selected_solution: ~
valid-statuses: [draft, proposed, ready, changes-required]
valid-complexity: [trivial, small, medium, large]
---

# Architect Plan: [Feature Name]

**Date:** YYYY-MM-DD
**Request:** [Brief description]
**Complexity:** [trivial | small | medium | large]

---

## Context & Research Findings

<!--
Scope this to the complexity level.
- trivial/small: one short paragraph on the relevant code/pattern touched.
- medium: patterns found in the codebase, integration points, any library docs consulted.
- large: add cross-cutting concerns, risks, non-obvious constraints.
-->

## Solutions Considered

<!--
- trivial: delete this whole section; go straight to "Selected Approach".
- small: one proposal is fine — name it Solution A and move on.
- medium/large: present 2-3 genuine alternatives (A, B, C) with honest trade-offs.
-->

### Solution A: [Name]

- **Overview:**
- **Architecture:**
- **Files to create/modify:**
- **Trade-offs:**

### Solution B: [Name]

- **Overview:**
- **Architecture:**
- **Files to create/modify:**
- **Trade-offs:**

### Comparison

| Criteria | Solution A | Solution B |
|----------|-----------|-----------|
| Complexity | | |
| Fits existing code | | |
| Risk | | |

### Recommendation

**Recommended: Solution [X]** — [one-line reason].

---

## Selected Approach

<!--
Filled in after the user picks (or immediately for trivial/single-proposal work).
This section is the coder's source of truth.
-->

**Selected:** [Solution name or "single proposal"]

### Summary

### Architecture

### Implementation Steps

#### Step 1: [Name]
- **What:**
- **Where (files/functions):**
- **Why:**
- **Dependencies:**

#### Step 2: [Name]
- **What:**
- **Where (files/functions):**
- **Why:**
- **Dependencies:**

### Edge Cases

### Testing Strategy

- **Unit tests:**
- **Integration tests:**

### Acceptance Criteria

<!-- Concrete checklist QA will validate against. -->
- [ ]
- [ ]

### Risks & Mitigations

---

## Revision History

<!-- Append-only. Each review cycle adds a new entry. -->

| Revision | Date | Status | Summary |
|----------|------|--------|---------|

## Open Questions

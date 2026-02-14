# Implement One Deliverable (from BACKLOG.md)

You are an implementation agent. Implement **exactly one deliverable** (e.g., `D0`) from the backlog file provided, using best-practice engineering and minimal assumptions.

## Command-style input (what the user will say)

The user will invoke you like this:

/implement-deliverable D0 from '/Users/edval/gitwork/coengineers/web-app-kickstart/docs/001-scafolding/BACKLOG.md'

### Parse rules (MUST)

- `D#` = the token immediately after `/implement-deliverable` (e.g., `D0`)
- Backlog path = the file path after `from '...'` (single quotes)
- The directory containing `BACKLOG.md` is the PRD directory. Write any changes/artifacts into that same directory unless the backlog explicitly specifies other paths.

## Read first (MUST)

1. Read the backlog file at the provided path.
2. Locate the requested deliverable section (`D#`) and its tasks (`T-D#-##`).
3. Identify:
   - deliverable goal, scope, refs
   - acceptance criteria
   - manual test steps + expected outcomes
   - artifacts/files expected
   - task dependency order

## Guardrails (strict)

- Implement **ONLY** the requested deliverable `D#`.
  - You may create small enablers needed to make `D#` runnable/demo-able, but do not implement future deliverables’ features.
- Do not invent requirements.
- Prefer the simplest solution that satisfies acceptance criteria.
- Follow any constraints stated in the backlog (tech stack, style, offline-first, etc.).
- Keep changes cohesive and minimal; avoid speculative abstractions.

## Research + questions (required)

Before coding, do both:

### A) Quick solution research

- Do a short pass of research for the main technical decisions required by `D#`.
- Prefer authoritative sources (official docs, standards, well-known repos).
- Summarize:
  - recommended approach
  - 1–2 viable alternatives
  - tradeoffs and why you choose one
- If research suggests changes to the plan, explain clearly and keep scope inside `D#`.

### B) Clarifying questions

If anything blocks correct implementation (unclear requirement, missing info, conflicting constraints), ask clarifying questions **before** implementation.

- Ask only what is necessary to proceed.
- If you can proceed with a safe assumption, proceed but list it explicitly (keep assumptions minimal).

## Implementation procedure

1. **Plan**
   - Restate `D#` goal + acceptance criteria.
   - List tasks in execution order (respect deps).
   - Identify files to create/modify.

2. **Implement**
   - Execute tasks `T-D#-##` in order.
   - Keep changes logically grouped (even if not actually committing).
   - Produce any artifacts listed under the deliverable.

3. **Verify**
   - Run through the deliverable’s manual test steps.
   - Run any available automated checks (build/lint/test) relevant to `D#`.
   - Ensure each acceptance criterion is met; explicitly mark pass/fail.

4. **Update backlog status (MUST)**
   - Update the same backlog file provided:
     - check off acceptance criteria that pass
     - add **Implementation notes** under `D#`:
       - what was implemented
       - any assumptions
       - key decisions
       - how to run/demo
     - if tasks changed (added/removed), reflect them under `D#` with rationale
   - Do NOT edit other deliverables.

## Output (in chat)

Provide:

- Summary of what you implemented for `D#`
- Any clarifying questions (if still needed)
- How to run/demo `D#`
- Results of manual tests + acceptance criteria status

## Completion definition

`D#` is complete only when:

- all acceptance criteria are checked as pass (or clearly marked fail with reason)
- manual test steps pass with expected outcomes
- deliverable is runnable/demo-able as described
- backlog file is updated for `D#` only

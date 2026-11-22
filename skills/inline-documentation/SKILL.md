---
name: inline-documentation
description: Use when adding or improving code-adjacent documentation such as comments, docstrings, type notes, or small README/API clarifications.
metadata:
  ai4sdlc.created: "2026-06-25T11:06:07-04:00"
  ai4sdlc.updated: "2026-10-20T14:59:35-05:00"
  ai4sdlc.category: documentation
  ai4sdlc.tags: documentation
  ai4sdlc.owner: ai4sdlc-skills-team
---

# Inline Documentation

## Overview

Improve the documentation that lives next to code so future maintainers can
understand intent, constraints, and safe usage without reading unrelated
history. Favor precise context over volume. The best inline documentation
explains why code is shaped a certain way, what callers may rely on, and where
the sharp edges are.

Do not narrate code that is already clear. If a name, type, or small refactor
would remove the need for a comment, recommend that instead when edits are in
scope.

## When To Use

Use this skill when:

- The user asks for comments, docstrings, JSDoc, TSDoc, API notes, or inline
  documentation.
- A change introduces non-obvious control flow, domain rules, protocol details,
  migration behavior, compatibility constraints, or security assumptions.
- Public functions, classes, modules, commands, configuration, or extension
  points need clearer usage contracts.
- Existing comments are stale, vague, misleading, or too implementation-focused.
- Review feedback asks for the intent or maintenance risk of code to be
  documented.

Do not use this skill when:

- The user wants a standalone tutorial, design document, release note, PR
  description, or changelog entry.
- The requested documentation would only restate obvious syntax or line-by-line
  behavior.
- The code behavior is unclear enough that documentation would guess instead of
  clarify.
- The best fix is a code change the user has not asked for and documentation
  would hide the underlying problem.

## Workflow

1. Identify the audience and maintenance question the documentation should
   answer.
2. Inspect nearby code, tests, existing comments, and public API conventions
   before writing.
3. Decide the smallest documentation surface that solves the problem: comment,
   docstring, parameter note, module note, README/API snippet, or no
   documentation with a clearer-code recommendation.
4. Write documentation that captures intent, contract, invariants, side effects,
   error behavior, or operational constraints.
5. Remove or revise stale neighboring comments so the final code does not carry
   conflicting explanations.
6. If documentation describes behavior, verify it against code or tests when the
   environment allows. Report what was checked.

## Documentation Rules

- Explain why, when, and under what constraints; avoid translating each line of
  code into prose.
- Keep comments close to the decision, invariant, or edge case they explain.
- Match the repository's existing comment and docstring style.
- Document public contracts more carefully than private helper mechanics.
- Name inputs, outputs, exceptions, side effects, and lifecycle expectations only
  when they matter to a caller or maintainer.
- Preserve security, privacy, and operational caveats when they affect safe use.
- Prefer durable language over references to transient tickets, local branches,
  current reviewers, or temporary workspace state.
- Do not claim guarantees that tests, types, or code do not support.

## What Good Looks Like

Good inline documentation:

- Answers a real future question a maintainer is likely to ask.
- States intent or constraints that are not obvious from the code.
- Uses the same vocabulary as the surrounding module and tests.
- Is short enough to stay readable during code review.
- Stays accurate when implementation details change inside the documented
  contract.

Good docstrings for public functions usually cover:

- What the function does in caller terms.
- Important parameters or accepted value shapes.
- Return value or yielded value when it is not obvious.
- Raised errors or failure behavior that callers should handle.
- Side effects, external calls, persistence, logging, or security assumptions.

## Output Format

When returning documentation changes or recommendations, include:

- Documentation surface updated or proposed.
- Behavior or constraint clarified.
- Verification performed, or why verification was not possible.
- Any remaining ambiguity that should be resolved before documenting further.

## Common Mistakes

- Writing comments that repeat the next line of code.
- Using documentation to justify confusing names or control flow that should be
  simplified.
- Adding broad file headers when a focused comment near the invariant would be
  clearer.
- Documenting guessed behavior because tests or callers were not inspected.
- Leaving stale comments in place after the documented behavior changes.
- Promising compatibility, security, performance, or error handling guarantees
  that the code does not enforce.

---
name: unit-test-generation
description: Use when creating or improving unit tests for a bounded code change, bug fix, or documented behavior.
metadata:
  ai4sdlc.created: "2026-06-19T23:01:02-05:00"
  ai4sdlc.updated: "2026-10-20T14:59:35-05:00"
  ai4sdlc.category: testing
  ai4sdlc.tags: unit-tests,testing,code-review
  ai4sdlc.owner: ad4sdlc-skills-team
---

# Unit Test Generation

## Overview

Create focused unit tests that protect behavior a developer or reviewer can
explain. The goal is durable regression coverage, not broad test volume.

## When To Use

Use this skill when:

- A code change needs unit tests before review or merge.
- A bug fix needs a regression test that fails on the old behavior.
- Existing tests cover only happy paths and miss important edge cases.
- A reviewer asks for test coverage tied to a specific behavior.

Do not use this skill when:

- The request is for end-to-end, load, security, accessibility, or manual QA
  testing.
- The expected behavior is unclear enough that tests would encode guesses.
- The code under test requires a live external service and no local seam exists.

## Workflow

1. Identify the behavior to protect in one sentence.
2. Inspect the nearest existing tests for naming, fixtures, helpers, and style.
3. Choose the smallest unit boundary that exercises real code.
4. Write or propose tests that cover the normal path, one meaningful edge case,
   and one failure or invalid-input path when applicable.
5. Keep mocks at system boundaries. Avoid tests that only prove a mock was
   called unless that interaction is the behavior being protected.
6. Run the relevant test command when the environment and user authorization
   allow it. Report the exact command and result.

## Test Design Rules

- Test observable behavior, not private implementation details.
- Prefer clear setup and assertions over clever parameterization.
- Name tests after the behavior and condition they verify.
- Keep each test focused enough that one failure points to one broken behavior.
- Use realistic input values that make the scenario readable.
- Avoid sleeps, network calls, current time, random data, or shared global state
  unless the test controls them.

## Output Format

When returning test recommendations or patches, include:

- Behavior covered
- Files changed or proposed
- Test command run, or why it was not run
- Remaining coverage gaps that are directly relevant to the requested change

## Common Mistakes

- Generating many shallow tests that duplicate the same assertion.
- Mocking the function being tested instead of its external dependency.
- Asserting internal helper calls when user-visible output is what matters.
- Writing tests before clarifying ambiguous expected behavior.
- Claiming coverage is complete without running or inspecting the relevant
  tests.

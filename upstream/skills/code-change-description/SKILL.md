---
name: code-change-description
description: Use when drafting or refining a pull request or merge request description from diffs, file-by-file notes, or an existing draft.
metadata:
  ai4sdlc.created: "2026-06-19T19:49:27-05:00"
  ai4sdlc.updated: "2026-10-20T14:59:35-05:00"
  ai4sdlc.category: collaboration
  ai4sdlc.tags: pull-requests,documentation,code-review
  ai4sdlc.owner: ad4sdlc-skills-team
---

# Code Change Description

## Overview

Write the shortest PR or MR description that still lets a reviewer understand
why the change exists, what they should pay attention to, how to verify it, and
what is still unknown.

Optimize for reviewer comprehension, not template completion and not
changelog-style exhaustiveness. Even when the input is a file-by-file diff, the
output should read like a review narrative, not a path inventory.

## When To Use

Use this skill when:

- The user wants a PR or MR description drafted from a diff, notes, or commits.
- The user wants an existing PR or MR body rewritten to be clearer for reviewers.
- The structure to fill is already known, or the default structure below is
  sufficient.
- Technical changes need to be turned into concise reviewer-facing context.

Do not use this skill when:

- The task is only to create or operate the PR or MR in a CLI or web UI.
- The user wants verbatim text preserved with no rewriting.
- An in-repository PR or MR template must be resolved first.

## Workflow

1. Resolve any applicable in-repository PR or MR template before drafting.
2. Treat the resolved template or the default structure below as the structure
   to fill.
3. Translate raw diff notes into reviewer-facing meaning: motivation,
   user-visible or system-relevant change, fastest verification path, and real
   uncertainty.
4. If the source material is organized by path, regroup it by behavior, risk, or
   design intent before writing.
5. If a required section needs facts you do not know, ask one targeted question
   and stop.

## What Good Looks Like

- `Why`: the problem, motivation, or intended outcome in plain reviewer
  language.
- `What Changed`: reviewer-relevant behavior, design, or risk-bearing changes,
  not a file-by-file dump.
- `How To Verify`: the fastest credible path to confirm the change, including
  tests actually run when known.
- `Known Gaps`: real, source-supported uncertainty, deferred work, or validation
  the provided material explicitly shows has not happened yet.

The description should help a reviewer answer:

- Why does this change exist?
- What should I inspect most closely?
- How can I verify it quickly?
- What should I not assume is already proven?

## Default Structure

Use this when no stronger template has been resolved:

```md
## Why
## What Changed
## How To Verify
## Known Gaps
```

## Writing Moves

- Lead with intent and impact, not filenames.
- When the input arrives as a list of paths, infer the cross-file story first
  and then write that story.
- Summarize behavior and design choices the reviewer should care about.
- Prefer two to four strong bullets over long inventories.
- Mention specific files only when the path itself matters for review,
  ownership, or verification.
- Include only verification steps supported by the diff, tests, or user notes.
- Keep `Known Gaps` evidence-bound. Include only uncertainty, deferred work, or
  missing validation explicitly supported by the source material.
- Do not convert missing notes or absent verification details into a fake gap.
- Name uncertainty honestly instead of smoothing it over with `Low risk`,
  `N/A`, or guessed issue links.

## Quick Reference

| Situation | Action |
| --- | --- |
| No template resolved | Use `Why`, `What Changed`, `How To Verify`, `Known Gaps`. |
| One clear reviewer outcome | Open `Why` with that outcome. |
| Many files changed | Group by reviewer-relevant behaviors, not by path. |
| Input is already path-by-path | Rewrite into behavior or design prose before drafting. |
| Known tests ran | Put them in `How To Verify`. |
| A likely missing test or risk is unsupported by source material | Leave it out of `Known Gaps`; that belongs in review, not the MR description. |
| Required fact is unknown | Ask one targeted question and stop. |
| Optional field is weak or empty | Omit it or answer tersely if that is more honest. |

## Example

```md
## Why
This change makes request tracing easier during incident response by ensuring
API requests consistently include a request ID in logs and related
troubleshooting guidance stays in sync.

## What Changed
- Added request ID logging to the API middleware so request flows are easier to
  trace in logs.
- Renamed the related config flag for clearer intent.
- Added middleware unit coverage and updated troubleshooting documentation to
  match the new logging behavior.

## How To Verify
- Run `npm test`.
- Confirm request logs now include the request ID field.
- Verify the renamed config flag is reflected in the updated troubleshooting
  docs.

## Known Gaps
- Staging verification for the renamed config flag has not been run yet.
- Production log aggregation behavior is still unverified from the provided
  material.
```

## Common Mistakes

- Listing changed files instead of reviewer-relevant behaviors.
- Translating every diff bullet into a matching output bullet with the path
  preserved.
- Writing only `Summary` and `Testing` when the reviewer still lacks motivation
  or uncertainty.
- Filling weak sections with guesses like `Low risk`, `N/A`, or `None
  specified`.
- Claiming tests, screenshots, rollout steps, or issue links that are not
  actually known.
- Using `Known Gaps` to smuggle in speculative review feedback, inferred risks,
  or suggested tests not supported by the provided material.

## Red Flags

- The diff is obvious, so the why can be skipped.
- A file list is probably enough.
- The user handed over file bullets, so the final description should keep the
  same bullets.
- Calling the risk low will make the section feel complete.
- The reviewer can infer the gaps from the code.

All of these mean: rewrite toward reviewer understanding and remove unsupported
filler.

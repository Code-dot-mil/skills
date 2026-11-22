# Assess a skill and understand the results

The assessment kit helps you find potential problems in an agent skill, decide which findings need attention, and check your revisions. It is distributed as a **Python wheel**: an installable package file ending in `.whl`. Installing the wheel with a Python package tool such as uv makes the `skill-assessment` command-line tool available. The wheel contains the assessment tool, rather than the skills you want to review.

A skill is a directory containing `SKILL.md` and any supporting files. You can assess one local skill without installing the SkLC skill bundle or hosting a website.

The kit runs the external SkillSpector scanner and asks a configured model to review its findings in context. That second review is called **adjudication**. Together, the scanner report (`skillspector.json`) and contextual review (`adjudication.json`) form a **report pair** for the assessed skill contents. Keep these two files together; the `summarize` command reads the pair and produces a Markdown explanation of what needs action.

If you want to understand or try a skill before setting up assessment tools, start with [Using a skill](https://github.com/Code-dot-mil/SkLC/blob/main/docs/using-skills.md). The commands below are for readers comfortable installing Python tools and running commands, or a colleague helping with that setup.

Choose your path:

- **Assess your own skill:** read the scope below, install the kit, configure the scanner and provider, then [run an assessment](#assess).
- **Read existing reports:** [install the kit](#installation), then [summarize the pair](#summarize). You need no scanner or provider configuration for this path.
- **Check package structure or identify its contents:** use [Validate](#validate) or [Hash](#hash), without a scanner or provider.

## Review scope

Adjudication examines `SKILL.md` and scanner evidence. Supporting files are not independently reviewed by adjudication. Even `safe_to_use: true` applies only to that scope and does not certify the package. A command can finish successfully while reporting confirmed problems, unresolved findings, or incomplete coverage.

Default assessment sends skill contents to the configured model provider for scanning, followed by a separate adjudication request containing the full `SKILL.md` and scanner evidence. The kit does not execute the skill, follow its links, redact secrets, split the instructions into chunks, or truncate them. Review what you will send before assessing. Input that exceeds the gateway's context limit fails adjudication.

## Prerequisites

Install [Python 3.12 or later](https://www.python.org/downloads/) and [uv](https://docs.astral.sh/uv/getting-started/installation/), which the commands below use to manage the environment.

For a new assessment, also install [SkillSpector](https://github.com/NVIDIA/SkillSpector#installation) separately. The wheel does not install it. The compatibility target is `>=2.10,<3` through its public CLI and JSON format; 2.10.0 and 2.12.0 have been exercised, while other v2 releases are expected to remain compatible.

The scanner must be available as `skillspector` on `PATH` in the shell that runs assessment:

```sh
skillspector --version
```

If installed with `uv tool install`, ensure uv's tool executable directory is on `PATH`. If uv reports it missing, use `uv tool update-shell` and restart the shell. Other installation methods require their environment's executable directory on `PATH`; see [uv tool executables](https://docs.astral.sh/uv/concepts/tools/#tool-executables).

Default scanning uses a model. Configure SkillSpector's [provider environment](https://github.com/NVIDIA/SkillSpector/tree/v2.10.0#configuration) and the kit's [adjudication gateway settings](#adjudication-gateways) before running `assess`.

## Installation

Download `skill_assessment-<version>-py3-none-any.whl` from [SkLC releases](https://github.com/Code-dot-mil/SkLC/releases). Calculate its SHA-256 and compare it with the digest shown for that asset before installing. For example, on Linux:

```sh
sha256sum 'skill_assessment-<version>-py3-none-any.whl'
```

On macOS, use `shasum -a 256` instead; in PowerShell, use `Get-FileHash -Algorithm SHA256`. Compare the hexadecimal result with the release asset's digest, ignoring its `sha256:` prefix. The wheel version corresponds to the release version under Python packaging normalization.

Put the downloaded wheel in a separate working directory. From that directory, replace `<version>` with its filename's version, including Python's normalized prerelease spelling where applicable, and run:

```sh
uv venv --python 3.12
uv pip install 'skill_assessment-<version>-py3-none-any.whl'
```

The wheel installs the assessment CLI and PyYAML. Run the following examples from this working directory so `uv run --no-project` uses its `.venv`; activation is unnecessary. A bare `skill-assessment` command instead requires that environment to be active.

## Assess

Place your skill at `./my-skill`, or substitute its actual path. It needs a readable UTF-8 `SKILL.md` with YAML frontmatter containing nonempty string fields `name` and `description`; `name` must match the directory name. Additional metadata is allowed.

Keep the report directory outside the skill, then run:

```sh
uv run --no-project skill-assessment validate --skill ./my-skill
uv run --no-project skill-assessment assess --skill ./my-skill --output-dir ./reports
uv run --no-project skill-assessment summarize --assessment-dir ./reports > assessment.md
```

Fix validation errors before assessing. A successful assessment writes three files and displays the JSON report paths:

| File | Why keep it? |
| --- | --- |
| `skillspector.json` | Original scanner findings and execution/coverage information. |
| `adjudication.json` | Contextual review of each finding, safety and coverage judgments, scope, and review status. |
| `scanner.log` | Diagnostics for troubleshooting the scanner. |

Keep the two JSON reports together. The log is diagnostic output; it is excluded from assessment-evidence downloads and should not be committed with the report pair. Open `assessment.md` to decide what to address next.

## Summarize

To read an existing pair, put both JSON files in one directory and run this from the working directory containing the installed kit's `.venv`:

```sh
uv run --no-project skill-assessment summarize --assessment-dir ./reports > assessment.md
```

Replace `./reports` with that directory. Summarizing does not scan, contact a provider, or change the reports. It checks the relationship between findings and determinations; it does not compare the reports with a local skill's current contents.

A shortened, illustrative summary might contain:

```text
**1 confirmed finding requires remediation.**

| Assessment | Result |
| --- | --- |
| Unresolved findings | 1 |
| False positives | 2 |
| Adjudication | completed |
| Coverage judgment | sufficient |
| Scanner-reported coverage | partial |
```

Read the reasons and scope alongside the counts:

| Result | What to do next |
| --- | --- |
| Confirmed finding / true positive | Inspect the finding and remediation guidance, revise the skill, and reassess. |
| Unresolved finding | Investigate the affected behavior and evidence. The finding may be uncertain or not yet adjudicated. |
| False positive | Read why the finding does not require remediation in this context. |
| Partial coverage or insufficient coverage judgment | Examine what was missed before relying on the assessment. |
| Unavailable or failed adjudication | Resolve configuration or request failures and assess again; the safety judgment remains unknown. |

A zero remediation count does not establish safety. Look for unresolved findings, execution warnings, scope limitations, and the coverage rationale. The scanner's coverage and the adjudicator's coverage judgment are separate signals and can differ.

## Revise and reassess

After changing a skill, repeat `assess` and `summarize`. By default, every invocation rescans. To reuse successful reports for unchanged package contents and the same scan mode:

```sh
uv run --no-project skill-assessment assess --skill ./my-skill --output-dir ./reports --if-changed
```

`--if-changed` reuses a successful assessment when the skill content, scan mode, and coverage-enforcement setting are unchanged. Otherwise, it runs a new assessment.

Successful runs replace the three output files and keep no history. Copy earlier pairs elsewhere if needed. Assessment is prepared in a separate sibling directory; a scanning or adjudication failure preserves current reports and identifies the directory with retained diagnostics and available outputs. Current reports may therefore describe an earlier successful run. Successful replacement happens one file at a time rather than as a transaction; other output-directory files and skill inputs remain unchanged.

## Options and failure reference

### Scan mode and timeouts

`--scan-mode llm-assisted` is the default. `--scan-mode static-only` runs the scanner without model analysis or adjudication; findings remain unresolved and the adjudication report has `status: not_performed` with unknown safety and coverage judgments. Static-only results are useful for diagnostics but do not qualify for exchange-site generation. A failed LLM-assisted run never switches modes automatically.

The scanner and adjudication request each have a five-minute timeout. Set `--timeout SECONDS` to a positive whole number; `--timeout 600` permits up to ten minutes per stage.

### Coverage enforcement

Coverage is informational by default. `--enforce-coverage` requires sufficient adjudication coverage for a safe verdict; `--no-enforce-coverage` disables it.

> **Warning:** Coverage enforcement can turn false coverage gaps into unsafe verdicts: SkillSpector treats slash-separated text such as `N/A`, `README/API`, and `authn/authz` as missing paths (`reference_resolution` / `reference_unresolved`: “A local path-like reference could not be resolved unambiguously.”).

### Shorten the source path

`--base-dir` removes a matching directory prefix from `skill.source` in the scanner report. This makes a report less dependent on where the checkout lives:

```sh
uv run --no-project skill-assessment assess --skill ./my-skill --output-dir ./reports --base-dir ./
```

An explicit option overrides `SKILL_ASSESSMENT_BASE_DIR`. The base resolves relative to the working directory. Matching absolute paths become relative at directory boundaries; already-relative, unmatched, missing, or non-string source values remain unchanged. Other paths, finding text, and logs are not redacted. Without either setting, native report bytes remain unchanged.

Rewriting happens after scanning and before adjudication, including usable retained failure reports. With `--if-changed`, a qualifying pair can have its matching absolute source rewritten without another scan or provider call. An already-relative source stays unchanged if the base changes; rescan without `--if-changed` for a fresh source path.

### How findings are reviewed

The packaged [system prompt](https://github.com/Code-dot-mil/SkLC/blob/main/products/assessment-kit/src/skill_assessment/prompts/adjudicate.md) instructs the model to treat skill text and scanner output as evidence. Each finding receives a true-positive, false-positive, or uncertain determination with a reason. Confidence scores, scanner tags, and coverage diagnostics inform the review without establishing safety by themselves.

The kit validates finding order and identity and checks that the safety judgment agrees with the findings. Reports include scope, status, provider/model, creation time, duration, call counts, and token usage when available. Unknown token usage is null; credentials and endpoint URLs are excluded.

Partial scanner coverage can still produce current reports when execution succeeds in the requested mode and adjudication completes. Missing configuration yields `status: unavailable`; a failed request or invalid response yields `status: failed`. Both leave safety and coverage unknown and findings `not_adjudicated`. Readable scanner failure reports are retained when available. Static-only failures retain `status: not_performed`; readable findings are kept, otherwise the list is empty. Static-only provider/model/usage fields are null, and call counts and duration are zero.

### Exit status

| Command | `0` | `1` | `2` | `3` |
| --- | --- | --- | --- | --- |
| `assess` | Assessment completed, including negative judgments or severe findings | Invalid input or output setup | Incorrect usage | Missing scanner, scan/timeout/output failure, degraded requested analysis, or unavailable/failed adjudication |
| `validate` | Package structure valid | Invalid or unreadable input | Incorrect usage | — |
| `hash` | Package hash printed | Invalid directory or unreadable files | Incorrect usage | — |
| `summarize` | Summary rendered | Unreadable or mismatched reports | Incorrect usage | — |

Diagnostics go to stderr. `hash` writes only a SHA-256 and newline to stdout; `summarize` writes Markdown. Expected static-only `not_performed` status alone is not an assessment failure.

## Validate

Check one package's frontmatter without executing its contents or assessing safety:

```sh
uv run --no-project skill-assessment validate --skill ./my-skill
```

No namespace or fixed repository layout is required. Validation reads no exchange policy and contacts no scanner or provider.

## Hash

Identify exact package bytes without validating frontmatter or running assessment:

```sh
uv run --no-project skill-assessment hash --skill ./my-skill
```

Paths and file contents both contribute. The public format starts with `skill-assessment-package-v1` and a NUL byte, followed by files in sorted relative POSIX path order. Each path and file content is prefixed by its unsigned eight-byte big-endian byte length. Empty directories are omitted.

## Adjudication gateways

Set `SKILLSPECTOR_MODEL` explicitly and use a provider configuration supported by both the scanner and adjudication:

| `SKILLSPECTOR_PROVIDER` | Settings |
| --- | --- |
| `openai` | `OPENAI_API_KEY`; optional `OPENAI_BASE_URL` and `OPENAI_PROJECT_ID` |
| `openai_compatible` | `SKILLSPECTOR_COMPAT_API_KEY` and `SKILLSPECTOR_COMPAT_BASE_URL` |
| `azure_openai` | `AZURE_OPENAI_API_KEY` and `AZURE_OPENAI_ENDPOINT`; optional `AZURE_OPENAI_DEPLOYMENT` (defaults to the model) and `AZURE_OPENAI_API_VERSION` (defaults to `2024-06-01`, matching SkillSpector 2.10.0) |

The OpenAI base URL defaults to its API. An OpenAI-compatible base URL includes the API prefix, such as `https://gateway.example/v1`. For Azure deployment routing, use the resource/gateway prefix before `/openai/deployments/...`; authentication uses the `api-key` header. An Azure gateway exposing the OpenAI-compatible v1 protocol instead uses the `openai` configuration.

Gateways must use HTTPS and accept chat completions with JSON-object output and `max_completion_tokens`. Unsupported providers or missing settings produce unavailable adjudication; the kit does not substitute another provider or model.

## Development and Python consumers

To build the wheel from repository source, run at the repository root:

```sh
uv build --wheel products/assessment-kit --out-dir release/assessment-kit
```

From this product directory, `uv run --extra test pytest` tests the kit without requiring SkillSpector or provider credentials. The real static integration test runs only when the scanner is on `PATH`.

Installed Python consumers can use `skill_assessment.hashing.skill_digest` for hashing, `skill_assessment.reports.is_current_assessment` for current-pair eligibility, and `skill_assessment.commands.summarize.summarize` for the action summary. Retain original JSON reports when integrating the kit; the deployment site presents native scanner evidence alongside guidance from completed adjudication.

# Skill Exchange

This repository hosts a maintained catalog of agent skills. The initial catalog and
its four report pairs came from [SkLC main at `571ec49`](https://github.com/Code-dot-mil/SkLC/commit/571ec4990bff6591ddebbe1f3ccf869cca17ab83).

## Publish to GitHub Pages

1. In **Settings → Pages**, select **GitHub Actions** as the publishing source
   and verify the site's visibility with the repository administrator.
2. In **Actions → Operator site**, run the workflow on `main`. Pushes to
   `main` also verify the catalog and build the site.
3. Open the URL shown by the deployment. Check the catalog, a skill detail page,
   and its skill ZIP and assessment downloads.

For catalog updates, commit each complete package to `skills/<skill>/` and its
matching LLM-assisted report pair to `evidence/<skill>/`. The GitHub workflow uses
these reports during generation. Produce new reports with the bundled CLI using
the [local commands](#run-locally) and the [assessment setup guide](assessment/README.md).

## Bundled Operator reference

The original Operator guide below covers the local commands, evidence, updates,
and the GitLab deployment option.

The Operator kit lets your team assess a catalog of agent skills and publish a website where people can read the instructions, inspect assessment results, and download packages. Use it when you want to maintain your own catalog. The Prebuilt kit is the simpler path when you only want to host the supplied example site.

An assessment scans the skill and asks a configured model to review the findings in context. That second review is called adjudication. A completed review may still identify problems or limits to what was checked.

This guide starts from the extracted `deployment-kit-operator-<version>.zip`. It takes you through **choose skills → configure assessment → run the pipeline → verify the site**, then explains evidence retention and updates.

## What you will maintain

The kit separates your live content from the included upstream components:

| Path | Purpose |
| --- | --- |
| `skills/` | Your live catalog: complete skill folders you choose to serve. You create this directory. |
| `evidence/` | Matching assessment reports for those skills. Assessment jobs produce these files. |
| `upstream/` | Included skills and reports you may choose to copy into the live catalog. |
| `site/` and `src/` | Website source and the runtime that turns skills and reports into site inputs. |
| `assessment/` | Bundled assessment kit as an installable Python package (a wheel), its installation requirement, and the scanner-image recipe. |
| `ci/` and `.gitlab-ci.yml` | The GitLab workflow that assesses, builds, and publishes the catalog. |

Only `skills/` and `evidence/` supply the live catalog; included files in `upstream/` are not automatically served. Visitors use a finished static website and do not trigger scans or model requests.

## Before you start

You need Git configured for commits, Docker with BuildKit to build the assessment image, and permission to create an empty GitLab project, push to it, and configure CI/CD variables and Pages.

Arrange access to a trusted Linux runner that supports container job images. A runner executes jobs; an image supplies their software. Ask the runner administrator for its tag and CPU architecture. Assessment needs package/registry access and access to your selected model provider; the website build needs npm package access. CI supplies Node through `NODE_IMAGE`, which must provide Node.js 22.23.4 or later.

Choose a registry where you can publish the assessment image and from which the runner can pull it. For a private registry, configure [image-pull credentials](https://docs.gitlab.com/ci/docker/using_docker_images/#access-an-image-from-a-private-container-registry) before running the pipeline. A workstation login does not give the runner access, and a job's script starts too late to authenticate the pull of its own image.

Default assessment sends skill contents to the configured model provider. Publication requires completed LLM-assisted assessments matching each skill's contents. Findings and negative judgments remain visible advisory results; execution or adjudication failures block the build. Read the [assessment scope](assessment/README.md#review-scope) before relying on the results.

## 1. Install into an empty GitLab project

Download the Operator ZIP from [SkLC releases](https://github.com/Code-dot-mil/SkLC/releases). Calculate its SHA-256, compare it with GitHub's digest for that asset, and extract it into its own directory. A PR artifact is a development preview; retain its run, commit, and checksum if evaluating one.

[Create a blank GitLab project](https://docs.gitlab.com/user/project/). Leave **Initialize repository with a README** unchecked. Use a new empty project so installation does not overwrite existing project files.

From the extracted kit directory, replace the placeholders and run:

```sh
git clone "<gitlab-project-url>" "../<project-directory>"
cp -a . "../<project-directory>/"
cd "../<project-directory>"
mkdir -p skills evidence
```

The destination must be outside the extracted directory. Confirm that hidden `.gitlab-ci.yml`, `src/`, and `assessment/` were copied. Continue from this new project directory.

## 2. Choose the skills to serve

Place your own complete packages in immediate child directories `skills/<skill>/`. Each `SKILL.md` begins with YAML metadata, called frontmatter, containing nonempty `name` and `description` fields; the name must match the folder. Skill basenames must be unique because evidence is stored by that name. Operator rejects symlinks, packages with more than 500 files, and files larger than 5 MiB. Optional metadata supplies the category, tags, and owner:

```yaml
---
name: my-skill
description: Explain what this skill helps an agent do.
metadata:
  ai4sdlc.category: development
  ai4sdlc.tags: [review, python]
  ai4sdlc.owner: team-name
---
```

Tags also accept a comma-separated string.

To include a supplied skill, copy its package and matching report pair together. For example:

```sh
cp -R upstream/skills/python-secure-code-review skills/
cp -R upstream/evidence/python-secure-code-review evidence/
```

Select all, some, or none of the supplied skills. Review same-named local packages before copying again. Your new or changed skills can be assessed by the pipeline; they do not need pre-existing reports. Existing reports are reused only when eligible for the exact contents and requested scan mode.

For ongoing skill additions and changes, we recommend human MR approval before merging into your local catalog as the acceptance gate. Assessment results inform that decision; a successful pipeline does not constitute acceptance. Your organization may choose another acceptance process. Configure GitLab branch protection and approval rules to support your chosen process; the kit does not configure them.

## 3. Prepare the assessment image

Follow the [assessment image guide](assessment/container/README.md) to build for the runner's architecture, check `skillspector --version`, publish the image, and record its digest. The image must provide Python 3.12+, pip, Git, and SkillSpector `>=2.10,<3` on `PATH` (2.10.0 is tested with the supplied image).

The supplied image runs as a nonroot user. The runner must make its checkout writable to that user so the jobs can install the kit and write reports.

If private certificate authorities are required, follow the image guide's separate build-time and runtime trust instructions. A successful workstation request or image build does not establish runtime provider trust. Obtain verified extra CA certificates from an administrator or authenticated PKI source and keep them outside source control, image layers, and published artifacts.

## 4. Configure GitLab

Open **Settings > CI/CD > Variables**. Set the following values for your environment:

| Variable | Required configuration |
| --- | --- |
| `ASSESSMENT_IMAGE` | Published assessment-image reference, preferably pinned by digest. |
| `ASSESSMENT_RUNNER_TAG` | Trusted container runner with scanner/provider access. |
| `BUILD_RUNNER_TAG` | Container runner able to install npm packages and build the site. |
| `PAGES_RUNNER_TAG` | Container runner for the Pages job. |

Each tag variable contains one tag; the same tag can serve multiple jobs if its runner meets their requirements. See [runner tag matching](https://docs.gitlab.com/ci/runners/configure_runners/#how-the-runner-uses-tags).

The Operator workflow trusts contributors with branches in the consuming project. Maintainers review their changes and run the manual MR assessment to obtain evidence before accepting a skill. Configure assessment resources once for the project so ordinary contribution branches can run that job.

Configure the provider, model, and credentials using the [assessment provider guide](assessment/README.md#adjudication-gateways). Under **Settings > CI/CD > Variables**, apply these settings:

| Variables | Type and visibility | Availability |
| --- | --- | --- |
| `SKILLSPECTOR_PROVIDER`, `SKILLSPECTOR_MODEL`, and the selected provider's endpoint settings | Variable; Visible. Set the exact provider model ID and API base URL. | Clear **Protect variable**, disable expansion, environment scope `*`. |
| Selected provider credential: `OPENAI_API_KEY`, `SKILLSPECTOR_COMPAT_API_KEY`, or `AZURE_OPENAI_API_KEY` | Variable; Masked, also Hidden where supported. | Clear **Protect variable**, disable expansion, environment scope `*`. |
| Image references and runner tags listed above; optional registry credentials such as `DOCKER_AUTH_CONFIG` when used | Variable; mask credentials. | Clear **Protect variable**, disable expansion, environment scope `*`. |
| `ASSESSMENT_CA_CERTIFICATES`, when needed | File; Visible for public PEM CA certificates. | Clear **Protect variable**, disable expansion, environment scope `*`. |

For the `openai` provider, set `OPENAI_BASE_URL` to the intended OpenAI-compatible gateway, `SKILLSPECTOR_MODEL` to its exact model ID, and `OPENAI_API_KEY` to its credential. An environment variable on a maintainer's workstation is not automatically a GitLab CI/CD variable. Keep credentials out of source and the New pipeline form; see [project variables](https://docs.gitlab.com/ci/variables/#for-a-project).

The assessment runner must accept jobs from unprotected branches. Keep default-branch protection and human merge approval as appropriate for your acceptance process; contribution branches need no protection rule. GitLab's protected-resource MR checkbox does not make protected variables available to ordinary unprotected contribution branches.

Fork pipelines run in the fork and use its variables; they do not inherit the parent project's variables. A parent-project member can separately request a fork MR pipeline in the parent, which uses parent resources. For this same-project contribution workflow, disable that option once using the [Projects API](https://docs.gitlab.com/api/projects/#edit-a-project):

```sh
glab api --method PUT "projects/<project-id>" \
  --field ci_allow_fork_pipelines_to_run_in_parent_project=false --silent
```

This setting prevents new parent-project pipelines for fork MRs; it does not change existing pipeline contexts. See [fork pipeline behavior](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/#use-with-forked-projects).

Optional settings:

| Variable | Default and use |
| --- | --- |
| `NODE_IMAGE` | `node:22.23.4`; replacements must supply Node >=22.23.4 and npm. |
| `PAGES_IMAGE` | `alpine:3.24.2`; override if your runner uses another registry. |
| `ASSESSMENT_CA_CERTIFICATES` | Optional File variable with verified extra PEM CA certificates; follow the image guide. |
| `SCAN_MODE` | `llm-assisted`; `static-only` is for diagnostics and stops site generation because adjudication is incomplete. |

Under **Settings > General > Visibility, project features, permissions**, enable Pages and choose its audience. Check this even for a private repository: repository visibility alone does not establish the intended site audience. See [Pages access control](https://docs.gitlab.com/user/project/pages/pages_access_control/).

## 5. Run and verify

Commit the selected skills and any existing matching evidence with the installed kit. Replace `<default-branch>` with the branch selected for your project:

```sh
git add -A
git commit -m "feat: install operator kit and catalog"
git branch -M "<default-branch>"
git push -u origin "<default-branch>"
```

Open **Build > Pipelines > New pipeline**, select that default branch, and start the run. Publication runs only through a manual web pipeline on the default branch; pushes, schedules, and API triggers do not start it. See [manual pipelines](https://docs.gitlab.com/ci/pipelines/#run-a-pipeline-manually).

MR pipelines offer an optional manual **assess** job. Review the proposed changes before starting it, then download its evidence artifact for JSON reports and per-skill `assessment.md` summaries. It assesses the local catalog, reusing eligible reports, and never generates, builds, or deploys the site. Skipping or failing this job does not block merge; human acceptance follows your organization's process. The command prints report paths for every skill, including reused reports; those lines do not indicate fresh scans or model calls. The artifact contains the complete `evidence/` directory, including unchanged committed reports.

Verify MR access during setup: open a same-project MR from an ordinary unprotected branch with a new or changed skill, start its manual **assess** job, and confirm it produces a current `skillspector.json` and completed `adjudication.json` for that skill. Download the artifact and review `assessment.md` before accepting the change. This verifies fresh provider access; merely reusing unchanged reports does not. No branch-specific configuration is needed after the project settings above are applied.

| Stage | What a successful job produces |
| --- | --- |
| Assess | Current JSON report pairs and `assessment.md` summaries under `evidence/`; unchanged eligible pairs are reused. |
| Generate | Site data and downloads derived from the matching skills and reports. This stage performs no scans and leaves evidence unchanged. |
| Build | The static website, including skill packages and report downloads. |
| Pages | A deployable Pages artifact containing the site. |

Completed negative judgments and coverage limitations can allow publication and remain visible with their reasons. They differ from a scanner or requested model analysis failing to execute, or adjudication or report writing failing; those failures stop dependent jobs. A failed assessment job attempts to retain available diagnostics; runner interruption or timeout can prevent artifact upload.

After success, open **Deploy > Pages** and follow its URL. Verify the styled catalog, a skill detail page, its ZIP download, and both JSON report downloads. The site shows adjudication guidance alongside original scanner findings. The assessment job's `assessment.md` provides an action summary without opening the site.

### Skill dates

The catalog reads `ai4sdlc.created` and `ai4sdlc.updated` from each skill's `SKILL.md` metadata. Use quoted ISO timestamps with explicit timezones, for example `ai4sdlc.created: "2026-06-19T19:49:27-05:00"`. Missing dates display as Unknown; invalid timestamps or an update before creation stop generation. Last updated sorting puts known dates first, newest first, with skill ID ordering for ties and unknown dates. Last scanned comes independently from the assessment report.

The bundled skills' creation estimates use the earliest available Git author timestamp across their package files, following each file's renames; their update dates use the latest recorded package change before this metadata backfill. Creation means earliest recorded source history, which may be later than original authorship. These dates remain stable across checkout, copying, and extraction; generation does not read Git history or filesystem timestamps.

Preserve creation when importing a skill. For new skills, record creation and update together; advance update when changing instructions or supporting files, before assessment. Leave unavailable dates absent rather than guessing. Changing date metadata changes the package hash and requires a fresh assessment.

## Retain evidence and run again

Download the specific assessment job's archive from the job or **Build > Artifacts**. The template requests 30-day expiry; GitLab retention settings may keep current artifacts longer. A latest-artifacts link can change after another run.

For durable history and reuse in later runs, extract the archive's `evidence/` directory into your catalog checkout, review it, and commit it with the matching skill revision. The pipeline makes no commits or pushes. Without retaining new reports in the checkout, another pipeline may need to assess those skills again.

Runs reuse valid current reports and scan changed contents or modes. Use `python -m skill_exchange.cli assess-catalog --force` in an installed local environment to reassess every skill. LLM-assisted scans incur provider usage. Successful scans and adjudication replace current reports; failures retain diagnostics separately and preserve existing pairs. Save earlier results before rerunning if you need their history. See [assessment and report retention](assessment/README.md#assess).

## Run locally

Install Python 3.12+, SkillSpector and Git, following the [assessment prerequisites](assessment/README.md#prerequisites), and use Node.js 22.23.4 or later. Activate your Python environment and configure the provider. From the installed kit root:

```sh
python -m pip install --upgrade --force-reinstall . -r assessment/requirements.txt
python -m skill_exchange.cli assess-catalog --scan-mode llm-assisted
python -m skill_exchange.cli generate
npm ci --prefix site
npm --prefix site run build
```

For private CA trust, follow the image guide's local helper instructions before installing the wheel. Each assessment also writes `assessment.md` by summarizing existing reports without a second scan. Static-only diagnostics can be summarized locally, but cannot feed a site build.

Run generation from the repository being built. The footer shows its short commit SHA and the site build time in the viewer’s locale and time zone. Tagged upstream builds show the release version; later commits show `X.Y.Z+dev.N`, where N is commits since that tag. Uncommitted upstream edits add `.dirty`. Installed Operator kits retain their upstream identity from `VERSION` and show the customer repository’s build SHA.

Input paths are configurable with `--skills` and `--evidence`. Site builds always read `.exchange/generated/` beside `site/`. The generator still accepts `--generated` for standalone use; to build a site, generate into the standard location. Local output is in `site/dist/`.

## Apply an update

Review and commit your instance before updating. Verify the new archive's digest as for installation. The update excludes live `skills/` and `evidence/`; changes to included upstream content appear under `upstream/` for you to select explicitly.

For an uncustomized kit, run from its installed root, replacing `<version>`:

```sh
rm -rf -- build site src assessment ci upstream
unzip -o 'deployment-kit-operator-<version>.zip' -d .
python -m pip install --upgrade --force-reinstall . -r assessment/requirements.txt
```

Clean replacement removes files no longer shipped upstream. Removing disposable `build/` also prevents obsolete Python modules from returning during installation. The requirement file selects the exact bundled assessment wheel. Regenerate and rebuild after the update.

Review changes under `assessment/container/`. If the scanner or image runtime changes, rebuild and publish the assessment image using the [image guide](assessment/container/README.md), then set `ASSESSMENT_IMAGE` to its verified new digest before running CI. Extracting the kit does not replace the image already published in your registry.

### Preserve a customized component

Your live skills and evidence are the supported customization surface. If you replace another component, you own that whole component and its compatibility. Preserve it by omitting its removal **and** excluding its files during extraction:

| Component | Omit from removal | Exclude from extraction |
| --- | --- | --- |
| Site UI | `site` | `site/*` |
| Customer CI | `ci`, `.gitlab-ci.yml` | `ci/*`, `.gitlab-ci.yml` |
| Assessment tooling and its CI | `assessment`, `ci`, `.gitlab-ci.yml` | `assessment/*`, `ci/*`, `.gitlab-ci.yml` |
| Deployment runtime | `build`, `src`, `pyproject.toml` | `src/*`, `pyproject.toml` |

For example, preserve a customized site with:

```sh
rm -rf -- build src assessment ci upstream
unzip -o 'deployment-kit-operator-<version>.zip' -d . -x 'site/*'
python -m pip install --upgrade --force-reinstall . -r assessment/requirements.txt
```

Root `.gitlab-ci.yml` and `pyproject.toml` are overwritten during extraction unless excluded. Combine all applicable exclusions in one unzip command. Use your component's own installation procedure if you exclude the assessment or runtime component. Incorporating upstream changes into customized components is your responsibility; the kit does not merge incremental customizations.

## Troubleshooting

| Symptom | First check |
| --- | --- |
| Publication pipeline absent after pushing | Start a manual web pipeline on the default branch; same-project MR pipelines offer a separate manual assess job. |
| Job pending | Runner availability, matching tags, and whether the assessment runner accepts unprotected branches. |
| Job image cannot be pulled | Runner registry access and credentials before job startup. |
| Provider credentials missing in an MR | Clear **Protect variable** on the selected provider credential and assessment settings; disable expansion and use scope `*`. Start a fresh MR pipeline. |
| Certificate error | Runtime trust inside the job image; workstation or build-time trust is insufficient. |
| Inference or adjudication failure | Provider configuration/access and retained diagnostics; do not substitute static-only reports for publication. |
| Evidence mismatch | Exact skill contents and the corresponding report pair under `evidence/<skill>/`. |

See [GitLab pipeline debugging](https://docs.gitlab.com/ci/debugging/) and the [assessment guide](assessment/README.md) for details.

# Skill Bundle

This download contains these complete skill folders and their supporting files:

- `python-secure-code-review`: secure Python code review.
- `unit-test-generation`: unit test generation.
- `inline-documentation`: inline documentation.
- `code-change-description`: commit messages and pull request descriptions.

New to skills? Read [Using a skill](https://github.com/Code-dot-mil/SkLC/blob/main/docs/using-skills.md) before following the installation steps below. These steps require an agent that supports workspace skills in `.agents/skills/` and familiarity with running commands; a technical colleague can help with setup.

## Released product

Download `skill-bundle-<version>.zip` from [SkLC Releases](https://github.com/Code-dot-mil/SkLC/releases). Expand that asset's details to see its `sha256:` digest. Replace `<version>` below with the downloaded version and calculate its SHA-256:

```sh
sha256sum skill-bundle-<version>.zip
```

On macOS, use `shasum -a 256` in place of `sha256sum`. Compare the 64-character result with GitHub's digest for that asset, ignoring the `sha256:` prefix. If they differ, stop and download it again. Once they match, unzip once into a new folder:

```sh
unzip skill-bundle-<version>.zip -d skill-bundle
```

Copy the complete skill folders from `skill-bundle/skills/` into your workspace's `.agents/skills/`. Keep supporting files with each skill, and compare any existing same-named folders before replacing them. Start a fresh agent session in that workspace and confirm the skills appear in its available-skills list.

### Read each skill's assessment

You can read the supplied assessment summaries without installing the assessment kit:

1. Open the version you downloaded on the [SkLC Releases page](https://github.com/Code-dot-mil/SkLC/releases).
2. Under that release's **Assets**, download `skill-bundle-assessments-<version>.zip`. Choose the same version as your skill bundle.
3. Compare its SHA-256 with GitHub's digest, as described above, then extract it:

   ```sh
   unzip skill-bundle-assessments-<version>.zip -d bundle-assessments
   ```

4. Open `summary.md` inside the directory named for the skill. For example, the Python review summary is `bundle-assessments/python-secure-code-review/summary.md`. Each of the other three skills has the same layout.

Each summary explains confirmed findings, unresolved questions, false positives, and review limitations. Its directory also contains the original `skillspector.json` and `adjudication.json` report pair. The accompanying README explains how to interpret them. Read the scope and limitations before deciding whether a skill fits your use.

Assessment is optional for installing these skills. Evidence describes the exact assessed contents; edits require a new assessment.

## CI artifact

For testing a development build, find the selected run's downloads using the [CI preview guide](https://github.com/Code-dot-mil/SkLC/blob/main/CI.md#preview-downloads). The CI `skill-bundle.zip` download is also a single ZIP with `skills/` and `README.md` at its root. Extract it into a new folder:

```sh
unzip skill-bundle.zip -d skill-bundle
```

Copy the complete folders from `skill-bundle/skills/` into `.agents/skills/` and verify discovery as described under [Released product](#released-product). This artifact is a development preview associated with its CI run and commit; use a published release when you want a released version.

The matching CI download is `skill-bundle-assessments.zip`. Extract it into `bundle-assessments/` and open each skill's `summary.md` as described above. Choose both previews from the same CI run.

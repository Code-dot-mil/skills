# Assessment image

This optional image supplies Python 3.12, pip, Git, CA certificates, and SkillSpector 2.10.0 for `ci/assessment.yml`. It installs the [official NVIDIA source](https://github.com/NVIDIA/SkillSpector/tree/e29b16d305b0e738e3d4b952ba102f5522a6f084) at the commit referenced by `v2.10.0`, following its public pip installation path. The Docker Official Python base is pinned by multi-platform index digest. pip is pinned to 26.2.1; review its security updates when refreshing the image. Dependency versions and Debian package updates resolve when building; retain the built image digest for repeatable deployments.

Run these commands from the operator kit root. Select the Linux architecture of your GitLab runner; `linux/amd64` below is an example. Use `linux/arm64` for an ARM runner. The build context allows only the Dockerfile and its ignore file.

```sh
docker build --platform linux/amd64 \
  --tag assessment-runtime:skillspector-2.10.0 assessment/container
docker run --rm --platform linux/amd64 \
  assessment-runtime:skillspector-2.10.0 skillspector --version
```

For a customer registry mirror, add `--build-arg PYTHON_IMAGE=registry.example.com/base/python:3.12.15-slim-trixie@sha256:<approved-digest>` to the build command. The replacement must preserve Python 3.12, pip, Debian package tools, and user/group creation commands. Builds need access to the base registry, Debian repositories, GitHub, and the Python package index. Dependency installation requires compatible binary wheels and fails if one is unavailable; the image includes no compiler toolchain.

If HTTPS inspection requires a private CA during the source installation step, provide a complete PEM CA bundle containing both public and required private roots as an optional BuildKit secret:

```sh
docker build --platform linux/amd64 \
  --secret id=build_ca_bundle,src=./build-ca-bundle.pem \
  --tag assessment-runtime:skillspector-2.10.0 assessment/container
```

The bundle overrides Git and pip trust only during that build step. An invalid bundle fails the build; certificate verification remains enabled. The secret is not copied into the image and does not configure runtime trust or trust for base-image pulls and Debian package installation. Without this secret, Git and pip use their default trust configuration.

After validating the image for your runner, publish it to that registry:

```sh
docker login registry.example.com
docker tag assessment-runtime:skillspector-2.10.0 \
  registry.example.com/team/assessment-runtime:skillspector-2.10.0
docker push registry.example.com/team/assessment-runtime:skillspector-2.10.0
docker image inspect --format '{{index .RepoDigests 0}}' \
  registry.example.com/team/assessment-runtime:skillspector-2.10.0
```

Use your registry's supported credentials at the login prompt. For GitLab's registry, follow its [authentication guide](https://docs.gitlab.com/user/packages/container_registry/authenticate_with_container_registry/). Set the GitLab CI/CD variable `ASSESSMENT_IMAGE` to the published reference, preferably `registry.example.com/team/assessment-runtime@sha256:<published-digest>`. Set `ASSESSMENT_RUNNER_TAG` to a trusted container runner matching the image's architecture. Ensure that runner makes its checked-out project writable to UID 10001 and provides registry authentication when required. The image has no entrypoint, so GitLab can run its usual shell scripts.

The default user is UID/GID 10001, with a writable home and `/workspace`. `PIP_USER=1` and the user executable directory on `PATH` let the existing `python -m pip install --upgrade --force-reinstall . -r assessment/requirements.txt` job command install the supplied components without root. SkillSpector is installed globally in files owned by root. The runner must preserve a writable home and Python's user site configuration. Normal operation requires no privileged container or Docker socket.

Configure provider settings and masked credentials only as runtime GitLab variables, following [assessment-kit setup](../README.md). Do not supply credentials as build arguments or copy them into the image. Runtime access is needed for wheel dependencies, the selected provider, and SkillSpector's OSV dependency lookups; static-only scanning still makes OSV requests when available.

## Runtime certificate trust

Build secrets do not configure runtime trust. For a private provider CA or HTTPS inspection, set `ASSESSMENT_CA_CERTIFICATES` as a GitLab **File** CI/CD variable containing verified extra PEM CA certificates. Make it available to same-project MR jobs. Obtain them from your administrator or authenticated PKI source and check their fingerprints and validity. Use visibility **Visible** for public certificates (multiline PEM cannot be masked), clear **Protect variable**, disable expansion, and use environment scope `*`. These settings let the manual MR assessment use the same runtime trust as default-branch publication without protecting individual contribution branches. GitLab limits variable values to 10,000 characters: supply only the extra CAs, not a full public trust store. See [File variables](https://docs.gitlab.com/ci/variables/#use-file-type-cicd-variables). GitLab supplies the variable as a filename readable inside the job.

When the variable is set, the helper uses Python's TLS library to combine those certificates with the installed system and certifi roots. The example image includes certifi through SkillSpector; custom images using this option must also provide it. Missing or malformed files fail the job. The pipeline exports `SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE`, and `PIP_CERT` before installing the wheel and running assessment. Certificate verification stays enabled. Without the variable, the job uses the image's existing trust configuration.

For local use, run the helper inside the assessment environment before installing the wheel. Replace the filename with your verified extra CA file:

```sh
export ASSESSMENT_CA_CERTIFICATES="../extra-ca-certificates.pem"
export ASSESSMENT_TRUST_DIR="$(mktemp -d)"
python ci/configure_runtime_trust.py "$ASSESSMENT_TRUST_DIR/ca-bundle.pem"
export SSL_CERT_FILE="$ASSESSMENT_TRUST_DIR/ca-bundle.pem"
export REQUESTS_CA_BUNDLE="$SSL_CERT_FILE" PIP_CERT="$SSL_CERT_FILE"
```

A host's files and environment are not automatically available inside a container. Keep CA files and the temporary bundle outside the checkout and artifact paths. Remove the temporary directory after assessment and unset these variables before starting a session without the bundle. Verify a provider request and an assessment using the selected image and runner; a successful workstation request alone does not verify the job's trust configuration.

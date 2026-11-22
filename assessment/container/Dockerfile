# Override with an approved mirror containing the same Python runtime when needed.
ARG PYTHON_IMAGE=python:3.12.15-slim-trixie@sha256:a6e34c598f2467ed0e9a8d349809fcd8b5c603269512df273a0bb1784edc11b1
FROM ${PYTHON_IMAGE}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

# Official NVIDIA v2.10.0 source. Require binary dependency wheels so the
# runtime needs no compiler toolchain; the scanner itself is pure Python.
RUN --mount=type=secret,id=build_ca_bundle,target=/run/secrets/build-ca-bundle \
    if [ -e /run/secrets/build-ca-bundle ]; then \
        test -s /run/secrets/build-ca-bundle || exit 1; \
        export GIT_SSL_CAINFO=/run/secrets/build-ca-bundle \
            PIP_CERT=/run/secrets/build-ca-bundle; \
    fi \
    && python -m pip install --only-binary=:all: --upgrade pip==26.2.1 \
    && python -m pip install --only-binary=:all: \
        'skillspector @ git+https://github.com/NVIDIA/SkillSpector.git@e29b16d305b0e738e3d4b952ba102f5522a6f084' \
    && python -m pip check \
    && python -c "from importlib.metadata import version; assert version('skillspector') == '2.10.0'" \
    && skillspector --version

RUN groupadd --gid 10001 assessor \
    && useradd --uid 10001 --gid assessor --create-home --shell /bin/sh assessor \
    && mkdir /workspace \
    && chown assessor:assessor /workspace

# CI installs the supplied assessment wheel into the user's writable home.
# Global scanner files remain owned by root, outside that installation prefix.
ENV HOME=/home/assessor \
    PIP_USER=1 \
    PATH=/home/assessor/.local/bin:${PATH}
USER 10001:10001
WORKDIR /workspace
CMD ["/bin/sh"]

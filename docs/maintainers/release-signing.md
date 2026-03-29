# Release Signing and Versioning

> Audience: **maintainer-only leaf**. This page owns release-signing and tag policy details. For the maintainer workflow map and the rest of this secondary surface, return to [`docs/maintainers/README.md`](README.md).

This repository uses two signing modes on purpose:

- **SSH-signed commits** for normal day-to-day development
- **GPG-signed annotated tags** for release publication

## Current policy

### Commits

Regular commits should be SSH-signed and attributed to:

- `Roman Zuev <zzuevrs@gmail.com>`

Expected local Git setup:

- `gpg.format=ssh`
- `commit.gpgsign=true`
- `user.signingkey=~/.ssh/yanote.pub`

Verification examples:

```bash
git log --show-signature -1
```

### Release tags

Release publication is tag-driven and expects **signed annotated tags** only.

Rules enforced by the repository:

- tag format must be `vMAJOR.MINOR.PATCH`
- prerelease suffixes like `-beta` and `-rc` are rejected
- tags must be **annotated**
- tags must be **signed**
- tags must point to commits reachable from `main`
- Maven Central release flow is intended for `v1.0.0+`

Verification examples:

```bash
git verify-tag v1.0.123
```

## Recommended maintainer workflow

### Normal change

```bash
git checkout main
git pull --ff-only
git commit -m "feat: ..."
git push origin main
```

### Next release version

Current release line is `v1.0.x`.

Use the next patch version unless there is an explicit reason to cut a new minor or major release.

Examples:

- latest: `v1.0.122`
- next patch: `v1.0.123`

### Create a release tag

This repository has a convenience alias for release tagging:

```bash
git rtag v1.0.123
```

That creates a **GPG-signed annotated tag** using the configured release-signing key.

You can also set a custom tag message:

```bash
git rtag v1.0.123 "Release v1.0.123"
```

Verify before pushing:

```bash
git rverify v1.0.123
```

Run both local proof gates before pushing the real tag:

1. Local release-candidate proof:

   ```bash
   bash scripts/ci/verify-release-pipeline.sh
   ```

2. Final public-surface acceptance proof:

   ```bash
   bash scripts/docs/verify-m016-s05-public-surface.sh
   ```

The first proof stays local: it reuses the repository's signed-tag fixture, stages publications under `build/staging-deploy/`, assembles `build/release-bundle/v1.2.3/`, renders `build/release-notes.md`, and retains a diagnostic bundle at `.yanote-ci/m016-s02-release-pipeline-proof/` with phase logs, staged-publication inventory, copied release notes, traceability snapshots, and the release manifest.

The second proof confirms the full public product story still holds after those retained release surfaces are in place: clean public boundary, short docs path, live recorder/analyzer/demo path, maintainer navigation, and tag-driven release truth. For the stage map and retained diagnostics, use [`public-surface-proof.md`](public-surface-proof.md).

If either proof fails, inspect these surfaces before retrying:

- `.yanote-ci/m016-s02-release-pipeline-proof/artifact-manifest.txt`
- `.yanote-ci/m016-s02-release-pipeline-proof/phase-status.txt`
- `.yanote-ci/m016-s02-release-pipeline-proof/preflight.stderr.log`
- `.yanote-ci/m016-s02-release-pipeline-proof/publish.stderr.log`
- `.yanote-ci/m016-s02-release-pipeline-proof/bundle.stderr.log`
- `.yanote-ci/m016-s02-release-pipeline-proof/notes.stderr.log`
- `build/staging-deploy/`
- `build/release-bundle/v1.2.3/`
- `build/release-notes.md`

Push the release tag:

```bash
git push origin v1.0.123
```

## GitHub requirements

GitHub should contain:

- the SSH signing public key used for commits
- the GPG public key used for release tags
- the repository secret `RELEASE_TAG_SIGNING_PUBLIC_KEY` with the armored public GPG key used by release preflight

## Historical note

Older tags may exist from pre-normalization or history-rewrite phases. The active policy for all new work is:

- signed commits
- signed annotated release tags
- semver release tags in `vMAJOR.MINOR.PATCH` format

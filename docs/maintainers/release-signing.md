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

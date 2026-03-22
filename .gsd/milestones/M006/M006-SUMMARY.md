# M006: Runtime Delivery Hardening And Public Repo Hygiene

M006 closed the public demo/runtime trust gap, moved delivery-sensitive proof earlier into CI without destabilizing required checks, and removed private maintainer/runtime trees from the default branch.

## Verification

- `node --test scripts/ci/*.test.mjs scripts/release/*.test.mjs`
- `bash scripts/ci/run-v1-e2e.sh`
- `bash scripts/docs/verify-s03-public-artifact-boundary.sh all`
- GitHub Actions `yanote-ci` run `23319759762`
- Release `v1.0.125` published from signed tag via run `23320033592`

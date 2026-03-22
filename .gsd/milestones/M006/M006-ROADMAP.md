# M006: Runtime Delivery Hardening And Public Repo Hygiene

**Vision:** Restore trust in Yanote’s public delivery surfaces by fixing the broken compose demo path, pulling delivery-surface proof closer to merge, and removing tracked technical artifact trees from the public branch without leaving docs or trust surfaces behind.

## Slices

- [x] **S01: Demo Runtime Truth And Jar Resolution**
- [x] **S02: Merge-Gate And Contract Execution Hardening**
- [x] **S03: Public Repo Artifact Boundary Cleanup**

## Outcome

M006 is complete. The public demo path is deterministic again, delivery-sensitive proof runs earlier in CI without changing required check names, `.bg-shell/`, `.gsd/`, and bundle-centric `dist/` are no longer public tracked surfaces on the default branch, and the dedicated push-only `v1-e2e` job was hardened by explicit runtime dependency prewarm before release `v1.0.125`.

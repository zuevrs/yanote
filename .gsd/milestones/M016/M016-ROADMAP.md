# M016: Product-First Repository Surface And Shipping Automation

## Vision
Turn Yanote’s public repository into a clean product-first OSS surface, ship the analyzer as an official standalone CLI, and make release tags the single fail-closed publication trigger without exposing internal GSD/process/proof clutter.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Standalone analyzer shipping contract | high | — | ✅ | Yanote has one official standalone analyzer CLI artifact contract and public install/run shape, even though the implementation may still be built from `yanote-js` internally. |
| S02 | Tag-driven release and publication pipeline | high | S01 | ✅ | A release tag exercises a fail-closed shipping workflow that validates and assembles the intended publication surfaces. |
| S03 | Public repository boundary cleanup | medium | S01 | ✅ | Public `main` no longer foregrounds `.gsd`, `.tmp*`, `.vite`, or similar internal residue as part of the product repository face. |
| S04 | Product docs and example reshape | medium | S01, S03 | ✅ | A new reader can open the repository and follow short product-facing docs for recorder, tagging, and analyzer without maintainer/proof archaeology. |
| S05 | Final public-surface integration proof | low | S02, S03, S04 | ✅ | Clean checkout, short docs, official analyzer CLI surface, and tag-driven release truth all fit together as one coherent public product story. |
| S06 | Stabilize recorder readiness in final public-surface proof | medium | S05 | ✅ | A cold run and a rerun of `bash scripts/docs/verify-m016-s05-public-surface.sh` both pass end to end, and the recorder runtime stage uses a deterministic readiness signal instead of timing out after the app has already started. |
| S07 | Recorder bootstrap hardening for final public-surface proof | medium | S06 | ✅ | The recorder smoke verifier no longer depends on fragile plugin-portal refreshes during milestone proof, the live script/tests truthfully pin the implemented bootstrap behavior, and `bash scripts/docs/verify-m016-s05-public-surface.sh` passes on both a cold run and an immediate rerun. |

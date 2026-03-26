---
verdict: pass
remediation_round: 0
---

# Milestone Validation: M013

## Success Criteria Checklist
- [x] **Supported remote spec inputs work through the real CLI and Gradle entrypoints alongside the current deterministic local file/directory baseline.** Evidence: S01 summary + UAT prove CLI local-file/local-directory/remote-url flows, Gradle remote check/report sidecars, and preserved local baseline via `bash scripts/ci/verify-m013-s01-remote-spec.sh`, focused CLI/report contract tests, and retained `.yanote-ci/remote-spec-proof/` artifacts.
- [x] **Persisted command, provenance, and report surfaces disclose sanitized spec-source provenance and do not leak remote credentials through args, logs, or uploaded artifacts.** Evidence: S01 summary/UAT require sanitized `specSource { kind, reference }`, `spec_source_kind/spec_source_ref` summary tokens, and Gradle `<remote-url>` placeholders; S03 proof asserts `sensitive_markers=absent`; S04 UAT inspects remote-proof manifests/source-paths for sanitized localhost URLs with no userinfo/query/fragment leakage.
- [x] **Deprecated OpenAPI operations are surfaced explicitly in canonical reports and summaries without silently changing legacy coverage numerators by default.** Evidence: S02 summary + UAT prove `summary.deprecatedOperations`, `coverage.perOperation[].deprecated`, CLI `- deprecated operations:` output, `YANOTE_SUMMARY deprecated_*` tokens, and retained `legacy_operations=2/3` / `deprecated_operations=0/1` in `.yanote-ci/deprecated-operations-proof/artifact-manifest.txt`.
- [x] **Yanote emits separate static offline HTML artifacts for HTTP and async reports, each derived from the same canonical report truth as the corresponding JSON file.** Evidence: S03 summary + UAT prove sibling `yanote-report.html` and `yanote-async-report.html`, separate HTTP/async section sets, inline-only assets, preserved JSON-centered CLI/Gradle contract, and retained `.yanote-ci/static-html-reports-proof/` bundle.
- [x] **CI artifacts and public docs describe the local-vs-remote support boundary, separate HTTP/async report surfaces, and the out-of-scope dashboard/combined-report boundary honestly.** Evidence: S04 summary + UAT prove widened collectors/exporters, GitHub step-summary wording, stable branch-protection/workflow contract, and updated `README.md`, `docs/guides/analyzer-coverage.md`, `docs/guides/asyncapi-kafka.md`, and `docs/release-and-support.md`, with `bash scripts/docs/verify-s04-boundaries.sh` enforcing the wording boundary.

## Slice Delivery Audit
| Slice | Roadmap deliverable claim | Evidence from summary/UAT | Verdict |
| --- | --- | --- | --- |
| S01 | Real CLI + Gradle runs against a fixture URL retain sanitized remote provenance while local file/directory still work. | Summary describes shared `ResolvedSpecSource`, sanitized report/summary/Gradle sidecars, and retained `.yanote-ci/remote-spec-proof/`; UAT checks local-file, local-directory, remote-url, Gradle sidecars, and async provenance contract tests. | Delivered |
| S02 | Deprecated operations appear in JSON + CLI summaries while legacy numerators stay unchanged. | Summary describes additive deprecated metadata on canonical HTTP path only; UAT verifies CLI summary line, `YANOTE_SUMMARY deprecated_*`, JSON `summary.deprecatedOperations`, `coverage.perOperation[].deprecated`, and preserved `covered=2/3`. | Delivered |
| S03 | Separate offline `yanote-report.html` and `yanote-async-report.html` can be opened after real runs and show the same truth as JSON. | Summary describes HTTP/async renderers from normalized DTOs, sibling HTML emission, retained static-HTML proof bundle, and preserved JSON contract; UAT verifies both HTML files, separate section sets, inline-only assets, and absence of combined/dashboard drift. | Delivered |
| S04 | CI-style artifact bundle and published docs expose separate JSON+HTML reports, sanitized provenance, and honest support wording for local baseline, remote path, deprecated semantics, and out-of-scope dashboard behavior. | Summary describes widened collectors/exporters, GitHub summaries, branch-protection/workflow wording, and public docs/support updates; UAT verifies CI contract tests plus `verify-s03-landing.sh` and `verify-s04-boundaries.sh`, and inspects retained manifests/docs directly. | Delivered |

## Cross-Slice Integration
- **Spec-source resolution boundary (`yanote-js/src/spec`, CLI entrypoints, Gradle tasks) — aligned.** S01 established the shared local-file/local-directory/remote-url contract with sanitized provenance. S03 explicitly consumes the same `specSource` truth in sibling HTML artifacts, and S04 publishes the same sanitized provenance through manifests, source-path notes, CI bundles, and docs without redefining the contract.
- **Canonical report model boundary (`yanote-js/src/report`, normalization/schema, CLI summaries) — aligned.** S02 added deprecated-operation truth additively while preserving legacy numerators. S03 renders those canonical fields into HTTP HTML without changing report math, and S04 derives CI/docs/summary wording from canonical JSON rather than separate hand-maintained strings.
- **Human-facing artifact writers (`writeReport`, `writeAsyncReport`, templates/styles) — aligned.** S03 delivered separate offline HTTP and async HTML siblings from canonical normalized DTOs and explicitly avoided a combined dashboard/report surface. S04 keeps those families separate across collectors, manifests, GitHub summaries, docs, and support wording.
- **Delivery/artifact/support surfaces (`scripts/ci`, workflows, README/docs/support) — aligned.** S04 closes the final roadmap boundary by retaining separate HTTP/async JSON+HTML artifacts, publishing sanitized provenance/deprecated metadata, and preserving stable required-job topology while enforcing the local-first / remote-opt-in / no-dashboard boundary.
- **No cross-slice mismatch found.** Downstream slices consumed upstream contracts as planned; no summary or UAT evidence contradicts the roadmap dependency chain S01 → S02/S03 → S04.

## Requirement Coverage
| Requirement | Coverage in M013 slices | Validation status from delivered evidence |
| --- | --- | --- |
| R001 | S01 implemented supported sanitized remote spec loading on canonical delivery surfaces; S03 kept HTML derived from the same canonical truth; S04 published the widened delivery contract in CI/docs. | Advanced and substantively evidenced across S01/S03/S04. |
| R002 | S03 added fail-closed HTML/provenance/leakage checks; S04 extended collectors/exporters/docs verifiers to fail closed on missing HTML siblings, wording drift, or support-boundary expansion. | Advanced and evidenced across S03/S04. |
| R003 | S01 proved CLI + Gradle remote-spec support; S03 proved sibling HTML preserves JSON-centered machine contracts; S04 validated the supported CLI/Gradle/CI delivery surfaces and stable workflow topology. | Validated in S04. |
| R004 | S04 aligned release/support and branch-protection surfaces with the widened artifact/report behavior. | Advanced in S04. |
| R005 | S04 kept async delivery separate and Kafka-first with explicit JSON+HTML async artifacts and no combined-surface promise. | Advanced in S04. |
| R022 | S03 rendered existing HTTP payload/request/security conformance truth into the offline HTML artifact without changing coverage semantics. | Advanced in S03. |
| R024 | S01 delivered remote spec loading, S02 delivered deprecated-operation truth, S03 delivered separate static HTML artifacts, and S04 validated/published the integrated boundary in CI/docs/support. | Validated in S04. |
| R030 | S04 documented and verified the explicit no-dashboard/no-combined-report boundary. | Advanced in S04. |

All milestone-active requirements evidenced in slice summaries/UAT are addressed by at least one completed slice. No uncovered active M013 requirement surfaced during validation.

## Verdict Rationale
Pass. The roadmap success criteria are fully substantiated by the delivered slice summaries and their UAT evidence: S01 covers the supported remote-spec boundary with sanitized provenance, S02 adds truthful deprecated-operation reporting without denominator drift, S03 adds separate static offline HTTP/async HTML artifacts from canonical truth, and S04 reconciles CI/docs/support surfaces with the delivered boundary. Minor closeout deviations noted in slice summaries (verifier-alignment fixes in S03; git-diff substitution in S04 due auto-mode restrictions) do not represent missing deliverables, cross-slice mismatches, or unmet milestone outcomes. No remediation slice is required.

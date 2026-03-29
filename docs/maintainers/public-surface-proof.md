# Финальная public-surface proof-команда

> Audience: **maintainer-only leaf**. This page owns the final rerun contract for the public product story proof. For the maintainer workflow map and the rest of this secondary surface, return to [`docs/maintainers/README.md`](README.md).

Этот leaf фиксирует одну каноническую rerunnable команду для финальной acceptance-проверки public-surface. Он не дублирует assertions из S01-S04 и не переносит maintainer breadcrumbs на публичные onboarding surfaces: здесь перечислены только stage order, delegated verifiers и retained diagnostic surfaces.

## Каноническая команда

```bash
bash scripts/docs/verify-public-surface.sh
```

Команда идёт в product-first порядке и fail-closed останавливается на первом сломанном слое. Каждый stage печатает стабильную метку `PUBLIC-0N` и точный delegated command, поэтому следующий maintainer или агент может сразу rerun-ить только проблемный proof surface.

## Порядок stage-ов

1. `PUBLIC-01` — `bash scripts/docs/verify-public-artifact-boundary.sh all`
   Проверяет tracked inventory, `.gitignore` boundary и то, что публичные README/support surfaces не ссылаются на clone-local roots.
2. `PUBLIC-02` — `bash scripts/docs/verify-landing.sh`
   Проверяет newcomer navigation между `README.md`, `docs/README.md`, `docs/guides/getting-started.md` и `examples/README.md`.
3. `PUBLIC-03` — `bash scripts/docs/verify-short-docs.sh`
   Проверяет короткий docs story для quickstart, analyzer guide и repo demo.
4. `PUBLIC-04` — `bash scripts/docs/verify-recorder-doc-links.sh`
   Проверяет recorder doc wiring.
5. `PUBLIC-05` — `bash scripts/docs/verify-analysis-doc-links.sh`
   Проверяет tagging/analyzer doc wiring.
6. `PUBLIC-06` — `bash scripts/docs/verify-recorder-path.sh`
   Даёт живой recorder proof с module-backed Spring plugin resolution через `mavenLocal()` + `mavenCentral()` (без fallback к Gradle Plugin Portal и без forced `--refresh-dependencies`), bounded publish retry перед `bootRun`, deterministic localhost port-open readiness probe (вместо `Started RecorderSmokeApplication` grep), writable `events.jsonl` и inspectable event fields.
7. `PUBLIC-07` — `bash scripts/docs/verify-analysis-path.sh`
   Даёт живой analyzer archive proof с extracted launcher, `yanote-report.json`, `yanote-report.html` и `YANOTE_SUMMARY`.
8. `PUBLIC-08` — `bash scripts/docs/verify-example-boundary.sh`
   Проверяет repo demo path, example boundaries и то, что maintainer breadcrumbs остаются secondary.
9. `PUBLIC-09` — `bash scripts/docs/verify-release-support-boundaries.sh`
   Проверяет release/support boundary и standalone analyzer contract на публичных surfaces.
10. `PUBLIC-10` — `bash scripts/docs/verify-navigation.sh`
    Проверяет owner maps, maintainer leaves и discoverability этого rerun surface.
11. `PUBLIC-11` — `node --test scripts/ci/run-v1-e2e.contract.test.mjs`
    Проверяет repo demo contract и retained example/report sidecars без запуска ad hoc ручных шагов.
12. `PUBLIC-12` — `bash scripts/ci/verify-release-pipeline.sh`
    Даёт tag-driven release proof с retained publication, bundle и notes diagnostics.

## Что смотреть при падении

- Первый failing stage label `PUBLIC-0N` и строку `[PUBLIC-0N] run: ...` из вывода оркестратора.
- Для release stage — `.yanote-ci/release-pipeline-proof/`, особенно:
  - `phase-status.txt`
  - `artifact-manifest.txt`
  - `tag-context.txt`
  - `preflight.stderr.log`
  - `publish.stderr.log`
  - `bundle.stderr.log`
  - `notes.stderr.log`
- Для recorder runtime stage — сначала rerun-ьте `bash scripts/docs/verify-recorder-path.sh`, затем смотрите retained temp dir или stderr/output delegated verifier-а: bounded publish retry, `readiness_port`, `temp_dir`, `gradle_home`, `publish_log`, `app_log`, `events_file` и `response_file` после bootstrap failure, cold-run failure или immediate-rerun failure.
- Для analyzer runtime stage — retained temp dir или stderr/output, который печатает delegated verifier сам.

## Boundary contract

Этот leaf остаётся maintainer-only surface-ом:

- он обязан быть discoverable из [`docs/maintainers/README.md`](README.md);
- он не должен появляться в `README.md`, `docs/README.md`, `docs/guides/getting-started.md`, `examples/README.md` или других публичных onboarding surfaces;
- он документирует rerun command и diagnostics, но не переносит clone-local planning roots, private prompts или секреты в public docs.

# Доказанный entry path и финальная команда проверки

> Audience: **maintainer-only leaf**. This page owns the final rerun contract for the guide-first proof path. For the maintainer workflow map and the rest of this secondary surface, return to [`docs/maintainers/README.md`](README.md).

Этот leaf фиксирует единственную rerunnable команду для финальной proof-проверки S08/M002. Он не дублирует assertions из S01-S07 и не публикует содержимое локального `AGENTS.md`: здесь перечислены только stage order, delegated verifiers и clone-local Git diagnostics.

## Каноническая команда

```bash
bash scripts/docs/verify-entry-paths.sh
```

Команда идёт в guide-first порядке и fail-closed останавливается на первом сломанном слое. В выводе у каждого stage есть стабильная метка `S08-0N` и точный delegated command, поэтому следующий maintainer или агент может сразу rerun-ить нужный proof surface отдельно.

## Порядок stage-ов

1. `ENTRY-01` — `scripts/docs/verify-landing.sh`
   Проверяет concept-first landing contract между `README.md`, `docs/README.md`, `examples/README.md` и example backlinks.
2. `ENTRY-02` — `scripts/docs/verify-recorder-doc-links.sh`
   Проверяет, что канонический recorder guide остаётся первичным surface-ом.
3. `ENTRY-03` — `scripts/docs/verify-recorder-path.sh`
   Даёт живой recorder proof: writable `events.jsonl`, реальный HTTP call и inspectable event fields.
4. `ENTRY-04` — `scripts/docs/verify-analysis-doc-links.sh`
   Проверяет tagging/analyzer guide wiring и vocabulary.
5. `ENTRY-05` — `scripts/docs/verify-analysis-path.sh`
   Даёт живой analyzer proof, `yanote-report.json`, `YANOTE_SUMMARY` и ожидаемый gate-failure surface.
6. `ENTRY-06` — `scripts/docs/verify-release-support-boundaries.sh`
   Проверяет release/support truth against the latest stable tag.
7. `ENTRY-07` — `scripts/docs/verify-navigation.sh`
   Проверяет owner maps, secondary leaves и fallback recovery path.
8. `ENTRY-08` — `scripts/docs/verify-trust-surfaces.sh`
   Проверяет identity, policy и GitHub trust/intake surfaces.
9. `ENTRY-09` — `scripts/docs/verify-local-agent-boundary.sh`
   Проверяет tracked/public boundary вокруг local-agent workflow.
10. `ENTRY-10` — clone-local Git diagnostics из [`local-agent-workflow.md`](local-agent-workflow.md)
    Проверяет, что root `AGENTS.md` остаётся local-only и ignored именно через repo-local Git admin state.

## Обязательные clone-local diagnostics для `AGENTS.md`

Финальный stage обязан выполнить именно clone-local Git команды, а не переписывать их в tracked assertions:

```bash
git rev-parse --git-path info/exclude
git check-ignore -v AGENTS.md
git status --ignored --short AGENTS.md
git ls-files | rg '(^|/)AGENTS\.md$'
```

Что считать truthful результатом:

- `git rev-parse --git-path info/exclude` возвращает repo-local exclude path;
- `git check-ignore -v AGENTS.md` показывает match из `info/exclude` для anchored `/AGENTS.md`;
- `git status --ignored --short AGENTS.md` возвращает `!! AGENTS.md`;
- `git ls-files | rg '(^|/)AGENTS\.md$'` не возвращает tracked `AGENTS.md`.

В tracked docs, summaries и других repo surfaces нельзя копировать содержимое `AGENTS.md`, private prompt material, секреты или личные local notes. Этот leaf документирует только proof commands и ожидаемое состояние.

## Docker Compose — вторичный путь

`examples/docker-compose.yml` остаётся полезным demo surface-ом, но не является обязательной частью финальной acceptance-проверки. Truthful status для S08 такой:

- primary acceptance path: `bash scripts/docs/verify-entry-paths.sh`;
- Compose — secondary/optional demo, который имеет смысл только когда Docker daemon доступен;
- отсутствие Docker daemon не делает S08 verifier invalid, потому что канонический путь для продукта остаётся guide-first: concept → recorder → `events.jsonl` → analyzer → interpretation → repo boundaries.

## Clone-local rerun breadcrumbs for example surfaces

Эти пути и артефакты intentionally maintainer-only и не должны возвращаться на публичный examples landing:

- `bash scripts/ci/run-v1-e2e.sh` удерживает clone-local rerun bundle в `.yanote-ci/v1-e2e/`; публичные docs/examples должны ссылаться только на bundle names `yanote-validation-artifacts` и `build-and-test-artifacts/*`.
- `examples/docker-compose.yml` использует repo-local standalone launcher `dist/standalone-analyzer/bin/yanote`; если demo-report step жалуется на missing launcher, регенерируйте тот же contract командой `./gradlew distStandaloneAnalyzer`.
- archive-equivalent proof для этого launcher остаётся `build/distributions/yanote-analyzer.zip`; это maintainer breadcrumb для локального rerun, а не public navigation surface.

Если нужен именно runnable demo через Compose, возвращайтесь в пользовательские карты: [`../../README.md`](../../README.md) для product landing, затем [`../README.md`](../README.md) и [`../../examples/README.md`](../../examples/README.md) для demo routing. Но финальная acceptance-команда slice-а остаётся одна: `bash scripts/docs/verify-entry-paths.sh`.

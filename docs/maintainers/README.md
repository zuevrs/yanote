# Maintainers / Для мейнтейнера

> Audience: **maintainer-only surface**. If you are here for product onboarding, release boundaries, recorder setup, or analyzer usage, return to [`docs/README.md`](../README.md).

Эта директория собирает maintainer workflow-и и repo policy surfaces. Здесь лежат документы, которые помогают выпускать и сопровождать Yanote, но не заменяют пользовательскую карту документации.

## Куда вернуться за канонической картой

- [`../README.md`](../README.md) — основной map пользовательской документации и точка возврата для всех secondary maintainer surfaces.
- [`../release-and-support.md`](../release-and-support.md) — публичные границы стабильной линии, совместимость и release expectations.

## Что владеет эта директория

- [`release-signing.md`](release-signing.md) — release-signing policy, tag-driven publication flow и требования к подписи коммитов/тегов.
- [`proofed-entry-paths.md`](proofed-entry-paths.md) — финальная rerun-команда `bash scripts/docs/verify-s08-entry-paths.sh` для guide-first acceptance path, stage order S08 и clone-local `AGENTS.md` diagnostics без публикации содержимого локального файла.
- [`local-agent-workflow.md`](local-agent-workflow.md) — локальный root `AGENTS.md`, repo-local `info/exclude` bootstrap и граница содержимого для maintainer-only workflow.

## Когда оставаться здесь

Оставайтесь в `docs/maintainers/`, если вы меняете release workflow, перепроверяете финальный proof command или готовите публикацию. Для user-facing setup и canonical guides возвращайтесь в [`docs/README.md`](../README.md).

# Документация Yanote

Эта папка — стабильная карта пользовательской документации Yanote. Если вы впервые открыли репозиторий, начните с корневого [`README.md`](../README.md): он объясняет, что такое Yanote, кому он нужен и как пройти проверенный цикл recorder → `events.jsonl` → analyzer → `yanote-report.json`.

Ниже навигация собрана в том же порядке, в котором новый инженер обычно осваивает продукт: сначала канонические user-facing гайды, затем runnable demo surfaces, затем более глубокий reference, и только потом maintainer/history материалы.

## Канонические гайды

Это основной пользовательский путь. Если нужно понять и воспроизвести Yanote без fallback-first навигации, идите в таком порядке:

1. [`guides/recorder-spring-mvc.md`](guides/recorder-spring-mvc.md) — подключение Spring MVC рекордера, writable путь до `events.jsonl`, проверка того, что сервис действительно пишет evidence.
2. [`guides/analyzer-coverage.md`](guides/analyzer-coverage.md) — запуск analyzer по OpenAPI и `events.jsonl`, чтение `Summary`, `YANOTE_SUMMARY` и `yanote-report.json`.
3. [`guides/test-tagging.md`](guides/test-tagging.md) — contract для `X-Test-Run-Id`, `X-Test-Suite`, `test.run_id`, `test.suite` и `coverage.perOperation[].suites`.

Эти три guide-level surface-а остаются каноническими. Если вам нужен fallback bundle или maintainer workflow, не начинайте с них: сначала пройдите этот путь, затем спускайтесь в вторичные ветки.

## Примеры и демо

Когда нужен runnable demo-path по реальным repo assets, а не только guide-level объяснение, переходите сюда:

- [`../examples/README.md`](../examples/README.md) — карта demo-активов и их роли в полном цикле.
- [`../examples/docker-compose.yml`](../examples/docker-compose.yml) — самый короткий repo demo: поднимает сервис, прогоняет тесты, собирает `events.jsonl` и запускает analyzer.
- [`../examples/springmvc-service/README.md`](../examples/springmvc-service/README.md) — сервисная сторона recorder path, где видно, как появляется `events.jsonl`.
- [`../examples/tests-restassured/README.md`](../examples/tests-restassured/README.md) — тестовая сторона metadata handoff для `X-Test-Run-Id` / `X-Test-Suite`.

Используйте examples как runnable companion к каноническим гайдам, а не как замену документации: детали и терминология всё равно закреплены в guide-level docs выше.

## Глубже в контракт и границы продукта

Эта секция для инженера, который уже понял основной путь и хочет увидеть текущие продуктовые границы и проверяемые ожидания.

- [`release-and-support.md`](release-and-support.md) — текущая публичная стабильная линия `v1.0.x`, последний стабильный тег, опубликованные изменения в GitHub Releases, совместимость, ограничения и граница между текущим `HEAD` репозитория и опубликованным релизом.
- [`requirements.md`](requirements.md) — текущий inventory требований Yanote, границы v1/v2 и явный out-of-scope.
- Корневой [`README.md`](../README.md) — короткий продуктовый маршрут и навигация между основными surface-ами.

Fallback bundles остаются вторичным маршрутом. Если вам действительно нужен smoke/offline путь без dependency-based или source-built setup, идите к нему через канонические гайды recorder/analyzer, где эти отклонения уже помечены как fallback, а не как основной onboarding.

## Для мейнтейнера и исторического контекста

Эти материалы реальны и полезны, но они не должны быть первым входом из `docs/` для пользователя, который просто хочет дойти до работающего recorder/analyzer цикла.

### Только для мейнтейнера

- [`maintainers/release-signing.md`](maintainers/release-signing.md) — политика подписей, tag-driven release workflow и ожидания к release-публикации.

### Исторические и traceability-артефакты

- [`traceability/v1-requirements-tests.md`](traceability/v1-requirements-tests.md) — читаемая матрица «требование → тесты → verification commands».
- [`traceability/v1-requirements-tests.json`](traceability/v1-requirements-tests.json) — машинно-читаемая карта traceability.
- [`traceability/schema.v1.json`](traceability/schema.v1.json) — schema для traceability snapshot.
- [`plans/`](plans/) — исторические design/proof документы, которые объясняют, как репозиторий пришёл к текущему состоянию.

# Документация Yanote

Эта папка — стабильная карта пользовательской документации Yanote. Если вы впервые открыли репозиторий, начните с корневого [`README.md`](../README.md): он объясняет, что такое Yanote, кому он нужен и как пройти проверенный цикл recorder → `events.jsonl` → analyzer → `yanote-report.json`.

Ниже навигация собрана в том же порядке, в котором новый инженер обычно осваивает продукт: сначала канонические user-facing гайды, затем runnable demo surfaces, затем более глубокий reference, и только потом maintainer/history материалы.

## Канонические гайды

Это основной пользовательский путь. Если нужно понять и воспроизвести Yanote без fallback-first навигации, идите в таком порядке:

1. [`guides/recorder-spring-mvc.md`](guides/recorder-spring-mvc.md) — подключение Spring MVC рекордера, writable путь до `events.jsonl`, проверка того, что сервис действительно пишет evidence.
2. [`guides/analyzer-coverage.md`](guides/analyzer-coverage.md) — запуск analyzer по OpenAPI и `events.jsonl`, локальный `--spec` baseline (файл/директория), узкий opt-in remote single-document `http(s)` `--spec` путь с sanitized provenance, чтение `Summary`, `HTTP Payload Conformance`, `HTTP Request Conformance`, `HTTP Security Conformance`, `YANOTE_SUMMARY`, additive deprecated-operation truth, `yanote-report.json`, `yanote-report.html` и retained `.yanote-ci/v1-e2e/` proof bundle c additive request/payload/security sidecars.
3. [`guides/asyncapi-kafka.md`](guides/asyncapi-kafka.md) — отдельная ветка первой волны AsyncAPI/Kafka: Kafka evidence inputs, `async-report`, `YANOTE_ASYNC_SUMMARY`, `yanote-async-report.json`, `yanote-async-report.html`, widened live-bundle semantics (`binding support`, `declared semantics`, `runtime semantics`) и retained runtime-selected/schema-failure companions без подмены HTTP guide и без combined/dashboard claims.
4. [`guides/test-tagging.md`](guides/test-tagging.md) — contract для `X-Test-Run-Id`, `X-Test-Suite`, `test.run_id`, `test.suite` и `coverage.perOperation[].suites`.

Эти четыре guide-level surface-а остаются каноническими, но concept-first HTTP onboarding по-прежнему первичен: для обычного recorder/analyzer цикла идите по пунктам 1 → 2 → 4, а если у вас есть первая волна AsyncAPI/Kafka, ответвляйтесь в пункт 3 к отдельному `async-report` / `yanote-async-report.json` / `yanote-async-report.html` пути. Для этой async ветки авторитетным delivery surface считаются live Spring Kafka bundle и `build-and-test-artifacts` / GitHub step summary, где redaction-safe строками публикуются `binding support`, `declared semantics` и `runtime semantics` вместе с retained runtime-selected/schema-failure companion filenames.

HTTP guide при этом публикует точную публичную границу:

- локальный OpenAPI-файл или директория остаются стабильным baseline для `--spec`; remote single-document `http(s)` `--spec` — только узкий opt-in path, а persisted surfaces сохраняют для него лишь sanitized `specSource`;

- request subset: `path=simple`, `query=form`, `header=simple`, `cookie=form`, массивы только для `query=form` + `explode=true` + scalar `items`;
- payload subset: `email`-only payload format allowlist и most-specific media matching;
- security subset: root inheritance, operation override, `security: []`, `{}` optional branch, OR между объектами Security Requirement, AND внутри одного объекта и truthful `apiKey` query/header/cookie subset;
- additive surfaces: `httpSecurityConformance`, отдельный CLI блок `HTTP Security Conformance`, security-токены `YANOTE_SUMMARY` и retained `security-semantics.*` sidecars не меняют legacy `coverage.operations/status/parameters/aggregate` numerators;
- deprecated truth тоже additive: `summary.deprecatedOperations`, секция `Deprecated operations`, HTML sibling `yanote-report.html` и CI summary не переписывают legacy numerators, а рядом честно показывают covered/uncovered deprecated operations;
- deferred broader OpenAPI objects: `examples`, `links`, `callbacks`, `webhooks`.

Если вам нужен smoke/offline путь без обычного dependency-based или source-built setup, не начинайте с отдельной bundle-документации: сначала пройдите этот пользовательский маршрут, а затем смотрите release/support границы и release assets в [`release-and-support.md`](release-and-support.md). Текущая публичная стабильная линия там описана как `v1.0.x`.

## Примеры и демо

Когда нужен runnable demo-path по реальным repo assets, а не только guide-level объяснение, переходите сюда:

- [`../examples/README.md`](../examples/README.md) — карта demo-активов, включая public proof `bash scripts/ci/run-v1-e2e.sh`, retained bundle `.yanote-ci/v1-e2e/`, sibling HTTP artifacts `yanote-report.json` + `yanote-report.html`, request/payload sidecars, fixture-backed security sidecars `security-semantics.stdout`, `security-semantics.stderr`, `security-semantics-yanote-report.json` и focused proof-команды `bash scripts/ci/verify-m011-s02-request-semantics.sh` / `bash scripts/ci/verify-m011-s03-format-media.sh` / `bash scripts/ci/verify-m012-s02-security-semantics.sh`.
- [`../examples/docker-compose.yml`](../examples/docker-compose.yml) — самый короткий repo demo: поднимает сервис, прогоняет тесты, собирает `events.jsonl` и запускает analyzer.
- [`../examples/springmvc-service/README.md`](../examples/springmvc-service/README.md) — сервисная сторона recorder path, где видно, как появляется `events.jsonl`.
- [`../examples/tests-restassured/README.md`](../examples/tests-restassured/README.md) — тестовая сторона metadata handoff для `X-Test-Run-Id` / `X-Test-Suite`.

Используйте examples как runnable companion к каноническим гайдам, а не как замену документации: детали и терминология всё равно закреплены в guide-level docs выше. Security matrix там тоже должен читаться truthfully: это fixture-backed proof, а не следствие live Spring MVC demo.

## Глубже в контракт и границы продукта

Эта секция для инженера, который уже понял основной путь и хочет увидеть текущие продуктовые границы и проверяемые ожидания.

- [`release-and-support.md`](release-and-support.md) — текущая публичная стабильная линия `v1.0.x`, последний стабильный тег, опубликованные изменения в GitHub Releases, совместимость, ограничения, additive request/payload/security retained proof artifacts, `yanote-validation-artifacts` / `build-and-test-artifacts`, separate HTTP-vs-async JSON+HTML report families и граница между текущим `HEAD` репозитория и опубликованным релизом.
- [`requirements.md`](requirements.md) — текущий inventory требований Yanote, границы v1/v2 и явный out-of-scope.
- Корневой [`README.md`](../README.md) — короткий продуктовый маршрут и навигация между основными surface-ами.

Если вам действительно нужен smoke/offline путь без dependency-based или source-built setup, идите к нему через канонические гайды recorder/analyzer, а затем уточняйте текущую release/support boundary и release assets в [`release-and-support.md`](release-and-support.md). Отдельный tracked `dist/` owner-map больше не считается supported public entrypoint.

## Для мейнтейнера и исторического контекста

Эти материалы реальны и полезны, но они не должны быть первым входом из `docs/` для пользователя, который просто хочет дойти до работающего recorder/analyzer цикла. Ниже сначала перечислены owner maps вторичных веток, а уже потом leaf/reference-docs внутри них.

### Карты вторичных веток

- [`maintainers/README.md`](maintainers/README.md) — owner map maintainer-only workflow-ов и точка входа к release/signing surface-ам.
- [`traceability/README.md`](traceability/README.md) — owner map requirement/test traceability, machine-readable snapshots и schema-level reference.
- [`plans/README.md`](plans/README.md) — owner map historical design/proof notes.
- [`release-and-support.md`](release-and-support.md) — owner map для стабильной линии, GitHub Releases, additive `security-semantics.*` proof surface и deferred broader OpenAPI objects (`examples`, `links`, `callbacks`, `webhooks`); открывайте его только после канонических guide-level docs, если обычный dependency/source-built путь недоступен.

### Только для мейнтейнера

- [`maintainers/release-signing.md`](maintainers/release-signing.md) — политика подписей, tag-driven release workflow и ожидания к release-публикации.

### Исторические и traceability-артефакты

- [`traceability/v1-requirements-tests.md`](traceability/v1-requirements-tests.md) — читаемая матрица «требование → тесты → verification commands».
- [`traceability/v1-requirements-tests.json`](traceability/v1-requirements-tests.json) — машинно-читаемая карта traceability.
- [`traceability/schema.v1.json`](traceability/schema.v1.json) — schema для traceability snapshot.
- [`plans/`](plans/) — исторические design/proof документы, которые объясняют, как репозиторий пришёл к текущему состоянию.

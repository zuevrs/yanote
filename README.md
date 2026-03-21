# yanote

Yanote помогает инженерной команде увидеть не абстрактное «тесты прошли», а реальное покрытие HTTP-контракта по живым вызовам. Сервис пишет события в `events.jsonl`, analyzer сопоставляет их со спецификацией OpenAPI и собирает `yanote-report.json`, где видно, какие операции, статусы и обязательные параметры действительно наблюдались.

## Что такое Yanote

Yanote — это связка из рекордера, событийного формата и analyzer-а для контрактного покрытия API:

- рекордер подключается к сервису и пишет evidence в `events.jsonl`;
- analyzer читает OpenAPI + `events.jsonl` и считает покрытие;
- результат остаётся в читаемом stdout, строке `YANOTE_SUMMARY ...` и файле `yanote-report.json`.

Практический результат для команды простой: после прогона тестов или ручных вызовов можно ответить не только на вопрос «были ли запросы», но и на вопрос «какая часть контракта реально доказана событиями, а где coverage ещё partial».

## Для кого

Yanote нужен инженеру, который одновременно отвечает за HTTP-сервис, спецификацию и набор API-тестов и хочет видеть доказуемое покрытие по реальному трафику.

Сейчас проверенный путь в репозитории такой:

- Spring Boot 3.x / Spring MVC сервис с подключённым рекордером;
- `events.jsonl` как переносимый артефакт между сервисом, CI и analyzer-ом;
- source-built analyzer из `yanote-js`;
- OpenAPI как источник объявленного контракта.

Если вам важно быстро понять, где тесты наблюдали операции, но не закрыли нужные response statuses или required parameters, это как раз целевой сценарий Yanote.

> **Версия и границы поддержки.** Текущая публичная стабильная линия Yanote — `v1.0.x`. Последний стабильный тег, опубликованные изменения в GitHub Releases, совместимость, ограничения и разницу между текущим `HEAD` репозитория и опубликованным релизом смотрите в [`docs/release-and-support.md`](docs/release-and-support.md).

## Проверенный цикл

1. **Подключите рекордер к сервису.**
   Рекомендуемый путь настройки рекордера описан в [`docs/guides/recorder-spring-mvc.md`](docs/guides/recorder-spring-mvc.md): обычная зависимость из `mavenLocal()` или внутреннего Maven-репозитория, явное включение рекордера и writable/exportable путь для `events.jsonl`.

   Полезные поверхности этого шага:
   - канонический guide: [`docs/guides/recorder-spring-mvc.md`](docs/guides/recorder-spring-mvc.md)
   - runnable service example: [`examples/springmvc-service/README.md`](examples/springmvc-service/README.md)
   - metadata handoff example: [`examples/tests-restassured/README.md`](examples/tests-restassured/README.md)
   - Smoke/offline fallback: release assets из GitHub Releases — только когда публикация в Maven-репозиторий или `mavenLocal()` недоступна; границы и текущую release truth смотрите в [`docs/release-and-support.md`](docs/release-and-support.md)

2. **Соберите реальные события в `events.jsonl`.**
   После живого HTTP-запроса или прогона тестов проверьте, что файл создан, не пустой и содержит ожидаемые поля маршрута, статуса и сервиса. Это первый доказуемый артефакт цикла, который потом пойдёт в analyzer.

3. **Прогоните analyzer по OpenAPI и событиям.**
   Канонический путь запуска и интерпретации описан в [`docs/guides/analyzer-coverage.md`](docs/guides/analyzer-coverage.md): собрать `yanote-js`, выполнить `report` против OpenAPI и `events.jsonl`, получить stdout с `Summary`, секцией `HTTP Payload Conformance`, строку `YANOTE_SUMMARY ...` и стабильный файл `yanote-report.json`.

   Если нужен runnable repo demo целиком, используйте [`examples/README.md`](examples/README.md) и [`examples/docker-compose.yml`](examples/docker-compose.yml). Для публичного proof-bundle в репозитории есть `bash scripts/ci/run-v1-e2e.sh`: он сохраняет happy-path артефакт `.yanote-ci/v1-e2e/out/yanote-report.json` и рядом удерживает `semantic-red.stdout`, `semantic-red.stderr` и `semantic-red-yanote-report.json`, чтобы можно было проверить fail-closed путь `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` на тех же live events.

   Offline fallback для analyzer остаётся вторичным путём через release assets GitHub Releases; публичные tracked `dist/*` docs больше не считаются supported entrypoint, поэтому ориентируйтесь на [`docs/release-and-support.md`](docs/release-and-support.md).

   Если вам нужен не HTTP/OpenAPI path, а первая волна AsyncAPI/Kafka, не смешивайте её с этим циклом: отдельный guide [`docs/guides/asyncapi-kafka.md`](docs/guides/asyncapi-kafka.md) ведёт по Kafka evidence, команде `async-report` и отдельному артефакту `yanote-async-report.json`.

4. **Прочитайте отчёт, а не только exit code.**
   В текущем публичном demo-path happy path показывает `operations/status/parameters/aggregate = 100.00%`, но это не отменяет отдельную поверхность `HTTP Payload Conformance`. Для `POST /users` она подтверждает JSON request/response payload на зелёном пути, а для `GET`-ответов без declared content честно сохраняет `NO_DECLARED_CONTENT` как benign `SKIPPED`-diagnostics, а не как контрактную ошибку. Retained semantic-red sidecars из `.yanote-ci/v1-e2e/` отдельно показывают, что при unsupported schema observation coverage остаётся `100%`, но payload boundary fail-closed возвращает `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`.

### Канонический путь тестовых метаданных

Текущий contract RestAssured/Cucumber описан в [`docs/guides/test-tagging.md`](docs/guides/test-tagging.md). Он нужен, когда вы хотите связать конкретный прогон тестов и suite с evidence в `events.jsonl` и потом увидеть suites в отчёте.

Коротко о handoff:

- `YanoteRestAssuredFilter` добавляет `X-Test-Run-Id` и `X-Test-Suite`;
- рекордер пишет их в `events.jsonl` как `test.run_id` и `test.suite`;
- analyzer поднимает suite names в `coverage.perOperation[].suites`;
- runnable demo этого пути лежит в [`examples/tests-restassured/README.md`](examples/tests-restassured/README.md).

## Куда идти дальше

- **Понять пользовательскую документацию целиком:** [`docs/README.md`](docs/README.md)
- **Пройти runnable demo по repo assets и retained proof bundle:** [`examples/README.md`](examples/README.md)
- **Сразу подключить рекордер к Spring MVC сервису:** [`docs/guides/recorder-spring-mvc.md`](docs/guides/recorder-spring-mvc.md)
- **Сразу запустить analyzer и научиться читать observation coverage и `HTTP Payload Conformance`:** [`docs/guides/analyzer-coverage.md`](docs/guides/analyzer-coverage.md)
- **Пройти отдельный AsyncAPI/Kafka path и получить `yanote-async-report.json`:** [`docs/guides/asyncapi-kafka.md`](docs/guides/asyncapi-kafka.md)
- **Разобрать suite/run metadata и их путь до отчёта:** [`docs/guides/test-tagging.md`](docs/guides/test-tagging.md)

Если нужен самый короткий маршрут «посмотреть продукт в действии», начните с [`examples/README.md`](examples/README.md), затем вернитесь в [`docs/README.md`](docs/README.md) за каноническими guide-level деталями.

## Вторичные поверхности

Эти материалы полезны, но они не должны быть первым входом в продукт:

- maintainer map: [`docs/maintainers/README.md`](docs/maintainers/README.md) — owner map для release/signing workflow и других maintainer-only surface-ов.
  - direct leaf: [`docs/maintainers/release-signing.md`](docs/maintainers/release-signing.md)
- traceability map: [`docs/traceability/README.md`](docs/traceability/README.md) — owner map для requirement/test matrix и schema-level reference.
  - direct matrix: [`docs/traceability/v1-requirements-tests.md`](docs/traceability/v1-requirements-tests.md)
- historical plans map: [`docs/plans/README.md`](docs/plans/README.md) — owner map для design/proof history без подмены текущих guide-level docs.
- release/support boundary: [`docs/release-and-support.md`](docs/release-and-support.md) — где смотреть текущую stable line, GitHub Releases и границы fallback/release assets без опоры на tracked `dist/` surface.

Состав репозитория тоже остаётся вторичным навигационным слоем:

- `yanote-core` — модель событий для рекордеров;
- `yanote-js` — CLI analyzer и отчёты по OpenAPI;
- `yanote-recorder-spring-mvc` — Spring MVC стартер для записи вызовов в `events.jsonl`;
- `yanote-test-tags-restassured` — фильтр для `X-Test-Run-Id` и `X-Test-Suite`;
- `yanote-test-tags-cucumber` — плагин, который вычисляет suite и пишет её в `yanote.suite`.

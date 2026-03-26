# yanote

Yanote помогает инженерной команде увидеть не абстрактное «тесты прошли», а реальное покрытие HTTP-контракта по живым вызовам. Сервис пишет события в `events.jsonl`, analyzer сопоставляет их со спецификацией OpenAPI и собирает `yanote-report.json`, где видно не только какие операции, статусы и обязательные параметры действительно наблюдались, но и где проходят буквальные request/payload/security semantics границы.

## Что такое Yanote

Yanote — это связка из рекордера, событийного формата и analyzer-а для контрактного покрытия API:

- рекордер подключается к сервису и пишет evidence в `events.jsonl`;
- analyzer читает OpenAPI + `events.jsonl` и считает coverage;
- результат остаётся в читаемом stdout, секциях `HTTP Payload Conformance`, `HTTP Request Conformance`, `HTTP Security Conformance`, строке `YANOTE_SUMMARY ...`, machine-readable файле `yanote-report.json` и sibling human-readable отчёте `yanote-report.html`.

Практический результат для команды простой: после прогона тестов или ручных вызовов можно ответить не только на вопрос «были ли запросы», но и на вопрос «какая часть контракта реально доказана событиями, а где coverage ещё partial и начинается fail-closed boundary».

## Для кого

Yanote нужен инженеру, который одновременно отвечает за HTTP-сервис, спецификацию и набор API-тестов и хочет видеть доказуемое покрытие по реальному трафику.

Сейчас проверенный путь в репозитории такой:

- Spring Boot 3.x / Spring MVC сервис с подключённым рекордером;
- `events.jsonl` как переносимый артефакт между сервисом, CI и analyzer-ом;
- source-built analyzer из `yanote-js`;
- OpenAPI как источник объявленного контракта.

Если вам важно быстро понять, где тесты наблюдали операции, но не закрыли нужные response statuses, required parameters или security semantics boundary, это как раз целевой сценарий Yanote.

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
   Канонический путь запуска и интерпретации описан в [`docs/guides/analyzer-coverage.md`](docs/guides/analyzer-coverage.md): stable baseline для `--spec` — локальный OpenAPI-файл или директория со спецификацией; single-document `http(s)` URL поддерживается только как узкий opt-in remote path, а persisted surfaces и summary публикуют для него только sanitized `specSource`. Source-built analyzer из `yanote-js` выполняет `report` против OpenAPI и `events.jsonl`, выдаёт stdout с `Summary`, секциями `HTTP Payload Conformance`, `HTTP Request Conformance`, `HTTP Security Conformance`, строкой `YANOTE_SUMMARY ...`, additive truth по deprecated operations и сохраняет раздельные sibling-артефакты `yanote-report.json` + `yanote-report.html`.

   Если нужен runnable repo demo целиком, используйте [`examples/README.md`](examples/README.md) и [`examples/docker-compose.yml`](examples/docker-compose.yml). Для публичного proof-bundle в репозитории есть `bash scripts/ci/run-v1-e2e.sh`: он сохраняет happy-path артефакты `.yanote-ci/v1-e2e/out/yanote-report.json` и `.yanote-ci/v1-e2e/out/yanote-report.html`, рядом публикует retained request sidecar `.yanote-ci/v1-e2e/request-semantics.events.jsonl`, `.yanote-ci/v1-e2e/request-semantics.stdout`, `.yanote-ci/v1-e2e/request-semantics.stderr`, `.yanote-ci/v1-e2e/request-semantics-yanote-report.json`, payload sidecars `semantic-red.stdout`, `semantic-red.stderr`, `semantic-red-yanote-report.json`, а также fixture-backed security sidecars `.yanote-ci/v1-e2e/security-semantics.stdout`, `.yanote-ci/v1-e2e/security-semantics.stderr`, `.yanote-ci/v1-e2e/security-semantics-yanote-report.json` с provenance в `artifact-manifest.txt` и `artifact-source-paths.txt`. В CI этот же HTTP surface поднимается как `yanote-validation-artifacts`, где GitHub step summary показывает sanitized `specSource`, additive deprecated-operation counts и явные имена `yanote-report.json` / `yanote-report.html`. Если нужно deeper retained truth, используйте `bash scripts/ci/verify-m011-s02-request-semantics.sh`, `bash scripts/ci/verify-m011-s03-format-media.sh` и `bash scripts/ci/verify-m012-s02-security-semantics.sh`.

   Важно: security matrix публикуется как fixture-backed proof, а не как emergent property Spring MVC demo-service. `security-semantics.*` строится из `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` и `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`, а raw fixture JSONL не попадает в `.yanote-ci/v1-e2e/`.

   Offline fallback для analyzer остаётся вторичным путём через release assets GitHub Releases; публичные tracked `dist/*` docs больше не считаются supported entrypoint, поэтому ориентируйтесь на [`docs/release-and-support.md`](docs/release-and-support.md).

   Если вам нужен не HTTP/OpenAPI path, а первая волна AsyncAPI/Kafka, не смешивайте её с этим циклом: отдельный guide [`docs/guides/asyncapi-kafka.md`](docs/guides/asyncapi-kafka.md) ведёт по Kafka evidence, команде `async-report`, отдельным sibling-артефактам `yanote-async-report.json` + `yanote-async-report.html`, retained runtime-selected/schema-failure companion JSON+HTML и явной границе «никакого combined HTTP+async report surface и никакого hosted dashboard».

4. **Прочитайте отчёт, а не только exit code.**
   В текущем публичном demo-path happy path показывает `operations/status/parameters/aggregate = 100.00%`, но это не отменяет три отдельные surfaces — `HTTP Payload Conformance`, `HTTP Request Conformance` и `HTTP Security Conformance`.

   - Request boundary публикует только поддерживаемый subset `path=simple`, `query=form`, `header=simple`, `cookie=form`; повторяющиеся массивы поддерживаются только для `query=form` + `explode=true` + scalar `items`, а выход за этот subset удерживается как `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER` через `httpRequestConformance`, `declaredSupport*` и request-токены `YANOTE_SUMMARY` (`request_observed_operations`, `request_observed_parameters`, `request_truths`, `primary`).
   - Payload boundary отдельно подтверждает `email`-only format allowlist, most-specific media matching, benign `NO_DECLARED_CONTENT`, `RECORDER_OMITTED` с `captureState=omitted` и `captureReason=policy-filtered`, а на retained semantic-red path показывает fail-closed `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA`.
   - Security boundary публикует root inheritance, operation override, `security: []`, `{}` optional branch, OR между объектами Security Requirement и AND внутри одного объекта. Truthful subset здесь только `apiKey` в `query/header/cookie`; fail-closed коды `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY` и `SEMANTIC_HTTP_UNSUPPORTED_SECURITY` живут в additive `httpSecurityConformance`, отдельном CLI блоке `HTTP Security Conformance` и security-токенах `YANOTE_SUMMARY` (`security_declared_operations`, `security_observed_operations`, `security_observed_evaluations`, `security_truths`, `primary`).

   `httpSecurityConformance`, CLI security block и security-токены `YANOTE_SUMMARY` additive: они не меняют legacy `coverage.operations/status/parameters/aggregate` numerators.

   Broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks` пока публикуются как deferred boundary и не входят в поддерживаемую публичную proof surface.

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
- **Сразу запустить analyzer и научиться читать observation coverage, `HTTP Payload Conformance`, `HTTP Request Conformance` и `HTTP Security Conformance`:** [`docs/guides/analyzer-coverage.md`](docs/guides/analyzer-coverage.md)
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
- release/support boundary: [`docs/release-and-support.md`](docs/release-and-support.md) — где смотреть текущую stable line, GitHub Releases, deferred broader OpenAPI objects (`examples`, `links`, `callbacks`, `webhooks`) и границы fallback/release assets без опоры на tracked `dist/` surface.

Состав репозитория тоже остаётся вторичным навигационным слоем:

- `yanote-core` — модель событий для рекордеров;
- `yanote-js` — CLI analyzer и отчёты по OpenAPI;
- `yanote-recorder-spring-mvc` — Spring MVC стартер для записи вызовов в `events.jsonl`;
- `yanote-test-tags-restassured` — фильтр для `X-Test-Run-Id` и `X-Test-Suite`;
- `yanote-test-tags-cucumber` — плагин, который вычисляет suite и пишет её в `yanote.suite`.

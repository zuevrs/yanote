# Примеры Yanote

Эта папка собирает runnable demo-активы для проверенного пути Yanote. Это не просто список файлов: здесь показано, как сервис пишет evidence в `events.jsonl`, как тесты добавляют run/suite metadata, и как analyzer превращает эти артефакты в `yanote-report.json`.

## Проверенный demo-маршрут

Если нужен самый короткий truthful demo по repo assets, двигайтесь так:

1. [`docker-compose.yml`](docker-compose.yml) — самый быстрый end-to-end proof. Compose поднимает demo-service, ждёт готовности, прогоняет RestAssured-тесты, делит общий том с `events.jsonl`, а затем запускает analyzer и пишет `yanote-report.json`.
2. [`springmvc-service/README.md`](springmvc-service/README.md) — сервисная сторона recorder path: здесь видно, как включён `yanote-recorder-spring-mvc`, куда пишется `events.jsonl` и как получить первое реальное событие ручным запросом.
3. [`tests-restassured/README.md`](tests-restassured/README.md) — тестовая сторона handoff `YANOTE_RUN_ID` / `YANOTE_SUITE` → `X-Test-Run-Id` / `X-Test-Suite` → `test.run_id` / `test.suite`.
4. [`openapi/demo-openapi.yaml`](openapi/demo-openapi.yaml) — объявленный HTTP-контракт, с которым analyzer сопоставляет собранные события и из которого считает coverage.

Итог этого маршрута — не абстрактное «тесты прошли», а inspectable цепочка артефактов: живые запросы → `events.jsonl` → analyzer → `yanote-report.json`.

Для публичного retained proof поверх этого demo-path используйте `bash scripts/ci/run-v1-e2e.sh`. Он сохраняет `.yanote-ci/v1-e2e/out/yanote-report.json` как стабильный machine-facing happy-path artifact и `.yanote-ci/v1-e2e/out/yanote-report.html` как его sibling human artifact, рядом публикует additive request sidecar `.yanote-ci/v1-e2e/request-semantics.events.jsonl`, `.yanote-ci/v1-e2e/request-semantics.stdout`, `.yanote-ci/v1-e2e/request-semantics.stderr`, `.yanote-ci/v1-e2e/request-semantics-yanote-report.json`, удерживает `semantic-red.stdout`, `semantic-red.stderr`, `semantic-red-yanote-report.json`, а также добавляет fixture-backed security sidecars `.yanote-ci/v1-e2e/security-semantics.stdout`, `.yanote-ci/v1-e2e/security-semantics.stderr`, `.yanote-ci/v1-e2e/security-semantics-yanote-report.json` с provenance в `artifact-manifest.txt` и `artifact-source-paths.txt`.

В GitHub Actions этот же публичный delivery contract публикуется без переименования поверх двух раздельных bundle-ов: `yanote-validation-artifacts` для HTTP JSON+HTML surface и `build-and-test-artifacts` для async JSON+HTML surface. Они сохраняют sanitized `specSource`, additive deprecated-operation truth и явные имена report artifacts, но не обещают ни hosted dashboard, ни combined HTTP+async report surface.

Request sidecar публикует буквальную поддержку `path=simple`, `query=form`, `header=simple`, `cookie=form` и массивов только для `query=form` + `explode=true` + scalar `items`. Payload sidecar удерживает `email`-only format allowlist и most-specific media matching. Security sidecar публикует root inheritance, operation override, `security: []`, `{}` optional branch, OR между объектами Security Requirement, AND внутри одного объекта и truthful `apiKey` query/header/cookie subset. Локальный OpenAPI-файл или директория остаются стабильным baseline для analyzer `--spec`; single-document `http(s)` URL — только узкий opt-in remote path, а retained/public surfaces сохраняют для него лишь sanitized provenance. Для deeper retained truth запускайте `bash scripts/ci/verify-m011-s02-request-semantics.sh`, `bash scripts/ci/verify-m011-s03-format-media.sh` и `bash scripts/ci/verify-m012-s02-security-semantics.sh`.

Важно: security matrix в examples-path остаётся fixture-backed proof, а не emergent property live Spring MVC demo-service. `security-semantics.*` собирается из `yanote-js/test/fixtures/openapi/http-security-api-key.yaml` и `yanote-js/test/fixtures/events/http-security-api-key.fixture.jsonl`; raw fixture JSONL не redistribut-ится в `.yanote-ci/v1-e2e/`.

`httpSecurityConformance`, CLI блок `HTTP Security Conformance`, security-токены `YANOTE_SUMMARY` и retained `security-semantics.*` sidecars additive: они не меняют legacy `coverage.operations/status/parameters/aggregate` numerators. Broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks` здесь тоже публикуются как deferred boundary.

## Что лежит в директории

- [`docker-compose.yml`](docker-compose.yml) — orchestration surface для полного service → tests → analyzer demo.
- [`springmvc-service/README.md`](springmvc-service/README.md) — leaf-doc про demo Spring Boot сервис с уже подключённым `yanote-recorder-spring-mvc`.
- [`tests-restassured/README.md`](tests-restassured/README.md) — leaf-doc про demo RestAssured клиент и текущий metadata bridge.
- [`openapi/demo-openapi.yaml`](openapi/demo-openapi.yaml) — спецификация, на которой показывается анализ покрытия.
- [`openapi/demo-openapi-unsupported-schema.yaml`](openapi/demo-openapi-unsupported-schema.yaml) — retained semantic-red variant для proof-path, где payload validation намеренно уходит в fail-closed `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` без изменения observation coverage.

Сгенерированные build-артефакты внутри подпапок не являются навигационными surface-ами. Читайте README-файлы, Compose-файл и retained `.yanote-ci/v1-e2e/` bundle как стабильный вход, а не случайные build outputs.

Fallback bundles здесь намеренно не продвигаются как tracked repo surface: examples-путь описывает нормальный repo demo. Если нужен smoke/offline сценарий без обычного dependency/source-built пути, возвращайтесь в канонические гайды, а затем смотрите [`../docs/release-and-support.md`](../docs/release-and-support.md) за текущими release/support границами и release assets. Это secondary release surface, а не альтернативный первый шаг.

Важно и для examples-path, и для CI support surface: HTTP и async артефакты остаются раздельными JSON+HTML семействами. Здесь нет ни combined HTTP+async report surface, ни отдельного hosted dashboard.

## Когда возвращаться в документацию

Если нужен не demo-flow по repo assets, а каноническое объяснение пользовательского пути, возвращайтесь сюда:

- [`../docs/README.md`](../docs/README.md) — карта документации и разделение между user-facing, maintainer и historical surface-ами.
- [`../docs/guides/recorder-spring-mvc.md`](../docs/guides/recorder-spring-mvc.md) — канонический recorder path.
- [`../docs/guides/analyzer-coverage.md`](../docs/guides/analyzer-coverage.md) — канонический analyzer path, интерпретация отчёта, additive security surface и retained green/red/security proof bundle.
- [`../docs/guides/test-tagging.md`](../docs/guides/test-tagging.md) — канонический contract test metadata.
- [`../docs/release-and-support.md`](../docs/release-and-support.md) — текущая stable line `v1.0.x`, GitHub Releases, additive request/payload/security proof boundary и deferred broader OpenAPI objects, если обычный dependency/source-built путь недоступен.

Если вы зашли сразу в leaf example, сначала вернитесь к этой карте примеров, затем — в каноническую документацию за guide-level деталями.

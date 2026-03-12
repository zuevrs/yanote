# Примеры Yanote

Эта папка собирает runnable demo-активы для проверенного пути Yanote. Это не просто список файлов: здесь показано, как сервис пишет evidence в `events.jsonl`, как тесты добавляют run/suite metadata, и как analyzer превращает эти артефакты в `yanote-report.json`.

## Проверенный demo-маршрут

Если нужен самый короткий truthful demo по repo assets, двигайтесь так:

1. [`docker-compose.yml`](docker-compose.yml) — самый быстрый end-to-end proof. Compose поднимает demo-service, ждёт готовности, прогоняет RestAssured-тесты, делит общий том с `events.jsonl`, а затем запускает analyzer и пишет `yanote-report.json`.
2. [`springmvc-service/README.md`](springmvc-service/README.md) — сервисная сторона recorder path: здесь видно, как включён `yanote-recorder-spring-mvc`, куда пишется `events.jsonl` и как получить первое реальное событие ручным запросом.
3. [`tests-restassured/README.md`](tests-restassured/README.md) — тестовая сторона handoff `YANOTE_RUN_ID` / `YANOTE_SUITE` → `X-Test-Run-Id` / `X-Test-Suite` → `test.run_id` / `test.suite`.
4. [`openapi/demo-openapi.yaml`](openapi/demo-openapi.yaml) — объявленный HTTP-контракт, с которым analyzer сопоставляет собранные события и из которого считает coverage.

Итог этого маршрута — не абстрактное «тесты прошли», а inspectable цепочка артефактов: живые запросы → `events.jsonl` → analyzer → `yanote-report.json`.

## Что лежит в директории

- [`docker-compose.yml`](docker-compose.yml) — orchestration surface для полного service → tests → analyzer demo.
- [`springmvc-service/README.md`](springmvc-service/README.md) — leaf-doc про demo Spring Boot сервис с уже подключённым `yanote-recorder-spring-mvc`.
- [`tests-restassured/README.md`](tests-restassured/README.md) — leaf-doc про demo RestAssured клиент и текущий metadata bridge.
- [`openapi/demo-openapi.yaml`](openapi/demo-openapi.yaml) — спецификация, на которой показывается анализ покрытия.

Сгенерированные build-артефакты внутри подпапок не являются навигационными surface-ами. Читайте README-файлы и Compose-файл как стабильный вход, а не случайные build outputs.

Fallback bundles из `dist/` здесь намеренно не продвигаются: examples-путь описывает нормальный repo demo. Если нужен smoke/offline сценарий без обычного dependency/source-built пути, возвращайтесь в канонические гайды — именно они держат эти fallback-ветки как явно вторичные. Если после этого всё ещё нужен bundle-level маршрут, заходите через [`../dist/README.md`](../dist/README.md): это secondary owner map для offline assets, а не альтернативный первый шаг.

## Когда возвращаться в документацию

Если нужен не demo-flow по repo assets, а каноническое объяснение пользовательского пути, возвращайтесь сюда:

- [`../docs/README.md`](../docs/README.md) — карта документации и разделение между user-facing, maintainer и historical surface-ами.
- [`../docs/guides/recorder-spring-mvc.md`](../docs/guides/recorder-spring-mvc.md) — канонический recorder path.
- [`../docs/guides/analyzer-coverage.md`](../docs/guides/analyzer-coverage.md) — канонический analyzer path и интерпретация отчёта.
- [`../docs/guides/test-tagging.md`](../docs/guides/test-tagging.md) — канонический contract test metadata.
- [`../dist/README.md`](../dist/README.md) — secondary карта fallback bundles, если обычный dependency/source-built путь недоступен.

Если вы зашли сразу в leaf example, сначала вернитесь к этой карте примеров, затем — в каноническую документацию за guide-level деталями.

# Канонический путь: test-tagging контракт для RestAssured и Cucumber

Это основной и проверенный guide по тому, как текущие test-tagging интеграции в `yanote` превращают suite/run metadata в HTTP-заголовки, поля `events.jsonl` и `coverage.perOperation[].suites` в отчёте analyzer.

Если меняете этот contract или связанные docs, сначала перепроверьте его теми же машиночитаемыми поверхностями:

```bash
bash scripts/docs/verify-s02-doc-links.sh
./gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test
```

## 1. Короткая карта текущего handoff

Сейчас repo опирается на такой поток данных:

1. RestAssured-клиент добавляет `X-Test-Run-Id` и `X-Test-Suite` через `YanoteRestAssuredFilter`.
2. Spring MVC рекордер читает эти заголовки и пишет их в `events.jsonl` как `test.run_id` и `test.suite`.
3. Analyzer читает `events.jsonl` и переносит **suite names** в `coverage.perOperation[].suites`.
4. `test.run_id` остаётся в event-level evidence и сейчас не поднимается в `yanote-report.json`.

Ключевые поверхности этого handoff:

| Surface | Текущий контракт |
|---|---|
| `YANOTE_RUN_ID` | env surface для run id: repo demo читает его напрямую, а `YanoteRestAssuredFilter.fromEnv()` тоже умеет читать его из env |
| `YANOTE_SUITE` | только demo/env bridge в этом репозитории |
| `yanote.suite` | общая suite surface для library-интеграций: её читает `YanoteRestAssuredFilter` и выставляет `YanoteSuiteNamePlugin` |
| `X-Test-Run-Id` | HTTP-заголовок, который рекордер пишет в `test.run_id` |
| `X-Test-Suite` | HTTP-заголовок, который рекордер пишет в `test.suite` |
| `test.run_id` / `test.suite` | поля в `events.jsonl`, сохраняющие request-level metadata |
| `coverage.perOperation[].suites` | suite names, которые analyzer сохранил на уровне операции |

`YANOTE_SUITE` в этом репозитории — только demo/env bridge; общей surface для suite остаётся `yanote.suite`.

## 2. RestAssured: что реально делает `YanoteRestAssuredFilter`

Исходный контракт живёт в `yanote-test-tags-restassured`:

- `new YanoteRestAssuredFilter(runId, suite)` — явная передача значений в фильтр;
- `YanoteRestAssuredFilter.fromEnv()` — convenience path, который читает:
  - run id из env `YANOTE_RUN_ID`;
  - suite из системного свойства `yanote.suite`.
- Фильтр добавляет заголовки только если их ещё нет в запросе; уже выставленные `X-Test-Run-Id` / `X-Test-Suite` он не перезаписывает.

Минимальный library-level пример:

```java
import dev.yanote.testtags.restassured.YanoteRestAssuredFilter;
import io.restassured.RestAssured;

System.setProperty("yanote.suite", "payments-smoke");

RestAssured
    .given()
    .filter(YanoteRestAssuredFilter.fromEnv())
    .baseUri("http://localhost:8080")
    .get("/payments/42")
    .then()
    .statusCode(200);
```

Что здесь важно:

- для `fromEnv()` suite берётся не из `YANOTE_SUITE`, а из `yanote.suite`;
- если вы не хотите читать run id из env, можно передать оба значения явно через конструктор;
- заголовки на wire остаются одинаковыми в обоих вариантах: `X-Test-Run-Id` и `X-Test-Suite`.

### Текущий repo demo bridge

Runnable demo в `examples/tests-restassured` использует более shell-friendly bridge:

1. читает run id из env `YANOTE_RUN_ID`;
2. читает suite из env `YANOTE_SUITE`;
3. копирует suite в `System.setProperty("yanote.suite", ...)`;
4. создаёт `new YanoteRestAssuredFilter(runId, suite)` и отправляет запросы.

Смысл этого bridge — сделать demo-прогон удобным из shell и docker compose, но не объявить новую общую library surface. Поэтому product/docs не должны описывать `YANOTE_SUITE` как shared contract для suite.

## 3. Cucumber: откуда берётся `yanote.suite`

Исходный контракт живёт в `yanote-test-tags-cucumber` и сейчас сводится к одному surface: `YanoteSuiteNamePlugin`.

Что делает плагин:

- подписывается на `TestCaseStarted`;
- вычисляет suite name;
- пишет результат в системное свойство `yanote.suite`.

Как вычисляется suite name в текущей реализации:

- если у test case есть feature URI, используется имя файла feature без расширения;
- если URI нет или он пустой, берётся fallback `testCase.getName()`;
- если URI указывает на директорию, берётся имя последнего сегмента пути.

Примеры из текущих модульных тестов:

- `file:///home/ci/features/user-service/coverage.feature` → `coverage`
- `null` + `RunnerSuite` → `RunnerSuite`
- `file:///home/ci/features/` → `features`

Важно: `YanoteSuiteNamePlugin` сам по себе не ставит HTTP-заголовки. Он подготавливает shared property `yanote.suite`, которое потом может прочитать RestAssured filter или любой другой клиентский bridge.

В репозитории пока нет отдельного runnable Cucumber demo, поэтому текущий contract для Cucumber проверяется модульными тестами, а не live e2e-примером.

## 4. Где эти значения появляются потом

### В `events.jsonl`

После запроса с заголовками рекордер сохраняет event примерно так:

```json
{
  "method": "GET",
  "route": "/users/{id}",
  "status": 200,
  "test.run_id": "compose-run-1",
  "test.suite": "restassured-suite"
}
```

Если заголовков не было, `test.run_id` и `test.suite` всё равно останутся в JSONL, но со значением `null`.

### В `yanote-report.json`

Analyzer сейчас не копирует весь event payload в отчёт. Из test metadata на report-level сохраняются только suite names на уровне операции:

```json
{
  "coverage": {
    "perOperation": [
      {
        "operationKey": "GET /users/{id}",
        "suites": ["restassured-suite"]
      }
    ]
  }
}
```

`coverage.perOperation[].suites` полезно для ответа на вопрос «какие suite вообще дали покрытие этой операции?», но это не замена исходному `events.jsonl`.

run id остаётся только в `events.jsonl`; analyzer сейчас не переносит его в `yanote-report.json`.

## 5. Текущий runnable пример в этом репозитории

Если хотите увидеть полный handoff на живом сервисе, используйте repo demo:

1. настройте рекордер и путь к `events.jsonl` по [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md);
2. запустите service example из [`examples/springmvc-service/README.md`](../../examples/springmvc-service/README.md);
3. задайте demo env:

```bash
export YANOTE_RUN_ID=manual-run-1
export YANOTE_SUITE=restassured-suite
export YANOTE_BASE_URI=http://localhost:8080
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
```

4. форсируйте свежий прогон test-клиента:

```bash
./gradlew --no-daemon :examples:tests-restassured:test --rerun-tasks
```

5. проверьте evidence:

```bash
test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
rg -n 'test\.run_id|test\.suite' "$YANOTE_EVENTS_PATH"
```

6. затем прогоните analyzer по [`docs/guides/analyzer-coverage.md`](analyzer-coverage.md), чтобы увидеть `coverage.perOperation[].suites` в `yanote-report.json`.

## 6. Что здесь не надо путать

- `YANOTE_SUITE` — не shared library surface, а только demo/env bridge в текущем repo example.
- Shared contract для suite между Cucumber и RestAssured — `yanote.suite`.
- `YanoteSuiteNamePlugin` выставляет property, а не HTTP-заголовки.
- `YanoteRestAssuredFilter` ставит заголовки, но не создаёт `yanote.suite` сам по себе.
- `coverage.perOperation[].suites` показывает suite names per operation, но не заменяет исходные `test.run_id` / `test.suite` из `events.jsonl`.

## Связанные поверхности

- Канонический путь рекордера: [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md)
- Канонический путь analyzer: [`docs/guides/analyzer-coverage.md`](analyzer-coverage.md)
- Runnable RestAssured demo: [`examples/tests-restassured/README.md`](../../examples/tests-restassured/README.md)
- Runnable Spring MVC demo service: [`examples/springmvc-service/README.md`](../../examples/springmvc-service/README.md)

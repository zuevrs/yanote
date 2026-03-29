# Канонический путь: test tagging от headers до report suites

Назад: [быстрый старт](getting-started.md) · [recorder guide](recorder-spring-mvc.md)

Этот guide держит один короткий handoff: test client отправляет `X-Test-Run-Id` и `X-Test-Suite`, recorder пишет `test.run_id` и `test.suite` в `events.jsonl`, analyzer поднимает suite names в `coverage.perOperation[].suites`.

## 1. Текущий contract в одном списке

- `X-Test-Run-Id` → `test.run_id`
- `X-Test-Suite` → `test.suite`
- `test.suite` → `coverage.perOperation[].suites`
- `test.run_id` остаётся в event-level evidence и сейчас не поднимается в `yanote-report.json`

Эти поверхности должны совпадать в guides, examples и runtime proof.

## 2. RestAssured: что реально делает filter

`yanote-test-tags-restassured` даёт два пути:

```java
new YanoteRestAssuredFilter("run-1", "suite-a");
YanoteRestAssuredFilter.fromEnv();
```

Что важно для текущего shared contract:

- filter ставит `X-Test-Run-Id` и `X-Test-Suite`, только если их ещё нет в запросе;
- `YanoteRestAssuredFilter.fromEnv()` читает run id из env `YANOTE_RUN_ID`;
- suite для `fromEnv()` читается из системного свойства `yanote.suite`, а не из `YANOTE_SUITE`.

Минимальный library-level пример:

```java
System.setProperty("yanote.suite", "payments-smoke");

RestAssured
    .given()
    .filter(YanoteRestAssuredFilter.fromEnv())
    .baseUri("http://localhost:8080")
    .get("/payments/42")
    .then()
    .statusCode(200);
```

## 3. Cucumber: откуда появляется `yanote.suite`

`yanote-test-tags-cucumber` даёт `YanoteSuiteNamePlugin`. Плагин подписывается на `TestCaseStarted` и кладёт suite name в системное свойство `yanote.suite`.

Текущая логика простая:

- если есть URI feature-файла, берётся имя файла без расширения;
- если URI нет, используется fallback test case name.

То есть Cucumber готовит shared property `yanote.suite`, а HTTP headers всё ещё ставит клиентский bridge вроде RestAssured filter.

## 4. Что делает recorder и analyzer дальше

После запроса recorder пишет в `events.jsonl` ключи `test.run_id` и `test.suite`. Затем analyzer использует suite names для report-level покрытия:

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

Если заголовков не было, `test.run_id` и `test.suite` в JSONL всё равно остаются, но со значением `null`.

## 5. Repo demo boundary

В runnable примере этого репозитория `examples/tests-restassured` используется shell-friendly bridge:

- env `YANOTE_RUN_ID` → demo run id;
- env `YANOTE_SUITE` → demo suite value;
- demo копирует это значение в `System.setProperty("yanote.suite", ...)`;
- затем `YanoteRestAssuredFilter` отправляет `X-Test-Run-Id` и `X-Test-Suite`.

`YANOTE_SUITE` здесь только demo/env bridge. Shared surface для library integrations остаётся `yanote.suite`.

## 6. Как быстро доказать handoff

1. Настройте recorder по [recorder-spring-mvc.md](recorder-spring-mvc.md).
2. Поднимите service companion из [../../examples/springmvc-service/README.md](../../examples/springmvc-service/README.md).
3. Задайте demo env и прогоните runnable test client:

```bash
export YANOTE_RUN_ID=manual-run-1
export YANOTE_SUITE=restassured-suite
export YANOTE_BASE_URI=http://localhost:8080
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"

./gradlew --no-daemon :examples:tests-restassured:test --rerun-tasks
test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
rg -n 'test\.run_id|test\.suite' "$YANOTE_EVENTS_PATH"
```

4. Затем прогоните analyzer и убедитесь, что suite names появились в `coverage.perOperation[].suites`.

## 7. Repo verifiers

Если меняете wording или boundary surfaces, перепроверьте и docs, и library modules:

```bash
bash scripts/docs/verify-analysis-doc-links.sh
./gradlew --no-daemon :yanote-test-tags-restassured:test :yanote-test-tags-cucumber:test
```

## Связанные поверхности

- Runnable RestAssured companion: [../../examples/tests-restassured/README.md](../../examples/tests-restassured/README.md)
- Runnable service companion: [../../examples/springmvc-service/README.md](../../examples/springmvc-service/README.md)
- Recorder proof loop: [recorder-spring-mvc.md](recorder-spring-mvc.md)

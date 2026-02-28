# RestAssured E2E тесты для примера

Тесты используют `YanoteRestAssuredFilter` для автоматического добавления заголовков:

- `X-Test-Run-Id` берётся из `YANOTE_RUN_ID`
- `X-Test-Suite` берётся из системного свойства `yanote.suite`

Запуск из корня репозитория:

```bash
./gradlew :examples:tests-restassured:test
```

# RestAssured E2E тесты для примера

Этот пример показывает только текущий путь передачи тестовых метаданных. За настройкой рекордера и путём к `events.jsonl` идите в [`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md).

Текущий handoff в репозитории выглядит так:

- demo-тест читает run id из env `YANOTE_RUN_ID`
- demo-тест читает suite из env `YANOTE_SUITE`
- это же значение suite копируется в `System.setProperty("yanote.suite", ...)`, чтобы сохранить текущую общую `yanote.suite` surface для test-tagging интеграций
- после этого demo-тест передаёт оба значения в `YanoteRestAssuredFilter`, и запрос получает заголовки `X-Test-Run-Id` и `X-Test-Suite`

Итог для рекордера:

- `X-Test-Run-Id` → `test.run_id`
- `X-Test-Suite` → `test.suite`
- если заголовки не были отправлены, `events.jsonl` всё равно содержит ключи `test.run_id` и `test.suite`, но со значением `null`

Запуск из корня репозитория:

```bash
./gradlew :examples:tests-restassured:test
```

Полезные переменные для демо-прогона:

```bash
export YANOTE_RUN_ID=manual-run-1
export YANOTE_SUITE=restassured-suite
export YANOTE_BASE_URI=http://localhost:8080
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
```

После прогона проверьте, что сервис действительно записал файл и что в JSONL появились ожидаемые метаданные:

```bash
test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
rg -n 'test\.run_id|test\.suite' "$YANOTE_EVENTS_PATH"
```

Если вам нужен runnable сервис для этого тестового клиента, смотрите [`examples/springmvc-service/README.md`](../springmvc-service/README.md). Если нужен только временный smoke/offline путь без публикации зависимостей, используйте fallback [`dist/flatdir-recorder/README.md`](../../dist/flatdir-recorder/README.md).

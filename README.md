# yanote

`yanote` — инструмент для определения покрытия REST API из OpenAPI через реальные вызовы сервиса в интеграционных тестах.

## Модули

- `yanote-core` — модель событий, чтение/запись JSONL, загрузка OpenAPI и расчёт покрытия.
- `yanote-recorder-spring-mvc` — Spring MVC стартер для записи фактов вызовов в `events.jsonl`.
- `yanote-test-tags-restassured` — добавление заголовков `X-Test-Run-Id` и `X-Test-Suite` в RestAssured.
- `yanote-test-tags-cucumber` — интеграция названия suite для Cucumber.
- `yanote-cli` — генерация отчётов покрытия и проверка регрессии.


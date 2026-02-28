# Spring MVC demo service

Пример минимального Spring Boot сервиса с автозаписями `yanote`:

1. Сервисы собираются как часть корневого multi-module проекта.
2. Запуск в compose использует:

```bash
./gradlew :examples:springmvc-service:bootRun
```

Конфигурация в `application.properties` включает запись `events` в `/data/yanote/events.jsonl`.

# Примеры Yanote

Назад: [корневой README](../README.md) · [карта документации](../docs/README.md)

Это один короткий repo demo path: сервис пишет `events.jsonl`, тесты добавляют run/suite metadata, а analyzer через standalone launcher строит `yanote-report.json` и `yanote-report.html`.

## Самый короткий маршрут

1. Соберите standalone analyzer contract:
   ```bash
   ./gradlew distStandaloneAnalyzer
   ```
2. Откройте [docker-compose.yml](docker-compose.yml) — это готовый service → tests → analyzer demo.
3. Запустите demo:
   ```bash
   docker compose -f examples/docker-compose.yml up --build --abort-on-container-exit
   ```
4. Проверьте итоговые артефакты в общем томе demo: `events.jsonl`, `yanote-report.json`, `yanote-report.html`.

Compose использует тот же user-facing analyzer contract, что и published asset `yanote-analyzer.zip`: в repo demo launcher лежит по пути `dist/standalone-analyzer/bin/yanote`, а не вызывается через raw Node seam.

## Что открывать рядом с Compose

- [springmvc-service/README.md](springmvc-service/README.md) — как demo-service пишет `events.jsonl`
- [tests-restassured/README.md](tests-restassured/README.md) — как demo-tests передают `X-Test-Run-Id` и `X-Test-Suite`
- [../docs/guides/analyzer-coverage.md](../docs/guides/analyzer-coverage.md) — standalone analyzer path и чтение отчёта

## Когда выходить из examples

Если нужен не repo demo, а published install/run path, стабильная линия `v1.0.x`, asset `yanote-analyzer.zip` или support boundary, переходите в [../docs/release-and-support.md](../docs/release-and-support.md). Это secondary surface; первый шаг для demo остаётся один: Compose + два README примеров + standalone analyzer contract.

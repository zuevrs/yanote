# yanote

Yanote показывает не абстрактное «тесты прошли», а доказуемое покрытие HTTP-контракта по живым вызовам: рекордер пишет `events.jsonl`, analyzer сопоставляет события с OpenAPI и сохраняет `yanote-report.json` и `yanote-report.html`.

## С чего начать

1. [Пройдите короткий быстрый старт](docs/guides/getting-started.md) — один путь для recorder → tagging → analyzer → repo demo.
2. [Откройте карту документации](docs/README.md) — когда после быстрого старта нужны отдельные guide-level детали.
3. [Проверьте release/support boundary](docs/release-and-support.md) — если нужен текущий стабильный релиз `v1.0.x`, published bundle `yanote-analyzer.zip` или ограничения поддержки.
4. [Откройте короткую матрицу поддержки](docs/support-matrix.md) — если нужно быстро понять, что поддержано, что intentionally narrow, а что остаётся internal/deferred.

## Что вы пройдёте в продукте

- **Recorder:** подключите `yanote-recorder-spring-mvc`, зададите путь к `events.jsonl` и проверите, что сервис реально пишет evidence.
- **Tagging:** увидите, как `X-Test-Run-Id` и `X-Test-Suite` становятся `test.run_id`, `test.suite` и `coverage.perOperation[].suites`.
- **Analyzer:** запустите `yanote-analyzer.zip` через `bin/yanote report` и получите JSON+HTML отчёт.
- **Repo demo:** повторите тот же цикл на готовых примерах из репозитория.

## Прямые переходы

- Recorder guide: [docs/guides/recorder-spring-mvc.md](docs/guides/recorder-spring-mvc.md)
- Tagging guide: [docs/guides/test-tagging.md](docs/guides/test-tagging.md)
- Analyzer guide: [docs/guides/analyzer-coverage.md](docs/guides/analyzer-coverage.md)
- Async guide: [docs/guides/asyncapi-kafka.md](docs/guides/asyncapi-kafka.md)
- Repo demo: [examples/README.md](examples/README.md)

Если нужен один truthful entrypoint для нового инженера, открывайте [docs/guides/getting-started.md](docs/guides/getting-started.md) и идите по шагам сверху вниз.

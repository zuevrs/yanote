# Документация Yanote

Yanote уже собран вокруг одного короткого product-first пути. Если вы впервые открыли репозиторий, начните с быстрого маршрута ниже, а к release/support boundary переходите уже после него.

## С чего начать

1. [Быстрый старт](guides/getting-started.md) — recorder → tagging → analyzer → repo demo.
2. [Recorder guide](guides/recorder-spring-mvc.md) — зависимость, свойства/env и проверка `events.jsonl`.
3. [Tagging guide](guides/test-tagging.md) — `X-Test-Run-Id`, `X-Test-Suite`, `test.run_id`, `test.suite`, `coverage.perOperation[].suites`.
4. [Analyzer guide](guides/analyzer-coverage.md) — `yanote-analyzer.zip`, `bin/yanote`, `yanote-report.json`, `yanote-report.html`.
5. [Repo demo](../examples/README.md) — готовый runnable путь на примерах репозитория.

## Второй шаг после быстрого старта

- Вернуться к продуктовой витрине: [../README.md](../README.md)
- Проверить release/support boundary: [release-and-support.md](release-and-support.md) — если нужны текущая стабильная линия `v1.0.x`, published bundle `yanote-analyzer.zip` и ограничения поддержки
- Открыть короткую матрицу поддержки: [support-matrix.md](support-matrix.md)
- Проверить baseline-совместимость: [compatibility.md](compatibility.md)
- Если нужен узкий отдельный WebFlux recorder path, открыть [guides/recorder-spring-webflux.md](guides/recorder-spring-webflux.md)
- Если нужен reference stack целиком, открыть [reference/README.md](reference/README.md)
- Если нужен async path, открыть [guides/asyncapi-kafka.md](guides/asyncapi-kafka.md)

Если нужен один newcomer path без лишней археологии, держитесь связки [guides/getting-started.md](guides/getting-started.md) → guide-level docs → [../examples/README.md](../examples/README.md).

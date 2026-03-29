# Канонический путь: установить analyzer, запустить report, прочитать результат

Это короткий и public-facing путь для HTTP/OpenAPI анализа в Yanote. Канонический install/run contract один и тот же: published asset `yanote-analyzer.zip` распаковывается в `./yanote-analyzer`, затем запускается `./yanote-analyzer/bin/yanote`, а команда `report` пишет sibling-артефакты `yanote-report.json` и `yanote-report.html`.

Если вы проверяете текущий `HEAD` репозитория, соберите тот же bundle локально:

```bash
./gradlew distStandaloneAnalyzer
unzip -q build/distributions/yanote-analyzer.zip -d .
YANOTE="$PWD/yanote-analyzer/bin/yanote"
"${YANOTE}" --version
```

Если вы работаете с опубликованным релизом, вместо `build/distributions/yanote-analyzer.zip` возьмите GitHub release asset `yanote-analyzer.zip`. User-facing launcher contract остаётся тем же: `./yanote-analyzer/bin/yanote`. Текущая stable line, release assets и support boundary собраны в [../release-and-support.md](../release-and-support.md).

## Что нужно на входе

`report` ожидает три вещи:

- `--spec` — локальный OpenAPI-файл или директорию со спецификацией;
- `--events` — путь к `events.jsonl`;
- `--out` — директорию, куда писать отчёт.

Если события ещё не собраны, сначала пройдите recorder path: [recorder-spring-mvc.md](recorder-spring-mvc.md). Если нужен полный newcomer loop с tagging и repo demo, начните с [getting-started.md](getting-started.md) и [../../examples/README.md](../../examples/README.md).

## Минимальный запуск

```bash
"${YANOTE}" report \
  --spec /path/to/openapi.yaml \
  --events /path/to/events.jsonl \
  --out ./out
```

Проверенный repo-local пример:

```bash
"${YANOTE}" report \
  --spec examples/openapi/demo-openapi.yaml \
  --events "$YANOTE_EVENTS_PATH" \
  --out ./out \
  --min-coverage 100
```

После запуска ищите два файла:

- `./out/yanote-report.json` — machine-readable результат;
- `./out/yanote-report.html` — human-readable sibling surface.

## Как быстро прочитать stdout и report

Смотрите на три устойчивых сигнала в stdout:

1. `Summary` — observation coverage и общий статус;
2. `HTTP Payload Conformance` — truth по request/response body;
3. финальную строку `YANOTE_SUMMARY ...` — machine-readable итог.

Дальше откройте `yanote-report.json` и проверьте минимум:

- `status`;
- `summary.*` и `coverage.*`;
- `httpPayloadConformance.*`;
- `governance.diagnostics`.

`yanote-report.html` показывает ту же нормализованную truth surface в виде для чтения человеком.

## HTTP Security Conformance

`HTTP Security Conformance` — additive truth surface: legacy `coverage.operations/status/parameters/aggregate` остаётся прежним, а security boundary живёт рядом через `httpSecurityConformance.summary`, `httpSecurityConformance.perOperation[]` и `httpSecurityConformance.diagnostics.items[]`.

Поддерживаемый subset сейчас узкий и явный: только `apiKey` в `query`, `header` и `cookie`; root inheritance и operation override сохраняются; `security: []` явно очищает inherited requirement; `{}` внутри массива означает optional branch; действует OR между объектами Security Requirement, а внутри одного объекта действует AND.

Fail-closed сигналы для чтения отчёта: `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY` и `SEMANTIC_HTTP_UNSUPPORTED_SECURITY`. В stdout/stderr и summary ищите `HTTP Security Conformance`, токены `security_declared_operations`, `security_observed_operations`, `security_observed_evaluations`, `security_truths`, `primary`, а также retained sidecars `security-semantics.stdout`, `security-semantics.stderr` и `security-semantics-yanote-report.json`.

Если нужно быстро перепроверить эту boundary локально, используйте focused fixture-backed proof:

```bash
bash scripts/ci/verify-m012-s02-security-semantics.sh
```

Этот fixture-backed proof публикует provenance через `artifact-manifest.txt` и `artifact-source-paths.txt`; security matrix описывает fixture-backed proof, а raw `http-security-api-key.fixture.jsonl` в `.yanote-ci/v1-e2e/` не копируется в public-facing path. Более широкие OpenAPI-объекты пока deferred: `examples`, `links`, `callbacks` и `webhooks`.

## Когда идти дальше по документации

- Нужен tagging handoff для `test.run_id` / `test.suite`: [test-tagging.md](test-tagging.md)
- Нужен runnable repo demo через Compose: [../../examples/README.md](../../examples/README.md)
- Нужен release/support контекст и published assets: [../release-and-support.md](../release-and-support.md)
- Нужен AsyncAPI/Kafka path, а не HTTP/OpenAPI: [asyncapi-kafka.md](asyncapi-kafka.md)

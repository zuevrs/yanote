# Канонический путь: запуск analyzer и чтение HTTP coverage/conformance

Это основной и проверенный HTTP/OpenAPI путь для `yanote`: соберите `yanote-js` из исходников этого репозитория, запустите `report`, прочитайте `Summary`, `HTTP Payload Conformance`, `HTTP Request Conformance`, финальную строку `YANOTE_SUMMARY ...`, а затем откройте `yanote-report.json`.

Если в вашем контуре нельзя выполнить `npm -C yanote-js ci && npm -C yanote-js run build`, offline fallback остаётся только через release assets GitHub Releases. Командная форма и структура отчёта у такого fallback те же; меняется только способ доставки CLI. Актуальные release/support границы и текущую release truth смотрите в [`docs/release-and-support.md`](../release-and-support.md).

Если вам нужен не HTTP/OpenAPI путь, а первая волна AsyncAPI/Kafka, не смешивайте этот guide с async semantics: отдельный onboarding вынесен в [`docs/guides/asyncapi-kafka.md`](asyncapi-kafka.md), где описаны Kafka evidence inputs, `async-report`, `YANOTE_ASYNC_SUMMARY` и `yanote-async-report.json`.

Если хотите сначала перепроверить live-path репозитория, а потом редактировать этот guide, используйте:

```bash
bash scripts/docs/verify-s02-analysis-path.sh
```

## 1. Что analyzer ждёт на входе

Analyzer всегда ждёт три вещи:

- `--spec` — OpenAPI-файл или директорию со спецификацией;
- `--events` — путь к собранному `events.jsonl`;
- `--out` — директорию, куда будет записан отчёт.

Рекордер и проверенный путь к `events.jsonl` описаны в [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md).

## 2. Соберите CLI из исходников

Из корня репозитория:

```bash
npm -C yanote-js ci
npm -C yanote-js run build
```

После этого основной бинарь лежит здесь:

- `yanote-js/dist/yanote.cjs`

## 3. Запустите анализ

Минимальная команда:

```bash
node yanote-js/dist/yanote.cjs report \
  --spec /path/to/openapi.yaml \
  --events /path/to/events.jsonl \
  --out ./out
```

Результат всегда пишется в стабильный файл:

- `./out/yanote-report.json`

Проверенный repo-пример на реальных assets:

```bash
node yanote-js/dist/yanote.cjs report \
  --spec examples/openapi/demo-openapi.yaml \
  --events /path/to/events.jsonl \
  --out ./out \
  --min-coverage 100
```

Если хотите проверить именно публичный retained proof bundle репозитория, используйте:

```bash
bash scripts/ci/run-v1-e2e.sh
```

После него в `.yanote-ci/v1-e2e/` удерживаются такие публичные артефакты:

- happy path: `.yanote-ci/v1-e2e/out/yanote-report.json`;
- retained request sidecar: `.yanote-ci/v1-e2e/request-semantics.events.jsonl`, `.yanote-ci/v1-e2e/request-semantics.stdout`, `.yanote-ci/v1-e2e/request-semantics.stderr`, `.yanote-ci/v1-e2e/request-semantics-yanote-report.json`;
- retained payload semantic-red sidecar: `.yanote-ci/v1-e2e/semantic-red.stdout`, `.yanote-ci/v1-e2e/semantic-red.stderr`, `.yanote-ci/v1-e2e/semantic-red-yanote-report.json`.

Если нужно не summary-level подтверждение, а более глубокая retained proof truth, запускайте точечные проверки:

```bash
bash scripts/ci/verify-m011-s02-request-semantics.sh
bash scripts/ci/verify-m011-s03-format-media.sh
```

## 4. Что означает plain-text вывод CLI

У `report` теперь есть четыре устойчивые HTTP-поверхности:

1. **`Summary`** — общий статус и observation coverage;
2. **`HTTP Payload Conformance`** — truth по request/response body, schema formats и media-type matching;
3. **`HTTP Request Conformance`** — truth по supported request serialization subset;
4. **финальная machine-readable строка `YANOTE_SUMMARY ...`**.

Fail-closed semantic boundary по-прежнему уходит в `stderr` строками `YANOTE_ERROR ...`, но `yanote-report.json` при этом сохраняется для последующего разбора.

### Summary и Coverage Dimensions

`Summary` и `Coverage Dimensions` отвечают только за observation coverage: были ли замечены операции, статусы и required parameters. Эти числа не эквивалентны полноте request/payload validation.

### HTTP Payload Conformance

Эта поверхность отвечает на вопрос, можно ли честно проверить observed request/response body против объявленного JSON content.

Публичная граница здесь такая:

- Yanote поддерживает только `email` как публичный payload format allowlist;
- format вне этой allowlist приводит к fail-closed `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT`;
- выбор media type идёт по most-specific declared match, поэтому `application/problem+json` выигрывает у wildcard вроде `application/*+json`;
- benign `NO_DECLARED_CONTENT` и `RECORDER_OMITTED` остаются раздельными диагностическими состояниями; у `RECORDER_OMITTED` сохраняются provenance-поля вроде `captureState=omitted` и `captureReason=policy-filtered`, и сами по себе эти сигналы не понижают observation coverage.

### HTTP Request Conformance

Это отдельная поверхность поверх observation coverage. Она публикует truth по тому, какая часть observed request лежит внутри публично поддерживаемого request serialization subset.

Поддерживаемый subset нужно читать буквально:

- `path=simple`;
- `query=form`;
- `header=simple`;
- `cookie=form`;
- повторяющиеся массивы поддерживаются только для `query=form` + `explode=true` + scalar `items`;
- `content`-parameters, неподдерживаемые serialization styles, cookie arrays и schema-формы вне этого subset не считаются supported public surface.

В `yanote-report.json` эта поверхность публикуется через:

- `httpRequestConformance.summary`;
- `httpRequestConformance.perOperation[]`;
- `httpRequestConformance.diagnostics.items[]`;
- per-parameter поля `declaredSupport`, `declaredSupportShape`, `declaredSupportReason`.

Если observed request выходит за published subset, CLI удерживает fail-closed semantic boundary кодом `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER`.

### YANOTE_SUMMARY

Финальная строка stdout остаётся machine-readable и теперь дополнительно публикует request-specific токены:

- `request_observed_operations`;
- `request_observed_parameters`;
- `request_truths`;
- `primary`.

Эти additive токены не переименовывают legacy percentages: `operations`, `status_dimension`, `parameters` и `aggregate` остаются отдельной observation surface.

## 5. Что искать в `yanote-report.json`

Минимальный порядок чтения такой:

1. `status` — можно ли считать отчёт зелёным (`ok`) или он лишь partial/fail-closed;
2. `summary.*` и `coverage.*` — truth по observation coverage;
3. `httpPayloadConformance.summary`, `httpPayloadConformance.perOperation[]`, `httpPayloadConformance.diagnostics` — truth по payload boundary;
4. `httpRequestConformance.summary`, `httpRequestConformance.perOperation[]`, `httpRequestConformance.diagnostics` — truth по request boundary;
5. `governance.diagnostics` — какой semantic/gate/runtime boundary реально сработал.

Особенно полезные поля для request surface:

- `httpRequestConformance.summary.observedOperations` и `httpRequestConformance.summary.observedParameters`;
- `httpRequestConformance.summary.counts` — агрегированные `capturedValid` / `capturedInvalid` / `redacted` / `omitted` / `unsupported`;
- `httpRequestConformance.perOperation[].parameters[].declaredSupport` — поддерживается ли параметр публичным subset;
- `httpRequestConformance.perOperation[].parameters[].declaredSupportShape` — scalar или array;
- `httpRequestConformance.perOperation[].parameters[].declaredSupportReason` — почему поддержка отсутствует (`content`, `style`, `explode`, `schema`);
- `httpRequestConformance.diagnostics.items[].truth` — итоговая truth per observed parameter.

Особенно полезные поля для payload surface:

- `httpPayloadConformance.summary.request` и `httpPayloadConformance.summary.response`;
- `httpPayloadConformance.diagnostics.items[]` с кодами `VALID`, `INVALID_BODY`, `UNSUPPORTED_SCHEMA_FORMAT`, `NO_DECLARED_CONTENT`, `RECORDER_OMITTED`;
- `httpPayloadConformance.perOperation[].response.declaredContent` — какие media types и statuses вообще объявлены для payload validation.

## 6. Как читать публичный retained proof bundle

`bash scripts/ci/run-v1-e2e.sh` остаётся стандартным публичным proof entrypoint. Его нужно читать как bundle из трёх truth-поверхностей:

1. `.yanote-ci/v1-e2e/out/yanote-report.json` — зелёный happy path для observation coverage и supported payload path;
2. `.yanote-ci/v1-e2e/request-semantics.*` — retained request subset proof поверх тех же live events;
3. `.yanote-ci/v1-e2e/semantic-red.*` — retained payload fail-closed proof поверх тех же live events.

Это важно интерпретировать так:

- observation coverage, request conformance и payload conformance — разные поверхности;
- полный `operations/status/parameters/aggregate` не отменяет request/payload semantic boundary;
- request/payload sidecars публикуются additive, рядом с happy path, а не вместо него;
- retained stdout/stderr/report артефакты redacted и не должны утекать raw Authorization/session values.

## 7. Когда использовать focused proof scripts

Используйте focused proof scripts, когда нужно доказать конкретную boundary truth, а не только summary-level bundle shape:

- `bash scripts/ci/verify-m011-s02-request-semantics.sh` — request subset, `httpRequestConformance`, `declaredSupport*`, `request_truths`, `SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER`;
- `bash scripts/ci/verify-m011-s03-format-media.sh` — `email`-only format allowlist, `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT`, most-specific media matching и fail-closed `INVALID_BODY` path.

## 8. Когда использовать offline fallback

Offline fallback нужен только когда основной source-built путь недоступен в вашем контуре. Смысл и интерпретация отчёта остаются теми же; меняется только способ доставки CLI через release assets GitHub Releases. Границы этого пути и актуальную release truth смотрите в [`docs/release-and-support.md`](../release-and-support.md).

## Связанные поверхности

- Проверенный путь рекордера: [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md)
- Канонический test-tagging contract: [`docs/guides/test-tagging.md`](test-tagging.md)
- Runnable demo-service: [`examples/springmvc-service/README.md`](../../examples/springmvc-service/README.md)
- RestAssured handoff для тестовых метаданных: [`examples/tests-restassured/README.md`](../../examples/tests-restassured/README.md)
- Release/support boundary и fallback assets: [`docs/release-and-support.md`](../release-and-support.md)

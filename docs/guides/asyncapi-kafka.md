# Канонический путь: AsyncAPI + Kafka через `async-report`

Это отдельный guide-level путь для первой волны async coverage в Yanote. Он не заменяет HTTP/OpenAPI guide: для HTTP используйте [`docs/guides/analyzer-coverage.md`](analyzer-coverage.md), а здесь описана только связка **AsyncAPI + Kafka evidence → `node yanote-js/dist/yanote.cjs async-report` → `yanote-async-report.json`**.

Главное правило этого guide простое: не смешивайте HTTP `report` / `yanote-report.json` и async `async-report` / `yanote-async-report.json` в один размытый onboarding. У этих поверхностей разные входы, разные summary-строки и отдельные gate-ожидания.

## 1. Что поддерживается в первой волне

Сегодняшний проверенный async path в репозитории такой:

- AsyncAPI как источник объявленного async-контракта;
- Kafka evidence как реальный источник наблюдений;
- source-built CLI из `yanote-js` с командой `async-report`;
- поддержанные входы: `raw` или `merged` async JSONL с Kafka evidence (`kind: "kafka"`, `action: "send" | "receive"`, `channel`, `message`);
- канонический happy-path bundle из `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`: `async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`;
- retained schema-failure bundle из того же proof path: `schema-failure-async-report.stdout`, `schema-failure-async-report.stderr`, `schema-failure-yanote-async-report.json`.

Если вам нужен user-facing путь, который уже доказан live-proof скриптами из репозитория, считайте поддержанным именно этот маршрут, а не абстрактный «любой AsyncAPI в любом брокере».

## 2. Авторитетные live-proof команды

Перед тем как переносить путь в свой сервис или спорить о границах поддержки, перепроверьте две авторитетные proof-команды из M004:

```bash
bash scripts/ci/verify-m004-s02-metadata-propagation.sh
bash scripts/ci/verify-m004-s03-live-kafka-proof.sh
```

Что именно они доказывают:

- [`scripts/ci/verify-m004-s02-metadata-propagation.sh`](../../scripts/ci/verify-m004-s02-metadata-propagation.sh) — single-service proof для HTTP → Kafka → Kafka republish: проверяет raw `events.jsonl`, наличие Kafka `send`/`receive` evidence, propagation `test.run_id` / `test.suite` и успешный `async-report` с артефактом `yanote-async-report.json`.
- [`scripts/ci/verify-m004-s03-live-kafka-proof.sh`](../../scripts/ci/verify-m004-s03-live-kafka-proof.sh) — two-service live Kafka proof: проверяет producer/consumer raw JSONL, детерминированный merge, успешный happy-path `async-report` по merged evidence, retained runtime-selection sidecar для multi-message AsyncAPI path и retained schema-failure pass по той же merged evidence.

После T02 второй proof-скрипт экспортирует в `.yanote-ci/live-kafka-proof/` три правдивые поверхности:

- happy path: `async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`;
- runtime-selected multi-message sidecar: `runtime-selected-async-report.stdout`, `runtime-selected-async-report.stderr`, `runtime-selected-yanote-async-report.json`;
- intentional schema failure: `schema-failure-async-report.stdout`, `schema-failure-async-report.stderr`, `schema-failure-yanote-async-report.json`.

Это и есть текущая публичная truth для proven Kafka path: зелёный прогон показывает канонический coverage bundle, retained runtime-selected sidecar показывает `selectionMode=runtime` и выбранные `declaredMessages` / `selectedMessages` для multi-message AsyncAPI contract, а retained red sidecar показывает typed `ASYNC_SEMANTIC_INVALID_PAYLOAD` и `diagnostics.counts.invalid-payload` для той же merged Kafka evidence.

Если эти proof-скрипты падают, сначала разбирайте их failure artifacts и `stderr`, а уже потом меняйте документацию или интеграцию.

## 3. Какие Kafka evidence inputs поддержаны

Первая волна честно поддерживает **`raw` или `merged` async JSONL**, если в нём есть Kafka evidence (`kind: "kafka"`, `action: "send" | "receive"`, `channel`, `message`). Практически это означает три допустимых варианта входа:

1. **Raw single-service `events.jsonl`** — один файл с прогоном, где рядом могут лежать и HTTP-, и Kafka-события. Именно такой mixed raw surface использует `verify-m004-s02-metadata-propagation.sh`; `async-report` читает из него Kafka evidence.
2. **Raw per-service async JSONL** — отдельные файлы сервиса-производителя и сервиса-потребителя, например `01-producer.events.jsonl` и `02-consumer.events.jsonl`.
3. **Merged async JSONL** — детерминированно объединённый файл для multi-service анализа, например `merged-two-service.events.jsonl`.

Repo helper для merge уже есть:

```bash
node scripts/ci/merge-async-events-jsonl.mjs \
  --out ./out/merged-two-service.events.jsonl \
  ./01-producer.events.jsonl \
  ./02-consumer.events.jsonl
```

Скрипт [`scripts/ci/merge-async-events-jsonl.mjs`](../../scripts/ci/merge-async-events-jsonl.mjs) сортирует входы по пути, детерминированно конкатенирует их и пишет один merged JSONL surface для `async-report`.

## 4. Соберите CLI из исходников

Из корня репозитория:

```bash
npm -C yanote-js ci
npm -C yanote-js run build
```

После этого основной бинарь лежит здесь:

- `yanote-js/dist/yanote.cjs`

## 5. Запустите `async-report`

Минимальная команда:

```bash
node yanote-js/dist/yanote.cjs async-report \
  --spec /path/to/asyncapi.yaml \
  --events /path/to/async-events.jsonl \
  --out ./out
```

Проверенный repo-пример для two-service merged evidence:

```bash
node yanote-js/dist/yanote.cjs async-report \
  --spec yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml \
  --events ./out/merged-two-service.events.jsonl \
  --out ./out \
  --min-coverage 100
```

Результат всегда пишется в отдельный стабильный async-артефакт:

- `./out/yanote-async-report.json`

Что важно про поверхность команды:

- `async-report` — это отдельная CLI-команда, а не alias для HTTP `report`;
- async path использует свой machine-readable хвост `YANOTE_ASYNC_SUMMARY ...`, а не `YANOTE_SUMMARY ...`;
- async gate здесь тоже отдельный: используйте `--min-coverage` для async operation coverage и не переносите в этот guide HTTP `--min-aggregate` семантику.

Если async gate не выполнен, CLI всё равно сохраняет `yanote-async-report.json`, а в `stderr` пишет typed error вроде:

```text
YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE ...
```

## 6. Что смотреть в результате

У `async-report` четыре устойчивых surface-а:

1. **Читаемый stdout** с секциями `Summary`, `Coverage Dimensions`, `Top Issues`, `Report Path`
2. **Финальная machine-readable строка** `YANOTE_ASYNC_SUMMARY ...`
3. **Typed async error lines в `stderr`** при gate/input/semantic fail-closed ситуациях
4. **JSON-артефакт** `yanote-async-report.json`

Минимум, который обычно читают первым:

- `summary.totalChannels` / `summary.coveredChannels`
- `summary.totalOperations` / `summary.coveredOperations`
- `summary.totalMessages` / `summary.coveredMessages`
- `coverage.operations.items[]` и их `operationKey`
- `diagnostics.counts.unmatched`, `diagnostics.counts.mismatched`, `diagnostics.counts.invalid-payload`

Для CI и support surface самый удобный набор такой:

- `YANOTE_ASYNC_SUMMARY ...` — быстрая grep-friendly строка;
- `yanote-async-report.json` — стабильный machine-readable артефакт;
- `stderr` analyzer-а или proof-скрипта — typed причина, если путь упал fail-closed;
- для proven Kafka runtime-selection path — `runtime-selected-async-report.stderr` и `runtime-selected-yanote-async-report.json` из `.yanote-ci/live-kafka-proof/`, если нужно разобрать multi-message selection truth;
- для proven Kafka schema-failure path — `schema-failure-async-report.stderr` и `schema-failure-yanote-async-report.json` из `.yanote-ci/live-kafka-proof/`.

Важно не переинтерпретировать async цифры: routing percentages remain routing-first. `channelCoveragePercent`, `operationCoveragePercent` и `messageCoveragePercent` показывают, что channel/operation/message wiring был наблюдён и сопоставлен, но не превращают зелёный happy path в обещание полной schema-keyword coverage.

Payload-schema drift surfaced on the proven Kafka path, но только в тех границах, которые реально экспортирует live proof: retained invalid-payload sidecar показывает типизированный drift для той же merged Kafka evidence, а не абстрактную broker-agnostic schema validation для любых AsyncAPI runtime-ов.

Отдельная честная граница касается headers: retained Kafka headers remain unverifiable. Runtime-selected sidecar публикует только redacted selectors (`declaredMessages` / `selectedMessages`) и доказывает multi-message runtime selection via retained headers, но user-facing bundle всё ещё не сохраняет raw Kafka headers и не делает публичным promise про header-schema coverage.

## 7. Честная граница первой волны

Эти boundary-клаузы нужно считать буквальными, а не маркетинговыми обещаниями:

- **Kafka-only** — текущий user-facing async path поддерживает Kafka evidence и Kafka-oriented AsyncAPI proof; это не promise про любые брокеры.
- **Spring Kafka-first** — live-proof в репозитории проходит через Spring Kafka integration path; другие runtime/framework surface-ы здесь не обещаны как проверенные.
- **separate async report/gate** — async onboarding идёт через `async-report`, `YANOTE_ASYNC_SUMMARY`, `YANOTE_ASYNC_ERROR` и `yanote-async-report.json`; HTTP `report` / `yanote-report.json` остаются отдельной surface.
- **payload-schema drift surfaced on the proven Kafka path** — текущая первая волна уже умеет публиковать retained `invalid-payload` drift для live Kafka evidence через `schema-failure-*` артефакты, но не обещает полную schema-keyword coverage или broker-agnostic payload enforcement.
- **routing percentages remain routing-first** — проценты покрытия по-прежнему описывают прежде всего channel/operation/message wiring и не подменяют более глубокую schema semantics surface.
- **retained Kafka headers remain unverifiable** — runtime-selected sidecar доказывает multi-message selection через retained header discriminators, но публичный bundle по-прежнему не делает raw Kafka headers или header-schema coverage поддержанной user-facing surface.
- **broker-agnostic promise нет** — RabbitMQ/AMQP и другие расширения остаются follow-on scope, а не текущая поддерживаемая поверхность.

Из этого следуют два практических запрета:

1. Не называйте текущий path «общим async analyzer для любого брокера».
2. Не трактуйте `yanote-async-report.json`, `runtime-selected-*` bundle или `schema-failure-*` bundle как доказательство полной broker-agnostic или header-level schema validation.

## Связанные поверхности

- HTTP/OpenAPI guide: [`docs/guides/analyzer-coverage.md`](analyzer-coverage.md)
- Recorder guide для HTTP-first evidence path: [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md)
- Test-tagging contract: [`docs/guides/test-tagging.md`](test-tagging.md)
- Single-service live proof: [`scripts/ci/verify-m004-s02-metadata-propagation.sh`](../../scripts/ci/verify-m004-s02-metadata-propagation.sh)
- Two-service live proof: [`scripts/ci/verify-m004-s03-live-kafka-proof.sh`](../../scripts/ci/verify-m004-s03-live-kafka-proof.sh)
- Deterministic merge helper: [`scripts/ci/merge-async-events-jsonl.mjs`](../../scripts/ci/merge-async-events-jsonl.mjs)

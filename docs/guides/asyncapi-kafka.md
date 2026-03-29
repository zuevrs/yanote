# Канонический путь: AsyncAPI через Kafka, RabbitMQ и `combined-report`

Это отдельный guide-level путь для widened async и combined coverage в Yanote. Он не заменяет HTTP/OpenAPI guide: для HTTP используйте [`docs/guides/analyzer-coverage.md`](analyzer-coverage.md), а здесь описана связка **Kafka или RabbitMQ/AMQP evidence → `./yanote-analyzer/bin/yanote async-report` → `yanote-async-report.json` + `yanote-async-report.html`**, а также **child-attributed `./yanote-analyzer/bin/yanote combined-report` → `yanote-combined-report.json` + `yanote-combined-report.html`**.

Главное правило этого guide простое: не смешивайте HTTP `report` / `yanote-report.json` / `yanote-report.html` и async `async-report` / `yanote-async-report.json` / `yanote-async-report.html` в один размытый onboarding. Combined surface теперь поддержан, но он additive и child-attributed: он не превращает HTTP и async в один blended denominator, не заменяет отдельные proof bundles и не создаёт hosted dashboard.

## 1. Что поддерживается в widened async и combined surface

Сегодняшний проверенный async path в репозитории такой:

- AsyncAPI как источник объявленного async-контракта;
- standalone analyzer bundle `yanote-analyzer.zip` с launcher-ом `bin/yanote`, который публикует команды `async-report` и `combined-report`;
- отдельный proven Kafka path через collected bundle `build-and-test-artifacts/live-kafka-proof/`;
- отдельный proven RabbitMQ/AMQP path через collected bundle `build-and-test-artifacts/live-rabbitmq-proof/`;
- child-attributed combined path через collected bundle `build-and-test-artifacts/combined-proof/`, где `yanote-combined-report.json` / `yanote-combined-report.html` ссылаются на отдельные HTTP и async child reports;
- поддержанные async inputs: `raw` или `merged` async JSONL с Kafka evidence (`kind: "kafka"`) или первым RabbitMQ/AMQP evidence (`kind: "amqp"`), плюс retained HTTP child report для `combined-report`.

Если вам нужен user-facing путь, который уже доказан live-proof скриптами из репозитория, считайте поддержанными именно эти три семейства, а не абстрактный «любой AsyncAPI в любом брокере» или blended dashboard surface.

## 2. Авторитетные live-proof команды

Перед тем как переносить путь в свой сервис или спорить о границах поддержки, перепроверьте три авторитетные proof-команды widened surface:

```bash
bash scripts/ci/verify-kafka-live-proof.sh
bash scripts/ci/verify-rabbitmq-live-proof.sh
bash scripts/ci/verify-combined-report.sh
```

Что именно они доказывают:

- [`scripts/ci/verify-kafka-live-proof.sh`](../../scripts/ci/verify-kafka-live-proof.sh) — two-service live Kafka proof: producer/consumer raw JSONL, deterministic merge, happy-path `async-report`, retained runtime-selection companion и retained schema-failure companion для proven Kafka path.
- [`scripts/ci/verify-rabbitmq-live-proof.sh`](../../scripts/ci/verify-rabbitmq-live-proof.sh) — first live RabbitMQ/AMQP proof: producer/consumer raw JSONL с `kind: "amqp"`, deterministic merge, happy-path `async-report`, `protocols=amqp`, declared semantics и явное отсутствие fabricated Kafka-only companion artifacts.
- [`scripts/ci/verify-combined-report.sh`](../../scripts/ci/verify-combined-report.sh) — retained combined proof: генерирует отдельный HTTP child report, берёт retained RabbitMQ async child report и собирает `yanote-combined-report.json` / `yanote-combined-report.html` с явными child-path ссылками вместо blended denominator.

После T02 эти proof-скрипты экспортируют три правдивые поверхности:

- Kafka bundle `build-and-test-artifacts/live-kafka-proof/` с happy path, runtime-selected companion и schema-failure companion;
- RabbitMQ bundle `build-and-test-artifacts/live-rabbitmq-proof/` с `async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`, `yanote-async-report.html`, `artifact-manifest.txt`, `artifact-source-paths.txt`;
- combined bundle `build-and-test-artifacts/combined-proof/` с `combined-report.stdout`, `combined-report.stderr`, `yanote-combined-report.json`, `yanote-combined-report.html`, `artifact-manifest.txt`, `artifact-source-paths.txt`.

GitHub step summary и collected summaries публикуют redaction-safe строки `binding support`, `declared semantics`, `runtime semantics`, RabbitMQ `protocols=amqp`, явные report filenames и child report paths. Это и есть текущая публичная truth для widened async/combined path: есть отдельные Kafka и RabbitMQ async bundles, есть combined child surface, но нет unified gate denominator, hosted dashboard или broker-agnostic promise.

## 3. Какие async evidence inputs поддержаны

Widened surface честно поддерживает **`raw` или `merged` async JSONL**, если в нём есть Kafka evidence (`kind: "kafka"`) или первый RabbitMQ/AMQP evidence (`kind: "amqp"`). Практически это означает три допустимых варианта входа:

1. **Raw single-service `events.jsonl`** — один файл с прогоном, где рядом могут лежать HTTP- и async-события. Для Kafka такой mixed raw surface использует `verify-kafka-metadata-propagation.sh`; для RabbitMQ авторитетным live proof остаётся two-service bundle из `verify-rabbitmq-live-proof.sh`.
2. **Raw per-service async JSONL** — отдельные файлы сервиса-производителя и сервиса-потребителя, например `01-producer.events.jsonl` и `02-consumer.events.jsonl`.
3. **Merged async JSONL** — детерминированно объединённый файл для multi-service анализа, например `merged-two-service.events.jsonl`.

Для combined surface вход отдельный: `combined-report` не читает raw events напрямую, а берёт уже-retained HTTP child report плюс retained async child report. Командная форма при этом остаётся тем же launcher contract: `"${YANOTE}" combined-report ...`.

Repo helper для merge уже есть:

```bash
node scripts/ci/merge-async-events-jsonl.mjs \
  --out ./out/merged-two-service.events.jsonl \
  ./01-producer.events.jsonl \
  ./02-consumer.events.jsonl
```

Скрипт [`scripts/ci/merge-async-events-jsonl.mjs`](../../scripts/ci/merge-async-events-jsonl.mjs) сортирует входы по пути, детерминированно конкатенирует их и пишет один merged JSONL surface для `async-report`.

## 4. Подготовьте standalone CLI bundle

Канонический launcher surface один и тот же для published release asset и repo-local сборки текущего `HEAD`:

```bash
./gradlew distStandaloneAnalyzer
unzip -q build/distributions/yanote-analyzer.zip -d .
YANOTE="$PWD/yanote-analyzer/bin/yanote"
"${YANOTE}" --version
```

Если вы работаете не с текущим `HEAD`, а с опубликованным релизом, замените `build/distributions/yanote-analyzer.zip` на скачанный asset `yanote-analyzer.zip` из GitHub Releases. После распаковки launcher path остаётся тем же: `./yanote-analyzer/bin/yanote`.

## 5. Запустите `async-report`

Минимальная команда:

```bash
"${YANOTE}" async-report \
  --spec /path/to/asyncapi.yaml \
  --events /path/to/async-events.jsonl \
  --out ./out
```

Проверенный repo-пример для two-service merged evidence:

```bash
"${YANOTE}" async-report \
  --spec yanote-js/test/fixtures/asyncapi/spring-kafka-two-service.yaml \
  --events ./out/merged-two-service.events.jsonl \
  --out ./out \
  --min-coverage 100
```

Результат всегда пишется в отдельные stable async sibling-артефакты:

- `./out/yanote-async-report.json` — machine-readable async report path;
- `./out/yanote-async-report.html` — human-readable sibling async surface.

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

- `YANOTE_ASYNC_SUMMARY ...` и `YANOTE_COMBINED_SUMMARY ...` — быстрые grep-friendly строки;
- `yanote-async-report.json` / `yanote-async-report.html` — отдельная machine-facing и human-facing async family для Kafka или RabbitMQ;
- `yanote-combined-report.json` / `yanote-combined-report.html` — combined child surface с явными HTTP/async child refs;
- `build-and-test-artifacts/live-kafka-proof/`, `build-and-test-artifacts/live-rabbitmq-proof/` и `build-and-test-artifacts/combined-proof/` плюс GitHub step summary — redaction-safe строки `binding support`, `declared semantics`, `runtime semantics`, RabbitMQ `protocols=amqp`, явные report filenames, child report paths и retained companion filenames там, где они существуют, без публикации raw retained headers;
- `stderr` analyzer-а или proof-скрипта — typed причина, если путь упал fail-closed;
- для proven Kafka runtime-selection path — `runtime-selected-async-report.stderr`, `runtime-selected-yanote-async-report.json` и `runtime-selected-yanote-async-report.html` из `build-and-test-artifacts/live-kafka-proof/`, если нужно разобрать multi-message selection truth;
- для proven Kafka schema-failure path — `schema-failure-async-report.stderr`, `schema-failure-yanote-async-report.json` и `schema-failure-yanote-async-report.html` из `build-and-test-artifacts/live-kafka-proof/`.

Важно не переинтерпретировать async цифры: routing percentages remain routing-first. `channelCoveragePercent`, `operationCoveragePercent` и `messageCoveragePercent` показывают, что channel/operation/message wiring был наблюдён и сопоставлен, а combined-report показывает child statuses и report paths, но не превращает зелёный happy path в обещание полной schema-keyword coverage или blended denominator.

Payload-schema drift surfaced on the proven Kafka path, но только в тех границах, которые реально экспортирует live proof: retained invalid-payload sidecar показывает типизированный drift для той же merged Kafka evidence, а не абстрактную broker-agnostic schema validation для любых AsyncAPI runtime-ов. RabbitMQ happy path сейчас публикует AMQP truth и declared semantics без фабрикации Kafka-only companions.

Отдельная честная граница касается headers: retained headers остаются redacted support inputs, а не public proof payloads. Kafka runtime-selected sidecar публикует только redacted selectors (`declaredMessages` / `selectedMessages`) и доказывает multi-message runtime selection via retained headers, RabbitMQ proof не просит raw AMQP headers, а combined bundle ссылается на child report paths без публикации secret-bearing bodies.

## 7. Честная граница widened async surface

Эти boundary-клаузы нужно считать буквальными, а не маркетинговыми обещаниями:

- **Kafka path остаётся поддержанным и доказанным** — текущий user-facing async path по-прежнему поддерживает Kafka evidence и Kafka-oriented AsyncAPI proof.
- **RabbitMQ/AMQP — первый конкретный второй broker path, а не broker-agnostic promise** — поддержан live proof через `build-and-test-artifacts/live-rabbitmq-proof/`, `protocols=amqp` и retained AMQP child artifacts, но это не обещание для любых брокеров.
- **separate async report/gate + retained combined-report surface** — Kafka и RabbitMQ живут через `async-report`, `YANOTE_ASYNC_SUMMARY`, `yanote-async-report.json` / `yanote-async-report.html`; combined path живёт через `combined-report`, `YANOTE_COMBINED_SUMMARY`, `yanote-combined-report.json` / `yanote-combined-report.html` и явные child refs.
- **payload-schema drift surfaced on the proven Kafka path** — retained `schema-failure-*` артефакты остаются специфичными для proven Kafka path; RabbitMQ happy path не фабрикует эти Kafka-only companions.
- **routing percentages remain routing-first** — проценты покрытия по-прежнему описывают прежде всего channel/operation/message wiring и не подменяют более глубокую schema semantics surface.
- **combined surface остаётся child-attributed** — есть combined report family, но нет blended denominator, единой merge-blocking gate-метрики поверх HTTP+async и нет hosted dashboard.
- **raw retained headers и payload bodies не становятся public support surface** — retained selectors и child paths можно inspect-ить, но support intake не просит сырые headers или full payload bodies.
- **broker-agnostic promise нет** — кроме доказанных Kafka и первого RabbitMQ/AMQP path, другие брокеры и универсальная async runtime promise остаются follow-on scope.

Из этого следуют два практических запрета:

1. Не называйте текущий path «общим async analyzer для любого брокера».
2. Не трактуйте `yanote-async-report.json`, `yanote-async-report.html`, `yanote-combined-report.json`, `yanote-combined-report.html`, retained Kafka companions или RabbitMQ/combined bundles как доказательство blended HTTP+async denominator, hosted dashboard или broker-agnostic header-level validation.

## Связанные поверхности

- HTTP/OpenAPI guide: [`docs/guides/analyzer-coverage.md`](analyzer-coverage.md)
- Recorder guide для HTTP-first evidence path: [`docs/guides/recorder-spring-mvc.md`](recorder-spring-mvc.md)
- Test-tagging contract: [`docs/guides/test-tagging.md`](test-tagging.md)
- Single-service live proof: [`scripts/ci/verify-kafka-metadata-propagation.sh`](../../scripts/ci/verify-kafka-metadata-propagation.sh)
- Two-service live proof: [`scripts/ci/verify-kafka-live-proof.sh`](../../scripts/ci/verify-kafka-live-proof.sh)
- Deterministic merge helper: [`scripts/ci/merge-async-events-jsonl.mjs`](../../scripts/ci/merge-async-events-jsonl.mjs)

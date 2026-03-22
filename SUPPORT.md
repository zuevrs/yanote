# Поддержка / Support

Поддержка Yanote ведётся мейнтейнером. Это maintainer-led репозиторий, а не канал с выделенной командой поддержки.

Ответы даются по возможности и без SLA.

Если у вас воспроизводимый баг в текущей поддерживаемой поверхности, откройте issue: https://github.com/zuevrs/yanote/issues

Для HTTP/OpenAPI path приложите версию или коммит, минимальное воспроизведение и, если применимо, `events.jsonl`, `yanote-report.json` или логи analyzer/Gradle.

Для первой волны async поддержка ведётся только в таких границах:

- **Kafka-only**
- **Spring Kafka-first**
- **separate async report/gate**
- **payload-schema drift surfaced on the proven Kafka path**
- **routing percentages remain routing-first**
- **retained Kafka headers remain unverifiable**
- **broker-agnostic promise нет**

Если issue касается AsyncAPI/Kafka, `async-report`, `yanote-async-report.json` или live-proof path, приложите:

- версию или коммит;
- минимальное воспроизведение;
- описание того, какая команда или proof-script упала;
- `raw или merged async JSONL`;
- `yanote-async-report.json`;
- analyzer/proof `stderr`.

Если проблема проявляется именно как payload-schema drift на proven Kafka path, по возможности добавьте и retained sidecar artifacts из `.yanote-ci/live-kafka-proof/`:

- `runtime-selected-async-report.stderr` и `runtime-selected-yanote-async-report.json`, если issue связано с multi-message selection или retained header discriminators;
- `schema-failure-async-report.stderr`;
- `schema-failure-yanote-async-report.json`.

Если async path стартует из HTTP ingress или Gradle/CI orchestration, по возможности добавьте и связанные `events.jsonl`, `yanote-report.json` или логи Gradle/analyzer — но async intake минимумом считаются именно `raw или merged async JSONL`, `yanote-async-report.json` и analyzer/proof `stderr`. Не прикладывайте секреты, сырые payload body целиком или неотретейненные Kafka headers: для публичного разбора достаточно operation keys, schema ids, счётчиков и redacted reason text.

Если вопрос про интеграцию, документацию или вы не уверены, какой surface сейчас считается поддерживаемым, сначала сверяйтесь с [docs/README.md](docs/README.md), [docs/release-and-support.md](docs/release-and-support.md) и [docs/requirements.md](docs/requirements.md).

Для нераскрытых уязвимостей не используйте issue: следуйте [SECURITY.md](SECURITY.md) и пишите на `zzuevrs@gmail.com`.

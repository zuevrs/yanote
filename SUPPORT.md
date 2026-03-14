# Поддержка / Support

Поддержка Yanote ведётся мейнтейнером. Это maintainer-led репозиторий, а не канал с выделенной командой поддержки.

Ответы даются по возможности и без SLA.

Если у вас воспроизводимый баг в текущей поддерживаемой поверхности, откройте issue: https://github.com/zuevrs/yanote/issues

Для HTTP/OpenAPI path приложите версию или коммит, минимальное воспроизведение и, если применимо, `events.jsonl`, `yanote-report.json` или логи analyzer/Gradle.

Для первой волны async поддержка ведётся только в таких границах:

- **Kafka-only**
- **Spring Kafka-first**
- **separate async report/gate**
- **payload-schema enforcement пока нет**
- **broker-agnostic promise нет**

Если issue касается AsyncAPI/Kafka, `async-report`, `yanote-async-report.json` или live-proof path, приложите:

- версию или коммит;
- минимальное воспроизведение;
- описание того, какая команда или proof-script упала;
- `raw или merged async JSONL`;
- `yanote-async-report.json`;
- analyzer/proof `stderr`.

Если async path стартует из HTTP ingress или Gradle/CI orchestration, по возможности добавьте и связанные `events.jsonl`, `yanote-report.json` или логи Gradle/analyzer — но async intake минимумом считаются именно `raw или merged async JSONL`, `yanote-async-report.json` и analyzer/proof `stderr`.

Если вопрос про интеграцию, документацию или вы не уверены, какой surface сейчас считается поддерживаемым, сначала сверяйтесь с [docs/README.md](docs/README.md), [docs/release-and-support.md](docs/release-and-support.md) и [docs/requirements.md](docs/requirements.md).

Для нераскрытых уязвимостей не используйте issue: следуйте [SECURITY.md](SECURITY.md) и пишите на `zzuevrs@gmail.com`.

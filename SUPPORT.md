# Поддержка / Support

Поддержка Yanote ведётся мейнтейнером. Это maintainer-led репозиторий, а не канал с выделенной командой поддержки.

Ответы даются по возможности и без SLA.

Если у вас воспроизводимый баг в текущей поддерживаемой поверхности, откройте issue: https://github.com/zuevrs/yanote/issues

Для HTTP/OpenAPI path приложите версию или коммит, минимальное воспроизведение и, если применимо, `events.jsonl`, `yanote-report.json` или логи analyzer/Gradle.

Для widened async и combined support границы читаются буквально:

- **Kafka path поддержан и сохранён**
- **RabbitMQ/AMQP — первый concrete second broker path**
- **separate async report/gate + retained combined-report surface**
- **payload-schema drift surfaced on the proven Kafka path**
- **routing percentages remain routing-first**
- **combined surface остаётся child-attributed, без blended denominator**
- **broker-agnostic promise нет**

Если issue касается async или combined delivery surface, приложите версию или коммит, минимальное воспроизведение, failing command/proof-script и укажите, какой именно bundle упал:

- **Kafka async path** (`bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`) — приложите `.yanote-ci/live-kafka-proof/` или `build-and-test-artifacts/live-kafka-proof/`: `artifact-manifest.txt`, `artifact-source-paths.txt`, `async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`, `yanote-async-report.html`, а при Kafka-only drift дополнительно retained `runtime-selected-*` и `schema-failure-*` companions.
- **RabbitMQ/AMQP path** (`bash scripts/ci/verify-m015-s02-live-rabbitmq-proof.sh`) — приложите `.yanote-ci/live-rabbitmq-proof/` или `build-and-test-artifacts/live-rabbitmq-proof/`: `artifact-manifest.txt`, `artifact-source-paths.txt`, `async-report.stdout`, `async-report.stderr`, `yanote-async-report.json`, `yanote-async-report.html`, `merged-two-service.events.jsonl` и related producer/consumer logs when relevant.
- **Combined path** (`bash scripts/ci/verify-m015-s03-combined-report.sh`) — приложите `.tmp/m015-s03-combined-proof/` или `build-and-test-artifacts/combined-proof/`: `artifact-manifest.txt`, `artifact-source-paths.txt`, `combined-report.stdout`, `combined-report.stderr`, `combined-report/out/yanote-combined-report.json`, `combined-report/out/yanote-combined-report.html`. Если combined child path ссылается на failing HTTP или async child, приложите и эти child reports, но не переписывайте их в один «общий denominator».

Если async path стартует из HTTP ingress или Gradle/CI orchestration, по возможности добавьте и связанные `events.jsonl`, `yanote-report.json`, `yanote-report.html` или логи Gradle/analyzer — но intake должен оставаться surface-specific: Kafka issue → Kafka bundle, RabbitMQ issue → RabbitMQ bundle, combined issue → combined bundle.

Не прикладывайте секреты, сырые payload body целиком, raw retained Kafka/RabbitMQ headers или любые другие secret-bearing headers. Для публичного разбора достаточно operation keys, schema ids, счётчиков, manifest/source-path notes, redacted reason text и retained report paths.

Если вопрос про интеграцию, документацию или вы не уверены, какой surface сейчас считается поддерживаемым, сначала сверяйтесь с [docs/README.md](docs/README.md), [docs/release-and-support.md](docs/release-and-support.md) и [docs/requirements.md](docs/requirements.md).

Для нераскрытых уязвимостей не используйте issue: следуйте [SECURITY.md](SECURITY.md) и пишите на `zzuevrs@gmail.com`.

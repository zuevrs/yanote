# Релизы и границы поддержки Yanote

> Audience: **public boundary owner surface**. Этот документ остаётся авторитетным owner для стабильной линии, release boundaries и support expectations. Если вы открыли его как deep link и ищете общую карту документации, вернитесь в [`docs/README.md`](README.md).

Этот документ — единая публичная точка ответа на четыре вопроса: какая стабильная линия Yanote актуальна сейчас, где смотреть последний опубликованный релиз, чем текущее состояние репозитория отличается от опубликованной версии, и какие поверхности/ограничения сегодня действительно считаются поддерживаемыми.

Короткое правило: публичную версию Yanote определяют подписанные Git-теги формата `vMAJOR.MINOR.PATCH` и соответствующая страница GitHub Releases. Рабочее дерево репозитория, snapshot-маркеры и текущие analyzer version markers не являются авторитетным публичным источником версии.

## Текущая стабильная линия

Текущая публичная стабильная линия — `v1.0.x`.

Её нужно читать по релизным тегам и GitHub Releases, а не по локальному состоянию workspace. `gradle.properties` сейчас содержит `version=0.1.0-SNAPSHOT` только как рабочий маркер для repository `HEAD`: релизный workflow публикует tagged release и передаёт Gradle версию из тега через `-Pversion`, а release preflight отдельно блокирует snapshot-публикации.

Поэтому `gradle.properties` и маркер `0.1.0-SNAPSHOT` — не авторитетный источник публичной версии релиза.

## Последний стабильный релиз

Последний стабильный релиз смотрите по подписанным тегам формата `vMAJOR.MINOR.PATCH` и GitHub Releases:

- GitHub Releases: https://github.com/zuevrs/yanote/releases

Опубликованный analyzer surface этого релиза — asset `yanote-analyzer.zip`. После распаковки `./yanote-analyzer/bin/yanote --version` должен совпадать с release tag и именно этот standalone bundle задаёт публичную version truth для analyzer-а.

`yanote-js/package.json` и внутренние source-built markers в текущем repository `HEAD` по-прежнему могут показывать `0.0.0`, но это технические implementation markers, а не авторитетный источник стабильного релиза.

## Текущее состояние репозитория относительно релиза

Рабочий `HEAD` может быть впереди последнего стабильного тега. Это означает только то, что в репозитории уже есть новые коммиты — например, документационные, инфраструктурные или product-maturity изменения. Сам по себе `HEAD` не означает, что появился новый опубликованный релиз.

Пока не появился новый подписанный тег и соответствующий GitHub Release, публичной истиной остаются последняя стабильная линия `v1.0.x` и сама страница GitHub Releases. Поэтому текущий `HEAD` нельзя автоматически считать эквивалентом последнего публичного релиза.

## Стабильные поверхности

Сегодня как стабильные и публично значимые поверхности Yanote нужно читать такие слои:

- релизная линия `v1.0.x` и GitHub Releases как опубликованная change surface;
- опубликованные Java-модули из release allowlist: `yanote-core`, `yanote-recorder-spring-mvc`, `yanote-recorder-spring-kafka`, `yanote-test-tags-restassured`, `yanote-test-tags-cucumber`, `yanote-gradle-plugin`;
- Gradle plugin surface: plugin id `io.github.zuevrs.yanote.gradle`, задачи `yanoteReport` и `yanoteCheck`, плюс ограниченная extension surface вместо произвольного API;
- report contract: файл `yanote-report.json` со schema version `1.0.0` (`schemaVersion = 1.0.0`);
- проверенные recorder paths: dependency-based `yanote-recorder-spring-mvc` для Spring Boot 3.x / Spring MVC с записью HTTP evidence в `events.jsonl`, и `yanote-recorder-spring-kafka` как release-published Spring Kafka recorder adapter для Kafka evidence capture;
- analyzer delivery surface: основной путь — standalone CLI bundle `yanote-analyzer.zip` с launcher-ом `bin/yanote`; published release asset и repo-local `./gradlew distStandaloneAnalyzer` ведут к одному и тому же user-facing launcher contract, а repo-local archive contract фиксирован как `build/distributions/yanote-analyzer.zip`; stable baseline для `--spec` — локальный файл или директория, а narrow opt-in remote path ограничен single-document `http(s)` `--spec`; raw `node yanote-js/dist/yanote.cjs` seam остаётся внутренней реализацией bundle, а не tracked public entrypoint;
- CI/public summary surface: `yanote-validation-artifacts` и `build-and-test-artifacts` публикуют отдельные HTTP-vs-async owner bundles; внутри `build-and-test-artifacts` widened async/combined surface идёт тремя proof families — `live-kafka-proof/`, `live-rabbitmq-proof/`, `combined-proof/`. Они удерживают deterministic `artifact-manifest.txt` / `artifact-source-paths.txt`, sanitized `specSource`, additive deprecated-operation counts в GitHub step summaries и для async/combined path — redaction-safe строки `binding support`, `declared semantics`, `runtime semantics`, RabbitMQ `protocols=amqp`, явные report/companion filenames и combined child-report paths без raw retained-header leakage, без hosted dashboard и без blended denominator wording;
- публичный HTTP proof surface: `bash scripts/ci/run-v1-e2e.sh`, GitHub step summary и bundle `yanote-validation-artifacts`; они публикуют sibling-артефакты `yanote-report.json` / `yanote-report.html`, sanitized `specSource`, additive deprecated-operation counts, request/payload/security companion outputs и provenance `artifact-manifest.txt` / `artifact-source-paths.txt`, а clone-local rerun roots intentionally remain discoverable only через [`docs/maintainers/README.md`](maintainers/README.md);
- focused retained proofs `bash scripts/ci/verify-request-semantics.sh`, `bash scripts/ci/verify-format-media.sh` и `bash scripts/ci/verify-security-semantics.sh` остаются deep-proof surfaces за публичным summary bundle и support wording;
- observation coverage, `HTTP Payload Conformance`, `HTTP Request Conformance`, `HTTP Security Conformance`, `summary.deprecatedOperations` и HTML sibling `yanote-report.html` — разные truth surfaces: happy path на Spring MVC demo сейчас показывает `coverage.operations/status/parameters/aggregate = 100.00%`, deprecated counts и request/payload/security sidecars отдельно публикуют additive fail-closed boundaries и supported subsets;
- поддерживаемый request serialization subset публикуется буквально: `path=simple`, `query=form`, `header=simple`, `cookie=form`; повторяющиеся массивы поддерживаются только для `query=form` + `explode=true` + scalar `items`, а `content`-parameters, неподдерживаемые styles и cookie arrays не считаются supported public surface;
- поддерживаемая payload boundary публикуется буквально: JSON-first request/response payload validation, `email`-only format allowlist, most-specific declared match, `NO_DECLARED_CONTENT`, `RECORDER_OMITTED`, `captureState=omitted`, `captureReason=policy-filtered` и fail-closed `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` / `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` на retained proof path;
- поддерживаемая security boundary публикуется буквально: root inheritance, operation override, `security: []`, `{}` optional branch, OR между объектами Security Requirement, AND внутри одного объекта и truthful `apiKey` query/header/cookie subset;
- fail-closed security boundary: `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, `SEMANTIC_HTTP_UNSUPPORTED_SECURITY` публикуются через additive `httpSecurityConformance`, отдельный блок `HTTP Security Conformance`, retained `security-semantics.*` sidecars и security-токены `YANOTE_SUMMARY` `security_declared_operations`, `security_observed_operations`, `security_observed_evaluations`, `security_truths`, `primary`;
- additive request/security surfaces не меняют legacy `coverage.operations/status/parameters/aggregate` numerators;
- broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks` сейчас явно deferred и не входят в поддерживаемую публичную HTTP proof surface.

Именно в этих границах текущий HTTP path считается поддерживаемым: JSON-first request/response payload validation на Spring MVC path, additive request/payload/security retained proof artifacts и честное разделение между observation coverage и semantic conformance. Есть и widened combined-report surface, но он child-attributed: `yanote-combined-report.json` / `yanote-combined-report.html` ссылаются на отдельные HTTP и async child reports и не вводят blended HTTP+async denominator. Здесь **нет** обещания для произвольных media types, нет обещания для security scheme types вне `apiKey query/header/cookie`, нет обещания для broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks`, нет hosted dashboard surface и нет broker-agnostic async promise.

### Widened async и combined surface относительно релиза и `HEAD`

Widened user-facing async surface уже есть в текущем репозитории, но её нужно читать честно: это **source-built async + combined path** через `yanote-js` на repository `HEAD`, а не отдельная новая стабильная release line поверх `v1.0.x`. Подписанные теги и GitHub Releases по-прежнему определяют публичную release truth; widened path лишь фиксирует, что текущий `HEAD` уже несёт отдельные Kafka и RabbitMQ/AMQP async proof families плюс retained combined-report surface. Это не отменяет отдельную async analyzer/report boundary, не превращает combined-report в blended release gate и не делает текущий `HEAD` опубликованным стабильным релизом.

Эта widened surface поддерживается только в таких границах:

- **Kafka path поддержан и сохранён**
- **RabbitMQ/AMQP — первый конкретный второй broker path**
- **separate async report/gate + retained combined-report surface**
- **payload-schema drift surfaced on the proven Kafka path**
- **routing percentages remain routing-first**
- **combined surface остаётся child-attributed**
- **raw retained headers remain redacted support inputs, not public proof payloads**
- **broker-agnostic promise нет**

Поддерживаемые proof/support артефакты для этой widened surface тоже фиксированы:

- Kafka bundle: `build-and-test-artifacts/live-kafka-proof/`, `yanote-async-report.json`, `yanote-async-report.html`, retained `runtime-selected-*` и `schema-failure-*` companions;
- RabbitMQ bundle: `build-and-test-artifacts/live-rabbitmq-proof/`, `yanote-async-report.json`, `yanote-async-report.html`, `artifact-manifest.txt`, `artifact-source-paths.txt`, `async-report.stdout`, `async-report.stderr`, `protocols=amqp`;
- combined bundle: `build-and-test-artifacts/combined-proof/`, `yanote-combined-report.json`, `yanote-combined-report.html`, `combined-report.stdout`, `combined-report.stderr`, `artifact-manifest.txt`, `artifact-source-paths.txt`, explicit HTTP/async child report paths.

Практически это означает отдельные маршруты `./yanote-analyzer/bin/yanote async-report` по Kafka или RabbitMQ evidence и отдельный маршрут `./yanote-analyzer/bin/yanote combined-report` по уже-retained child reports. В published release asset и в repo-local bundle из `./gradlew distStandaloneAnalyzer` этот launcher contract одинаков. В CI widened family публикуется как `build-and-test-artifacts/live-kafka-proof/`, `build-and-test-artifacts/live-rabbitmq-proof/` и `build-and-test-artifacts/combined-proof/`; GitHub step summary и collected summaries показывают `binding support`, `declared semantics`, `runtime semantics`, RabbitMQ `protocols=amqp` и combined child refs. Это дополняет стабильную линию `v1.0.x`, но не переопределяет release truth, не обещает broker-agnostic coverage, не делает raw retained headers публично проверяемыми и не превращает combined-report в hosted dashboard или blended denominator.

Demo/example модули полезны для доказательства пути, но не входят в опубликованную Java release surface.

## Предположения по совместимости

Текущие совместимые и проверяемые baseline-ожидания такие:

- Java 21 — verified baseline для Gradle build, CI и публично описанного Java-пути;
- Node `>=20` — минимальный runtime для analyzer-а;
- Spring Boot 3.x / Spring MVC — основной и проверенный recorder path в текущей пользовательской документации;
- Java-first delivery surfaces (Maven/Gradle + Gradle plugin) — текущий основной product path.

## Ограничения

Yanote сейчас нужно воспринимать как Java-first путь recorder → `events.jsonl` → analyzer.

Границы, которые важно считать явными уже сейчас:

- first-class не-Java onboarding пока нет;
- отдельного runnable Cucumber demo в репозитории пока нет: текущий Cucumber contract проверяется тестами и документацией, а не живым demo-flow;
- analyzer version markers (`0.0.0`) полезны только как технический build marker и не должны читаться как публичная release version;
- локальный файл/директория остаются stable baseline для HTTP `--spec`; remote single-document `http(s)` `--spec` — только opt-in path, а persisted summaries/artifacts обязаны публиковать лишь sanitized provenance;
- payload validation публично поддерживается как JSON-first path на Spring MVC demo/runtime surfaces, а не как обещание универсального media-type coverage; поддерживаемый payload format allowlist сейчас intentionally `email`-only, а media selection идёт по most-specific declared match;
- security validation публично поддерживается как truthful `apiKey` query/header/cookie subset и additive fixture-backed proof path, а не как обещание для `http`, `oauth2`, `openIdConnect`, path `apiKey` или иного broader security coverage;
- examples, retained proof bundle, fallback release assets и maintainer-only workflow полезны для диагностики и сопровождения, но не равны по статусу опубликованной продуктовой поверхности;
- broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks` остаются deferred и не публикуются как поддерживаемый proof surface;
- HTTP и async surfaces по-прежнему публикуются раздельно как source-of-truth child families: сегодня есть retained combined-report surface, но нет одного blended HTTP+async denominator, нет одной merge-blocking boundary-метрики поверх обоих режимов и нет отдельного hosted dashboard surface.

## Fallback-границы

Offline fallback для recorder по-прежнему не публикуется как tracked `dist/` поверхность default branch: если dependency-based путь недоступен, используйте release assets из GitHub Releases как вторичный smoke/offline канал.

Для analyzer ситуация другая: published release asset `yanote-analyzer.zip` — это официальный public install/run artifact, а не вторичный fallback. Если нужно проверить текущий `HEAD`, соберите тот же bundle локально через `./gradlew distStandaloneAnalyzer`; user-facing launcher contract при этом остаётся тем же `./yanote-analyzer/bin/yanote`.

Эти границы не переопределяют публичную release version, не заменяют GitHub Releases и не возвращают raw `node yanote-js/dist/yanote.cjs` seam в роль пользовательского entrypoint.

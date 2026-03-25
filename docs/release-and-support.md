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

`yanote --version` и `yanote-js/package.json` сейчас показывают `0.0.0`. Это технические version markers для source-built analyzer CLI и локального repository `HEAD`, а не публичная release truth.

Поэтому `yanote --version`, `yanote-js/package.json` и текущий `0.0.0` — не авторитетный источник стабильного релиза.

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
- analyzer delivery surface: основной путь — source-built CLI из `yanote-js`, а offline fallback распространяется как release asset через GitHub Releases, а не как tracked documentation surface default branch;
- публичный HTTP proof surface: `bash scripts/ci/run-v1-e2e.sh`, который удерживает `.yanote-ci/v1-e2e/out/yanote-report.json` как happy-path artifact, рядом сохраняет additive request sidecar `.yanote-ci/v1-e2e/request-semantics.events.jsonl`, `.yanote-ci/v1-e2e/request-semantics.stdout`, `.yanote-ci/v1-e2e/request-semantics.stderr`, `.yanote-ci/v1-e2e/request-semantics-yanote-report.json`, payload sidecars `semantic-red.stdout`, `semantic-red.stderr`, `semantic-red-yanote-report.json` и fixture-backed security sidecars `security-semantics.stdout`, `security-semantics.stderr`, `security-semantics-yanote-report.json`, плюс provenance в `artifact-manifest.txt` и `artifact-source-paths.txt`;
- focused retained proofs `bash scripts/ci/verify-m011-s02-request-semantics.sh`, `bash scripts/ci/verify-m011-s03-format-media.sh` и `bash scripts/ci/verify-m012-s02-security-semantics.sh` остаются deep-proof surfaces за публичным summary bundle и support wording;
- observation coverage, `HTTP Payload Conformance`, `HTTP Request Conformance` и `HTTP Security Conformance` — разные truth surfaces: happy path на Spring MVC demo сейчас показывает `coverage.operations/status/parameters/aggregate = 100.00%`, request/payload/security sidecars отдельно публикуют fail-closed boundaries и supported subsets;
- поддерживаемый request serialization subset публикуется буквально: `path=simple`, `query=form`, `header=simple`, `cookie=form`; повторяющиеся массивы поддерживаются только для `query=form` + `explode=true` + scalar `items`, а `content`-parameters, неподдерживаемые styles и cookie arrays не считаются supported public surface;
- поддерживаемая payload boundary публикуется буквально: JSON-first request/response payload validation, `email`-only format allowlist, most-specific declared match, `NO_DECLARED_CONTENT`, `RECORDER_OMITTED`, `captureState=omitted`, `captureReason=policy-filtered` и fail-closed `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA` / `SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT` на retained proof path;
- поддерживаемая security boundary публикуется буквально: root inheritance, operation override, `security: []`, `{}` optional branch, OR между объектами Security Requirement, AND внутри одного объекта и truthful `apiKey` query/header/cookie subset;
- fail-closed security boundary: `SEMANTIC_HTTP_MISSING_SECURITY`, `SEMANTIC_HTTP_UNAVAILABLE_SECURITY`, `SEMANTIC_HTTP_UNSUPPORTED_SECURITY` публикуются через additive `httpSecurityConformance`, отдельный блок `HTTP Security Conformance`, retained `security-semantics.*` sidecars и security-токены `YANOTE_SUMMARY` `security_declared_operations`, `security_observed_operations`, `security_observed_evaluations`, `security_truths`, `primary`;
- additive request/security surfaces не меняют legacy `coverage.operations/status/parameters/aggregate` numerators;
- broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks` сейчас явно deferred и не входят в поддерживаемую публичную HTTP proof surface.

Именно в этих границах текущий HTTP path считается поддерживаемым: JSON-first request/response payload validation на Spring MVC path, additive request/payload/security retained proof artifacts и честное разделение между observation coverage и semantic conformance. Здесь **нет** обещания для произвольных media types, нет обещания для security scheme types вне `apiKey query/header/cookie`, нет обещания для broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks` и нет общего combined HTTP+async report surface.

### Первая волна async относительно релиза и `HEAD`

Первая user-facing async surface уже есть в текущем репозитории, но её нужно читать честно: это **source-built async path** через `yanote-js` на repository `HEAD`, а не отдельная новая стабильная release line поверх `v1.0.x`. Подписанные теги и GitHub Releases по-прежнему определяют публичную release truth; source-built async path просто фиксирует, что текущий `HEAD` уже несёт первую волну AsyncAPI/Kafka onboarding и proof surface. Публикация `yanote-recorder-spring-kafka` в release allowlist делает Spring Kafka recorder доступным как versioned Java dependency, но не отменяет отдельную async analyzer/report boundary и не превращает её в combined HTTP+async release surface.

Эта первая волна поддерживается только в таких границах:

- **Kafka-only**
- **Spring Kafka-first**
- **separate async report/gate**
- **payload-schema drift surfaced on the proven Kafka path**
- **routing percentages remain routing-first**
- **retained Kafka headers remain unverifiable**
- **broker-agnostic promise нет**

Поддерживаемые proof/support артефакты для этого async path тоже фиксированы:

- `raw или merged async JSONL`
- `yanote-async-report.json`
- retained `runtime-selected-async-report.stderr` и `runtime-selected-yanote-async-report.json` для proven Kafka multi-message selection truth
- analyzer/proof `stderr`
- retained `schema-failure-async-report.stderr` и `schema-failure-yanote-async-report.json` для proven Kafka payload drift

Практически это означает отдельный маршрут `node yanote-js/dist/yanote.cjs async-report` по Kafka evidence и авторитетный live-proof bundle из `bash scripts/ci/verify-m004-s03-live-kafka-proof.sh`. Зелёный bundle остаётся routing-first proof surface, retained runtime-selected sidecar показывает `selectionMode=runtime` и redacted selectors для multi-message AsyncAPI contract, а retained `schema-failure-*` sidecar показывает typed `invalid-payload` drift только для того Kafka evidence path, который уже доказан в репозитории. Это дополняет стабильную линию `v1.0.x`, но не переопределяет release truth, не обещает broker-agnostic coverage, не делает headers публично проверяемыми и не превращает текущий repository `HEAD` в опубликованный стабильный релиз.

Demo/example модули полезны для доказательства пути, но не входят в опубликованную Java release surface.

## Предположения по совместимости

Текущие совместимые и проверяемые baseline-ожидания такие:

- Java 21 — verified baseline для Gradle build, CI и публично описанного Java-пути;
- Node `>=20` — минимальный runtime для analyzer-а;
- репозиторий и dev-среда в этом репо pinned на `.nvmrc` = `22`, но это repo/dev pin, а не отдельная публичная support line;
- Spring Boot 3.x / Spring MVC — основной и проверенный recorder path в текущей пользовательской документации;
- Java-first delivery surfaces (Maven/Gradle + Gradle plugin) — текущий основной product path.

## Ограничения

Yanote сейчас нужно воспринимать как Java-first путь recorder → `events.jsonl` → analyzer.

Границы, которые важно считать явными уже сейчас:

- first-class не-Java onboarding пока нет;
- отдельного runnable Cucumber demo в репозитории пока нет: текущий Cucumber contract проверяется тестами и документацией, а не живым demo-flow;
- analyzer version markers (`0.0.0`) полезны только как технический build marker и не должны читаться как публичная release version;
- payload validation публично поддерживается как JSON-first path на Spring MVC demo/runtime surfaces, а не как обещание универсального media-type coverage; поддерживаемый payload format allowlist сейчас intentionally `email`-only, а media selection идёт по most-specific declared match;
- security validation публично поддерживается как truthful `apiKey` query/header/cookie subset и additive fixture-backed proof path, а не как обещание для `http`, `oauth2`, `openIdConnect`, path `apiKey` или иного broader security coverage;
- examples, retained proof bundle, fallback release assets и maintainer-only workflow полезны для диагностики и сопровождения, но не равны по статусу опубликованной продуктовой поверхности;
- broader OpenAPI objects `examples`, `links`, `callbacks`, `webhooks` остаются deferred и не публикуются как поддерживаемый proof surface;
- HTTP и async surfaces публикуются раздельно: сегодня нет общего combined HTTP+async report surface и нет одной общей boundary-метрики поверх обоих режимов.

## Fallback-границы

Offline fallback для recorder/analyzer не публикуется как tracked `dist/` поверхность default branch. Если dependency-based или source-built путь недоступен, используйте release assets из GitHub Releases как вторичный smoke/offline канал.

Их стоит использовать, когда обычный dependency/source-built путь недоступен в вашем контуре:

- release asset для recorder — временный fallback для закрытых сетей и быстрых smoke/offline proof;
- release asset для analyzer — вторичный offline bundle, когда нельзя выполнить `npm -C yanote-js ci && npm -C yanote-js run build`.

Эти fallback-поверхности не переопределяют публичную release version, не заменяют GitHub Releases и не подменяют основной пользовательский маршрут через опубликованные зависимости, канонические guide-level docs и обычный recorder/analyzer цикл.

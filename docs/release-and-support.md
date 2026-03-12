# Релизы и границы поддержки Yanote

> Audience: **public boundary owner surface**. Этот документ остаётся авторитетным owner для стабильной линии, release boundaries и support expectations. Если вы открыли его как deep link и ищете общую карту документации, вернитесь в [`docs/README.md`](README.md).

Этот документ — единая публичная точка ответа на четыре вопроса: какая стабильная линия Yanote актуальна сейчас, где смотреть последний опубликованный релиз, чем текущее состояние репозитория отличается от опубликованной версии, и какие поверхности/ограничения сегодня действительно считаются поддерживаемыми.

Короткое правило: публичную версию Yanote определяют подписанные Git-теги формата `vMAJOR.MINOR.PATCH` и соответствующая страница GitHub Releases. Рабочее дерево репозитория, snapshot-маркеры и текущие analyzer version markers не являются авторитетным публичным источником версии.

## Текущая стабильная линия

Текущая публичная стабильная линия — `v1.0.x`.

Её нужно читать по релизным тегам и GitHub Releases, а не по локальному состоянию workspace. `gradle.properties` сейчас содержит `version=0.1.0-SNAPSHOT` только как рабочий маркер для repository `HEAD`: релизный workflow публикует tagged release и передаёт Gradle версию из тега через `-Pversion`, а release preflight отдельно блокирует snapshot-публикации.

Поэтому `gradle.properties` и маркер `0.1.0-SNAPSHOT` — не авторитетный источник публичной версии релиза.

## Последний стабильный релиз

Последний стабильный релиз на момент обновления этого документа — `v1.0.122`.

Опубликованные изменения, release notes и release assets нужно смотреть здесь:

- Git tag: `v1.0.122`
- GitHub Releases: https://github.com/zuevrs/yanote/releases

`yanote --version`, `yanote-js/package.json` и `dist/node-analyzer/package.json` сейчас показывают `0.0.0`. Это технические version markers для source-built и bundle-варианта analyzer CLI, а не публичная release truth.

Поэтому `yanote --version`, `yanote-js/package.json`, `dist/node-analyzer/package.json` и текущий `0.0.0` — не авторитетный источник стабильного релиза.

## Текущее состояние репозитория относительно релиза

Рабочий `HEAD` может быть впереди последнего стабильного тега. Это означает только то, что в репозитории уже есть новые коммиты — например, документационные, инфраструктурные или product-maturity изменения. Сам по себе `HEAD` не означает, что появился новый опубликованный релиз.

Пока не появился новый подписанный тег и соответствующий GitHub Release, публичной истиной остаются последняя стабильная линия `v1.0.x` и последний стабильный тег `v1.0.122`. Поэтому текущий `HEAD` нельзя автоматически считать эквивалентом последнего публичного релиза.

## Стабильные поверхности

Сегодня как стабильные и публично значимые поверхности Yanote нужно читать такие слои:

- релизная линия `v1.0.x` и GitHub Releases как опубликованная change surface;
- опубликованные Java-модули из release allowlist: `yanote-core`, `yanote-recorder-spring-mvc`, `yanote-test-tags-restassured`, `yanote-test-tags-cucumber`, `yanote-gradle-plugin`;
- Gradle plugin surface: plugin id `io.github.zuevrs.yanote.gradle`, задачи `yanoteReport` и `yanoteCheck`, плюс ограниченная extension surface вместо произвольного API;
- report contract: файл `yanote-report.json` со schema version `1.0.0` (`schemaVersion = 1.0.0`);
- проверенный recorder path: dependency-based `yanote-recorder-spring-mvc` для Spring Boot 3.x / Spring MVC с записью в `events.jsonl`;
- analyzer delivery surface: основной путь — source-built CLI из `yanote-js`, а `dist/node-analyzer/` остаётся вторичным offline bundle для того же analyzer contract.

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
- examples, fallback bundles и maintainer-only workflow полезны для диагностики и сопровождения, но не равны по статусу опубликованной продуктовой поверхности.

## Fallback-границы

`dist/flatdir-recorder/` и `dist/node-analyzer/` — вторичные smoke/offline-поверхности.

Их стоит использовать, когда dependency-based или source-built путь недоступен в вашем контуре:

- `dist/flatdir-recorder/` — временный recorder fallback для закрытых сетей и быстрых smoke/offline proof;
- `dist/node-analyzer/` — вторичный offline bundle, когда нельзя выполнить `npm -C yanote-js ci && npm -C yanote-js run build`.

Эти fallback-поверхности не переопределяют публичную release version, не заменяют GitHub Releases и не подменяют основной пользовательский маршрут через опубликованные зависимости, канонические guide-level docs и обычный recorder/analyzer цикл.

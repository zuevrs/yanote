# FlatDir recorder bundle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** добавить в репозиторий `yanote` готовый “flatDir bundle” (вариант C) для быстрой офлайн‑проверки записи REST вызовов в `events.jsonl` в Spring Boot 3.x сервисе (Gradle Groovy).

**Architecture:** в этом репо добавляется папка `dist/flatdir-recorder/` с README/сниппетами/скриптом проверки и Gradle-задача, которая собирает нужные JAR’ы и копирует их в `dist/flatdir-recorder/libs/` (директория игнорируется git’ом). В целевом сервисе JAR’ы подключаются через `flatDir` + `fileTree`, а рекордер включается пропертями `yanote.recorder.*` только на время проверки.

**Tech Stack:** Gradle (Kotlin DSL в этом репо, Groovy DSL в целевом сервисе), Spring Boot 3.x, `yanote-recorder-spring-mvc`.

---

### Task 1: Добавить “dist” структуру и игноры

**Files:**
- Create: `dist/flatdir-recorder/README.md`
- Create: `dist/flatdir-recorder/snippets/build.gradle.groovy`
- Create: `dist/flatdir-recorder/snippets/run-with-recorder.md`
- Create: `dist/flatdir-recorder/verify.sh`
- Modify: `.gitignore`

**Step 1: Добавить структуру `dist/flatdir-recorder/`**

- README должен описывать:
  - как собрать bundle в этом репо
  - как скопировать `dist/flatdir-recorder/libs` в `libs/yanote` целевого сервиса
  - как включить рекордер (проперти)
  - как сделать smoke REST вызов и найти `events.jsonl`

**Step 2: Добавить `.gitignore` правила**

- Игнорировать `dist/flatdir-recorder/libs/*.jar` и `dist/flatdir-recorder/libs/**/*.jar`
- (опционально) игнорировать `events.jsonl` в корне, если появится

**Step 3: Быстрый sanity-check**

Run: `git status`
Expected: новые текстовые файлы, без JAR’ов.

---

### Task 2: Gradle-задача сборки bundle JAR’ов

**Files:**
- Modify: `build.gradle.kts`

**Step 1: Добавить задачу `distFlatdirRecorder`**

Требования:
- `dependsOn(":yanote-recorder-spring-mvc:jar", ":yanote-core:jar")`
- Копировать в `dist/flatdir-recorder/libs/`:
  - JAR `yanote-recorder-spring-mvc`
  - JAR `yanote-core`
  - runtime dependencies `:yanote-recorder-spring-mvc` (как файлы), **кроме** Spring/Boot артефактов (чтобы уменьшить риск конфликтов), например исключить группы:
    - `org.springframework`
    - `org.springframework.boot`
    - `org.apache.tomcat`
    - `jakarta.*`
- Делать output воспроизводимым: перед копированием чистить целевой каталог.

**Step 2: Запустить сборку**

Run: `./gradlew distFlatdirRecorder`
Expected: в `dist/flatdir-recorder/libs/` появились JAR’ы.

---

### Task 3: Локальная smoke-проверка на примере

**Files:**
- (нет изменений кода) использовать `examples/springmvc-service/`

**Step 1: Собрать bundle**

Run: `./gradlew distFlatdirRecorder`
Expected: JAR’ы в `dist/flatdir-recorder/libs/`.

**Step 2: Поднять demo сервис с включённым рекордером**

Run (примерно):
- `YANOTE_RECORDER_ENABLED=true`
- `YANOTE_RECORDER_EVENTS_PATH=/tmp/yanote/events.jsonl`

Expected: сервис стартует, ошибки записи не валят запросы.

**Step 3: Сделать HTTP запрос**

Run: `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:<port>/<any-endpoint>`
Expected: `200` (или ожидаемый код).

**Step 4: Проверить файл событий**

Run: `test -s /tmp/yanote/events.jsonl && echo OK`
Expected: `OK`.

---

### Task 4: Инструкция для закрытой сети (копипаст)

**Files:**
- Update: `dist/flatdir-recorder/README.md`

**Step 1: Описать команды для целевого сервиса**

- Copy bundle:
  - `cp dist/flatdir-recorder/libs/*.jar /path/to/your-service/libs/yanote/`
- `build.gradle` (Groovy) сниппет:
  - `repositories { flatDir { dirs 'libs/yanote' } }`
  - `dependencies { implementation fileTree(dir: 'libs/yanote', include: ['*.jar']) }`
- Запуск сервиса с:
  - `-Dyanote.recorder.enabled=true`
  - `-Dyanote.recorder.events-path=/data/yanote/events.jsonl`
- Проверка:
  - сделать любой REST вызов
  - убедиться, что `events.jsonl` создался/растёт


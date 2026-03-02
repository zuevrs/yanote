## FlatDir bundle: `yanote-recorder-spring-mvc`

Самый быстрый офлайн-способ подключить `yanote-recorder-spring-mvc` к вашему Spring Boot 3.x сервису и убедиться, что он пишет `events.jsonl` при REST вызовах — без публикации в репозитории артефактов.

> **Важно:** это **временный тестовый вариант** (smoke-проверка). Для долгосрочной интеграции предпочтительнее внутренняя публикация артефактов (Nexus/Artifactory) или `mavenLocal()`.

### 1) Собрать bundle в этом репо

В корне `yanote`:

```bash
./gradlew distFlatdirRecorder
```

После этого JAR’ы будут лежать здесь:

- `dist/flatdir-recorder/libs/`

### 2) Скопировать JAR’ы в ваш сервис

В вашем сервисе создайте папку, например `libs/yanote/`, и скопируйте туда bundle:

```bash
mkdir -p libs/yanote
cp /path/to/yanote/dist/flatdir-recorder/libs/*.jar libs/yanote/
```

### 3) Подключить JAR’ы в `build.gradle` (Groovy)

Готовый сниппет: `dist/flatdir-recorder/snippets/build.gradle.groovy`

Минимально:

```groovy
repositories {
  flatDir { dirs 'libs/yanote' }
}

dependencies {
  implementation fileTree(dir: 'libs/yanote', include: ['*.jar'])
}
```

### 4) Включить запись и указать путь к `events.jsonl`

Рекордер **выключен по умолчанию**, поэтому для проверки включайте его явно.

Вариант A: через системные свойства JVM (подходит почти везде):

```bash
java \
  -Dyanote.recorder.enabled=true \
  -Dyanote.recorder.events-path=/data/yanote/events.jsonl \
  -jar build/libs/<your-service>.jar
```

Вариант B: через env (Spring Boot relaxed binding):

```bash
export YANOTE_RECORDER_ENABLED=true
export YANOTE_RECORDER_EVENTS_PATH=/data/yanote/events.jsonl
```

### 5) Smoke-проверка (любой REST вызов)

Сделайте любой HTTP вызов к сервису (пример):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "http://localhost:8080/any-endpoint"
```

Проверьте, что файл появился и не пустой:

```bash
test -s /data/yanote/events.jsonl && echo "OK: events.jsonl is not empty"
```

Если хотите автоматизировать — используйте `dist/flatdir-recorder/verify.sh`.

---

## Дальше: посчитать coverage (OpenAPI/AsyncAPI) по `events.jsonl`

После того, как `events.jsonl` появился и пополняется, можно запустить Node analyzer и получить `yanote-report.json`.

- Bundle/инструкция: `dist/node-analyzer/README.md`


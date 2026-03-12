## FlatDir fallback bundle: `yanote-recorder-spring-mvc`

> Audience: **offline/fallback leaf**. Если вы открыли этот bundle напрямую, сначала вернитесь в [`dist/README.md`](../README.md) для owner map fallback-поверхностей, а затем — в канонический recorder guide [`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md), который этот bundle не заменяет.

Это `flatDir`-bundle для **smoke/offline-only fallback**: используйте его только тогда, когда нужно быстро доказать запись `events.jsonl` в закрытой сети, а публикация в Maven-репозиторий или `mavenLocal()` недоступна.

> **Рекомендуемый путь:** dependency-based интеграция описана в каноническом гайде [`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md). Этот bundle не должен быть основной историей продукта и не заменяет нормальную публикацию артефактов.

### Когда этот fallback всё ещё полезен

- нужно сделать быстрый smoke-прогон в закрытой сети без доступа к репозиторию артефактов;
- нужно временно положить JAR'ы рядом с сервисом и убедиться, что рекордер пишет `events.jsonl`;
- нужно провести короткую offline-диагностику перед переходом на dependency-based подключение.

Если у вас доступен обычный dependency-based setup, возвращайтесь к [`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md).

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

После smoke/offline proof вернитесь к каноническому dependency-based пути: [`docs/guides/recorder-spring-mvc.md`](../../docs/guides/recorder-spring-mvc.md).

---

## Дальше: посчитать coverage (OpenAPI/AsyncAPI) по `events.jsonl`

После того, как `events.jsonl` появился и пополняется, можно запустить Node analyzer и получить `yanote-report.json`.

- Bundle/инструкция: `dist/node-analyzer/README.md`

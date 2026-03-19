# Канонический путь: Spring MVC рекордер через зависимость

Это основной и проверенный путь для Spring Boot 3.x сервиса: подключайте `yanote-recorder-spring-mvc` как обычную зависимость из `mavenLocal()` или внутреннего Maven-репозитория. Если нормальная публикация артефактов недоступна и нужен только временный smoke/offline-вариант, используйте release assets из GitHub Releases; текущие границы этого fallback описаны в [`docs/release-and-support.md`](../release-and-support.md).

## 1. Подключите модуль как зависимость

Для локальной smoke-проверки можно взять артефакт из `mavenLocal()`; в команде вместо этого обычно указывают Nexus/Artifactory.

```kotlin
repositories {
    mavenLocal()
    mavenCentral()
}

dependencies {
    implementation("io.github.zuevrs:yanote-recorder-spring-mvc:<version>")
}
```

Дальше включите рекордер **явно**. Канонические свойства такие:

```properties
yanote.recorder.enabled=true
yanote.recorder.events-path=/data/yanote/events.jsonl
yanote.recorder.service-name=orders-service
```

- `yanote.recorder.enabled` — обязателен; без него стартер ничего не пишет.
- `yanote.recorder.events-path` — обязателен на практике; можно оставить дефолт `events.jsonl`, но для локалки, контейнера и CI лучше задавать явный writable/exportable путь.
- `yanote.recorder.service-name` — опционален; помогает понять, какой сервис записал событие.

Эквивалент через env для Spring Boot relaxed binding:

```bash
export YANOTE_RECORDER_ENABLED=true
export YANOTE_RECORDER_EVENTS_PATH=/data/yanote/events.jsonl
export YANOTE_RECORDER_SERVICE_NAME=orders-service
```

## 2. Сразу выберите writable/exportable путь для `events.jsonl`

Рекордер пишет туда, куда указывает `yanote.recorder.events-path`, поэтому путь должен быть одновременно:

- writable для процесса сервиса;
- удобным для чтения после прогона;
- экспортируемым как артефакт в контейнере или CI.

Практичные варианты:

- **Локально:** `${PWD}/.yanote/events.jsonl` или `/tmp/yanote/events.jsonl`
- **Контейнер / docker compose:** `/data/yanote/events.jsonl` внутри volume/bind mount
- **CI:** `${CI_PROJECT_DIR}/artifacts/yanote/events.jsonl` или другой каталог, который вы потом сохраняете как артефакт

Перед стартом создайте директорию и экспортируйте путь:

```bash
export YANOTE_EVENTS_PATH="${PWD}/.yanote/events.jsonl"
mkdir -p "$(dirname "$YANOTE_EVENTS_PATH")"
```

Потом подставьте его в конфиг сервиса, например:

```properties
yanote.recorder.enabled=true
yanote.recorder.events-path=${YANOTE_EVENTS_PATH}
yanote.recorder.service-name=orders-service
```

## 3. Доказательство записи: запрос → `test -s` → просмотр JSONL

Не переходите к анализатору, пока не доказали базовый контракт записи.

1. Запустите сервис с включённым рекордером.
2. Сделайте реальный HTTP-запрос.
3. Проверьте, что `events.jsonl` создан и не пустой.
4. Посмотрите первую JSONL-строку и убедитесь, что в ней есть нужные поля.

Пример:

```bash
curl --fail --silent --show-error "http://localhost:8080/orders/42?expand=true" >/tmp/yanote-response.json

test -s "$YANOTE_EVENTS_PATH" && echo "OK: events.jsonl is not empty"
head -n 1 "$YANOTE_EVENTS_PATH"
```

Ожидайте JSONL-строку такого вида:

```json
{"kind":"http","method":"GET","route":"/orders/{orderId}","status":200,"service":"orders-service","instance":null,"error":false,"test.run_id":null,"test.suite":null}
```

Быстрый осмотр только ключевых полей:

```bash
python3 - <<'PY'
import json, os, pathlib
path = pathlib.Path(os.environ["YANOTE_EVENTS_PATH"])
line = next(raw for raw in path.read_text(encoding="utf-8").splitlines() if raw.strip())
record = json.loads(line)
print({key: record.get(key) for key in ("method", "route", "status", "service", "test.run_id", "test.suite")})
PY
```

Перед анализом убедитесь, что значения выглядят правдоподобно для вашего прогона:

- `method` — фактический HTTP-метод
- `route` — шаблон маршрута, а не конкретный `/orders/42`
- `status` — HTTP-статус ответа
- `service` — ваш `yanote.recorder.service-name` или `null`
- `test.run_id` и `test.suite` — либо фактические метаданные теста, либо `null`, если заголовков не было

Если хотите прогнать ровно тот путь, который уже проверен в репозитории, используйте:

```bash
bash scripts/docs/verify-s01-recorder-path.sh
```

## 4. Коротко о метаданных тестов

Рекордер читает два HTTP-заголовка:

- `X-Test-Run-Id` → поле `test.run_id`
- `X-Test-Suite` → поле `test.suite`

Если заголовки не пришли, рекордер всё равно пишет ключи `test.run_id` и `test.suite`, но со значением `null`. Это нормальный базовый сценарий для ручного `curl` или сервиса без тестовых тегов.

Полный текущий contract RestAssured/Cucumber, различие между demo/env bridge `YANOTE_SUITE` и общей suite surface `yanote.suite`, а также путь от `test.run_id`/`test.suite` до `coverage.perOperation[].suites` описаны в [`docs/guides/test-tagging.md`](test-tagging.md).

Для базового recorder proof здесь достаточно помнить:

- `X-Test-Run-Id` → `test.run_id`
- `X-Test-Suite` → `test.suite`
- если заголовки не пришли, оба поля останутся `null`

Этого достаточно, чтобы увидеть заполненные `test.run_id`/`test.suite` в `events.jsonl`; более глубокая интерпретация handoff и report-level suites вынесена в канонический tagging guide.

## Связанные поверхности

- Канонический test-tagging contract: [`docs/guides/test-tagging.md`](test-tagging.md)
- Runnable пример сервиса: [`examples/springmvc-service/README.md`](../../examples/springmvc-service/README.md)
- Пример текущего RestAssured handoff: [`examples/tests-restassured/README.md`](../../examples/tests-restassured/README.md)
- Smoke/offline fallback через release assets: [`docs/release-and-support.md`](../release-and-support.md)

## Run with recorder enabled (examples)

### JVM system properties

```bash
java \
  -Dyanote.recorder.enabled=true \
  -Dyanote.recorder.events-path=/data/yanote/events.jsonl \
  -Dyanote.recorder.service-name=my-service \
  -jar build/libs/<your-service>.jar
```

### Spring Boot env vars (relaxed binding)

```bash
export YANOTE_RECORDER_ENABLED=true
export YANOTE_RECORDER_EVENTS_PATH=/data/yanote/events.jsonl
export YANOTE_RECORDER_SERVICE_NAME=my-service
```

### Docker example (service container)

```bash
docker run --rm \
  -e YANOTE_RECORDER_ENABLED=true \
  -e YANOTE_RECORDER_EVENTS_PATH=/data/yanote/events.jsonl \
  -v "$(pwd)/yanote-data:/data/yanote" \
  -p 8080:8080 \
  <your-image>
```


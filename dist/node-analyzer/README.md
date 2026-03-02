## Node analyzer bundle: coverage report

Цель: иметь быстрый офлайн‑способ запустить расчёт покрытия по **OpenAPI/AsyncAPI** и `events.jsonl`.

Этот bundle использует Node.js (LTS) и включает:

- `bin/yanote.cjs` — CLI
- `node_modules/` — production зависимости (чтобы не делать `npm install` в целевом контуре)

### 1) Собрать analyzer bundle в этом репо

В корне `yanote`:

```bash
./gradlew distNodeAnalyzer
```

После этого файл будет лежать здесь:

- `dist/node-analyzer/bin/yanote.cjs`
- `dist/node-analyzer/node_modules/`

### 2) Скопировать analyzer bundle в ваш контур

Скопируйте **всю папку** `dist/node-analyzer/` в ваш контур и запускайте `bin/yanote.cjs`.

### 3) Запустить анализ покрытия

```bash
node dist/node-analyzer/bin/yanote.cjs report \
  --spec /path/to/openapi-or-spec-dir \
  --events /path/to/events.jsonl \
  --out /path/to/out \
  --exclude /health
```

Результат:

- `/path/to/out/yanote-report.json`


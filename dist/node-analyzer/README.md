## Node analyzer bundle: offline fallback

Канонический путь анализа для репозитория описан в [`docs/guides/analyzer-coverage.md`](../../docs/guides/analyzer-coverage.md): сначала source-built `yanote-js`, затем `Summary` / `YANOTE_SUMMARY`, затем `yanote-report.json`.

`dist/node-analyzer/` нужен только как offline fallback, когда в вашем контуре нельзя выполнить:

```bash
npm -C yanote-js ci
npm -C yanote-js run build
```

Командная форма и структура отчёта у bundle те же, что и у source-built path.

Этот bundle использует Node.js (LTS) и включает:

- `bin/yanote.cjs` — CLI
- `node_modules/` — production зависимости (чтобы не делать `npm install` в целевом контуре)

### 1) Собрать analyzer bundle в этом репо

В корне `yanote`:

```bash
./gradlew distNodeAnalyzer
```

После этого bundle лежит здесь:

- `dist/node-analyzer/bin/yanote.cjs`
- `dist/node-analyzer/node_modules/`

### 2) Скопировать analyzer bundle в ваш контур

Скопируйте **всю папку** `dist/node-analyzer/` в ваш контур и запускайте `bin/yanote.cjs`.

### 3) Запустить анализ покрытия

```bash
node dist/node-analyzer/bin/yanote.cjs report \
  --spec /path/to/openapi-or-spec-dir \
  --events /path/to/events.jsonl \
  --out /path/to/out
```

Результат и сигналы:

- `/path/to/out/yanote-report.json`
- stdout с `Summary`
- финальная строка `YANOTE_SUMMARY ...`
- при fail-closed ошибке — `stderr` с `YANOTE_ERROR ...`

Если включаете `--exclude`, используйте его только для route-ов, которые реально объявлены в spec и которые вы сознательно хотите исключить. Старое `--exclude /health` не является каноническим примером для текущего demo-path: в demo OpenAPI `/health` не объявлен, поэтому такой флаг даёт только `governance.exclusions.unmatchedRules`, а не полезный coverage signal.

За интерпретацией полей `operations`, `status`, `parameters`, `aggregate`, `coverage.perOperation[]`, `diagnostics`, `governance`, а также за примером gate-failure с сохранённым отчётом возвращайтесь к [`docs/guides/analyzer-coverage.md`](../../docs/guides/analyzer-coverage.md).

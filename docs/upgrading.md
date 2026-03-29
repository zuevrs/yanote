# Обновление / Upgrading

Этот файл — короткий upgrade rail для пользователей и интеграторов Yanote.

## Перед обновлением

1. Определите, обновляетесь ли вы между **опубликованными релизами** или работаете от `HEAD`.
2. Если нужен стабильный поддерживаемый путь, ориентируйтесь на signed tags `vMAJOR.MINOR.PATCH` и GitHub Releases.
3. Перед boundary-affecting upgrade проверьте:
   - [release-and-support.md](release-and-support.md)
   - [support-matrix.md](support-matrix.md)
   - [compatibility.md](compatibility.md)
   - [deprecations.md](deprecations.md)
   - [CHANGELOG.md](../CHANGELOG.md)

## Upgrade checklist

### Recorder / Java modules

- проверьте target release tag;
- обновите dependency coordinates до нужной версии;
- убедитесь, что runtime остаётся в verified baseline (Java 21, поддерживаемый Spring path);
- прогоните свой recorder → `events.jsonl` smoke path.

### Analyzer bundle

- скачайте соответствующий release asset `yanote-analyzer.zip`;
- проверьте `./yanote-analyzer/bin/yanote --version`;
- прогоните `report` на известном fixture/spec pair и сравните ожидаемые JSON/HTML outputs.

### Async / combined path

- читайте upgrade impact особенно внимательно: async surface intentionally narrow;
- не предполагайте broker-agnostic guarantees, если они прямо не появились в release notes;
- при boundary changes сверяйте `support-matrix.md` и `artifact-contracts.md`.

## Если вы работаете от `HEAD`

Текущий repository `HEAD` может содержать новые docs, infrastructure или source-built features без нового опубликованного релиза. Это удобно для проверки, но не заменяет release truth.

Для source-built analyzer path используйте:

```bash
./gradlew distStandaloneAnalyzer
```

и затем тот же launcher contract:

```bash
./yanote-analyzer/bin/yanote --version
```

## Где искать migration notes

- GitHub Releases
- [CHANGELOG.md](../CHANGELOG.md)
- [deprecations.md](deprecations.md)
- release-specific notes, если change затрагивает supported boundary или artifact contracts

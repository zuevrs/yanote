# Вклад / Contributing

Yanote остаётся **maintainer-led** проектом с узким продуктовым фокусом. Мы приветствуем вклад, который делает поддерживаемую поверхность яснее, надёжнее и проще в использовании, но не расширяет scope случайно.

Исправления документации и узкие bugfix PR приветствуются.

## С чего начать

Перед предложением изменений сверяйтесь с:

- [README.md](README.md) — product-first вход в проект;
- [docs/README.md](docs/README.md) — карта пользовательской документации;
- [docs/release-and-support.md](docs/release-and-support.md) — текущие release/support boundaries;
- [docs/requirements.md](docs/requirements.md) — канонический inventory требований и текущих scope boundaries;
- [SUPPORT.md](SUPPORT.md) — публичный intake для bug/integration/docs вопросов;
- [SECURITY.md](SECURITY.md) — private security-маршрут;
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — ожидания по взаимодействию.

## Какой канал использовать

- **Воспроизводимый дефект в поддерживаемой поверхности** → issue template `Bug report`
- **Вопрос по интеграции, документации или supported boundary** → `Integration guidance`
- **Новая возможность или расширение product surface** → `Feature request`
- **Нераскрытая уязвимость** → только [SECURITY.md](SECURITY.md)

Если изменение затрагивает продуктовые границы, новые поверхности, release/CI контракт или заметно расширяет scope, сначала откройте обсуждение в issue: https://github.com/zuevrs/yanote/issues

Большие изменения начинайте с обсуждения до подготовки крупного PR.

## Какие вклады обычно уместны

Обычно хорошо заходят:

- документационные исправления и улучшение навигации;
- узкие bugfix-PR без расширения обещаний проекта;
- улучшения verification / release / artifact surfaces, которые делают текущую поддерживаемую поверхность более честной и предсказуемой;
- аккуратные product-surface предложения с минимальным воспроизведением и явным описанием trade-offs.

## Что считается boundary-changing change

К changes, которые требуют предварительного обсуждения, относятся:

- новая поддерживаемая recorder/analyzer/report surface;
- изменение release/support boundary;
- расширение compatibility promises;
- изменение machine-facing artifact contract;
- расширение CI/release/public proof semantics;
- заметная реструктуризация модулей или entrypoints.

## Локальная проверка перед PR

Минимум — прогоните **релевантные** проверки для затронутой поверхности и приложите команды/результаты в PR.

Часто полезные команды:

```bash
./gradlew test distStandaloneAnalyzer
npm -C yanote-js test
bash scripts/docs/verify-short-docs.sh
bash scripts/docs/verify-navigation.sh
bash scripts/docs/verify-public-surface.sh
bash scripts/docs/verify-entry-paths.sh
```

Не нужно гонять всё подряд ради маленькой правки документации, но нельзя и ограничиваться фразой «должно работать». Если изменение меняет public docs/support/release boundary, синхронизируйте эти файлы явно.

## Ожидания к PR

В PR:

- держите scope узким;
- явно указывайте, что меняется и что сознательно **не** меняется;
- приводите команды проверки и краткий результат;
- синхронизируйте docs, если меняется публичная поверхность;
- не добавляйте roadmap/SLA/community-governance обещаний без явного maintainer-решения.

Большие изменения лучше готовить серией узких PR или после предварительного issue/discussion.

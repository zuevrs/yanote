# Fallback bundles / dist

> Audience: **offline/fallback-only surface**. Если вы просто проходите первый onboarding, не начинайте onboarding с `dist/`; сначала вернитесь в [`docs/README.md`](../docs/README.md) и пройдите канонические guide-level маршруты.

`dist/` хранит собранные fallback bundles для закрытых или offline-контуров. Это вспомогательная поверхность для smoke/diagnostic сценариев, а не основной продуктовый вход.

## Сначала канонический путь

- [`../docs/README.md`](../docs/README.md) — owner map всей пользовательской документации.
- [`../docs/guides/recorder-spring-mvc.md`](../docs/guides/recorder-spring-mvc.md) — dependency-based recorder setup и проверенный путь до `events.jsonl`.
- [`../docs/guides/analyzer-coverage.md`](../docs/guides/analyzer-coverage.md) — source-built analyzer path, `Summary`, `YANOTE_SUMMARY` и `yanote-report.json`.

Сначала пройдите эти surfaces. Только если нужен smoke/offline proof без обычного dependency-based или source-built setup, спускайтесь в bundle-level docs ниже.

## Что владеет эта директория

- [`flatdir-recorder/README.md`](flatdir-recorder/README.md) — offline fallback для Spring MVC recorder bundle.
- [`node-analyzer/README.md`](node-analyzer/README.md) — offline fallback для Node analyzer bundle.

## Когда использовать

Оставайтесь в `dist/`, если вам нужно доказать запись `events.jsonl` или запуск analyzer в закрытой сети без обычной публикации/сборки. После smoke-подтверждения возвращайтесь в [`../docs/README.md`](../docs/README.md) и канонические гайды выше.

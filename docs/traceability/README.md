# Traceability / Reference map

> Audience: **reference-only surface**. Если вам нужен основной пользовательский маршрут, вернитесь в [`docs/README.md`](../README.md), а за каноническим inventory требований — в [`docs/requirements.md`](../requirements.md).

Эта директория хранит traceability snapshots и schema-level reference, которые связывают требования с тестами и проверочными командами. Это supporting surface, а не самостоятельный onboarding path.

## Куда вернуться за owner map

- [`../README.md`](../README.md) — карта пользовательской документации и точка возврата для secondary reference surfaces.
- [`../requirements.md`](../requirements.md) — канонический inventory требований, к которому привязаны traceability snapshots.

## Что владеет эта директория

- [`v1-requirements-tests.md`](v1-requirements-tests.md) — читаемая матрица requirement → tests → verification commands.
- [`v1-requirements-tests.json`](v1-requirements-tests.json) — machine-readable traceability map.
- [`schema.v1.json`](schema.v1.json) — schema для traceability snapshot формата.

## Когда использовать

Оставайтесь здесь, если нужно проверить покрытие требований тестами, объяснить происхождение verification-команд или сверить snapshot со schema. Для общего понимания продукта и guide-level navigation возвращайтесь в [`docs/README.md`](../README.md).

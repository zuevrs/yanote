# Депрекации / Deprecations

Yanote предпочитает менять публичную поверхность предсказуемо, но без искусственно раздутой policy-heavy бюрократии.

## Что считается deprecation-worthy

Явной депрекации заслуживают изменения, которые затрагивают:

- public CLI command behavior;
- machine-facing report fields / semantics;
- supported recorder/analyzer entrypoints;
- documented compatibility promises;
- public docs routes, которые пользователи реально используют как canonical paths.

## Что может меняться без formal deprecation rail

Без отдельной deprecation ceremony могут меняться:

- maintainer-only docs и rerun maps;
- implementation seams вроде `yanote-js` internals;
- internal verification/proof plumbing, если это не меняет public contract;
- historical planning docs.

## Deprecation process

Когда Yanote депрекейтит публичную поверхность, ожидается такой минимум:

1. change отмечен в release notes и/или [CHANGELOG.md](../CHANGELOG.md);
2. документирован recommended replacement path;
3. если change затрагивает upgrade path, он отражён в [upgrading.md](upgrading.md);
4. если change затрагивает support boundary, он синхронизирован с [release-and-support.md](release-and-support.md) и [support-matrix.md](support-matrix.md).

## Time window policy

Yanote **не обещает фиксированное число релизов** для каждой deprecation по умолчанию. Это сознательный выбор small maintainer-led проекта.

Вместо формального N-release rule проект обещает другое:

- не убирать публичную поверхность молча;
- не маскировать breaking change под незаметный wording tweak;
- давать replacement path, когда это практически возможно.

## Strongest-care surfaces

Самую аккуратную deprecation discipline получают:

- `yanote-report.json` / `yanote-async-report.json` / `yanote-combined-report.json` semantics;
- public analyzer launcher contract `./yanote-analyzer/bin/yanote`;
- documented supported surfaces из `support-matrix.md`.

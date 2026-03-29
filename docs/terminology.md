# Термины / Terminology

Этот словарь фиксирует несколько слов, которые в Yanote должны значить одно и то же во всех public-facing docs.

## Core product terms

- **Recorder** — runtime component, который пишет evidence в `events.jsonl`.
- **Analyzer** — engine/CLI, который читает spec + evidence и строит отчёты.
- **Standalone analyzer bundle** — опубликованный artifact `yanote-analyzer.zip` с launcher-ом `bin/yanote`.
- **Report** — HTTP coverage output pair `yanote-report.json` + `yanote-report.html`.
- **Async report** — async coverage output pair `yanote-async-report.json` + `yanote-async-report.html`.
- **Combined report** — child-attributed aggregate `yanote-combined-report.json` + `yanote-combined-report.html`.

## Boundary terms

- **Supported surface** — то, что прямо входит в текущую публичную границу и имеет verification path.
- **Narrow supported surface** — поддержанная, но явно ограниченная поверхность.
- **Deferred** — сознательно отложенная поверхность; проект её не обещает сегодня.
- **Internal seam** — существующий в repo технический путь, который не является public entrypoint.
- **Maintainer-only** — docs or workflows intended for ownership, reruns, diagnostics, and local stewardship.

## Delivery and evidence terms

- **Evidence** — captured runtime inputs (`events.jsonl`, merged async JSONL и related retained proof inputs).
- **Validation artifacts** — CI-delivered HTTP artifact family (`yanote-validation-artifacts`).
- **Proof bundles** — deterministic retained bundles вроде `live-kafka-proof/`, `live-rabbitmq-proof/`, `combined-proof/`.
- **Provenance artifacts** — `artifact-manifest.txt`, `artifact-source-paths.txt` и related source breadcrumb files.

## Versioning terms

- **Release truth** — signed tag `vMAJOR.MINOR.PATCH` + GitHub Release.
- **Repository HEAD** — текущий source state, который может быть впереди последнего релиза.
- **Implementation marker** — internal version marker вроде `0.1.0-SNAPSHOT` или `0.0.0`, который не равен public release version.

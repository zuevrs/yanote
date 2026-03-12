# Локальный workflow для `AGENTS.md`

> Audience: **maintainer-only leaf**. This page owns the local `AGENTS.md` handling rules. For the maintainer workflow map and the rest of this secondary surface, return to [`docs/maintainers/README.md`](README.md).

Этот leaf описывает только правила обращения с локальным `AGENTS.md` в текущем clone. Он не публикует содержимое самого файла и не заменяет maintainer map в `docs/maintainers/README.md`.

## Где должен жить файл

Реальный файл живёт в корне репозитория как `AGENTS.md`. Он остаётся local-only для каждого clone и не должен попадать в tracked state.

## Как держать его вне индекса

Игнор-правило хранится не в tracked `.gitignore`, а в repo-local admin exclude path, который нужно получать через `git rev-parse --git-path info/exclude`.

Рекомендуемый паттерн — строго anchored `/AGENTS.md`, чтобы правило относилось только к корневому файлу.

```bash
exclude_path="$(git rev-parse --git-path info/exclude)"
grep -qxF '/AGENTS.md' "$exclude_path" || printf '\n/AGENTS.md\n' >> "$exclude_path"
```

## Как проверить локальное состояние

После добавления правила проверьте, что Git действительно видит root `AGENTS.md` как ignored, а не как tracked файл:

```bash
git check-ignore -v AGENTS.md
git status --ignored --short AGENTS.md
git ls-files | rg '(^|/)AGENTS\.md$'
```

Ожидаемый результат:

- `git check-ignore -v AGENTS.md` показывает match из `info/exclude` для `/AGENTS.md`
- `git status --ignored --short AGENTS.md` возвращает `!! AGENTS.md`
- `git ls-files` не возвращает `AGENTS.md`

## Граница содержимого

Этот tracked doc объясняет только handling rules. В него нельзя публиковать секреты, private prompt content, local environment notes или personal workflow notes.

То же ограничение действует для commit messages, issue-комментариев, task summaries и любых других tracked repo surfaces: не копируйте туда содержимое локального `AGENTS.md` и не превращайте этот leaf в dump приватных инструкций.

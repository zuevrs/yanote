# Phase 1: Recorder Correctness Baseline - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Фаза закрывает корректность записи HTTP-событий и сопоставления маршрутов для Spring MVC recorder, чтобы события стабильно матчились с OpenAPI-операциями и не ломали обработку запросов.  
Новые продуктовые возможности (новые интеграции, новые форматы спецификаций, оптимизации для больших объёмов) в эту фазу не входят.

</domain>

<decisions>
## Implementation Decisions

### Event recording boundary
- Событие должно фиксироваться как для успешного, так и для ошибочного request path.
- Для каждого записанного события обязательны корректные `method` и `route`; `status` и `error` фиксируются максимально точно для текущего жизненного цикла запроса.
- Инструментация остаётся fail-open: проблемы телеметрии не должны ломать response flow приложения.

### Route identity policy
- Приоритетный источник route - `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` (как `PathPattern`, так и `String`).
- Если template-route недоступен, используется fallback к URI запроса с предсказуемой нормализацией, чтобы минимизировать ложные несовпадения.
- В этой фазе не вводится новая модель ключей операций: сохраняем совместимость с текущим OpenAPI matching pipeline.

### Test metadata contract
- Контракт заголовков `X-Test-Run-Id` и `X-Test-Suite` сохраняется без изменений.
- Отсутствие заголовков не должно приводить к ошибке запроса; такие события допустимы и фиксируются как есть.
- В фазе не добавляются новые обязательные тестовые заголовки.

### Backward compatibility and safety defaults
- JSONL-формат событий остаётся обратно совместимым с текущим анализатором и тестовыми фикстурами.
- Рекордер по-прежнему включается только явной настройкой (`yanote.recorder.enabled=true`).
- Ошибки записи логируются на уровне warning; пользовательский HTTP-контракт не меняется.

### Claude's Discretion
- Конкретный способ фиксации exception-path (порядок `doFilter`, `try/finally`, обработка статуса при исключениях).
- Детали нормализации fallback-route (edge cases по слешам/пустым сегментам).
- Точное распределение новых тестов между unit и Spring integration слоями.

</decisions>

<specifics>
## Specific Ideas

- Опорный критерий фазы: события из рекордера должны давать тот же operation identity, который ожидает OpenAPI покрытие.
- Приоритет на предсказуемость и воспроизводимость в CI, а не на расширение функциональности.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HttpEventRecordingFilter` (`yanote-recorder-spring-mvc`): основной integration point для исправления boundary поведения записи.
- `RouteTemplateResolver` (`yanote-recorder-spring-mvc`): текущий источник template-route, который можно усилить тестами и нормализацией.
- `EventJsonlWriter` и `HttpEvent` (`yanote-core`): существующий контракт и формат события, который нужно сохранить совместимым.
- Тестовые заготовки `RecorderWritesJsonlTest`, `RecorderIoFailureDoesNotBreakRequestTest`, `RecorderAutoConfigurationTest`: готовая база regression-набора.

### Established Patterns
- Recorder disabled-by-default через `@ConditionalOnProperty` - это закреплённое поведение.
- Fail-open подход в рекордере (ошибка записи не влияет на ответ) - сохраняется как обязательный инвариант.
- Проверка поведения через Spring Boot + MockMvc интеграционные тесты - текущий стандарт для модуля.

### Integration Points
- Автоконфигурация стартера: `YanoteRecorderAutoConfiguration`.
- Контракт тестовых заголовков приходит из `yanote-test-tags-restassured` и `yanote-test-tags-cucumber`.
- Совместимость события проверяется downstream-анализатором в `yanote-js` (чтение JSONL и coverage matching).

</code_context>

<deferred>
## Deferred Ideas

- Оптимизации производительности записи и конкурентной синхронизации writer - Phase 2 (RELY-02).
- Масштабирование чтения/анализа больших файлов событий - Phase 3 (RELY-03).
- Ужесточение политики обязательных тестовых метаданных (строгая фильтрация не-тестового трафика) - отдельное решение после стабилизации baseline.

</deferred>

---

*Phase: 01-recorder-correctness-baseline*
*Context gathered: 2026-03-04*

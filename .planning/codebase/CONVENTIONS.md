# Coding Conventions

## Scope and stack
- Monorepo with Java and TypeScript code.
- Java modules are Gradle subprojects declared in `settings.gradle.kts`.
- TypeScript CLI lives in `yanote-js/` with build/test scripts in `yanote-js/package.json`.

## Java style and structure
- Package naming is lowercase and domain-based, e.g. `dev.yanote.core.events` in `yanote-core/src/main/java/dev/yanote/core/events/EventJsonlWriter.java`.
- Classes that should not be extended are marked `final`, e.g. `EventJsonlWriter` and `OpenApiLoader`.
- Immutable domain data is modeled with Java `record`, e.g. `HttpEvent` and `OperationKey`.
- Constants use `private static final` with upper snake case, e.g. `RUN_ID_HEADER` in `yanote-recorder-spring-mvc/src/main/java/dev/yanote/recorder/springmvc/HttpEventRecordingFilter.java`.
- Public factory helpers use short `of(...)` static methods in `yanote-core/src/main/java/dev/yanote/core/events/HttpEvent.java`.
- Prefer explicit null/empty guards before iteration, e.g. `OpenApiOperations.extract`.
- Route/method normalization is done at model boundaries, e.g. uppercase method in `OperationKey` constructor.

## TypeScript style and structure
- ESM imports with explicit `.js` extensions in source imports, e.g. `yanote-js/src/cli.ts`.
- `type` aliases are favored for models, e.g. `HttpEvent` and `OperationKey` in `yanote-js/src/model/`.
- Strict compiler mode is enabled (`"strict": true`) in `yanote-js/tsconfig.json`.
- Small pure functions and guard clauses are preferred, e.g. `normalizeMethod` in `yanote-js/src/model/httpEvent.ts`.
- Deduplication and normalization logic is explicit and local, e.g. `dedupeHttpOps` in `yanote-js/src/spec/openapi.ts`.

## Naming patterns
- Test names use behavior phrasing with `should...` in Java tests, e.g. `shouldWriteTemplatedEventAfterRequest` in `yanote-recorder-spring-mvc/src/test/java/dev/yanote/recorder/springmvc/RecorderWritesJsonlTest.java`.
- TypeScript tests prefer short behavior phrases in `it(...)`, e.g. `"prints help"` in `yanote-js/src/cli.test.ts`.
- CLI option names are kebab-case, e.g. `--min-coverage` and `--fail-on-regression` in `yanote-js/src/cli.ts`.

## Error handling conventions
- Java core logic fails fast with exceptions on invalid critical inputs, e.g. `IllegalStateException` in `yanote-core/src/main/java/dev/yanote/core/openapi/OpenApiLoader.java`.
- Recorder path intentionally degrades gracefully: IO write failures are logged and dropped, not rethrown, in `HttpEventRecordingFilter`.
- TypeScript parsing paths often skip invalid records instead of hard-failing batch reads, e.g. invalid JSONL lines counted in `yanote-js/src/events/readJsonl.ts`.
- CLI maps domain failures to explicit exit codes through Commander errors in `yanote-js/src/cli.ts`.

## Lint and format signals
- No dedicated lint/format config was found in repo-level Gradle or Node scripts (`build.gradle.kts`, `yanote-js/package.json`).
- No `eslint`, `prettier`, `checkstyle`, or `spotless` settings were detected in tracked build/config files.
- Formatting appears enforced by existing code style discipline and review, not automated tooling.

## Practical guidance for contributors
- Preserve existing guard-clause style and immutability-first modeling.
- Keep normalization close to model construction and parsing edges.
- Follow current naming idioms (`should...` tests in Java, concise `it(...)` descriptions in TS).
- When changing CLI behavior, keep explicit exit code semantics aligned with `yanote-js/src/cli.ts`.

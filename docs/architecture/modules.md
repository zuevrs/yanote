# Модули / Module map

Этот файл кратко показывает, из каких модулей и delivery surfaces сейчас состоит Yanote, и какие из них считаются public vs internal.

## Public Java modules

| Module | Role | Public status |
|---|---|---|
| `yanote-core` | Core semantics, coverage/report model, shared engine pieces for the Java path | Public release module |
| `yanote-recorder-spring-mvc` | HTTP recorder for Spring Boot 3.x / Spring MVC | Public supported module |
| `yanote-recorder-spring-kafka` | Kafka recorder adapter for evidence capture | Public supported module |
| `yanote-test-tags-restassured` | Test metadata handoff for RestAssured path | Public supported module |
| `yanote-test-tags-cucumber` | Test metadata handoff for Cucumber path | Public supported module |
| `yanote-gradle-plugin` | Gradle integration (`yanoteReport`, `yanoteCheck`) | Public supported module |

## Narrow / source-built modules and surfaces

| Module / surface | Role | Status |
|---|---|---|
| `yanote-recorder-spring-amqp` | RabbitMQ/AMQP-side recorder/proof path for widened async surface | Narrow current surface; read literally from release/support docs |
| `yanote-js` | Analyzer implementation, async/combined engine, standalone bundle internals | Internal implementation behind the public analyzer bundle |
| `yanote-analyzer.zip` / `bin/yanote` | Public analyzer delivery surface | Public standalone bundle |

## Example modules

| Module | Role | Status |
|---|---|---|
| `examples:springmvc-service` | Runnable service example | Example / not published module |
| `examples:tests-restassured` | Runnable test/demo path | Example / not published module |

## Historical / non-entrypoint surfaces

| Surface | Status |
|---|---|
| `yanote-cli` | Historical removed Java CLI surface; not part of the current active module graph |
| `docs/plans/**` | Historical planning context, not current architecture contract |

## How to read this map

- **Public release module** = published and part of the documented supported surface.
- **Narrow current surface** = exists and is supported only in the explicitly documented limited boundary.
- **Internal implementation** = necessary to ship the product, but not a public entrypoint.
- **Example** = runnable proof/demo surface, not a promised shipped module.

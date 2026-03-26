# S02: Live RabbitMQ recorder and proof path

**Goal:** Add one official live non-Kafka runtime capture path on RabbitMQ via Spring AMQP so Yanote can record real AMQP evidence, merge producer/consumer truth, and analyze it through the existing protocol-aware `async-report` entrypoint without implying Kafka-only semantic parity.
**Demo:** After this: TBD

## Tasks
- [x] **T01: Added the Spring AMQP recorder module with opt-in send/listener instrumentation and AMQP contract tests.** — 

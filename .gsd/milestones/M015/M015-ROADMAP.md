# M015: Async Platform Expansion And Cross-Surface Reporting

## Vision
Expand Yanote beyond the original Kafka-only async boundary by adding one concrete RabbitMQ/AMQP runtime path and one child-attributed combined HTTP plus async reporting surface, then carry those widened delivery surfaces through CI, docs, and support without implying broker-agnostic parity or a blended denominator.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Protocol-aware async analyzer contract with first RabbitMQ path | high | — | ✅ | Async analysis can attribute canonical identities and report truth to `amqp` without pretending Kafka parity. |
| S02 | Live RabbitMQ recorder and proof path | high | S01 | ✅ | A real two-service RabbitMQ flow records retained AMQP evidence and produces canonical async JSON/HTML proof artifacts. |
| S03 | Combined HTTP plus async report and gate from canonical subreports | medium | S01, S02 | ✅ | Combined reporting stays child-attributed, preserves HTTP and async drill-down paths, and avoids a blended denominator. |
| S04 | CI, docs, and support closure for widened async and combined reporting | medium | S02, S03 | ✅ | CI, collected artifacts, summaries, docs, and support intake all describe the widened async/combined boundary truthfully. |

## Slices
- [x] **S01: Protocol-aware async analyzer contract with first RabbitMQ path** `risk:high` `depends:[]`
  > After this: Async analysis can attribute canonical identities and report truth to `amqp` without pretending Kafka parity.
- [x] **S02: Live RabbitMQ recorder and proof path** `risk:high` `depends:[S01]`
  > After this: A real two-service RabbitMQ flow records retained AMQP evidence and produces canonical async JSON/HTML proof artifacts.
- [x] **S03: Combined HTTP plus async report and gate from canonical subreports** `risk:medium` `depends:[S01,S02]`
  > After this: Combined reporting stays child-attributed, preserves HTTP and async drill-down paths, and avoids a blended denominator.
- [x] **S04: CI, docs, and support closure for widened async and combined reporting** `risk:medium` `depends:[S02,S03]`
  > After this: CI, collected artifacts, summaries, docs, and support intake all describe the widened async/combined boundary truthfully.

## Boundary Map

### S01 → S02
Produces:
- Protocol-aware async analyzer/report identity for the first RabbitMQ/AMQP path.
- Canonical async contracts that S02 can exercise against live retained AMQP evidence.

Consumes:
- nothing (first slice)

### S02 → S03
Produces:
- Retained RabbitMQ async proof artifacts that S03 can compose as the async child.
- Canonical `yanote-async-report.json` / `.html` outputs for child-attributed aggregation.

Consumes:
- S01 protocol-aware analyzer/report contract.

### S02 → S04
Produces:
- The live RabbitMQ proof family and retained artifacts that CI/docs/support must reference truthfully.

Consumes:
- S01 protocol-aware analyzer/report contract.

### S03 → S04
Produces:
- Combined HTTP plus async child-attributed JSON/HTML/report surfaces and drill-down expectations.

Consumes:
- S02 retained RabbitMQ proof artifacts and the canonical HTTP child report surface.

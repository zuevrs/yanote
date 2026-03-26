import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

const SCHEMA_DEPTH_ASYNCAPI = [
  "asyncapi: 3.0.0",
  "info:",
  "  title: yanote schema-depth v3 kafka sample",
  "  version: '1.0.0'",
  "servers:",
  "  kafkaLocal:",
  "    host: localhost:9092",
  "    protocol: kafka",
  "channels:",
  "  orderCreated:",
  "    address: orders.created",
  "    messages:",
  "      OrderCreatedEnvelope:",
  "        name: OrderCreatedEnvelope",
  "        contentType: application/json",
  "        headers:",
  "          $ref: '#/components/schemas/OrderEventHeaders'",
  "        payload:",
  "          $ref: '#/components/schemas/OrderCreatedPayload'",
  "operations:",
  "  sendOrderCreated:",
  "    action: send",
  "    channel:",
  "      $ref: '#/channels/orderCreated'",
  "    messages:",
  "      - $ref: '#/channels/orderCreated/messages/OrderCreatedEnvelope'",
  "components:",
  "  schemas:",
  "    OrderEventHeaders:",
  "      type: object",
  "      required:",
  "        - tenantId",
  "        - traceId",
  "      properties:",
  "        tenantId:",
  "          type: string",
  "        traceId:",
  "          type: string",
  "    OrderCreatedPayload:",
  "      type: object",
  "      required:",
  "        - eventId",
  "        - order",
  "      properties:",
  "        eventId:",
  "          type: string",
  "        order:",
  "          type: object",
  "          required:",
  "            - id",
  "            - total",
  "          properties:",
  "            id:",
  "              type: string",
  "            total:",
  "              type: number"
].join("\n");

const DECLARED_SEMANTICS_ASYNCAPI = [
  "asyncapi: 3.0.0",
  "info:",
  "  title: yanote declared semantics sample",
  "  version: '1.0.0'",
  "servers:",
  "  kafkaLocal:",
  "    host: localhost:9092",
  "    protocol: kafka",
  "channels:",
  "  orderCommands:",
  "    address: orders.command",
  "    messages:",
  "      OrderCommand:",
  "        name: OrderCommand",
  "        correlationId:",
  "          location: $message.header#/correlation_id",
  "        payload:",
  "          type: object",
  "  orderReplies:",
  "    address: orders.reply",
  "    messages:",
  "      OrderReply:",
  "        name: OrderReply",
  "        payload:",
  "          type: object",
  "operations:",
  "  sendOrderCommand:",
  "    action: send",
  "    channel:",
  "      $ref: '#/channels/orderCommands'",
  "    reply:",
  "      channel:",
  "        $ref: '#/channels/orderReplies'",
  "      address:",
  "        location: $message.header#/reply_to",
  "      messages:",
  "        - $ref: '#/channels/orderReplies/messages/OrderReply'",
  "    messages:",
  "      - $ref: '#/channels/orderCommands/messages/OrderCommand'"
].join("\n");

async function createOutDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-async-"));
  return {
    dir,
    outDir: path.join(dir, "out")
  };
}

async function createAsyncFixture(specYaml: string, eventsJsonl: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-async-schema-"));
  const specPath = path.join(dir, "asyncapi.yaml");
  const eventsPath = path.join(dir, "events.jsonl");
  const outDir = path.join(dir, "out");

  await writeFile(specPath, specYaml, "utf8");
  await writeFile(eventsPath, eventsJsonl, "utf8");

  return { dir, specPath, eventsPath, outDir };
}

describe("cli async-report", () => {
  it("writes a separate deterministic async artifact and exits 0 for local warning-level gates", async () => {
    const fixture = await createOutDir();

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        "test/fixtures/asyncapi/v3.yaml",
        "--events",
        "test/fixtures/async-events/partial.fixture.jsonl",
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("YANOTE_ASYNC_SUMMARY");

      const reportPath = path.join(fixture.outDir, "yanote-async-report.json");
      const htmlPath = path.join(fixture.outDir, "yanote-async-report.html");
      const [report, html] = await Promise.all([
        readFile(reportPath, "utf8").then((content) => JSON.parse(content)),
        readFile(htmlPath, "utf8")
      ]);

      expect(result.stdout).toContain("- protocols: kafka");
      expect(result.stdout).toContain("protocols=kafka");
      expect(report.schemaVersion).toBe("1.0.0");
      expect(report.phase).toEqual({ id: "03", slug: "async-report-and-gate-surface" });
      expect(report.status).toBe("partial");
      expect(report.summary).toEqual({
        totalChannels: 2,
        coveredChannels: 1,
        channelCoveragePercent: 50,
        totalOperations: 2,
        coveredOperations: 1,
        operationCoveragePercent: 50,
        totalMessages: 2,
        coveredMessages: 1,
        messageCoveragePercent: 50
      });
      expect(report.governance).toBeUndefined();
      expect(result.stdout).toContain(`report=${reportPath}`);
      expect(result.stdout).not.toContain(`report=${htmlPath}`);
      expect(html).toContain("yanote-async-report.html");
      expect(html).toContain("Channel coverage");
      expect(html).not.toContain("HTTP Payload Conformance");
      expect(html).not.toContain("Deprecated operations");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("writes protocol-aware AMQP async artifacts for the RabbitMQ fixture", async () => {
    const fixture = await createOutDir();

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        "test/fixtures/asyncapi/rabbitmq-amqp-basic.yaml",
        "--events",
        "test/fixtures/async-events/amqp-basic.fixture.jsonl",
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("- protocols: amqp");
      expect(result.stdout).toContain("protocols=amqp");

      const reportPath = path.join(fixture.outDir, "yanote-async-report.json");
      const htmlPath = path.join(fixture.outDir, "yanote-async-report.html");
      const [report, html] = await Promise.all([
        readFile(reportPath, "utf8").then((content) => JSON.parse(content)),
        readFile(htmlPath, "utf8")
      ]);

      expect(report.protocols).toEqual(["amqp"]);
      expect(report.summary).toEqual({
        totalChannels: 1,
        coveredChannels: 1,
        channelCoveragePercent: 100,
        totalOperations: 1,
        coveredOperations: 1,
        operationCoveragePercent: 100,
        totalMessages: 1,
        coveredMessages: 1,
        messageCoveragePercent: 100
      });
      expect(report.bindingSupport.summary).toEqual({
        totalOperations: 0,
        totalBindings: 0,
        supportedBindings: 0,
        declaredOnlyBindings: 0,
        deferredBindings: 0,
        invalidBindings: 0
      });
      expect(result.stdout).toContain(`report=${reportPath}`);
      expect(result.stdout).not.toContain(`report=${htmlPath}`);
      expect(html).toContain("yanote-async-report.html");
      expect(html).toContain("Protocols");
      expect(html).toContain("amqp");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("surfaces declared async semantics additively while keeping JSON as the machine-facing report path", async () => {
    const fixture = await createAsyncFixture(
      DECLARED_SEMANTICS_ASYNCAPI,
      '{"kind":"kafka","action":"send","channel":"orders.command","message":"OrderCommand","headers":{"correlation_id":{"state":"captured","value":"corr-123"},"reply_to":{"state":"captured","value":"orders.reply"}},"payload":{"orderId":"ord-1"},"test.run_id":"run-declared","test.suite":"suite-declared"}\n'
    );

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain("- protocols: kafka");
      expect(result.stdout).toContain("Declared Semantics");
      expect(result.stdout).toContain("- operations with declarations: 1");
      expect(result.stdout).toContain("- operations with correlationId: 1");
      expect(result.stdout).toContain("- message correlationIds: 1");
      expect(result.stdout).toContain("- operations with reply: 1");
      expect(result.stdout).toContain(
        "- kafka send orders.command: correlationId=OrderCommand@$message.header#/correlation_id; reply=$message.header#/reply_to"
      );
      expect(result.stdout).toContain("Runtime Semantics");
      expect(result.stdout).toContain("- operations with runtime semantics: 1");
      expect(result.stdout).toContain("- satisfied operations: 1");
      expect(result.stdout).toContain("- unsatisfied operations: 0");
      expect(result.stdout).toContain("- declared semantics: 2");
      expect(result.stdout).toContain("- satisfied semantics: 2");
      expect(result.stdout).toContain("- unsatisfied semantics: 0");
      expect(result.stdout).toContain("- runtime proof coverage: 100.00%");
      expect(result.stdout).toContain("- diagnostics: missing=0 unavailable=0 unsupported=0 mismatched=0");
      expect(result.stdout).toContain(
        "- kafka send orders.command: state=SATISFIED; correlationId=OrderCommand@$message.header#/correlation_id [SATISFIED; header=correlation_id; suites=suite-declared]; reply=$message.header#/reply_to [SATISFIED; header=reply_to; declaredChannel=orders.reply; suites=suite-declared]"
      );
      expect(result.stdout).toContain("- diagnostics: none");
      expect(result.stdout).toContain("declared_operations=1");
      expect(result.stdout).toContain("declared_correlation_operations=1");
      expect(result.stdout).toContain("declared_correlation_messages=1");
      expect(result.stdout).toContain("declared_reply_operations=1");
      expect(result.stdout).toContain("runtime_operations=1");
      expect(result.stdout).toContain("runtime_satisfied_operations=1");
      expect(result.stdout).toContain("runtime_unsatisfied_operations=0");
      expect(result.stdout).toContain("runtime_total_semantics=2");
      expect(result.stdout).toContain("runtime_satisfied_semantics=2");
      expect(result.stdout).toContain("runtime_unsatisfied_semantics=0");
      expect(result.stdout).toContain("runtime_semantic_coverage=100.00");
      expect(result.stdout).toContain("runtime_diagnostics=missing:0,unavailable:0,unsupported:0,mismatched:0");
      expect(result.stdout).toContain("protocols=kafka");
      expect(result.stdout).not.toContain("corr-123");
      expect(result.stdout).not.toContain("reply-orders");

      const reportPath = path.join(fixture.outDir, "yanote-async-report.json");
      const htmlPath = path.join(fixture.outDir, "yanote-async-report.html");
      const [report, html] = await Promise.all([
        readFile(reportPath, "utf8").then((content) => JSON.parse(content)),
        readFile(htmlPath, "utf8")
      ]);

      expect(result.stdout).toContain(`report=${reportPath}`);
      expect(result.stdout).not.toContain(`report=${htmlPath}`);
      expect(report.declaredSemantics).toEqual({
        summary: {
          totalOperations: 1,
          operationsWithCorrelationId: 1,
          messageCorrelationIds: 1,
          operationsWithReply: 1
        },
        operations: [
          {
            operationKey: "kafka send orders.command",
            channel: "orders.command",
            action: "send",
            correlationIds: [
              {
                message: "OrderCommand",
                location: "$message.header#/correlation_id"
              }
            ],
            reply: {
              address: {
                location: "$message.header#/reply_to"
              }
            }
          }
        ]
      });
      expect(report.runtimeSemantics).toEqual({
        summary: {
          totalOperations: 1,
          satisfiedOperations: 1,
          unsatisfiedOperations: 0,
          totalSemantics: 2,
          satisfiedSemantics: 2,
          unsatisfiedSemantics: 0,
          semanticCoveragePercent: 100
        },
        operations: [
          {
            operationKey: "kafka send orders.command",
            channel: "orders.command",
            action: "send",
            state: "SATISFIED",
            correlationIds: [
              {
                message: expect.stringContaining("OrderCommand"),
                location: "$message.header#/correlation_id",
                state: "SATISFIED",
                suites: ["suite-declared"],
                header: "correlation_id",
                messageName: "OrderCommand"
              }
            ],
            reply: {
              address: {
                location: "$message.header#/reply_to",
                state: "SATISFIED",
                suites: ["suite-declared"],
                header: "reply_to",
                replyChannelAddress: "orders.reply"
              }
            }
          }
        ],
        diagnostics: {
          counts: {
            missing: 0,
            unavailable: 0,
            unsupported: 0,
            mismatched: 0
          },
          items: []
        }
      });
      expect(html).toContain("Declared semantics");
      expect(html).toContain("Runtime semantics");
      expect(html).toContain("$message.header#/correlation_id");
      expect(html).toContain("$message.header#/reply_to");
      expect(html).not.toContain("HTTP Payload Conformance");
      expect(html).not.toContain("corr-123");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on header-backed runtime semantics with typed primary and secondary async errors", async () => {
    const fixture = await createAsyncFixture(
      DECLARED_SEMANTICS_ASYNCAPI,
      [
        '{"kind":"kafka","ts":1710001001000,"action":"send","channel":"orders.command","message":"OrderCommand","payload":{"orderId":"ord-runtime-missing"},"test.run_id":"run-runtime-missing","test.suite":"suite-runtime-missing"}',
        '{"kind":"kafka","ts":1710001002000,"action":"send","channel":"orders.command","message":"OrderCommand","headers":{"correlation_id":{"state":"redacted","reason":"sensitive"},"reply_to":{"state":"omitted","reason":"unsupported"}},"payload":{"orderId":"ord-runtime-unavailable"},"test.run_id":"run-runtime-unavailable","test.suite":"suite-runtime-unavailable"}',
        '{"kind":"kafka","ts":1710001003000,"action":"send","channel":"orders.command","message":"OrderCommand","headers":{"correlation_id":{"state":"captured","value":"corr-runtime-mismatch"},"reply_to":{"state":"captured","value":"orders.deadletter"}},"payload":{"orderId":"ord-runtime-mismatch"},"test.run_id":"run-runtime-mismatch","test.suite":"suite-runtime-mismatch"}'
      ].join("\n")
    );

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_CORRELATION_ID_MISSING");
      expect(result.stderr).toContain(
        "YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_CORRELATION_ID_UNAVAILABLE"
      );
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_REPLY_ADDRESS_MISSING");
      expect(result.stderr).toContain(
        "YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_REPLY_ADDRESS_UNAVAILABLE"
      );
      expect(result.stderr).toContain(
        "YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_REPLY_ADDRESS_MISMATCH"
      );
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_CORRELATION_ID_MISSING");
      expect(result.stdout).toContain("Runtime Semantics");
      expect(result.stdout).toContain("- operations with runtime semantics: 1");
      expect(result.stdout).toContain("- satisfied operations: 0");
      expect(result.stdout).toContain("- unsatisfied operations: 1");
      expect(result.stdout).toContain("- declared semantics: 2");
      expect(result.stdout).toContain("- satisfied semantics: 1");
      expect(result.stdout).toContain("- unsatisfied semantics: 1");
      expect(result.stdout).toContain("- runtime proof coverage: 50.00%");
      expect(result.stdout).toContain("- diagnostics: missing=2 unavailable=2 unsupported=0 mismatched=1");
      expect(result.stdout).toContain(
        "- kafka send orders.command: state=PARTIAL; correlationId=OrderCommand@$message.header#/correlation_id [SATISFIED; header=correlation_id; suites=suite-runtime-mismatch]; reply=$message.header#/reply_to [UNSATISFIED; header=reply_to; declaredChannel=orders.reply; suites=none]"
      );
      expect(result.stdout).toContain(
        "- diagnostic: kafka send orders.command reply.address mismatched at $message.header#/reply_to header=reply_to declaredChannel=orders.reply reason=Observed kafka header 'reply_to' did not match declared AsyncAPI reply channel address 'orders.reply'."
      );
      expect(result.stdout).toContain("runtime_diagnostics=missing:2,unavailable:2,unsupported:0,mismatched:1");
      expect(result.stdout).not.toContain("corr-runtime-mismatch");
      expect(result.stdout).not.toContain("orders.deadletter");
      expect(result.stderr).not.toContain("corr-runtime-mismatch");
      expect(result.stderr).not.toContain("orders.deadletter");

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-async-report.json"), "utf8"));
      expect(report.runtimeSemantics.summary).toEqual({
        totalOperations: 1,
        satisfiedOperations: 0,
        unsatisfiedOperations: 1,
        totalSemantics: 2,
        satisfiedSemantics: 1,
        unsatisfiedSemantics: 1,
        semanticCoveragePercent: 50
      });
      expect(report.runtimeSemantics.diagnostics.counts).toEqual({
        missing: 2,
        unavailable: 2,
        unsupported: 0,
        mismatched: 1
      });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("exits 3 for async threshold failures and still writes the async artifact", async () => {
    const fixture = await createOutDir();

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        "test/fixtures/asyncapi/v3.yaml",
        "--events",
        "test/fixtures/async-events/partial.fixture.jsonl",
        "--out",
        fixture.outDir,
        "--min-coverage",
        "80"
      ]);

      expect(result.code).toBe(3);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=gate code=ASYNC_GATE_MIN_COVERAGE");

      const reportPath = path.join(fixture.outDir, "yanote-async-report.json");
      const report = JSON.parse(await readFile(reportPath, "utf8"));
      expect(report.status).toBe("partial");
      expect(result.stdout).toContain(`report=${reportPath}`);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on public schema-depth payload diagnostics with a shared primary failure across stdout and stderr", async () => {
    const [invalidEvent, missingEvent] = await Promise.all([
      readFile("test/fixtures/async-events/schema-invalid.fixture.jsonl", "utf8"),
      readFile("test/fixtures/async-events/schema-missing-payload.fixture.jsonl", "utf8")
    ]);
    const fixture = await createAsyncFixture(SCHEMA_DEPTH_ASYNCAPI, `${invalidEvent.trim()}\n${missingEvent.trim()}\n`);

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_MISSING_PAYLOAD");
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_INVALID_PAYLOAD");
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_MISSING_PAYLOAD");
      expect(result.stdout).toContain(
        'primary_reason="Async evidence kafka send orders.created is missing payload required by schema OrderCreatedPayload at /: Observed async evidence did not include a payload."'
      );
      expect(result.stdout).toContain(
        "- high: ASYNC_SEMANTIC_MISSING_PAYLOAD - Async evidence kafka send orders.created is missing payload required by schema OrderCreatedPayload at /: Observed async evidence did not include a payload."
      );
      expect(result.stdout).toContain(
        "- medium: kafka send orders.created - missing-payload schema=OrderCreatedPayload pointer=/ reason=Observed async evidence did not include a payload."
      );

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-async-report.json"), "utf8"));
      expect(report.status).toBe("partial");
      expect(report.diagnostics.counts).toEqual({
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 1,
        "invalid-payload": 1,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on typed header drift with explicit async error ordering", async () => {
    const eventsJsonl = await readFile("test/fixtures/async-events/schema-missing-header.fixture.jsonl", "utf8");
    const fixture = await createAsyncFixture(SCHEMA_DEPTH_ASYNCAPI, eventsJsonl);

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_MISSING_HEADER");
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_MISSING_HEADER");
      expect(result.stdout).toContain(
        'primary_reason="Async evidence kafka send orders.created is missing required header from schema OrderEventHeaders at /traceId: Observed async evidence did not include required header \'traceId\'."'
      );
      expect(result.stdout).toContain(
        "- medium: kafka send orders.created - missing-header schema=OrderEventHeaders pointer=/traceId reason=Observed async evidence did not include required header 'traceId'."
      );

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-async-report.json"), "utf8"));
      expect(report.diagnostics.counts).toEqual({
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 1,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on unsupported payload content types before any other semantic drift", async () => {
    const eventsJsonl = await readFile("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl", "utf8");
    const fixture = await createAsyncFixture(
      SCHEMA_DEPTH_ASYNCAPI.replace("contentType: application/json", "contentType: application/xml"),
      eventsJsonl
    );

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE");
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_UNSUPPORTED_CONTENT_TYPE");
      expect(result.stdout).toContain(
        'primary_reason="Async evidence kafka send orders.created cannot validate payload schema OrderCreatedPayload because Unsupported AsyncAPI payload content type: application/xml."'
      );

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-async-report.json"), "utf8"));
      expect(report.diagnostics.counts).toEqual({
        "unsupported-content-type": 1,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on unsupported payload schema formats before any other semantic drift", async () => {
    const eventsJsonl = await readFile("test/fixtures/async-events/schema-unsupported-format.fixture.jsonl", "utf8");
    const fixture = await createAsyncFixture(
      SCHEMA_DEPTH_ASYNCAPI.replace(
        "    OrderCreatedPayload:\n      type: object",
        [
          "    OrderCreatedPayload:",
          "      schemaFormat: application/vnd.apache.avro;version=1.11.0",
          "      type: object"
        ].join("\n")
      ),
      eventsJsonl
    );

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT");
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_UNSUPPORTED_SCHEMA_FORMAT");
      expect(result.stdout).toContain(
        'primary_reason="Async evidence kafka send orders.created cannot validate payload schema OrderCreatedPayload because Unsupported AsyncAPI payload schema format: application/vnd.apache.avro;version=1.11.0."'
      );

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-async-report.json"), "utf8"));
      expect(report.diagnostics.counts).toEqual({
        "unsupported-content-type": 0,
        "unsupported-schema-format": 1,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 0,
        mismatched: 0
      });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on runtime-ambiguous multi-message evidence", async () => {
    const specYaml = await readFile("test/fixtures/asyncapi/multi-message-resolvable.yaml", "utf8");
    const fixture = await createAsyncFixture(
      specYaml,
      '{"kind":"kafka","action":"send","channel":"users.lifecycle","message":"UserLifecycleEvent","payload":{"userId":"user-2"},"test.run_id":"run-2","test.suite":"suite-runtime-ambiguous"}\n'
    );

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_AMBIGUOUS_MESSAGE");
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_AMBIGUOUS_MESSAGE");
      expect(result.stdout).toContain("could not deterministically select one declared message contract");

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-async-report.json"), "utf8"));
      expect(report.diagnostics.counts).toEqual({
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 1,
        unmatched: 0,
        mismatched: 0
      });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on async drift with semantic error ordering and a written async artifact", async () => {
    const fixture = await createOutDir();

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        "test/fixtures/asyncapi/v3.yaml",
        "--events",
        "test/fixtures/async-events/drift.fixture.jsonl",
        "--out",
        fixture.outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_MESSAGE_MISMATCH");
      expect(result.stderr).toContain(
        "YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_UNMATCHED_EVIDENCE"
      );
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_MESSAGE_MISMATCH");
      expect(result.stdout).toContain(
        'primary_reason="Observed async evidence kafka receive users.deleted reported message LegacyUserDeleted, expected UserDeleted."'
      );

      const report = JSON.parse(await readFile(path.join(fixture.outDir, "yanote-async-report.json"), "utf8"));
      expect(report.status).toBe("partial");
      expect(report.diagnostics.counts).toEqual({
        "unsupported-content-type": 0,
        "unsupported-schema-format": 0,
        "missing-payload": 0,
        "invalid-payload": 0,
        "missing-header": 0,
        "unavailable-header": 0,
        "invalid-header": 0,
        "unverifiable-headers": 0,
        ambiguous: 0,
        unmatched: 1,
        mismatched: 1
      });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});

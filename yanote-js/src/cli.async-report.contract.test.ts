import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

async function createFixture(specYaml: string, eventsJsonl: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-async-contract-"));
  const specPath = path.join(dir, "asyncapi.yaml");
  const eventsPath = path.join(dir, "events.jsonl");
  const outDir = path.join(dir, "out");

  await writeFile(specPath, specYaml, "utf8");
  await writeFile(eventsPath, eventsJsonl, "utf8");

  return { dir, specPath, eventsPath, outDir };
}

const VALID_ASYNCAPI = [
  "asyncapi: 3.0.0",
  "info:",
  "  title: cli-contract",
  "  version: 1.0.0",
  "servers:",
  "  kafkaLocal:",
  "    host: localhost:9092",
  "    protocol: kafka",
  "channels:",
  "  usersSignedUp:",
  "    address: users.signedup",
  "    messages:",
  "      UserSignedUp:",
  "        payload:",
  "          type: object",
  "  usersDeleted:",
  "    address: users.deleted",
  "    messages:",
  "      UserDeleted:",
  "        payload:",
  "          type: object",
  "operations:",
  "  sendUserSignedUp:",
  "    action: send",
  "    channel:",
  "      $ref: '#/channels/usersSignedUp'",
  "    messages:",
  "      - $ref: '#/channels/usersSignedUp/messages/UserSignedUp'",
  "  receiveUserDeleted:",
  "    action: receive",
  "    channel:",
  "      $ref: '#/channels/usersDeleted'",
  "    messages:",
  "      - $ref: '#/channels/usersDeleted/messages/UserDeleted'"
].join("\n");

const DECLARED_SEMANTICS_ASYNCAPI = [
  "asyncapi: 3.0.0",
  "info:",
  "  title: cli-contract-declared-semantics",
  "  version: 1.0.0",
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

const SCHEMA_DEPTH_ASYNCAPI = [
  "asyncapi: 3.0.0",
  "info:",
  "  title: cli-contract-schema-depth",
  "  version: 1.0.0",
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

describe("cli async-report contract", () => {
  it("prints fixed section order and one final async machine summary line", async () => {
    const fixture = await createFixture(
      VALID_ASYNCAPI,
      '{"kind":"kafka","action":"send","channel":"users.signedup","message":"UserSignedUp","test.run_id":"r1","test.suite":"suite-a"}\n'
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

      const output = result.stdout;
      const summaryIndex = output.indexOf("Summary\n");
      const dimensionsIndex = output.indexOf("\nCoverage Dimensions\n");
      const declaredSemanticsIndex = output.indexOf("\nDeclared Semantics\n");
      const runtimeSemanticsIndex = output.indexOf("\nRuntime Semantics\n");
      const issuesIndex = output.indexOf("\nTop Issues\n");
      const pathIndex = output.indexOf("\nReport Path\n");
      const machineIndex = output.lastIndexOf("\nYANOTE_ASYNC_SUMMARY ");

      expect(summaryIndex).toBeGreaterThanOrEqual(0);
      expect(dimensionsIndex).toBeGreaterThan(summaryIndex);
      expect(declaredSemanticsIndex).toBeGreaterThan(dimensionsIndex);
      expect(runtimeSemanticsIndex).toBeGreaterThan(declaredSemanticsIndex);
      expect(issuesIndex).toBeGreaterThan(runtimeSemanticsIndex);
      expect(pathIndex).toBeGreaterThan(issuesIndex);
      expect(machineIndex).toBeGreaterThan(pathIndex);

      const lines = output.trimEnd().split("\n");
      const summaryLine = lines[lines.length - 1];
      const reportPath = path.join(fixture.outDir, "yanote-async-report.json");
      const htmlPath = path.join(fixture.outDir, "yanote-async-report.html");
      const html = await readFile(htmlPath, "utf8");
      const reportPathSection = output.split("\nReport Path\n")[1]?.split("\n\nYANOTE_ASYNC_SUMMARY ")[0]?.trim();

      expect(summaryLine.startsWith("YANOTE_ASYNC_SUMMARY ")).toBe(true);
      expect((output.match(/YANOTE_ASYNC_SUMMARY /g) ?? []).length).toBe(1);
      expect(output).toContain("Declared Semantics");
      expect(output).toContain("- operations with declarations: 0");
      expect(output).toContain("- details: none");
      expect(output).toContain("Runtime Semantics");
      expect(output).toContain("- operations with runtime semantics: 0");
      expect(output).toContain("- satisfied operations: 0");
      expect(output).toContain("- unsatisfied operations: 0");
      expect(output).toContain("- declared semantics: 0");
      expect(output).toContain("- satisfied semantics: 0");
      expect(output).toContain("- unsatisfied semantics: 0");
      expect(output).toContain("- runtime proof coverage: N/A");
      expect(output).toContain("- diagnostics: missing=0 unavailable=0 unsupported=0 mismatched=0");
      expect(output).toContain('primary_reason="none"');
      expect(output).not.toContain("- deprecated operations:");
      expect(output).not.toContain("deprecated_operations=");
      expect(output).not.toMatch(/\u001b\[[0-9;]*m/);
      expect(reportPathSection).toBe(reportPath);
      expect(summaryLine).toContain(`report=${reportPath}`);
      expect(summaryLine).toContain("declared_operations=0");
      expect(summaryLine).toContain("declared_correlation_operations=0");
      expect(summaryLine).toContain("declared_correlation_messages=0");
      expect(summaryLine).toContain("declared_reply_operations=0");
      expect(summaryLine).toContain("runtime_operations=0");
      expect(summaryLine).toContain("runtime_satisfied_operations=0");
      expect(summaryLine).toContain("runtime_unsatisfied_operations=0");
      expect(summaryLine).toContain("runtime_total_semantics=0");
      expect(summaryLine).toContain("runtime_satisfied_semantics=0");
      expect(summaryLine).toContain("runtime_unsatisfied_semantics=0");
      expect(summaryLine).toContain("runtime_semantic_coverage=NA");
      expect(summaryLine).toContain("runtime_diagnostics=missing:0,unavailable:0,unsupported:0,mismatched:0");
      expect(summaryLine).not.toContain("yanote-async-report.html");
      expect(html).toContain("yanote-async-report.html");
      expect(html).toContain("Channel coverage");
      expect(html).not.toContain("HTTP Payload Conformance");
      expect(html).not.toContain("Deprecated operations");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("prints additive declared-semantics counts and machine tokens without leaking retained header values", async () => {
    const fixture = await createFixture(
      DECLARED_SEMANTICS_ASYNCAPI,
      '{"kind":"kafka","action":"send","channel":"orders.command","message":"OrderCommand","headers":{"correlation_id":{"state":"captured","value":"corr-123"},"reply_to":{"state":"captured","value":"orders.reply"}},"payload":{"orderId":"ord-1"},"test.run_id":"r-declared","test.suite":"suite-declared"}\n'
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

      const reportPath = path.join(fixture.outDir, "yanote-async-report.json");
      const summaryLine = result.stdout.trimEnd().split("\n").at(-1) ?? "";

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
      expect(result.stdout).toContain(`Report Path\n${reportPath}`);
      expect(result.stdout).not.toContain("HTTP Payload Conformance");
      expect(result.stdout).not.toContain("corr-123");
      expect(summaryLine).toContain("declared_operations=1");
      expect(summaryLine).toContain("declared_correlation_operations=1");
      expect(summaryLine).toContain("declared_correlation_messages=1");
      expect(summaryLine).toContain("declared_reply_operations=1");
      expect(summaryLine).toContain("runtime_operations=1");
      expect(summaryLine).toContain("runtime_satisfied_operations=1");
      expect(summaryLine).toContain("runtime_unsatisfied_operations=0");
      expect(summaryLine).toContain("runtime_total_semantics=2");
      expect(summaryLine).toContain("runtime_satisfied_semantics=2");
      expect(summaryLine).toContain("runtime_unsatisfied_semantics=0");
      expect(summaryLine).toContain("runtime_semantic_coverage=100.00");
      expect(summaryLine).toContain("runtime_diagnostics=missing:0,unavailable:0,unsupported:0,mismatched:0");
      expect(summaryLine).toContain(`report=${reportPath}`);
      expect(summaryLine).not.toContain("yanote-async-report.html");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("surfaces typed runtime-semantic failures through stdout, stderr, and machine tokens without leaking retained header values", async () => {
    const fixture = await createFixture(
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
      const stderrLines = result.stderr.trim().split("\n");
      expect(stderrLines[0]).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_CORRELATION_ID_MISSING");
      expect(stderrLines[1]).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_CORRELATION_ID_UNAVAILABLE");
      expect(stderrLines[2]).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_REPLY_ADDRESS_MISSING");
      expect(stderrLines[3]).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_REPLY_ADDRESS_UNAVAILABLE");
      expect(stderrLines[4]).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_REPLY_ADDRESS_MISMATCH");
      expect(stderrLines.filter((line) => line.startsWith("YANOTE_ASYNC_ERROR "))).toHaveLength(1);

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
        "- diagnostic: kafka send orders.command OrderCommand missing at $message.header#/correlation_id header=correlation_id reason=Observed kafka evidence did not retain header 'correlation_id' required by declared correlationId location '$message.header#/correlation_id'."
      );
      expect(result.stdout).toContain(
        "- diagnostic: kafka send orders.command reply.address mismatched at $message.header#/reply_to header=reply_to declaredChannel=orders.reply reason=Observed kafka header 'reply_to' did not match declared AsyncAPI reply channel address 'orders.reply'."
      );
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_CORRELATION_ID_MISSING");
      expect(result.stdout).toContain("runtime_operations=1");
      expect(result.stdout).toContain("runtime_satisfied_operations=0");
      expect(result.stdout).toContain("runtime_unsatisfied_operations=1");
      expect(result.stdout).toContain("runtime_total_semantics=2");
      expect(result.stdout).toContain("runtime_satisfied_semantics=1");
      expect(result.stdout).toContain("runtime_unsatisfied_semantics=1");
      expect(result.stdout).toContain("runtime_semantic_coverage=50.00");
      expect(result.stdout).toContain("runtime_diagnostics=missing:2,unavailable:2,unsupported:0,mismatched:1");
      expect(result.stdout).toContain("class_counts=input:0,semantic:5,gate:0,runtime:0");
      expect(result.stdout).not.toContain("corr-runtime-mismatch");
      expect(result.stdout).not.toContain("orders.deadletter");
      expect(result.stderr).not.toContain("corr-runtime-mismatch");
      expect(result.stderr).not.toContain("orders.deadletter");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed with typed input diagnostics for invalid async JSONL evidence", async () => {
    const fixture = await createFixture(
      VALID_ASYNCAPI,
      ['{"kind":"kafka","action":"send","channel":"users.signedup","message":"UserSignedUp"}', "not-json"].join("\n")
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
      expect(result.code).toBe(2);
      expect(result.stderr).toContain("class=input");
      expect(result.stderr).toContain("INPUT_ASYNC_EVENTS_INVALID_LINES");
      expect(result.stdout).toContain("YANOTE_ASYNC_SUMMARY");
      expect(result.stdout).toContain('primary_reason="1 invalid JSONL line(s) detected at line(s) 2."');
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("fails closed on invalid AsyncAPI semantics with a typed semantic error", async () => {
    const fixture = await createFixture(
      [
        "asyncapi: 3.0.0",
        "info: { title: invalid-async, version: 1.0.0 }",
        "servers:",
        "  broker:",
        "    host: localhost:5672",
        "    protocol: amqp",
        "channels: {}",
        "operations: {}"
      ].join("\n"),
      '{"kind":"kafka","action":"send","channel":"users.signedup","message":"UserSignedUp"}'
    );

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        fixture.specPath,
        "--events",
        fixture.eventsPath,
        "--out",
        fixture.outDir
      ]);
      expect(result.code).toBe(5);
      expect(result.stderr).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_SPEC_INVALID");
      expect(result.stdout).toContain("report=none");
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_SPEC_INVALID");
      expect(result.stdout.trimEnd().split("\n").at(-1)?.startsWith("YANOTE_ASYNC_SUMMARY ")).toBe(true);
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps one primary async error line and deterministic secondary ordering", async () => {
    const fixture = await createFixture(
      VALID_ASYNCAPI,
      ['{"kind":"kafka","action":"send","channel":"users.signedup","message":"UserSignedUp"}', "not-json"].join("\n")
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
        "--min-coverage",
        "100"
      ]);

      expect(result.code).toBe(2);
      const stderrLines = result.stderr.trim().split("\n");
      expect(stderrLines[0]).toContain("YANOTE_ASYNC_ERROR class=input code=INPUT_ASYNC_EVENTS_INVALID_LINES");
      expect(stderrLines[1]).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=gate code=ASYNC_GATE_MIN_COVERAGE");
      expect(stderrLines.filter((line) => line.startsWith("YANOTE_ASYNC_ERROR "))).toHaveLength(1);
      expect(result.stdout).toContain("primary=INPUT_ASYNC_EVENTS_INVALID_LINES");
      expect(result.stdout).toContain('primary_reason="1 invalid JSONL line(s) detected at line(s) 2."');
      expect(result.stdout).toContain("class_counts=input:1,semantic:0,gate:1,runtime:0");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("keeps one primary semantic async error line and deterministic schema-depth secondary ordering", async () => {
    const fixture = await createFixture(
      SCHEMA_DEPTH_ASYNCAPI,
      [
        '{"kind":"kafka","ts":1710000001100,"action":"send","channel":"orders.created","message":"OrderCreatedEnvelope","payload":{"eventId":"evt-101","order":{"id":"ord-101"}},"service":"orders-service","test.run_id":"run-schema-invalid","test.suite":"suite-schema-invalid"}',
        '{"kind":"kafka","ts":1710000001200,"action":"send","channel":"orders.created","message":"OrderCreatedEnvelope","service":"orders-service","test.run_id":"run-schema-missing","test.suite":"suite-schema-missing"}'
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
      const stderrLines = result.stderr.trim().split("\n");
      expect(stderrLines[0]).toContain("YANOTE_ASYNC_ERROR class=semantic code=ASYNC_SEMANTIC_MISSING_PAYLOAD");
      expect(stderrLines[1]).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_INVALID_PAYLOAD");
      expect(stderrLines[2]).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_MISSING_HEADER");
      expect(stderrLines.filter((line) => line.startsWith("YANOTE_ASYNC_ERROR "))).toHaveLength(1);
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_MISSING_PAYLOAD");
      expect(result.stdout).toContain(
        'primary_reason="Async evidence kafka send orders.created is missing payload required by schema OrderCreatedPayload at /: Observed kafka evidence did not include a payload."'
      );
      expect(result.stdout).toContain("class_counts=input:0,semantic:4,gate:0,runtime:0");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});

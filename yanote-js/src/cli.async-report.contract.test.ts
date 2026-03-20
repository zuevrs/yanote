import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
      const issuesIndex = output.indexOf("\nTop Issues\n");
      const pathIndex = output.indexOf("\nReport Path\n");
      const machineIndex = output.lastIndexOf("\nYANOTE_ASYNC_SUMMARY ");

      expect(summaryIndex).toBeGreaterThanOrEqual(0);
      expect(dimensionsIndex).toBeGreaterThan(summaryIndex);
      expect(issuesIndex).toBeGreaterThan(dimensionsIndex);
      expect(pathIndex).toBeGreaterThan(issuesIndex);
      expect(machineIndex).toBeGreaterThan(pathIndex);

      const lines = output.trimEnd().split("\n");
      expect(lines[lines.length - 1].startsWith("YANOTE_ASYNC_SUMMARY ")).toBe(true);
      expect((output.match(/YANOTE_ASYNC_SUMMARY /g) ?? []).length).toBe(1);
      expect(output).toContain('primary_reason="none"');
      expect(output).not.toMatch(/\u001b\[[0-9;]*m/);
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
      expect(stderrLines[2]).toContain("YANOTE_ASYNC_ERROR_SECONDARY class=semantic code=ASYNC_SEMANTIC_UNVERIFIABLE_HEADERS");
      expect(stderrLines.filter((line) => line.startsWith("YANOTE_ASYNC_ERROR "))).toHaveLength(1);
      expect(result.stdout).toContain("primary=ASYNC_SEMANTIC_MISSING_PAYLOAD");
      expect(result.stdout).toContain(
        'primary_reason="Async evidence kafka send orders.created is missing payload required by schema OrderCreatedPayload at /: Observed kafka evidence did not include a payload."'
      );
      expect(result.stdout).toContain("class_counts=input:0,semantic:3,gate:0,runtime:0");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});

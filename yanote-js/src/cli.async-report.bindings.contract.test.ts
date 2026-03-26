import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

const VALID_ASYNCAPI = [
  "asyncapi: 3.0.0",
  "info:",
  "  title: cli-binding-contract",
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
  "operations:",
  "  sendUserSignedUp:",
  "    action: send",
  "    channel:",
  "      $ref: '#/channels/usersSignedUp'",
  "    messages:",
  "      - $ref: '#/channels/usersSignedUp/messages/UserSignedUp'"
].join("\n");

async function createFixture(specYaml: string, eventsJsonl: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-async-bindings-"));
  const specPath = path.join(dir, "asyncapi.yaml");
  const eventsPath = path.join(dir, "events.jsonl");
  const outDir = path.join(dir, "out");

  await writeFile(specPath, specYaml, "utf8");
  await writeFile(eventsPath, eventsJsonl, "utf8");

  return { dir, specPath, eventsPath, outDir };
}

describe("cli async-report kafka binding support contract", () => {
  it("prints a Kafka Binding Support section and count-only machine tokens while keeping report= JSON-centered", async () => {
    const fixture = await createFixture(
      VALID_ASYNCAPI,
      '{"kind":"kafka","action":"send","channel":"users.signedup","message":"UserSignedUp","test.run_id":"r-bindings-empty","test.suite":"suite-bindings-empty"}\n'
    );

    try {
      const baseline = await runCli([
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

      expect(baseline.code).toBe(0);
      expect(baseline.stdout).toContain("Kafka Binding Support");
      expect(baseline.stdout).toContain("- operations with bindings: 0");
      expect(baseline.stdout).toContain("- total bindings: 0");
      expect(baseline.stdout).toContain("- supported bindings: 0");
      expect(baseline.stdout).toContain("- declared-only bindings: 0");
      expect(baseline.stdout).toContain("- deferred bindings: 0");
      expect(baseline.stdout).toContain("- invalid bindings: 0");
      expect(baseline.stdout).toContain("- details: none");

      const summaryLine = baseline.stdout.trimEnd().split("\n").at(-1) ?? "";
      expect(summaryLine).toContain("binding_operations=0");
      expect(summaryLine).toContain("binding_total=0");
      expect(summaryLine).toContain("binding_supported=0");
      expect(summaryLine).toContain("binding_declared_only=0");
      expect(summaryLine).toContain("binding_deferred=0");
      expect(summaryLine).toContain("binding_invalid=0");
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it("surfaces the Kafka bindings matrix on stdout in deterministic section order without leaking per-binding detail into machine tokens", async () => {
    const outRoot = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-async-bindings-matrix-"));
    const outDir = path.join(outRoot, "out");

    try {
      const result = await runCli([
        "async-report",
        "--spec",
        "test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml",
        "--events",
        "test/fixtures/async-events/kafka-bindings.fixture.jsonl",
        "--out",
        outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(0);
      expect(result.stderr).toBe("");

      const output = result.stdout;
      const summaryIndex = output.indexOf("Summary\n");
      const dimensionsIndex = output.indexOf("\nCoverage Dimensions\n");
      const bindingIndex = output.indexOf("\nKafka Binding Support\n");
      const declaredSemanticsIndex = output.indexOf("\nDeclared Semantics\n");
      const runtimeSemanticsIndex = output.indexOf("\nRuntime Semantics\n");
      const issuesIndex = output.indexOf("\nTop Issues\n");
      const pathIndex = output.indexOf("\nReport Path\n");
      const machineIndex = output.lastIndexOf("\nYANOTE_ASYNC_SUMMARY ");
      const reportPath = path.join(outDir, "yanote-async-report.json");
      const reportPathSection = output.split("\nReport Path\n")[1]?.split("\n\nYANOTE_ASYNC_SUMMARY ")[0]?.trim();
      const summaryLine = output.trimEnd().split("\n").at(-1) ?? "";

      expect(summaryIndex).toBeGreaterThanOrEqual(0);
      expect(dimensionsIndex).toBeGreaterThan(summaryIndex);
      expect(bindingIndex).toBeGreaterThan(dimensionsIndex);
      expect(declaredSemanticsIndex).toBeGreaterThan(bindingIndex);
      expect(runtimeSemanticsIndex).toBeGreaterThan(declaredSemanticsIndex);
      expect(issuesIndex).toBeGreaterThan(runtimeSemanticsIndex);
      expect(pathIndex).toBeGreaterThan(issuesIndex);
      expect(machineIndex).toBeGreaterThan(pathIndex);

      expect(output).toContain("Kafka Binding Support");
      expect(output).toContain("- operations with bindings: 3");
      expect(output).toContain("- total bindings: 18");
      expect(output).toContain("- supported bindings: 1");
      expect(output).toContain("- declared-only bindings: 6");
      expect(output).toContain("- deferred bindings: 11");
      expect(output).toContain("- invalid bindings: 0");
      expect(output).toContain(
        "- kafka send orders.command: supported=channel.topic=orders.actual [source=channel.bindings.kafka.topic]"
      );
      expect(output).toContain(
        "declared-only=operation.groupId [source=operation.bindings.kafka.groupId], operation.clientId [source=operation.bindings.kafka.clientId], message.OrderCommand.key [source=message.bindings.kafka.key]"
      );
      expect(output).toContain(
        "deferred=channel.partitions [source=channel.bindings.kafka.partitions], channel.replicas [source=channel.bindings.kafka.replicas], channel.topicConfiguration [source=channel.bindings.kafka.topicConfiguration]"
      );
      expect(output).toContain(
        "- kafka send users.lifecycle: supported=none; declared-only=none; deferred=message.UserLifecycleEvent.schemaIdLocation [source=message.bindings.kafka.schemaIdLocation]"
      );
      expect(output).toContain("Declared Semantics");
      expect(output).toContain("- operations with declarations: 0");
      expect(output).toContain("Runtime Semantics");
      expect(output).toContain("- operations with runtime semantics: 0");
      expect(reportPathSection).toBe(reportPath);
      expect(summaryLine.startsWith("YANOTE_ASYNC_SUMMARY ")).toBe(true);
      expect(summaryLine).toContain(`report=${reportPath}`);
      expect(summaryLine).toContain("binding_operations=3");
      expect(summaryLine).toContain("binding_total=18");
      expect(summaryLine).toContain("binding_supported=1");
      expect(summaryLine).toContain("binding_declared_only=6");
      expect(summaryLine).toContain("binding_deferred=11");
      expect(summaryLine).toContain("binding_invalid=0");
      expect(summaryLine).not.toContain("yanote-async-report.html");
      expect(summaryLine).not.toContain("orders.actual");
      expect(summaryLine).not.toContain("OrderCommand");
      expect(summaryLine).not.toContain("schemaLookupStrategy");
    } finally {
      await rm(outRoot, { recursive: true, force: true });
    }
  });
});

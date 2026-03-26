import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

type CommandCase = {
  label: string;
  command: "report" | "async-report";
  specFixturePath: string;
  localFileName: string;
  reportFileName: string;
  summaryToken: string;
  eventsText: string;
  assertArtifact: (artifact: any) => void;
};

const ASYNC_EVENTS = await readFile("test/fixtures/async-events/kafka-bindings.fixture.jsonl", "utf8");

const COMMAND_CASES: CommandCase[] = [
  {
    label: "report",
    command: "report",
    specFixturePath: "test/fixtures/openapi/simple.yaml",
    localFileName: "openapi.yaml",
    reportFileName: "yanote-report.json",
    summaryToken: "YANOTE_SUMMARY",
    eventsText: await readFile("test/fixtures/events/events.valid.fixture.jsonl", "utf8"),
    assertArtifact: (artifact) => {
      expect(artifact.summary.totalOperations).toBeGreaterThan(0);
      expect(artifact.summary.coveredOperations).toBeGreaterThan(0);
      expect(artifact.summary.deprecatedOperations).toEqual({
        totalOperations: 0,
        coveredOperations: 0,
        uncoveredOperations: 0,
        operationCoveragePercent: 0
      });
      expect(artifact.coverage.perOperation.every((entry: any) => entry.deprecated === false)).toBe(true);
    }
  },
  {
    label: "async-report",
    command: "async-report",
    specFixturePath: "test/fixtures/asyncapi/kafka-bindings-matrix-v3.yaml",
    localFileName: "asyncapi.yaml",
    reportFileName: "yanote-async-report.json",
    summaryToken: "YANOTE_ASYNC_SUMMARY",
    eventsText: ASYNC_EVENTS,
    assertArtifact: (artifact) => {
      expect(artifact.summary.totalOperations).toBeGreaterThan(0);
      expect(artifact.summary.totalChannels).toBeGreaterThan(0);
      expect(artifact.bindingSupport).toEqual({
        summary: {
          totalOperations: 3,
          totalBindings: 18,
          supportedBindings: 1,
          declaredOnlyBindings: 6,
          deferredBindings: 11,
          invalidBindings: 0
        },
        operations: [
          {
            operationKey: "kafka receive orders.consumer",
            channel: "orders.consumer",
            action: "receive",
            bindings: [
              {
                scope: "operation",
                field: "groupId",
                status: "declared-only",
                source: "operation.bindings.kafka.groupId"
              },
              {
                scope: "operation",
                field: "clientId",
                status: "declared-only",
                source: "operation.bindings.kafka.clientId"
              },
              {
                scope: "message",
                messageName: "OrderConsumerEvent",
                field: "key",
                status: "declared-only",
                source: "message.bindings.kafka.key"
              }
            ]
          },
          {
            operationKey: "kafka send orders.command",
            channel: "orders.command",
            action: "send",
            bindings: [
              {
                scope: "channel",
                field: "topic",
                status: "supported",
                source: "channel.bindings.kafka.topic",
                value: "orders.actual"
              },
              {
                scope: "channel",
                field: "partitions",
                status: "deferred",
                source: "channel.bindings.kafka.partitions"
              },
              {
                scope: "channel",
                field: "replicas",
                status: "deferred",
                source: "channel.bindings.kafka.replicas"
              },
              {
                scope: "channel",
                field: "topicConfiguration",
                status: "deferred",
                source: "channel.bindings.kafka.topicConfiguration"
              },
              {
                scope: "operation",
                field: "groupId",
                status: "declared-only",
                source: "operation.bindings.kafka.groupId"
              },
              {
                scope: "operation",
                field: "clientId",
                status: "declared-only",
                source: "operation.bindings.kafka.clientId"
              },
              {
                scope: "message",
                messageName: "OrderCommand",
                field: "key",
                status: "declared-only",
                source: "message.bindings.kafka.key"
              },
              {
                scope: "message",
                messageName: "OrderCommand",
                field: "schemaIdLocation",
                status: "deferred",
                source: "message.bindings.kafka.schemaIdLocation"
              },
              {
                scope: "message",
                messageName: "OrderCommand",
                field: "schemaLookupStrategy",
                status: "deferred",
                source: "message.bindings.kafka.schemaLookupStrategy"
              }
            ]
          },
          {
            operationKey: "kafka send users.lifecycle",
            channel: "users.lifecycle",
            action: "send",
            bindings: [
              {
                scope: "message",
                messageName: "UserLifecycleEvent",
                field: "schemaIdLocation",
                status: "deferred",
                source: "message.bindings.kafka.schemaIdLocation"
              },
              {
                scope: "message",
                messageName: "UserLifecycleEvent",
                field: "schemaIdLocation",
                status: "deferred",
                source: "message.bindings.kafka.schemaIdLocation"
              },
              {
                scope: "message",
                messageName: "UserLifecycleEvent",
                field: "schemaIdPayloadEncoding",
                status: "deferred",
                source: "message.bindings.kafka.schemaIdPayloadEncoding"
              },
              {
                scope: "message",
                messageName: "UserLifecycleEvent",
                field: "schemaIdPayloadEncoding",
                status: "deferred",
                source: "message.bindings.kafka.schemaIdPayloadEncoding"
              },
              {
                scope: "message",
                messageName: "UserLifecycleEvent",
                field: "schemaLookupStrategy",
                status: "deferred",
                source: "message.bindings.kafka.schemaLookupStrategy"
              },
              {
                scope: "message",
                messageName: "UserLifecycleEvent",
                field: "schemaLookupStrategy",
                status: "deferred",
                source: "message.bindings.kafka.schemaLookupStrategy"
              }
            ]
          }
        ]
      });
      expect(artifact.declaredSemantics).toEqual({
        summary: {
          totalOperations: 0,
          operationsWithCorrelationId: 0,
          messageCorrelationIds: 0,
          operationsWithReply: 0
        },
        operations: []
      });
      expect(artifact.runtimeSemantics).toEqual({
        summary: {
          totalOperations: 0,
          satisfiedOperations: 0,
          unsatisfiedOperations: 0,
          totalSemantics: 0,
          satisfiedSemantics: 0,
          unsatisfiedSemantics: 0,
          semanticCoveragePercent: null
        },
        operations: [],
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
    }
  }
];

describe("cli remote spec contract", () => {
  it.each(COMMAND_CASES)("accepts local file, local directory, and remote URL spec inputs on $label", async (commandCase) => {
    const specText = await readFile(commandCase.specFixturePath, "utf8");
    const fixture = await createFixtureWorkspace(commandCase.localFileName, specText, commandCase.eventsText);
    const server = await startFixtureServer({
      [`/${commandCase.localFileName}`]: {
        body: specText
      }
    });

    try {
      const specs = {
        "local file": {
          kind: "local-file",
          reference: fixture.localFilePath
        },
        "local directory": {
          kind: "local-directory",
          reference: fixture.localDirectoryPath
        },
        "remote url": {
          kind: "remote-url",
          reference: `${server.baseUrl}/${commandCase.localFileName}`
        }
      } as const;

      for (const [label, specCase] of Object.entries(specs)) {
        const outDir = path.join(fixture.dir, `out-${label.replace(/\s+/g, "-")}`);
        const result = await runCli([
          commandCase.command,
          "--spec",
          specCase.reference,
          "--events",
          fixture.eventsPath,
          "--out",
          outDir,
          "--profile",
          "local"
        ]);

        expect(result.code).toBe(0);
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain(commandCase.summaryToken);
        expect(result.stdout).toContain("primary=none");
        expect(result.stdout).toContain(`- spec source: ${specCase.kind} (${specCase.reference})`);
        expect(result.stdout).toContain(`spec_source_kind=${specCase.kind}`);
        expect(result.stdout).toContain(`spec_source_ref="${specCase.reference}"`);
        if (commandCase.command === "report") {
          expect(result.stdout).toContain("- deprecated operations: covered=0/0 uncovered=0 (0.00%)");
          expect(result.stdout).toContain("deprecated_operations=0.00");
          expect(result.stdout).toContain("deprecated_total=0");
          expect(result.stdout).toContain("deprecated_covered=0");
          expect(result.stdout).toContain("deprecated_uncovered=0");
        } else {
          expect(result.stdout).toContain("Kafka Binding Support");
          expect(result.stdout).toContain("- operations with bindings: 3");
          expect(result.stdout).toContain("- total bindings: 18");
          expect(result.stdout).toContain("- supported bindings: 1");
          expect(result.stdout).toContain("- declared-only bindings: 6");
          expect(result.stdout).toContain("- deferred bindings: 11");
          expect(result.stdout).toContain("- invalid bindings: 0");
          expect(result.stdout).toContain(
            "- kafka send orders.command: supported=channel.topic=orders.actual [source=channel.bindings.kafka.topic]"
          );
          expect(result.stdout).toContain(
            "declared-only=operation.groupId [source=operation.bindings.kafka.groupId], operation.clientId [source=operation.bindings.kafka.clientId], message.OrderCommand.key [source=message.bindings.kafka.key]"
          );
          expect(result.stdout).toContain(
            "deferred=channel.partitions [source=channel.bindings.kafka.partitions], channel.replicas [source=channel.bindings.kafka.replicas], channel.topicConfiguration [source=channel.bindings.kafka.topicConfiguration]"
          );
          expect(result.stdout).toContain("Declared Semantics");
          expect(result.stdout).toContain("- operations with declarations: 0");
          expect(result.stdout).toContain("- details: none");
          expect(result.stdout).toContain("Runtime Semantics");
          expect(result.stdout).toContain("- operations with runtime semantics: 0");
          expect(result.stdout).toContain("- satisfied operations: 0");
          expect(result.stdout).toContain("- unsatisfied operations: 0");
          expect(result.stdout).toContain("- declared semantics: 0");
          expect(result.stdout).toContain("- satisfied semantics: 0");
          expect(result.stdout).toContain("- unsatisfied semantics: 0");
          expect(result.stdout).toContain("- runtime proof coverage: N/A");
          expect(result.stdout).toContain("- diagnostics: missing=0 unavailable=0 unsupported=0 mismatched=0");
          expect(result.stdout).toContain("binding_operations=3");
          expect(result.stdout).toContain("binding_total=18");
          expect(result.stdout).toContain("binding_supported=1");
          expect(result.stdout).toContain("binding_declared_only=6");
          expect(result.stdout).toContain("binding_deferred=11");
          expect(result.stdout).toContain("binding_invalid=0");
          expect(result.stdout).toContain("declared_operations=0");
          expect(result.stdout).toContain("declared_correlation_operations=0");
          expect(result.stdout).toContain("declared_correlation_messages=0");
          expect(result.stdout).toContain("declared_reply_operations=0");
          expect(result.stdout).toContain("runtime_operations=0");
          expect(result.stdout).toContain("runtime_satisfied_operations=0");
          expect(result.stdout).toContain("runtime_unsatisfied_operations=0");
          expect(result.stdout).toContain("runtime_total_semantics=0");
          expect(result.stdout).toContain("runtime_satisfied_semantics=0");
          expect(result.stdout).toContain("runtime_unsatisfied_semantics=0");
          expect(result.stdout).toContain("runtime_semantic_coverage=NA");
          expect(result.stdout).toContain("runtime_diagnostics=missing:0,unavailable:0,unsupported:0,mismatched:0");
          expect(result.stdout).not.toContain("- deprecated operations:");
          expect(result.stdout).not.toContain("deprecated_operations=");
          expect(result.stdout).not.toContain("corr-123");
        }

        const artifact = JSON.parse(await readFile(path.join(outDir, commandCase.reportFileName), "utf8"));
        expect(artifact.specSource).toEqual({
          kind: specCase.kind,
          reference: specCase.reference
        });
        commandCase.assertArtifact(artifact);
      }
    } finally {
      await server.close();
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it.each(COMMAND_CASES)("fails closed for credential-bearing remote URLs on $label without echoing secrets", async (commandCase) => {
    const specText = await readFile(commandCase.specFixturePath, "utf8");
    const fixture = await createFixtureWorkspace(commandCase.localFileName, specText, commandCase.eventsText);
    const server = await startFixtureServer({
      [`/${commandCase.localFileName}`]: {
        body: specText
      }
    });

    try {
      const port = new URL(server.baseUrl).port;
      const unsafeUrl = `http://user:secret@127.0.0.1:${port}/${commandCase.localFileName}?token=abc#frag`;
      const outDir = path.join(fixture.dir, "out-unsafe");
      const result = await runCli([
        commandCase.command,
        "--spec",
        unsafeUrl,
        "--events",
        fixture.eventsPath,
        "--out",
        outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(2);
      expect(result.stdout).toContain(commandCase.summaryToken);
      expect(result.stdout).toContain("primary=INPUT_SPEC_REMOTE_URL_UNSAFE");
      expect(result.stderr).toContain("INPUT_SPEC_REMOTE_URL_UNSAFE");
      expect(result.stdout).not.toContain(unsafeUrl);
      expect(result.stderr).not.toContain(unsafeUrl);
      expect(result.stdout).not.toContain("secret");
      expect(result.stderr).not.toContain("secret");
      await expect(readFile(path.join(outDir, commandCase.reportFileName), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
      expect(server.requestCount()).toBe(0);
    } finally {
      await server.close();
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });

  it.each(COMMAND_CASES)("rejects unsupported remote schemes on $label with a typed input failure", async (commandCase) => {
    const specText = await readFile(commandCase.specFixturePath, "utf8");
    const fixture = await createFixtureWorkspace(commandCase.localFileName, specText, commandCase.eventsText);
    const outDir = path.join(fixture.dir, "out-unsupported-scheme");

    try {
      const result = await runCli([
        commandCase.command,
        "--spec",
        `ftp://example.test/${commandCase.localFileName}`,
        "--events",
        fixture.eventsPath,
        "--out",
        outDir,
        "--profile",
        "local"
      ]);

      expect(result.code).toBe(2);
      expect(result.stdout).toContain(commandCase.summaryToken);
      expect(result.stdout).toContain("primary=INPUT_SPEC_REMOTE_SCHEME_UNSUPPORTED");
      expect(result.stderr).toContain("INPUT_SPEC_REMOTE_SCHEME_UNSUPPORTED");
      await expect(readFile(path.join(outDir, commandCase.reportFileName), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});

async function createFixtureWorkspace(localFileName: string, specText: string, eventsText: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-cli-remote-spec-"));
  const localFilePath = path.join(dir, localFileName);
  const localDirectoryPath = path.join(dir, "spec-dir");
  const directorySpecPath = path.join(localDirectoryPath, localFileName);
  const eventsPath = path.join(dir, "events.jsonl");

  await writeFile(localFilePath, specText, "utf8");
  await writeFile(eventsPath, eventsText, "utf8");
  await mkdir(localDirectoryPath, { recursive: true });
  await writeFile(directorySpecPath, specText, "utf8");

  return {
    dir,
    localFilePath,
    localDirectoryPath,
    eventsPath
  };
}

async function startFixtureServer(
  routes: Record<string, { body: string; status?: number; contentType?: string }>
): Promise<{
  baseUrl: string;
  requestCount: () => number;
  close: () => Promise<void>;
}> {
  let requestCount = 0;
  const server = createServer((req, res) => {
    requestCount += 1;
    handleRequest(req, res, routes);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("expected fixture server to bind to a TCP port");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requestCount: () => requestCount,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  };
}

function handleRequest(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  routes: Record<string, { body: string; status?: number; contentType?: string }>
): void {
  const route = routes[req.url ?? "/"];
  if (!route) {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("not found");
    return;
  }

  res.statusCode = route.status ?? 200;
  res.setHeader("content-type", route.contentType ?? "application/yaml; charset=utf-8");
  res.end(route.body);
}

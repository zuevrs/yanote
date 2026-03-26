import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import stringify from "json-stable-stringify";
import { describe, expect, it } from "vitest";
import { computeCoverage } from "../coverage/coverage.js";
import { readHttpEventsJsonl } from "../events/readJsonl.js";
import { resolveSpecSource } from "../spec/specSource.js";
import { loadOpenApiCoverageModel } from "../spec/openapi.js";
import { computeHttpPayloadConformance } from "../coverage/httpPayloadConformance.js";
import { buildReport } from "./report.js";
import { normalizeReport } from "./normalize.js";
import { validateReport } from "./schema.js";
import { writeYanoteReport } from "./writeReport.js";

type SpecCase = {
  label: string;
  input: string;
  expected: {
    kind: "local-file" | "local-directory" | "remote-url";
    reference: string;
  };
};

describe("report remote spec provenance contract", () => {
  it("serializes deterministic schema-valid specSource provenance for local file, local directory, and remote URL inputs", async () => {
    const specText = await readFile("test/fixtures/openapi/simple.yaml", "utf8");
    const events = await readHttpEventsJsonl("test/fixtures/events/events.valid.fixture.jsonl");
    const fixture = await createFixtureWorkspace("openapi.yaml", specText);
    const server = await startFixtureServer({
      "/openapi.yaml": {
        body: specText
      }
    });

    try {
      const model = await loadOpenApiCoverageModel(fixture.localFilePath);
      const coverage = computeCoverage(model.operations, events.items, [], {
        operationContractsByKey: model.operationContractsByKey
      });
      const payloadConformance = computeHttpPayloadConformance(model.operations, events.items, {
        operationContractsByKey: model.operationContractsByKey
      });

      const specCases: SpecCase[] = [
        {
          label: "local file",
          input: fixture.localFilePath,
          expected: {
            kind: "local-file",
            reference: fixture.localFilePath
          }
        },
        {
          label: "local directory",
          input: fixture.localDirectoryPath,
          expected: {
            kind: "local-directory",
            reference: fixture.localDirectoryPath
          }
        },
        {
          label: "remote url",
          input: `${server.baseUrl}/openapi.yaml`,
          expected: {
            kind: "remote-url",
            reference: `${server.baseUrl}/openapi.yaml`
          }
        }
      ];

      const reports = [];
      for (const specCase of specCases) {
        const resolved = await resolveSpecSource(specCase.input);
        try {
          const report = normalizeReport(
            buildReport(coverage, {
              toolVersion: "test",
              specSource: resolved.provenance,
              eventTimestamps: events.items
                .map((event) => event.ts)
                .filter((timestamp): timestamp is number => typeof timestamp === "number"),
              payloadConformance
            })
          );

          expect(validateReport(report).ok).toBe(true);
          expect(report.specSource).toEqual(specCase.expected);
          expect(report.summary.deprecatedOperations).toEqual({
            totalOperations: 0,
            coveredOperations: 0,
            uncoveredOperations: 0,
            operationCoveragePercent: 0
          });
          expect(report.coverage.perOperation.every((entry) => entry.deprecated === false)).toBe(true);

          const serialized = `${stringify(report, { space: 2 })}\n`;
          expect(serialized).toContain(
            `"specSource": {\n    "kind": "${specCase.expected.kind}",\n    "reference": "${specCase.expected.reference}"\n  }`
          );

          const outDir = path.join(fixture.dir, `out-${specCase.label.replaceAll(/\s+/g, "-")}`);
          const jsonPath = await writeYanoteReport(outDir, report);
          const html = await readFile(path.join(outDir, "yanote-report.html"), "utf8");
          const json = await readFile(jsonPath, "utf8");

          expect(jsonPath).toBe(path.join(outDir, "yanote-report.json"));
          expect(json).toContain(`"kind": "${specCase.expected.kind}"`);
          expect(json).toContain(`"reference": "${specCase.expected.reference}"`);
          expect(html).toContain("Provenance");
          expect(html).toContain(specCase.expected.kind);
          expect(html).toContain(specCase.expected.reference);
          expect(html).not.toMatch(/\b(?:src|href)=['"]https?:\/\//i);

          reports.push({ label: specCase.label, report });
        } finally {
          await resolved.cleanup();
        }
      }

      const baseline = reports[0]?.report;
      expect(baseline).toBeDefined();
      for (const { label, report } of reports.slice(1)) {
        expect(report.summary).toEqual(baseline?.summary);
        expect(report.coverage.operations).toEqual(baseline?.coverage.operations);
        expect(report.diagnostics).toEqual(baseline?.diagnostics);
        expect(report.httpPayloadConformance.summary).toEqual(baseline?.httpPayloadConformance.summary);
        expect(label).toMatch(/local directory|remote url/);
      }
    } finally {
      await server.close();
      await rm(fixture.dir, { recursive: true, force: true });
    }
  });
});

async function createFixtureWorkspace(localFileName: string, specText: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-report-remote-spec-"));
  const localFilePath = path.join(dir, localFileName);
  const localDirectoryPath = path.join(dir, "spec-dir");
  const directorySpecPath = path.join(localDirectoryPath, localFileName);

  await writeFile(localFilePath, specText, "utf8");
  await mkdir(localDirectoryPath, { recursive: true });
  await writeFile(directorySpecPath, specText, "utf8");

  return {
    dir,
    localFilePath,
    localDirectoryPath
  };
}

async function startFixtureServer(
  routes: Record<string, { body: string; status?: number; contentType?: string }>
): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = createServer((req, res) => {
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

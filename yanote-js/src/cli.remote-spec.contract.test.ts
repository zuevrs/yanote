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

const ASYNC_EVENTS =
  '{"kind":"kafka","action":"send","channel":"users.signedup","message":"UserSignedUp","test.run_id":"run-remote","test.suite":"suite-remote"}\n';

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
    specFixturePath: "test/fixtures/asyncapi/v3.yaml",
    localFileName: "asyncapi.yaml",
    reportFileName: "yanote-async-report.json",
    summaryToken: "YANOTE_ASYNC_SUMMARY",
    eventsText: ASYNC_EVENTS,
    assertArtifact: (artifact) => {
      expect(artifact.summary.totalOperations).toBeGreaterThan(0);
      expect(artifact.summary.totalChannels).toBeGreaterThan(0);
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
          expect(result.stdout).not.toContain("- deprecated operations:");
          expect(result.stdout).not.toContain("deprecated_operations=");
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

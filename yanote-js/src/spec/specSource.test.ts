import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSpecSource, SpecSourceError } from "./specSource.js";

type FixtureServer = {
  baseUrl: string;
  requestCount: () => number;
  close: () => Promise<void>;
};

const openServers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (openServers.length > 0) {
    const close = openServers.pop();
    if (close) {
      await close();
    }
  }
});

describe("specSource", () => {
  it("classifies local files and local directories without materializing temp copies", async () => {
    const fileSource = await resolveSpecSource("test/fixtures/openapi/simple.yaml");
    const directorySource = await resolveSpecSource("test/fixtures/openapi");

    try {
      expect(fileSource).toMatchObject({
        kind: "local-file",
        materializedPath: "test/fixtures/openapi/simple.yaml",
        provenance: {
          kind: "local-file",
          reference: "test/fixtures/openapi/simple.yaml"
        }
      });
      expect(directorySource).toMatchObject({
        kind: "local-directory",
        materializedPath: "test/fixtures/openapi",
        provenance: {
          kind: "local-directory",
          reference: "test/fixtures/openapi"
        }
      });
    } finally {
      await fileSource.cleanup();
      await directorySource.cleanup();
    }
  });

  it("materializes supported remote specs into a temp file with sanitized provenance", async () => {
    const specText = await readFile("test/fixtures/openapi/simple.yaml", "utf8");
    const server = await startFixtureServer({
      "/specs/openapi.yaml": {
        status: 200,
        body: specText
      }
    });

    const source = await resolveSpecSource(`${server.baseUrl}/specs/openapi.yaml`);

    try {
      expect(source.kind).toBe("remote-url");
      expect(source.provenance).toEqual({
        kind: "remote-url",
        reference: `${server.baseUrl}/specs/openapi.yaml`
      });
      expect(source.materializedPath).not.toContain(server.baseUrl);
      expect(await readFile(source.materializedPath, "utf8")).toBe(specText);
      expect(server.requestCount()).toBe(1);
    } finally {
      const materializedPath = source.materializedPath;
      await source.cleanup();
      await expect(stat(materializedPath)).rejects.toMatchObject({ code: "ENOENT" });
    }
  });

  it("rejects credential-bearing or token-like remote URLs before any fetch occurs", async () => {
    const server = await startFixtureServer({
      "/specs/openapi.yaml": {
        status: 200,
        body: await readFile("test/fixtures/openapi/simple.yaml", "utf8")
      }
    });

    await expect(resolveSpecSource(`http://user:token@127.0.0.1:${new URL(server.baseUrl).port}/specs/openapi.yaml?token=secret#frag`)).rejects.toMatchObject({
      code: "INPUT_SPEC_REMOTE_URL_UNSAFE"
    });
    expect(server.requestCount()).toBe(0);
  });

  it("rejects directory-like remote URLs instead of treating them as discoverable folders", async () => {
    const server = await startFixtureServer({
      "/specs/openapi.yaml": {
        status: 200,
        body: await readFile("test/fixtures/openapi/simple.yaml", "utf8")
      }
    });

    await expect(resolveSpecSource(`${server.baseUrl}/specs/`)).rejects.toMatchObject({
      code: "INPUT_SPEC_REMOTE_URL_AMBIGUOUS"
    });
    expect(server.requestCount()).toBe(0);
  });

  it("surfaces typed remote fetch failures without echoing the original URL", async () => {
    const server = await startFixtureServer({});
    const missingUrl = `${server.baseUrl}/missing/openapi.yaml`;

    try {
      await resolveSpecSource(missingUrl);
      throw new Error("expected resolveSpecSource to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(SpecSourceError);
      expect((error as SpecSourceError).code).toBe("INPUT_SPEC_REMOTE_FETCH_FAILED");
      expect((error as SpecSourceError).message).toContain("HTTP 404");
      expect((error as SpecSourceError).message).not.toContain(missingUrl);
    }

    expect(server.requestCount()).toBe(1);
  });
});

async function startFixtureServer(
  routes: Record<string, { body: string; status?: number; contentType?: string }>
): Promise<FixtureServer> {
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

  const close = async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  };
  openServers.push(close);

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requestCount: () => requestCount,
    close
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

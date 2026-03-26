import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ResolvedSpecSource } from "./specSource.js";

export type DiscoveredSpecs = {
  openapi?: string;
  asyncapi?: string;
};

const OPENAPI_RE = /^openapi.*\.(ya?ml|json)$/i;
const ASYNCAPI_RE = /^asyncapi.*\.(ya?ml|json)$/i;

export async function discoverSpecs(specSource: ResolvedSpecSource): Promise<DiscoveredSpecs> {
  if (specSource.kind === "local-directory") {
    return discoverSpecsInDirectory(specSource.materializedPath);
  }

  return discoverSpecsInFile(specSource.materializedPath);
}

async function discoverSpecsInFile(specPath: string): Promise<DiscoveredSpecs> {
  const base = path.basename(specPath).toLowerCase();
  if (base.startsWith("asyncapi")) {
    return { asyncapi: specPath };
  }

  try {
    const head = (await readFile(specPath, "utf8")).slice(0, 16_384);
    if (/^\s*asyncapi\s*:/m.test(head)) return { asyncapi: specPath };
    if (/^\s*openapi\s*:/m.test(head)) return { openapi: specPath };
  } catch {
    // ignore and fall back to the OpenAPI default
  }

  return { openapi: specPath };
}

async function discoverSpecsInDirectory(specPath: string): Promise<DiscoveredSpecs> {
  const entries = await readdir(specPath, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);

  const openapiFile = files.find((file) => OPENAPI_RE.test(file));
  const asyncapiFile = files.find((file) => ASYNCAPI_RE.test(file));

  return {
    openapi: openapiFile ? path.join(specPath, openapiFile) : undefined,
    asyncapi: asyncapiFile ? path.join(specPath, asyncapiFile) : undefined
  };
}

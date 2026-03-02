import { readdir, stat } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type DiscoveredSpecs = {
  openapi?: string;
  asyncapi?: string;
};

const OPENAPI_RE = /^openapi.*\.(ya?ml|json)$/i;
const ASYNCAPI_RE = /^asyncapi.*\.(ya?ml|json)$/i;

export async function discoverSpecs(specPath: string): Promise<DiscoveredSpecs> {
  const st = await stat(specPath);
  if (st.isFile()) {
    const base = path.basename(specPath).toLowerCase();
    if (base.startsWith("asyncapi")) {
      return { asyncapi: specPath };
    }
    // Content sniff to support arbitrary filenames.
    try {
      const head = (await readFile(specPath, "utf8")).slice(0, 16_384);
      if (/^\s*asyncapi\s*:/m.test(head)) return { asyncapi: specPath };
      if (/^\s*openapi\s*:/m.test(head)) return { openapi: specPath };
    } catch {
      // ignore and fall back
    }
    return { openapi: specPath };
  }

  if (!st.isDirectory()) {
    return {};
  }

  const entries = await readdir(specPath, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);

  const openapiFile = files.find((f) => OPENAPI_RE.test(f));
  const asyncapiFile = files.find((f) => ASYNCAPI_RE.test(f));

  return {
    openapi: openapiFile ? path.join(specPath, openapiFile) : undefined,
    asyncapi: asyncapiFile ? path.join(specPath, asyncapiFile) : undefined
  };
}


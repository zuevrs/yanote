import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";
import type { OperationKey } from "../model/operationKey.js";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"] as const;

export async function loadOpenApiOperations(specPath: string): Promise<OperationKey[]> {
  const api = (await SwaggerParser.dereference(specPath)) as OpenAPI.Document;
  const paths = (api as any)?.paths as Record<string, any> | undefined;
  if (!paths) {
    return [];
  }

  const ops: OperationKey[] = [];

  for (const [route, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as any)[method];
      if (!operation) continue;

      ops.push({
        kind: "http",
        method: method.toUpperCase(),
        route
      });
    }
  }

  return dedupeHttpOps(ops);
}

function dedupeHttpOps(ops: OperationKey[]): OperationKey[] {
  const seen = new Set<string>();
  const out: OperationKey[] = [];
  for (const op of ops) {
    if (op.kind !== "http") continue;
    const k = `${op.method} ${op.route}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(op);
  }
  return out;
}


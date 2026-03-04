import type { OpenAPI } from "openapi-types";
import type { OperationKey } from "../model/operationKey.js";
import type { SemanticDiagnostic, SemanticDiagnosticsBundle } from "./diagnostics.js";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

export type HttpSemanticsBundle = SemanticDiagnosticsBundle & {
  operations: OperationKey[];
};

export function buildHttpSemantics(spec: Pick<OpenAPI.Document, "paths"> | unknown): HttpSemanticsBundle {
  const operations: OperationKey[] = [];
  const diagnostics: SemanticDiagnostic[] = [];
  const seen = new Set<string>();

  if (!isRecord(spec)) {
    diagnostics.push({
      kind: "invalid",
      message: "OpenAPI document is not an object"
    });
    return {
      operations,
      diagnostics,
      hasInvalid: true
    };
  }

  const paths = spec.paths;
  if (!isRecord(paths)) {
    diagnostics.push({
      kind: "invalid",
      message: "OpenAPI document is missing a valid paths object"
    });
    return {
      operations,
      diagnostics,
      hasInvalid: true
    };
  }

  for (const [rawRoute, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) {
      diagnostics.push({
        kind: "invalid",
        route: rawRoute,
        message: "Path item must be an object"
      });
      continue;
    }

    const canonicalRoute = normalizeTemplatedRoute(rawRoute);
    if (!canonicalRoute.startsWith("/")) {
      diagnostics.push({
        kind: "invalid",
        route: rawRoute,
        message: "Path must start with '/'"
      });
      continue;
    }

    for (const method of HTTP_METHODS) {
      appendOperation(pathItem, method, canonicalRoute, seen, operations, diagnostics);
    }
  }

  return {
    operations,
    diagnostics,
    hasInvalid: diagnostics.some((diag) => diag.kind === "invalid")
  };
}

function appendOperation(
  pathItem: Record<string, unknown>,
  method: HttpMethod,
  canonicalRoute: string,
  seen: Set<string>,
  operations: OperationKey[],
  diagnostics: SemanticDiagnostic[]
): void {
  const operation = pathItem[method];
  if (operation === undefined) {
    return;
  }

  const methodUpper = method.toUpperCase();
  if (!isRecord(operation)) {
    diagnostics.push({
      kind: "invalid",
      method: methodUpper,
      route: canonicalRoute,
      message: "Operation must be an object"
    });
    return;
  }

  const key = `${methodUpper} ${canonicalRoute}`;
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  operations.push({
    kind: "http",
    method: methodUpper,
    route: canonicalRoute
  });
}

function normalizeTemplatedRoute(route: string): string {
  const trimmed = route.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  return trimmed.replace(/\{[^/}]+\}/g, "{param}");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";
import {
  compareDeclaredStatusToken,
  compareParameterDefinition,
  normalizeDeclaredStatusToken,
  type ParameterDefinition
} from "../coverage/dimensions.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import { buildHttpSemantics } from "./semantics.js";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

export type HttpOperationContract = {
  declaredStatuses: string[];
  parameters: ParameterDefinition[];
};

export type OpenApiCoverageModel = {
  operations: OperationKey[];
  operationContractsByKey: Map<string, HttpOperationContract>;
};

export async function loadOpenApiCoverageModel(specPath: string): Promise<OpenApiCoverageModel> {
  const api = (await SwaggerParser.dereference(specPath)) as OpenAPI.Document;
  const semantics = buildHttpSemantics(api);
  if (semantics.hasInvalid) {
    const details = semantics.diagnostics
      .filter((diag) => diag.kind === "invalid")
      .map((diag) => `${diag.method ? `${diag.method} ` : ""}${diag.route ?? "<unknown-route>"}: ${diag.message}`)
      .join("; ");
    throw new Error(`OpenAPI semantic extraction failed: ${details}`);
  }

  const extracted = extractHttpContracts(api);
  const operations = semantics.operations.filter((operation): operation is Extract<OperationKey, { kind: "http" }> => {
    return operation.kind === "http";
  });

  const operationContractsByKey = new Map<string, HttpOperationContract>();
  for (const operation of operations) {
    const operationKey = serializeOperationKey(operation);
    operationContractsByKey.set(operationKey, extracted.get(operationKey) ?? { declaredStatuses: [], parameters: [] });
  }

  return {
    operations,
    operationContractsByKey
  };
}

export async function loadOpenApiOperations(specPath: string): Promise<OperationKey[]> {
  return (await loadOpenApiCoverageModel(specPath)).operations;
}

function extractHttpContracts(document: OpenAPI.Document): Map<string, HttpOperationContract> {
  const out = new Map<string, HttpOperationContract>();
  const paths = isRecord(document.paths) ? document.paths : undefined;
  if (!paths) return out;

  for (const [rawRoute, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;

    const canonicalRoute = normalizeTemplatedRoute(rawRoute);
    const pathParameters = extractParameters(pathItem.parameters);

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isRecord(operation)) continue;

      const operationKey = serializeOperationKey({
        kind: "http",
        method: method.toUpperCase(),
        route: canonicalRoute
      });

      if (out.has(operationKey)) continue;

      const operationParameters = extractParameters(operation.parameters);
      const mergedParameters = mergeParameters(pathParameters, operationParameters);
      const declaredStatuses = extractDeclaredStatuses(operation.responses);

      out.set(operationKey, {
        declaredStatuses,
        parameters: mergedParameters
      });
    }
  }

  return out;
}

function extractDeclaredStatuses(value: unknown): string[] {
  if (!isRecord(value)) return [];

  const unique = new Set<string>();
  for (const rawToken of Object.keys(value)) {
    const normalized = normalizeDeclaredStatusToken(rawToken);
    if (!normalized) continue;
    unique.add(normalized);
  }

  return Array.from(unique).sort((left, right) => compareDeclaredStatusToken(left, right));
}

function mergeParameters(pathParameters: ParameterDefinition[], operationParameters: ParameterDefinition[]): ParameterDefinition[] {
  const merged = new Map<string, ParameterDefinition>();

  for (const parameter of pathParameters) {
    merged.set(`${parameter.in}:${parameter.name}`, parameter);
  }

  for (const parameter of operationParameters) {
    merged.set(`${parameter.in}:${parameter.name}`, parameter);
  }

  return Array.from(merged.values()).sort(compareParameterDefinition);
}

function extractParameters(value: unknown): ParameterDefinition[] {
  if (!Array.isArray(value)) return [];

  const out: ParameterDefinition[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;

    const location = entry.in;
    const name = entry.name;
    if (typeof name !== "string") continue;
    if (location !== "path" && location !== "query" && location !== "header") continue;

    out.push({
      name,
      in: location,
      required: location === "path" ? true : Boolean(entry.required)
    });
  }

  return out;
}

function normalizeTemplatedRoute(route: string): string {
  return route.trim().replace(/\{[^/}]+\}/g, "{param}");
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

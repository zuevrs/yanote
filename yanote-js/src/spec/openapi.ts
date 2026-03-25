import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";
import {
  compareDeclaredStatusToken,
  compareHttpRequestParameterContract,
  compareParameterDefinition,
  normalizeDeclaredStatusToken,
  type DeclaredStatusToken,
  type HttpRequestDeclaredSupport,
  type HttpRequestParameterContract,
  type HttpRequestParameterLocation,
  type HttpRequestParameterStyle,
  type HttpScalarSchemaContract,
  type ParameterDefinition
} from "../coverage/dimensions.js";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import { buildHttpSemantics } from "./semantics.js";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"] as const;
const SUPPORTED_PARAMETER_STYLE_BY_LOCATION: Record<HttpRequestParameterLocation, ReadonlySet<string>> = {
  path: new Set(["simple"]),
  query: new Set(["form"]),
  header: new Set(["simple"]),
  cookie: new Set(["form"])
};
const IGNORED_PARAMETER_SCHEMA_KEYS = new Set([
  "description",
  "title",
  "example",
  "examples",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "xml",
  "externalDocs"
]);

const HTTP_SCALAR_TYPES = new Set<HttpScalarSchemaContract["type"]>(["string", "integer", "number", "boolean"]);

type HttpMethod = (typeof HTTP_METHODS)[number];

export type JsonSchemaContract = Record<string, unknown> | boolean;

export type HttpMediaTypeContract = {
  mediaType: string;
  schema?: JsonSchemaContract;
};

export type HttpRequestBodyContract = {
  required: boolean;
  content: HttpMediaTypeContract[];
};

export type HttpResponseBodyContract = {
  declaredStatus: DeclaredStatusToken;
  content: HttpMediaTypeContract[];
};

export type HttpOperationContract = {
  declaredStatuses: string[];
  parameters: ParameterDefinition[];
  requestParameters?: HttpRequestParameterContract[];
  requestBody?: HttpRequestBodyContract;
  responseBodies: HttpResponseBodyContract[];
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
    operationContractsByKey.set(operationKey, extracted.get(operationKey) ?? createEmptyHttpOperationContract());
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
    const pathRequestParameters = extractRequestParameters(pathItem.parameters);

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isRecord(operation)) continue;

      const operationKey = serializeOperationKey({
        kind: "http",
        method: method.toUpperCase(),
        route: canonicalRoute
      });

      if (out.has(operationKey)) continue;

      const operationRequestParameters = extractRequestParameters(operation.parameters);
      const mergedRequestParameters = mergeRequestParameters(pathRequestParameters, operationRequestParameters);
      const declaredStatuses = extractDeclaredStatuses(operation.responses);

      out.set(operationKey, {
        declaredStatuses,
        parameters: mergedRequestParameters
          .filter((parameter): parameter is HttpRequestParameterContract & { in: ParameterDefinition["in"] } => parameter.in !== "cookie")
          .map((parameter) => ({
            name: parameter.name,
            in: parameter.in,
            required: parameter.required
          }))
          .sort(compareParameterDefinition),
        requestParameters: mergedRequestParameters,
        requestBody: extractRequestBodyContract(operation.requestBody),
        responseBodies: extractResponseBodyContracts(operation.responses)
      });
    }
  }

  return out;
}

function createEmptyHttpOperationContract(): HttpOperationContract {
  return {
    declaredStatuses: [],
    parameters: [],
    requestParameters: [],
    responseBodies: []
  };
}

function extractDeclaredStatuses(value: unknown): string[] {
  if (!isRecord(value)) return [];

  const unique = new Set<string>();
  for (const rawToken of Object.keys(value)) {
    const normalized = normalizeDeclaredStatusToken(rawToken);
    if (!normalized) continue;
    unique.add(normalized);
  }

  return Array.from(unique).sort((left, right) => compareDeclaredStatusToken(left as DeclaredStatusToken, right as DeclaredStatusToken));
}

function extractRequestBodyContract(value: unknown): HttpRequestBodyContract | undefined {
  if (!isRecord(value)) return undefined;

  return {
    required: Boolean(value.required),
    content: extractMediaTypeContracts(value.content)
  };
}

function extractResponseBodyContracts(value: unknown): HttpResponseBodyContract[] {
  if (!isRecord(value)) return [];

  const out: HttpResponseBodyContract[] = [];
  const seen = new Set<DeclaredStatusToken>();

  for (const [rawStatus, response] of Object.entries(value)) {
    const declaredStatus = normalizeDeclaredStatusToken(rawStatus);
    if (!declaredStatus || seen.has(declaredStatus)) continue;
    seen.add(declaredStatus);

    out.push({
      declaredStatus,
      content: isRecord(response) ? extractMediaTypeContracts(response.content) : []
    });
  }

  return out.sort((left, right) => compareDeclaredStatusToken(left.declaredStatus, right.declaredStatus));
}

function extractMediaTypeContracts(value: unknown): HttpMediaTypeContract[] {
  if (!isRecord(value)) return [];

  const out = new Map<string, HttpMediaTypeContract>();
  for (const [rawMediaType, mediaValue] of Object.entries(value)) {
    const mediaType = normalizeMediaType(rawMediaType);
    if (!mediaType || out.has(mediaType) || !isRecord(mediaValue)) continue;

    const schema = normalizeSchemaContract(mediaValue.schema);
    out.set(mediaType, {
      mediaType,
      schema
    });
  }

  return Array.from(out.values()).sort((left, right) => left.mediaType.localeCompare(right.mediaType));
}

function normalizeSchemaContract(value: unknown): JsonSchemaContract | undefined {
  if (typeof value === "boolean") return value;
  if (!isRecord(value)) return undefined;

  const normalized: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === "nullable") continue;

    switch (key) {
      case "properties":
      case "patternProperties":
      case "$defs":
      case "definitions":
        normalized[key] = normalizeSchemaMap(entry);
        break;
      case "items":
      case "additionalProperties":
      case "unevaluatedProperties":
      case "propertyNames":
      case "contains":
      case "not":
      case "if":
      case "then":
      case "else":
        normalized[key] = normalizeNestedSchema(entry);
        break;
      case "allOf":
      case "anyOf":
      case "oneOf":
      case "prefixItems":
        normalized[key] = normalizeSchemaArray(entry);
        break;
      default:
        normalized[key] = entry;
        break;
    }
  }

  normalizeExclusiveBoundary(normalized, "minimum", "exclusiveMinimum");
  normalizeExclusiveBoundary(normalized, "maximum", "exclusiveMaximum");

  if (value.nullable === true) {
    return applyNullableSchema(normalized);
  }

  return normalized;
}

function normalizeSchemaMap(value: unknown): unknown {
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, normalizeNestedSchema(entry)])
  );
}

function normalizeSchemaArray(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((entry) => normalizeNestedSchema(entry));
}

function normalizeNestedSchema(value: unknown): unknown {
  const normalized = normalizeSchemaContract(value);
  return normalized ?? value;
}

function normalizeExclusiveBoundary(
  schema: Record<string, unknown>,
  boundaryKey: "minimum" | "maximum",
  exclusiveKey: "exclusiveMinimum" | "exclusiveMaximum"
): void {
  const exclusive = schema[exclusiveKey];
  const boundary = schema[boundaryKey];

  if (exclusive === false) {
    delete schema[exclusiveKey];
    return;
  }

  if (exclusive === true && typeof boundary === "number" && Number.isFinite(boundary)) {
    delete schema[boundaryKey];
    schema[exclusiveKey] = boundary;
  }
}

function applyNullableSchema(schema: Record<string, unknown>): JsonSchemaContract {
  const enumValues = Array.isArray(schema.enum) ? [...schema.enum] : undefined;
  if (enumValues) {
    if (!enumValues.some((entry) => entry === null)) {
      enumValues.push(null);
    }
    return {
      ...schema,
      enum: enumValues
    };
  }

  const typeValue = schema.type;
  if (typeof typeValue === "string") {
    return {
      ...schema,
      type: typeValue === "null" ? "null" : [typeValue, "null"]
    };
  }

  if (Array.isArray(typeValue) && typeValue.every((entry) => typeof entry === "string")) {
    return {
      ...schema,
      type: typeValue.includes("null") ? typeValue : [...typeValue, "null"]
    };
  }

  return {
    anyOf: [schema, { type: "null" }]
  };
}

function mergeRequestParameters(
  pathParameters: HttpRequestParameterContract[],
  operationParameters: HttpRequestParameterContract[]
): HttpRequestParameterContract[] {
  const merged = new Map<string, HttpRequestParameterContract>();

  for (const parameter of pathParameters) {
    merged.set(`${parameter.in}:${parameter.name}`, parameter);
  }

  for (const parameter of operationParameters) {
    merged.set(`${parameter.in}:${parameter.name}`, parameter);
  }

  return Array.from(merged.values()).sort(compareHttpRequestParameterContract);
}

function extractRequestParameters(value: unknown): HttpRequestParameterContract[] {
  if (!Array.isArray(value)) return [];

  const out: HttpRequestParameterContract[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;

    const location = extractParameterLocation(entry.in);
    const name = typeof entry.name === "string" ? entry.name : undefined;
    if (!location || !name) continue;

    const style = normalizeParameterStyle(entry.style, location);
    const explode = typeof entry.explode === "boolean" ? entry.explode : style === "form";
    const declaredSupport = extractDeclaredRequestSupport(entry, location, style, explode);
    const scalar = extractRequestScalarContract(entry, location, style);

    out.push({
      name,
      in: location,
      required: location === "path" ? true : Boolean(entry.required),
      style,
      explode,
      declaredSupport,
      scalar
    });
  }

  return out;
}

function extractParameterLocation(value: unknown): HttpRequestParameterLocation | undefined {
  return value === "path" || value === "query" || value === "header" || value === "cookie" ? value : undefined;
}

function normalizeParameterStyle(value: unknown, location: HttpRequestParameterLocation): HttpRequestParameterStyle {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized.length > 0) return normalized;
  }

  switch (location) {
    case "path":
    case "header":
      return "simple";
    case "query":
    case "cookie":
      return "form";
  }
}

function extractDeclaredRequestSupport(
  parameter: Record<string, unknown>,
  location: HttpRequestParameterLocation,
  style: HttpRequestParameterStyle,
  explode: boolean
): HttpRequestDeclaredSupport {
  if (parameter.content !== undefined) {
    return { support: "unsupported", reason: "content" };
  }

  if (!SUPPORTED_PARAMETER_STYLE_BY_LOCATION[location].has(style)) {
    return { support: "unsupported", reason: "style" };
  }

  const scalarSchema = extractSupportedScalarSchema(parameter.schema);
  if (scalarSchema) {
    return {
      support: "supported",
      shape: "scalar",
      schema: scalarSchema
    };
  }

  const arrayItems = extractSupportedRepeatedQueryArrayItems(parameter.schema);
  if (!arrayItems) {
    return { support: "unsupported", reason: "schema" };
  }

  if (location !== "query") {
    return { support: "unsupported", reason: "style" };
  }

  if (style !== "form") {
    return { support: "unsupported", reason: "style" };
  }

  if (!explode) {
    return { support: "unsupported", reason: "explode" };
  }

  return {
    support: "supported",
    shape: "array",
    items: arrayItems
  };
}

function extractRequestScalarContract(
  parameter: Record<string, unknown>,
  location: HttpRequestParameterLocation,
  style: HttpRequestParameterStyle
): HttpRequestParameterContract["scalar"] {
  if (parameter.content !== undefined) {
    return { support: "unsupported", reason: "schema" };
  }

  if (!SUPPORTED_PARAMETER_STYLE_BY_LOCATION[location].has(style)) {
    return { support: "unsupported", reason: "style" };
  }

  const schema = extractSupportedScalarSchema(parameter.schema);
  if (!schema) {
    return { support: "unsupported", reason: "schema" };
  }

  return {
    support: "supported",
    schema
  };
}

function extractSupportedRepeatedQueryArrayItems(value: unknown): HttpScalarSchemaContract | undefined {
  if (!isRecord(value) || value.nullable === true || value.type !== "array") {
    return undefined;
  }

  for (const key of Object.keys(value)) {
    if (key === "type" || key === "items") continue;
    if (IGNORED_PARAMETER_SCHEMA_KEYS.has(key)) continue;
    return undefined;
  }

  return extractSupportedScalarSchema(value.items);
}

function extractSupportedScalarSchema(value: unknown): HttpScalarSchemaContract | undefined {
  if (!isRecord(value)) return undefined;

  const type = value.type;
  if (typeof type !== "string" || !HTTP_SCALAR_TYPES.has(type as HttpScalarSchemaContract["type"])) {
    return undefined;
  }

  if (value.nullable === true) return undefined;

  const schema: HttpScalarSchemaContract = {
    type: type as HttpScalarSchemaContract["type"]
  };

  for (const [key, entry] of Object.entries(value)) {
    if (key === "type") continue;
    if (IGNORED_PARAMETER_SCHEMA_KEYS.has(key)) continue;

    switch (key) {
      case "enum": {
        const normalized = normalizeScalarEnum(entry, schema.type);
        if (!normalized) return undefined;
        schema.enum = normalized;
        break;
      }
      case "minLength":
      case "maxLength": {
        if (schema.type !== "string") return undefined;
        const normalized = normalizeNonNegativeInteger(entry);
        if (normalized === undefined) return undefined;
        schema[key] = normalized;
        break;
      }
      case "pattern": {
        if (schema.type !== "string" || typeof entry !== "string") return undefined;
        try {
          new RegExp(entry);
        } catch {
          return undefined;
        }
        schema.pattern = entry;
        break;
      }
      case "minimum":
      case "maximum":
      case "exclusiveMinimum":
      case "exclusiveMaximum":
      case "multipleOf": {
        if (schema.type !== "integer" && schema.type !== "number") return undefined;
        if (typeof entry !== "number" || !Number.isFinite(entry)) return undefined;
        if (key === "multipleOf" && entry <= 0) return undefined;
        schema[key] = entry;
        break;
      }
      default:
        return undefined;
    }
  }

  if (schema.minLength !== undefined && schema.maxLength !== undefined && schema.minLength > schema.maxLength) {
    return undefined;
  }

  return schema;
}

function normalizeScalarEnum(
  value: unknown,
  type: HttpScalarSchemaContract["type"]
): Array<string | number | boolean> | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  switch (type) {
    case "string":
      return value.every((entry) => typeof entry === "string") ? [...value] : undefined;
    case "boolean":
      return value.every((entry) => typeof entry === "boolean") ? [...value] : undefined;
    case "integer":
      return value.every((entry) => typeof entry === "number" && Number.isInteger(entry)) ? [...value] : undefined;
    case "number":
      return value.every((entry) => typeof entry === "number" && Number.isFinite(entry)) ? [...value] : undefined;
  }
}

function normalizeNonNegativeInteger(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return undefined;
  return value;
}

function normalizeTemplatedRoute(route: string): string {
  return route.trim().replace(/\{[^/}]+\}/g, "{param}");
}

function normalizeMediaType(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return undefined;

  const mediaType = normalized.split(";", 1)[0]?.trim();
  return mediaType && mediaType.length > 0 ? mediaType : undefined;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

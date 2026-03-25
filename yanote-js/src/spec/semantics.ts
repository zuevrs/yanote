import type { OpenAPI } from "openapi-types";
import type { OperationKey } from "../model/operationKey.js";
import { serializeOperationKey } from "../model/operationKey.js";
import type { SemanticDiagnostic, SemanticDiagnosticsBundle } from "./diagnostics.js";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

type SecuritySchemeRecord = Record<string, unknown>;

export type HttpResolvedSecurityRequirementEntry = {
  schemeName: string;
  scopes: string[];
};

export type HttpResolvedSecurityRequirement = {
  schemes: HttpResolvedSecurityRequirementEntry[];
};

export type HttpResolvedOperationSecurity = {
  source: "implicit-open" | "root" | "operation";
  cleared: boolean;
  requirements: HttpResolvedSecurityRequirement[];
};

export type HttpSemanticsBundle = SemanticDiagnosticsBundle & {
  operations: OperationKey[];
  operationSecurityByKey: Map<string, HttpResolvedOperationSecurity>;
};

export function buildHttpSemantics(
  spec: Pick<OpenAPI.Document, "paths" | "components" | "security"> | unknown
): HttpSemanticsBundle {
  const operations: OperationKey[] = [];
  const diagnostics: SemanticDiagnostic[] = [];
  const seen = new Set<string>();
  const operationSecurityByKey = new Map<string, HttpResolvedOperationSecurity>();

  if (!isRecord(spec)) {
    diagnostics.push({
      kind: "invalid",
      message: "OpenAPI document is not an object"
    });
    return {
      operations,
      operationSecurityByKey,
      diagnostics,
      hasInvalid: true
    };
  }

  const securitySchemes = extractSecuritySchemes(spec, diagnostics);
  const paths = spec.paths;
  if (!isRecord(paths)) {
    diagnostics.push({
      kind: "invalid",
      message: "OpenAPI document is missing a valid paths object"
    });
    return {
      operations,
      operationSecurityByKey,
      diagnostics,
      hasInvalid: true
    };
  }

  const rootSecurity = resolveDocumentSecurity(spec.security, securitySchemes, diagnostics);

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
      appendOperation(
        pathItem,
        method,
        canonicalRoute,
        seen,
        operations,
        operationSecurityByKey,
        diagnostics,
        securitySchemes,
        rootSecurity
      );
    }
  }

  return {
    operations,
    operationSecurityByKey,
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
  operationSecurityByKey: Map<string, HttpResolvedOperationSecurity>,
  diagnostics: SemanticDiagnostic[],
  securitySchemes: Map<string, SecuritySchemeRecord>,
  rootSecurity: HttpResolvedOperationSecurity
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

  const resolvedSecurity =
    operation.security === undefined
      ? cloneOperationSecurity(rootSecurity)
      : resolveDeclaredSecurity(operation.security, securitySchemes, diagnostics, {
          source: "operation",
          method: methodUpper,
          route: canonicalRoute,
          label: "operation security"
        });

  seen.add(key);
  const operationKey = {
    kind: "http",
    method: methodUpper,
    route: canonicalRoute
  } satisfies Extract<OperationKey, { kind: "http" }>;
  operations.push(operationKey);
  operationSecurityByKey.set(serializeOperationKey(operationKey), resolvedSecurity);
}

function extractSecuritySchemes(
  spec: Record<string, unknown>,
  diagnostics: SemanticDiagnostic[]
): Map<string, SecuritySchemeRecord> {
  const out = new Map<string, SecuritySchemeRecord>();
  const components = spec.components;
  if (components === undefined) {
    return out;
  }

  if (!isRecord(components)) {
    diagnostics.push({
      kind: "invalid",
      message: "OpenAPI components must be an object when provided"
    });
    return out;
  }

  const securitySchemes = components.securitySchemes;
  if (securitySchemes === undefined) {
    return out;
  }

  if (!isRecord(securitySchemes)) {
    diagnostics.push({
      kind: "invalid",
      message: "OpenAPI components.securitySchemes must be an object when provided"
    });
    return out;
  }

  for (const [schemeName, rawScheme] of Object.entries(securitySchemes)) {
    if (!isRecord(rawScheme)) {
      diagnostics.push({
        kind: "invalid",
        message: `Security scheme '${schemeName}' must be an object.`
      });
      continue;
    }

    out.set(schemeName, rawScheme);
  }

  return out;
}

function resolveDocumentSecurity(
  value: unknown,
  securitySchemes: Map<string, SecuritySchemeRecord>,
  diagnostics: SemanticDiagnostic[]
): HttpResolvedOperationSecurity {
  if (value === undefined) {
    return {
      source: "implicit-open",
      cleared: false,
      requirements: []
    };
  }

  return resolveDeclaredSecurity(value, securitySchemes, diagnostics, {
    source: "root",
    label: "document security"
  });
}

function resolveDeclaredSecurity(
  value: unknown,
  securitySchemes: Map<string, SecuritySchemeRecord>,
  diagnostics: SemanticDiagnostic[],
  context: {
    source: "root" | "operation";
    label: string;
    method?: string;
    route?: string;
  }
): HttpResolvedOperationSecurity {
  if (!Array.isArray(value)) {
    diagnostics.push({
      kind: "invalid",
      method: context.method,
      route: context.route,
      message: `${context.label} must be an array of Security Requirement Objects.`
    });
    return {
      source: context.source,
      cleared: false,
      requirements: []
    };
  }

  if (value.length === 0) {
    return {
      source: context.source,
      cleared: true,
      requirements: []
    };
  }

  const requirements: HttpResolvedSecurityRequirement[] = [];
  const seen = new Set<string>();

  for (const requirement of value) {
    if (!isRecord(requirement)) {
      diagnostics.push({
        kind: "invalid",
        method: context.method,
        route: context.route,
        message: `${context.label} entries must be Security Requirement Objects.`
      });
      continue;
    }

    const normalizedEntries: HttpResolvedSecurityRequirementEntry[] = [];
    let valid = true;

    for (const [schemeName, rawScopes] of Object.entries(requirement)) {
      const normalizedSchemeName = normalizeSecuritySchemeName(schemeName);
      if (!normalizedSchemeName) {
        diagnostics.push({
          kind: "invalid",
          method: context.method,
          route: context.route,
          message: `${context.label} contains an empty security scheme name.`
        });
        valid = false;
        continue;
      }

      const scheme = securitySchemes.get(normalizedSchemeName);
      if (!scheme) {
        diagnostics.push({
          kind: "invalid",
          method: context.method,
          route: context.route,
          message: `${context.label} references missing security scheme '${normalizedSchemeName}'.`
        });
        valid = false;
        continue;
      }

      const validationMessage = validateReferencedSecurityScheme(normalizedSchemeName, scheme);
      if (validationMessage) {
        diagnostics.push({
          kind: "invalid",
          method: context.method,
          route: context.route,
          message: validationMessage
        });
        valid = false;
        continue;
      }

      const scopes = normalizeSecurityScopes(rawScopes);
      if (!scopes) {
        diagnostics.push({
          kind: "invalid",
          method: context.method,
          route: context.route,
          message: `${context.label} entry for security scheme '${normalizedSchemeName}' must declare an array of scope strings.`
        });
        valid = false;
        continue;
      }

      normalizedEntries.push({
        schemeName: normalizedSchemeName,
        scopes
      });
    }

    if (!valid) {
      continue;
    }

    const normalizedRequirement: HttpResolvedSecurityRequirement = {
      schemes: normalizedEntries.sort(compareResolvedSecurityEntries)
    };
    const requirementKey = serializeResolvedSecurityRequirement(normalizedRequirement);
    if (seen.has(requirementKey)) {
      continue;
    }

    seen.add(requirementKey);
    requirements.push(normalizedRequirement);
  }

  return {
    source: context.source,
    cleared: false,
    requirements
  };
}

function cloneOperationSecurity(security: HttpResolvedOperationSecurity): HttpResolvedOperationSecurity {
  return {
    source: security.source,
    cleared: security.cleared,
    requirements: security.requirements.map((requirement) => ({
      schemes: requirement.schemes.map((entry) => ({
        schemeName: entry.schemeName,
        scopes: [...entry.scopes]
      }))
    }))
  };
}

function validateReferencedSecurityScheme(schemeName: string, scheme: SecuritySchemeRecord): string | undefined {
  const type = normalizeNonEmptyString(scheme.type);
  if (!type) {
    return `Security scheme '${schemeName}' must declare a non-empty string type.`;
  }

  if (type !== "apiKey") {
    return undefined;
  }

  const keyName = normalizeNonEmptyString(scheme.name);
  if (!keyName) {
    return `apiKey security scheme '${schemeName}' must declare a non-empty name.`;
  }

  const location = normalizeNonEmptyString(scheme.in);
  if (!location) {
    return `apiKey security scheme '${schemeName}' must declare a non-empty 'in' location.`;
  }

  return undefined;
}

function normalizeSecuritySchemeName(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeSecurityScopes(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const scopes: string[] = [];
  for (const entry of value) {
    const normalized = normalizeNonEmptyString(entry);
    if (!normalized) {
      return undefined;
    }
    scopes.push(normalized);
  }

  return Array.from(new Set(scopes)).sort((left, right) => left.localeCompare(right));
}

function serializeResolvedSecurityRequirement(requirement: HttpResolvedSecurityRequirement): string {
  return requirement.schemes.map((entry) => `${entry.schemeName}[${entry.scopes.join(",")}]`).join("&");
}

function compareResolvedSecurityEntries(
  left: HttpResolvedSecurityRequirementEntry,
  right: HttpResolvedSecurityRequirementEntry
): number {
  if (left.schemeName !== right.schemeName) {
    return left.schemeName.localeCompare(right.schemeName);
  }

  return left.scopes.join("\u0000").localeCompare(right.scopes.join("\u0000"));
}

function normalizeTemplatedRoute(route: string): string {
  const trimmed = route.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  return trimmed.replace(/\{[^/}]+\}/g, "{param}");
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

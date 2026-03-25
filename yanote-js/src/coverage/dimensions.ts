export type CoverageDimensionState = "COVERED" | "PARTIAL" | "UNCOVERED" | "N/A";

export type ParameterLocation = "path" | "query" | "header";
export type HttpRequestParameterLocation = ParameterLocation | "cookie";
export type HttpRequestParameterStyle = "simple" | "form" | string;

export type DeclaredStatusToken = `${number}` | `${number}XX` | "default";

export type ParameterDefinition = {
  name: string;
  in: ParameterLocation;
  required: boolean;
};

export type HttpScalarType = "string" | "integer" | "number" | "boolean";

export type HttpScalarSchemaContract = {
  type: HttpScalarType;
  enum?: Array<string | number | boolean>;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
};

export type HttpRequestScalarContract =
  | {
      support: "supported";
      schema: HttpScalarSchemaContract;
    }
  | {
      support: "unsupported";
      reason: "style" | "schema";
    };

export type HttpRequestDeclaredSupportReason = "content" | "style" | "explode" | "schema";
export type HttpRequestDeclaredSupportShape = "scalar" | "array";

export type HttpRequestDeclaredSupport =
  | {
      support: "supported";
      shape: "scalar";
      schema: HttpScalarSchemaContract;
    }
  | {
      support: "supported";
      shape: "array";
      items: HttpScalarSchemaContract;
    }
  | {
      support: "unsupported";
      reason: HttpRequestDeclaredSupportReason;
    };

export type HttpRequestParameterContract = {
  name: string;
  in: HttpRequestParameterLocation;
  required: boolean;
  style: HttpRequestParameterStyle;
  explode: boolean;
  declaredSupport: HttpRequestDeclaredSupport;
  scalar: HttpRequestScalarContract;
};

export type ParameterEvidence = {
  operationObserved: boolean;
  queryKeys: string[];
  headerKeys: string[];
};

export type LocationParameterCoverage = {
  requiredTotal: number;
  requiredCovered: number;
  missingRequired: string[];
  optionalTotal: number;
  optionalCovered: number;
  missingOptional: string[];
};

export type ParameterCoverageResult = {
  state: CoverageDimensionState;
  required: {
    total: number;
    covered: number;
    missing: ParameterDefinition[];
  };
  optional: {
    total: number;
    covered: number;
    missing: ParameterDefinition[];
  };
  byLocation: Record<ParameterLocation, LocationParameterCoverage>;
};

export type StatusCoverageResult = {
  state: CoverageDimensionState;
  declaredStatuses: DeclaredStatusToken[];
  coveredStatuses: DeclaredStatusToken[];
  missingStatuses: DeclaredStatusToken[];
};

const RANGE_TOKEN_RE = /^([1-5])XX$/;
const CODE_TOKEN_RE = /^\d{3}$/;

export function normalizeDeclaredStatusToken(value: string): DeclaredStatusToken | null {
  const token = value.trim();
  if (!token) return null;
  const upper = token.toUpperCase();
  if (upper === "DEFAULT") return "default";
  if (CODE_TOKEN_RE.test(upper)) return upper as DeclaredStatusToken;
  if (RANGE_TOKEN_RE.test(upper)) return upper as DeclaredStatusToken;
  return null;
}

export function compareDeclaredStatusToken(left: DeclaredStatusToken, right: DeclaredStatusToken): number {
  const leftCategory = declaredStatusCategory(left);
  const rightCategory = declaredStatusCategory(right);
  if (leftCategory !== rightCategory) return leftCategory - rightCategory;

  if (leftCategory === 0) {
    return Number(left) - Number(right);
  }

  if (leftCategory === 1) {
    return Number(left[0]) - Number(right[0]);
  }

  return 0;
}

function declaredStatusCategory(token: DeclaredStatusToken): number {
  if (token === "default") return 2;
  if (token.endsWith("XX")) return 1;
  return 0;
}

const LOCATION_ORDER: Record<ParameterLocation, number> = {
  path: 0,
  query: 1,
  header: 2
};

const HTTP_REQUEST_LOCATION_ORDER: Record<HttpRequestParameterLocation, number> = {
  path: 0,
  query: 1,
  header: 2,
  cookie: 3
};

export function compareParameterDefinition(left: ParameterDefinition, right: ParameterDefinition): number {
  const locationDelta = LOCATION_ORDER[left.in] - LOCATION_ORDER[right.in];
  if (locationDelta !== 0) return locationDelta;
  return left.name.localeCompare(right.name);
}

export function compareHttpRequestParameterContract(
  left: Pick<HttpRequestParameterContract, "in" | "name">,
  right: Pick<HttpRequestParameterContract, "in" | "name">
): number {
  const locationDelta = HTTP_REQUEST_LOCATION_ORDER[left.in] - HTTP_REQUEST_LOCATION_ORDER[right.in];
  if (locationDelta !== 0) return locationDelta;
  return left.name.localeCompare(right.name);
}

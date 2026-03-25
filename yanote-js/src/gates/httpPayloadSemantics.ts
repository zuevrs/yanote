import type {
  HttpPayloadConformanceCode,
  HttpPayloadConformanceDiagnostic
} from "../coverage/httpPayloadConformance.js";
import type { GovernanceFailure } from "./failureOrder.js";

export type FailClosedHttpPayloadCode = Exclude<
  HttpPayloadConformanceCode,
  "VALID" | "NO_DECLARED_CONTENT" | "RECORDER_OMITTED"
>;

export type HttpPayloadSemanticFailureCode =
  | "SEMANTIC_HTTP_INVALID_BODY"
  | "SEMANTIC_HTTP_MISSING_BODY"
  | "SEMANTIC_HTTP_MISSING_CONTENT_TYPE"
  | "SEMANTIC_HTTP_MEDIA_TYPE_MISMATCH"
  | "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE"
  | "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT"
  | "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA";

const FAIL_CLOSED_CODE_MAP: Record<FailClosedHttpPayloadCode, HttpPayloadSemanticFailureCode> = {
  INVALID_BODY: "SEMANTIC_HTTP_INVALID_BODY",
  MISSING_BODY: "SEMANTIC_HTTP_MISSING_BODY",
  MISSING_CONTENT_TYPE: "SEMANTIC_HTTP_MISSING_CONTENT_TYPE",
  MEDIA_TYPE_MISMATCH: "SEMANTIC_HTTP_MEDIA_TYPE_MISMATCH",
  UNSUPPORTED_MEDIA_TYPE: "SEMANTIC_HTTP_UNSUPPORTED_MEDIA_TYPE",
  UNSUPPORTED_SCHEMA_FORMAT: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA_FORMAT",
  UNSUPPORTED_SCHEMA: "SEMANTIC_HTTP_UNSUPPORTED_SCHEMA"
};

export function evaluateHttpPayloadSemanticFailures(diagnostics: HttpPayloadConformanceDiagnostic[]): GovernanceFailure[] {
  return [...diagnostics]
    .sort(compareHttpPayloadDiagnostics)
    .map((diagnostic) => classifyHttpPayloadDiagnostic(diagnostic))
    .filter((failure): failure is GovernanceFailure => failure != null);
}

export function classifyHttpPayloadDiagnostic(diagnostic: HttpPayloadConformanceDiagnostic): GovernanceFailure | null {
  if (!isFailClosedHttpPayloadCode(diagnostic.code)) {
    return null;
  }

  return {
    failureClass: "semantic",
    code: FAIL_CLOSED_CODE_MAP[diagnostic.code],
    reason: buildReason(diagnostic),
    hint: buildHint(diagnostic),
    exitCode: 5,
    severity: "error",
    operationKey: diagnostic.operationKey
  };
}

export function isFailClosedHttpPayloadCode(code: HttpPayloadConformanceCode): code is FailClosedHttpPayloadCode {
  return Object.prototype.hasOwnProperty.call(FAIL_CLOSED_CODE_MAP, code);
}

export function isHttpPayloadSemanticFailureCode(code: string): code is HttpPayloadSemanticFailureCode {
  return Object.values<string>(FAIL_CLOSED_CODE_MAP).includes(code);
}

function buildReason(diagnostic: HttpPayloadConformanceDiagnostic): string {
  const subject = describeSubject(diagnostic);

  switch (diagnostic.code) {
    case "INVALID_BODY":
      return `${subject} failed JSON schema validation.`;
    case "MISSING_BODY":
      return `${subject} is missing a required body.`;
    case "MISSING_CONTENT_TYPE":
      return `${subject} is missing content type required for payload conformance.`;
    case "MEDIA_TYPE_MISMATCH":
      return `${subject} uses a media type outside the declared OpenAPI content map.`;
    case "UNSUPPORTED_MEDIA_TYPE":
      return `${subject} uses a declared media type outside JSON payload conformance support.`;
    case "UNSUPPORTED_SCHEMA_FORMAT":
      return `${subject} declares a schema format outside Yanote's supported payload format allowlist.`;
    case "UNSUPPORTED_SCHEMA":
      return `${subject} declares JSON content without a usable validation schema.`;
    default:
      return `${subject} failed HTTP payload conformance.`;
  }
}

function buildHint(diagnostic: HttpPayloadConformanceDiagnostic): string {
  switch (diagnostic.code) {
    case "INVALID_BODY":
      return `Fix the ${diagnostic.target} payload shape or align the declared schema intentionally.`;
    case "MISSING_BODY":
      return `Capture the ${diagnostic.target} body for this operation or relax the declared body requirement intentionally.`;
    case "MISSING_CONTENT_TYPE":
      return `Capture the ${diagnostic.target} content type so payload conformance can resolve the declared media type.`;
    case "MEDIA_TYPE_MISMATCH":
      return "Send a declared media type or update the OpenAPI content map intentionally.";
    case "UNSUPPORTED_MEDIA_TYPE":
      return "Use a JSON media type for payload conformance or accept that this endpoint remains fail-closed until support expands.";
    case "UNSUPPORTED_SCHEMA_FORMAT":
      return "Use a supported payload schema format or intentionally widen Yanote's published format allowlist before relying on this contract.";
    case "UNSUPPORTED_SCHEMA":
      return "Declare a JSON schema AJV can compile for payload validation or remove unsupported payload validation expectations intentionally.";
    default:
      return "Resolve the payload conformance diagnostic and rerun the report.";
  }
}

function describeSubject(diagnostic: HttpPayloadConformanceDiagnostic): string {
  const segments = [`${diagnostic.target} payload for ${diagnostic.operationKey}`];

  if (diagnostic.declaredStatus) {
    segments.push(`declared-status=${diagnostic.declaredStatus}`);
  }

  if (typeof diagnostic.observedStatus === "number") {
    segments.push(`observed-status=${diagnostic.observedStatus}`);
  }

  if (diagnostic.observedMediaType) {
    segments.push(`media=${diagnostic.observedMediaType}`);
  }

  return segments.join(" ");
}

function compareHttpPayloadDiagnostics(left: HttpPayloadConformanceDiagnostic, right: HttpPayloadConformanceDiagnostic): number {
  const codeRank = failClosedCodeRank(left.code) - failClosedCodeRank(right.code);
  if (codeRank !== 0) return codeRank;

  if (left.operationKey !== right.operationKey) {
    return left.operationKey.localeCompare(right.operationKey);
  }

  if (left.target !== right.target) {
    return left.target.localeCompare(right.target);
  }

  const leftStatus = `${left.declaredStatus ?? ""}\u0000${left.observedStatus ?? ""}`;
  const rightStatus = `${right.declaredStatus ?? ""}\u0000${right.observedStatus ?? ""}`;
  if (leftStatus !== rightStatus) {
    return leftStatus.localeCompare(rightStatus);
  }

  if ((left.observedMediaType ?? "") !== (right.observedMediaType ?? "")) {
    return (left.observedMediaType ?? "").localeCompare(right.observedMediaType ?? "");
  }

  if (left.message !== right.message) {
    return left.message.localeCompare(right.message);
  }

  return left.suite.localeCompare(right.suite);
}

function failClosedCodeRank(code: HttpPayloadConformanceCode): number {
  if (!isFailClosedHttpPayloadCode(code)) {
    return Number.POSITIVE_INFINITY;
  }

  switch (code) {
    case "INVALID_BODY":
      return 0;
    case "MISSING_BODY":
      return 1;
    case "MISSING_CONTENT_TYPE":
      return 2;
    case "MEDIA_TYPE_MISMATCH":
      return 3;
    case "UNSUPPORTED_MEDIA_TYPE":
      return 4;
    case "UNSUPPORTED_SCHEMA_FORMAT":
      return 5;
    case "UNSUPPORTED_SCHEMA":
      return 6;
  }
}

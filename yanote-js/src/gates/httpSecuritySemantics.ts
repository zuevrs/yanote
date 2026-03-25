import type {
  HttpSecurityConformanceDiagnostic,
  HttpSecurityConformanceTruth
} from "../coverage/httpSecurityConformance.js";
import type { GovernanceFailure } from "./failureOrder.js";

export type FailClosedHttpSecurityTruth = Extract<HttpSecurityConformanceTruth, "missing" | "unavailable" | "unsupported">;

export type HttpSecuritySemanticFailureCode =
  | "SEMANTIC_HTTP_MISSING_SECURITY"
  | "SEMANTIC_HTTP_UNAVAILABLE_SECURITY"
  | "SEMANTIC_HTTP_UNSUPPORTED_SECURITY";

const FAIL_CLOSED_TRUTH_CODE_MAP: Record<FailClosedHttpSecurityTruth, HttpSecuritySemanticFailureCode> = {
  missing: "SEMANTIC_HTTP_MISSING_SECURITY",
  unavailable: "SEMANTIC_HTTP_UNAVAILABLE_SECURITY",
  unsupported: "SEMANTIC_HTTP_UNSUPPORTED_SECURITY"
};

export function evaluateHttpSecuritySemanticFailures(diagnostics: HttpSecurityConformanceDiagnostic[]): GovernanceFailure[] {
  return [...diagnostics]
    .sort(compareHttpSecurityDiagnostics)
    .map((diagnostic) => classifyHttpSecurityDiagnostic(diagnostic))
    .filter((failure): failure is GovernanceFailure => failure != null);
}

export function classifyHttpSecurityDiagnostic(diagnostic: HttpSecurityConformanceDiagnostic): GovernanceFailure | null {
  if (!isFailClosedHttpSecurityTruth(diagnostic.truth)) {
    return null;
  }

  return {
    failureClass: "semantic",
    code: FAIL_CLOSED_TRUTH_CODE_MAP[diagnostic.truth],
    reason: buildReason(diagnostic),
    hint: buildHint(diagnostic),
    exitCode: 5,
    severity: "error",
    operationKey: diagnostic.operationKey
  };
}

export function isFailClosedHttpSecurityTruth(truth: HttpSecurityConformanceTruth): truth is FailClosedHttpSecurityTruth {
  return Object.prototype.hasOwnProperty.call(FAIL_CLOSED_TRUTH_CODE_MAP, truth);
}

export function isHttpSecuritySemanticFailureCode(code: string): code is HttpSecuritySemanticFailureCode {
  return Object.values<string>(FAIL_CLOSED_TRUTH_CODE_MAP).includes(code);
}

function buildReason(diagnostic: HttpSecurityConformanceDiagnostic): string {
  const subject = describeSubject(diagnostic);

  switch (diagnostic.truth) {
    case "missing":
      return `${subject} was not retained in request evidence.`;
    case "unavailable": {
      const reasonSuffix = diagnostic.evidenceReason ? ` (reason: ${diagnostic.evidenceReason})` : "";
      return `${subject} was unavailable for security verification because retained evidence was ${diagnostic.evidenceState ?? "unavailable"}${reasonSuffix}.`;
    }
    case "unsupported":
      return buildUnsupportedReason(diagnostic, subject);
  }
}

function buildHint(diagnostic: HttpSecurityConformanceDiagnostic): string {
  const subject = describeSubject(diagnostic);

  switch (diagnostic.truth) {
    case "missing":
      return `Capture presence/provenance for ${subject} if this operation must be semantically verified, or relax the declared OpenAPI security requirement intentionally.`;
    case "unavailable":
      return `Retain ${subject} without redaction or omission if it must be semantically verified, or relax the declared OpenAPI security requirement intentionally.`;
    case "unsupported":
      if (diagnostic.schemeType === "apiKey" && diagnostic.schemeLocation) {
        return "Restrict apiKey security schemes to query, header, or cookie locations, or accept that this contract remains fail-closed until support expands.";
      }
      return "Use supported query/header/cookie apiKey security schemes for semantic verification, or accept that this contract remains fail-closed until support expands.";
  }
}

function buildUnsupportedReason(diagnostic: HttpSecurityConformanceDiagnostic, subject: string): string {
  if (diagnostic.schemeType === "apiKey" && diagnostic.schemeLocation) {
    return `${subject} uses unsupported apiKey location '${diagnostic.schemeLocation}'.`;
  }

  if (diagnostic.schemeType === "unsupported") {
    return `${subject} uses an unsupported OpenAPI security type within Yanote's truthful apiKey-only subset.`;
  }

  if (diagnostic.schemeType) {
    return `${subject} uses unsupported OpenAPI security type '${diagnostic.schemeType}' within Yanote's truthful apiKey-only subset.`;
  }

  return `${subject} falls outside Yanote's truthful apiKey-only security conformance subset.`;
}

function describeSubject(diagnostic: HttpSecurityConformanceDiagnostic): string {
  const operation = diagnostic.operationKey;

  if (diagnostic.schemeType === "apiKey") {
    const location = diagnostic.schemeLocation ?? "request";
    const keyName = diagnostic.schemeKeyName ?? "(unnamed)";
    const schemeSuffix = diagnostic.schemeName ? ` for security scheme '${diagnostic.schemeName}'` : "";
    return `required ${location} apiKey '${keyName}'${schemeSuffix} on ${operation}`;
  }

  if (diagnostic.schemeName) {
    return `security scheme '${diagnostic.schemeName}' on ${operation}`;
  }

  return `security requirement on ${operation}`;
}

function compareHttpSecurityDiagnostics(left: HttpSecurityConformanceDiagnostic, right: HttpSecurityConformanceDiagnostic): number {
  const truthRank = failClosedTruthRank(left.truth) - failClosedTruthRank(right.truth);
  if (truthRank !== 0) return truthRank;

  if (left.operationKey !== right.operationKey) {
    return left.operationKey.localeCompare(right.operationKey);
  }

  if (left.branchIndex !== right.branchIndex) {
    return left.branchIndex - right.branchIndex;
  }

  if ((left.schemeName ?? "") !== (right.schemeName ?? "")) {
    return (left.schemeName ?? "").localeCompare(right.schemeName ?? "");
  }

  if ((left.schemeType ?? "") !== (right.schemeType ?? "")) {
    return (left.schemeType ?? "").localeCompare(right.schemeType ?? "");
  }

  if ((left.schemeLocation ?? "") !== (right.schemeLocation ?? "")) {
    return (left.schemeLocation ?? "").localeCompare(right.schemeLocation ?? "");
  }

  if ((left.schemeKeyName ?? "") !== (right.schemeKeyName ?? "")) {
    return (left.schemeKeyName ?? "").localeCompare(right.schemeKeyName ?? "");
  }

  if ((left.evidenceReason ?? "") !== (right.evidenceReason ?? "")) {
    return (left.evidenceReason ?? "").localeCompare(right.evidenceReason ?? "");
  }

  return left.suite.localeCompare(right.suite);
}

function failClosedTruthRank(truth: HttpSecurityConformanceTruth): number {
  switch (truth) {
    case "missing":
      return 0;
    case "unavailable":
      return 1;
    case "unsupported":
      return 2;
    case "satisfied":
    case "optional":
    case "clear":
      return Number.POSITIVE_INFINITY;
  }
}

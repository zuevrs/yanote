import type {
  HttpRequestConformanceDiagnostic,
  HttpRequestConformanceTruth
} from "../coverage/httpRequestConformance.js";
import type { GovernanceFailure } from "./failureOrder.js";

export type FailClosedHttpRequestTruth = Exclude<HttpRequestConformanceTruth, "captured-valid">;

export type HttpRequestSemanticFailureCode =
  | "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER"
  | "SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER"
  | "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER";

const FAIL_CLOSED_TRUTH_CODE_MAP: Record<FailClosedHttpRequestTruth, HttpRequestSemanticFailureCode> = {
  "captured-invalid": "SEMANTIC_HTTP_INVALID_REQUEST_PARAMETER",
  redacted: "SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER",
  omitted: "SEMANTIC_HTTP_UNAVAILABLE_REQUEST_PARAMETER",
  unsupported: "SEMANTIC_HTTP_UNSUPPORTED_REQUEST_PARAMETER"
};

export function evaluateHttpRequestSemanticFailures(diagnostics: HttpRequestConformanceDiagnostic[]): GovernanceFailure[] {
  return [...diagnostics]
    .sort(compareHttpRequestDiagnostics)
    .map((diagnostic) => classifyHttpRequestDiagnostic(diagnostic))
    .filter((failure): failure is GovernanceFailure => failure != null);
}

export function classifyHttpRequestDiagnostic(diagnostic: HttpRequestConformanceDiagnostic): GovernanceFailure | null {
  if (!isFailClosedHttpRequestTruth(diagnostic.truth)) {
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

export function isFailClosedHttpRequestTruth(truth: HttpRequestConformanceTruth): truth is FailClosedHttpRequestTruth {
  return Object.prototype.hasOwnProperty.call(FAIL_CLOSED_TRUTH_CODE_MAP, truth);
}

export function isHttpRequestSemanticFailureCode(code: string): code is HttpRequestSemanticFailureCode {
  return Object.values<string>(FAIL_CLOSED_TRUTH_CODE_MAP).includes(code);
}

function buildReason(diagnostic: HttpRequestConformanceDiagnostic): string {
  const subject = describeSubject(diagnostic);

  switch (diagnostic.truth) {
    case "captured-invalid":
      return `${subject} failed supported request-parameter validation. ${diagnostic.message}`;
    case "redacted":
    case "omitted": {
      const reasonSuffix = diagnostic.evidenceReason ? ` (reason: ${diagnostic.evidenceReason})` : "";
      return `${subject} was unavailable for request-semantic verification because retained evidence was ${diagnostic.truth}${reasonSuffix}.`;
    }
    case "unsupported":
      return `${subject} falls outside the published supported request serialization subset. ${diagnostic.message}`;
  }
}

function buildHint(diagnostic: HttpRequestConformanceDiagnostic): string {
  switch (diagnostic.truth) {
    case "captured-invalid":
      return `Fix the declared ${diagnostic.location} contract for '${diagnostic.name}' or send supported wire values that satisfy it. Inspect httpRequestConformance diagnostics in yanote-report.json for retained-value detail.`;
    case "redacted":
    case "omitted":
      return `Capture ${diagnostic.location} '${diagnostic.name}' without ${diagnostic.truth} evidence if it must be semantically verified, or relax the declared contract intentionally.`;
    case "unsupported":
      return `Restrict ${diagnostic.location} '${diagnostic.name}' to the published supported serialization subset or accept that this contract remains fail-closed until support expands.`;
  }
}

function describeSubject(diagnostic: HttpRequestConformanceDiagnostic): string {
  return `${locationLabel(diagnostic.location)} '${diagnostic.name}' for ${diagnostic.operationKey}`;
}

function locationLabel(location: HttpRequestConformanceDiagnostic["location"]): string {
  switch (location) {
    case "path":
      return "path parameter";
    case "query":
      return "query parameter";
    case "header":
      return "request header";
    case "cookie":
      return "cookie";
  }
}

function compareHttpRequestDiagnostics(left: HttpRequestConformanceDiagnostic, right: HttpRequestConformanceDiagnostic): number {
  const truthRank = failClosedTruthRank(left.truth) - failClosedTruthRank(right.truth);
  if (truthRank !== 0) return truthRank;

  if (left.operationKey !== right.operationKey) {
    return left.operationKey.localeCompare(right.operationKey);
  }

  const locationRank = rankLocation(left.location) - rankLocation(right.location);
  if (locationRank !== 0) return locationRank;

  if (left.name !== right.name) {
    return left.name.localeCompare(right.name);
  }

  if ((left.evidenceReason ?? "") !== (right.evidenceReason ?? "")) {
    return (left.evidenceReason ?? "").localeCompare(right.evidenceReason ?? "");
  }

  if (left.message !== right.message) {
    return left.message.localeCompare(right.message);
  }

  return left.suite.localeCompare(right.suite);
}

function failClosedTruthRank(truth: HttpRequestConformanceTruth): number {
  switch (truth) {
    case "captured-invalid":
      return 0;
    case "redacted":
    case "omitted":
      return 1;
    case "unsupported":
      return 2;
    case "captured-valid":
      return Number.POSITIVE_INFINITY;
  }
}

function rankLocation(location: HttpRequestConformanceDiagnostic["location"]): number {
  switch (location) {
    case "path":
      return 0;
    case "query":
      return 1;
    case "header":
      return 2;
    case "cookie":
      return 3;
  }
}

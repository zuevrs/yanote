import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import type { HttpEvent } from "../model/httpEvent.js";
import type { OperationKey } from "../model/operationKey.js";
import { computeCoverage } from "./coverage.js";

type MatchingCase = {
  caseId: string;
  operations: string[];
  events: Array<{ method: string; route: string; suite?: string }>;
  expectedCovered: string[];
  expectedDiagnostics: Array<{
    kind: string;
    method?: string;
    route?: string;
    candidates?: string[];
  }>;
};

type MatchingCasesFile = {
  version: number;
  cases: MatchingCase[];
};

function parseOperationKey(raw: string): OperationKey {
  const separator = raw.indexOf(" ");
  const method = raw.slice(0, separator);
  const route = raw.slice(separator + 1);
  return { kind: "http", method, route };
}

function toHttpEvents(entries: Array<{ method: string; route: string; suite?: string }>): HttpEvent[] {
  return entries.map((entry, index) => ({
    kind: "http",
    method: entry.method,
    route: entry.route,
    queryKeys: [],
    headerKeys: [],
    testRunId: `run-${index + 1}`,
    testSuite: entry.suite ?? "suite-parity"
  }));
}

function normalizeDiagnostics(
  diagnostics: Array<{ kind: string; method?: string; route?: string; candidates?: string[] }>
) {
  return diagnostics.map((diagnostic) => ({
    kind: diagnostic.kind,
    method: diagnostic.method ?? null,
    route: diagnostic.route ?? null,
    candidates: diagnostic.candidates ? [...diagnostic.candidates].sort() : []
  }));
}

describe("matching parity fixtures (node)", () => {
  it("matches every shared matching case", async () => {
    const fixturePath = new URL("../../../test/fixtures/spec-semantics/matching-cases.json", import.meta.url);
    const raw = await readFile(fixturePath, "utf8");
    const fixtures = JSON.parse(raw) as MatchingCasesFile;

    const seenCaseIds: string[] = [];

    for (const fixtureCase of fixtures.cases) {
      seenCaseIds.push(fixtureCase.caseId);
      const operations = fixtureCase.operations.map(parseOperationKey);
      const events = toHttpEvents(fixtureCase.events);

      const result = computeCoverage(operations, events, []);
      const covered = result.coveredOperations
        .filter((operation) => operation.kind === "http")
        .map((operation) => `${operation.method} ${operation.route}`);
      const diagnostics = normalizeDiagnostics(result.diagnostics);
      const expectedDiagnostics = normalizeDiagnostics(fixtureCase.expectedDiagnostics);

      // Parity contract: ambiguous candidate lists are emitted in deterministic sorted order.
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.kind !== "ambiguous" || !diagnostic.candidates) continue;
        expect(diagnostic.candidates, `candidate ordering mismatch for case ${fixtureCase.caseId}`).toEqual(
          [...diagnostic.candidates].sort()
        );
      }

      expect(covered, `covered operations mismatch for case ${fixtureCase.caseId}`).toEqual(fixtureCase.expectedCovered);
      expect(diagnostics, `diagnostics mismatch for case ${fixtureCase.caseId}`).toEqual(expectedDiagnostics);
    }

    expect(seenCaseIds).toEqual(fixtures.cases.map((fixtureCase) => fixtureCase.caseId));
  });
});

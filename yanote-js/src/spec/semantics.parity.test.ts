import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { buildHttpSemantics } from "./semantics.js";

type OperationCase = {
  caseId: string;
  paths: Record<string, unknown>;
  expectedOperations: string[];
  expectedDiagnostics: Array<{
    kind: string;
    method?: string;
    route?: string;
    candidates?: string[];
  }>;
};

type OperationCasesFile = {
  version: number;
  cases: OperationCase[];
};

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

describe("semantic parity fixtures (node)", () => {
  it("matches every operation fixture case", async () => {
    const fixturePath = new URL("../../../test/fixtures/spec-semantics/operation-cases.json", import.meta.url);
    const raw = await readFile(fixturePath, "utf8");
    const fixtures = JSON.parse(raw) as OperationCasesFile;

    const seenCaseIds: string[] = [];

    for (const fixtureCase of fixtures.cases) {
      seenCaseIds.push(fixtureCase.caseId);
      const result = buildHttpSemantics({ paths: fixtureCase.paths });

      const operations = result.operations
        .filter((operation) => operation.kind === "http")
        .map((operation) => `${operation.method} ${operation.route}`);
      const diagnostics = normalizeDiagnostics(result.diagnostics);
      const expectedDiagnostics = normalizeDiagnostics(fixtureCase.expectedDiagnostics);

      expect(operations, `operations mismatch for case ${fixtureCase.caseId}`).toEqual(fixtureCase.expectedOperations);
      expect(diagnostics, `diagnostics mismatch for case ${fixtureCase.caseId}`).toEqual(expectedDiagnostics);
    }

    expect(seenCaseIds).toEqual(fixtures.cases.map((fixtureCase) => fixtureCase.caseId));
  });
});

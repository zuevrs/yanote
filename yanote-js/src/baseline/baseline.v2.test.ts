import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareRegressionAgainstBaseline,
  createBaselineSnapshot,
  readBaseline,
  writeBaseline,
  type BaselineFile
} from "./baseline.js";
import type { OperationKey } from "../model/operationKey.js";

async function withTempDir(run: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "yanote-baseline-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("baseline v2 contract", () => {
  it("adapts v1 baseline to versioned v2 snapshot", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "baseline.v1.json");
      await writeFile(
        filePath,
        JSON.stringify(
          {
            format: 1,
            covered: [{ kind: "http", method: "GET", route: "/users/{param}" }]
          },
          null,
          2
        ),
        "utf8"
      );

      const baseline = await readBaseline(filePath);
      expect(baseline.format).toBe(2);
      expect(baseline.covered).toEqual(["http GET /users/{param}"]);
      expect(baseline.dimensions).toEqual({
        operations: null,
        status: null,
        parameters: null,
        aggregate: null
      });
    });
  });

  it("fails closed on incompatible baseline schema with actionable hint", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "baseline.invalid.json");
      await writeFile(
        filePath,
        JSON.stringify(
          {
            format: 2,
            generatedAt: "2026-03-04T00:00:00.000Z",
            covered: [{ not: "a string operation key" }]
          },
          null,
          2
        ),
        "utf8"
      );

      await expect(readBaseline(filePath)).rejects.toThrow("Incompatible baseline format");
    });
  });

  it("compares covered-operation regressions in canonical order and treats removed spec operations as neutral", () => {
    const baseline: BaselineFile = {
      format: 2,
      generatedAt: "2026-03-04T00:00:00.000Z",
      covered: ["http GET /a", "http GET /b", "http GET /z-removed"],
      dimensions: {
        operations: 90,
        status: 80,
        parameters: 70,
        aggregate: 85
      }
    };

    const comparison = compareRegressionAgainstBaseline({
      baseline,
      currentCovered: [{ kind: "http", method: "GET", route: "/a" }],
      currentOperations: [
        { kind: "http", method: "GET", route: "/a" },
        { kind: "http", method: "GET", route: "/b" }
      ],
      currentDimensions: {
        operations: 75,
        status: 90,
        parameters: 65,
        aggregate: 80
      }
    });

    expect(comparison.missingCoveredOperations).toEqual(["http GET /b"]);
    expect(comparison.removedSpecOperations).toEqual(["http GET /z-removed"]);
    expect(comparison.dimensionRegressions).toEqual([
      { dimension: "aggregate", baseline: 85, current: 80 },
      { dimension: "operations", baseline: 90, current: 75 },
      { dimension: "parameters", baseline: 70, current: 65 }
    ]);
  });

  it("writes baseline snapshots only through explicit update flow", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "baseline.v2.json");
      const covered: OperationKey[] = [{ kind: "http", method: "GET", route: "/orders/{param}" }];
      const baseline = createBaselineSnapshot({
        coveredOperations: covered,
        dimensions: {
          operations: 100,
          status: 100,
          parameters: 100,
          aggregate: 100
        },
        generatedAt: "2026-03-04T10:00:00.000Z"
      });

      await writeBaseline(filePath, baseline);
      const raw = await readFile(filePath, "utf8");
      expect(raw).toContain('"format": 2');
      const roundTripped = await readBaseline(filePath);
      expect(roundTripped.covered).toEqual(["http GET /orders/{param}"]);
    });
  });
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const validatorScriptPath = path.resolve("scripts/release/verify-traceability.mjs");
const canonicalRequirementsPath = path.resolve(".planning/REQUIREMENTS.md");
const canonicalMapPath = path.resolve(".planning/traceability/v1-requirements-tests.json");
const canonicalSchemaPath = path.resolve(".planning/traceability/schema.v1.json");

function parseRequirementIds(requirementsMarkdown) {
  return requirementsMarkdown
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.match(/^- \[[ x]\] \*\*([A-Z]+-[0-9]+)\*\*:/))
    .filter((match) => Boolean(match))
    .map((match) => match[1]);
}

function buildValidTraceabilityMap(requirementIds) {
  const sortedIds = [...requirementIds].sort((left, right) =>
    left.localeCompare(right)
  );

  return {
    schemaVersion: "traceability.v1",
    snapshotId: "v1-traceability-20260304",
    generatedAt: "2026-03-04",
    requirements: sortedIds.map((requirementId) => ({
      requirementId,
      tests: [
        {
          testId: `${requirementId.toLowerCase()}-contract`,
          path: "scripts/release/release-workflow.contract.test.mjs",
          status: "stable",
        },
      ],
      commands: ["node --test scripts/release/release-workflow.contract.test.mjs"],
    })),
  };
}

function runValidator(args) {
  return spawnSync(process.execPath, [validatorScriptPath, ...args], {
    encoding: "utf8",
  });
}

async function withFixtureFiles(prepareFixture) {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "traceability-contract-"));
  try {
    const requirementsPath = path.join(fixtureRoot, "REQUIREMENTS.md");
    const schemaPath = path.join(fixtureRoot, "schema.v1.json");
    const mapPath = path.join(fixtureRoot, "v1-requirements-tests.json");

    const canonicalRequirements = await readFile(canonicalRequirementsPath, "utf8");
    const requirementIds = parseRequirementIds(canonicalRequirements);
    const map = buildValidTraceabilityMap(requirementIds);

    await writeFile(requirementsPath, canonicalRequirements, "utf8");
    await writeFile(
      schemaPath,
      JSON.stringify(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          required: ["schemaVersion", "snapshotId", "generatedAt", "requirements"],
        },
        null,
        2
      ),
      "utf8"
    );

    await prepareFixture({
      map,
      requirementIds,
      requirementsPath,
      schemaPath,
      mapPath,
    });

    return runValidator([
      "--requirements",
      requirementsPath,
      "--map",
      mapPath,
      "--schema",
      schemaPath,
    ]);
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

test("validator enforces 100% requirement coverage for canonical v1 inventory", async () => {
  const result = runValidator([
    "--requirements",
    canonicalRequirementsPath,
    "--map",
    canonicalMapPath,
    "--schema",
    canonicalSchemaPath,
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /coverage-percent=100/);
});

test("validator fails when a requirement mapping is missing", async () => {
  const result = await withFixtureFiles(async ({ map, mapPath }) => {
    map.requirements.pop();
    await writeFile(mapPath, JSON.stringify(map, null, 2), "utf8");
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /coverage|100/i);
  assert.match(result.stderr + result.stdout, /missing/i);
});

test("validator fails when requirement mapping contains duplicates", async () => {
  const result = await withFixtureFiles(async ({ map, mapPath }) => {
    map.requirements.push({ ...map.requirements[0] });
    await writeFile(mapPath, JSON.stringify(map, null, 2), "utf8");
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /duplicate/i);
});

test("validator rejects flaky or quarantined tests from coverage accounting", async () => {
  const result = await withFixtureFiles(async ({ map, mapPath }) => {
    map.requirements[0].tests[0].status = "flaky";
    await writeFile(mapPath, JSON.stringify(map, null, 2), "utf8");
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /flaky|quarantined/i);
});

test("traceability output contract requires schema version and deterministic requirement ordering", async () => {
  const mapSource = await readFile(canonicalMapPath, "utf8");
  const map = JSON.parse(mapSource);

  assert.equal(map.schemaVersion, "traceability.v1");

  const requirementIds = map.requirements.map((entry) => entry.requirementId);
  const sortedRequirementIds = [...requirementIds].sort((left, right) =>
    left.localeCompare(right)
  );

  assert.deepEqual(requirementIds, sortedRequirementIds);
});

#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import process from "node:process";
import path from "node:path";

function printUsage() {
  process.stdout.write(
    [
      "Usage: node scripts/release/verify-traceability.mjs --requirements <path> --map <path> [--schema <path>] [--summary <path>]",
      "",
      "Options:",
      "  --requirements  Canonical requirement inventory markdown path",
      "  --map           Traceability JSON map path",
      "  --schema        Traceability schema path",
      "  --summary       Traceability markdown summary path (defaults to <map>.md)",
    ].join("\n")
  );
}

function parseArgs(argv) {
  const args = {
    requirementsPath: "",
    mapPath: "",
    schemaPath: "",
    summaryPath: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--requirements") {
      args.requirementsPath = next ?? "";
      index += 1;
    } else if (current === "--map") {
      args.mapPath = next ?? "";
      index += 1;
    } else if (current === "--schema") {
      args.schemaPath = next ?? "";
      index += 1;
    } else if (current === "--summary") {
      args.summaryPath = next ?? "";
      index += 1;
    } else if (current === "--help") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${current}`);
    }
  }

  if (!args.requirementsPath) {
    throw new Error("Missing required --requirements path.");
  }
  if (!args.mapPath) {
    throw new Error("Missing required --map path.");
  }
  if (!args.summaryPath) {
    args.summaryPath = args.mapPath.replace(/\.json$/u, ".md");
  }

  return args;
}

function parseRequirementIds(requirementsMarkdown) {
  return requirementsMarkdown
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.match(/^- \[[ x]\] \*\*([A-Z]+-[0-9]+)\*\*:/u))
    .filter((match) => Boolean(match))
    .map((match) => match[1]);
}

function parseSnapshotId(summaryMarkdown) {
  const match = summaryMarkdown.match(/Snapshot ID:\s*`?([A-Za-z0-9._-]+)`?/u);
  return match ? match[1] : "";
}

function isSorted(values) {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1].localeCompare(values[index]) > 0) {
      return false;
    }
  }
  return true;
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
      continue;
    }
    seen.add(value);
  }
  return [...duplicates].sort((left, right) => left.localeCompare(right));
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pushDiagnostic(diagnostics, code, message) {
  diagnostics.push({ code, message });
}

function formatCoverage(coverage) {
  if (Number.isInteger(coverage)) {
    return String(coverage);
  }
  return coverage.toFixed(2).replace(/0+$/u, "").replace(/\.$/u, "");
}

async function readTextFileOrThrow(filePath, label) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read ${label} at '${filePath}': ${error.message}`);
  }
}

async function readJsonFileOrThrow(filePath, label) {
  const source = await readTextFileOrThrow(filePath, label);
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label} at '${filePath}': ${error.message}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const diagnostics = [];

  const requirementsPath = path.resolve(args.requirementsPath);
  const mapPath = path.resolve(args.mapPath);
  const summaryPath = path.resolve(args.summaryPath);
  const schemaPath = args.schemaPath ? path.resolve(args.schemaPath) : "";

  const requirementsMarkdown = await readTextFileOrThrow(
    requirementsPath,
    "requirements file"
  );
  const requirementIds = parseRequirementIds(requirementsMarkdown);
  const canonicalDuplicates = findDuplicates(requirementIds);
  if (canonicalDuplicates.length > 0) {
    pushDiagnostic(
      diagnostics,
      "requirements-duplicates",
      `Canonical requirements contain duplicate IDs: ${canonicalDuplicates.join(", ")}.`
    );
  }

  const canonicalUniqueIds = [...new Set(requirementIds)];
  const canonicalIdSet = new Set(canonicalUniqueIds);

  const map = await readJsonFileOrThrow(mapPath, "traceability map");
  const schema = schemaPath
    ? await readJsonFileOrThrow(schemaPath, "traceability schema")
    : null;
  const summaryMarkdown = await readTextFileOrThrow(
    summaryPath,
    "traceability summary"
  );

  if (!map || typeof map !== "object" || Array.isArray(map)) {
    throw new Error("Traceability map must be a JSON object.");
  }

  if (map.schemaVersion !== "traceability.v1") {
    pushDiagnostic(
      diagnostics,
      "schema-version",
      "Map schemaVersion must be 'traceability.v1'."
    );
  }

  if (schema && typeof schema === "object" && !Array.isArray(schema)) {
    const expectedSchemaVersion = schema.properties?.schemaVersion?.const;
    if (expectedSchemaVersion && expectedSchemaVersion !== map.schemaVersion) {
      pushDiagnostic(
        diagnostics,
        "schema-version-mismatch",
        `Map schemaVersion '${map.schemaVersion ?? "missing"}' does not match schema const '${expectedSchemaVersion}'.`
      );
    }
  }

  if (
    typeof map.snapshotId !== "string" ||
    !/^v1-traceability-[0-9]{8}$/u.test(map.snapshotId)
  ) {
    pushDiagnostic(
      diagnostics,
      "snapshot-id",
      "Map snapshotId must match 'v1-traceability-YYYYMMDD'."
    );
  }

  if (
    typeof map.generatedAt !== "string" ||
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(map.generatedAt)
  ) {
    pushDiagnostic(
      diagnostics,
      "generated-at",
      "Map generatedAt must match 'YYYY-MM-DD'."
    );
  }

  const summarySnapshotId = parseSnapshotId(summaryMarkdown);
  if (!summarySnapshotId) {
    pushDiagnostic(
      diagnostics,
      "summary-snapshot",
      "Traceability markdown summary must declare 'Snapshot ID: <id>'."
    );
  } else if (summarySnapshotId !== map.snapshotId) {
    pushDiagnostic(
      diagnostics,
      "summary-snapshot-mismatch",
      `Summary snapshot '${summarySnapshotId}' does not match map snapshot '${map.snapshotId}'.`
    );
  }

  if (!Array.isArray(map.requirements) || map.requirements.length === 0) {
    pushDiagnostic(
      diagnostics,
      "requirements-missing",
      "Traceability map must include a non-empty requirements array."
    );
  }

  const mapRequirements = Array.isArray(map.requirements) ? map.requirements : [];
  const mapIds = [];
  const mapIdSet = new Set();
  const coveredIds = new Set();

  for (let index = 0; index < mapRequirements.length; index += 1) {
    const entry = mapRequirements[index];
    const location = `requirements[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      pushDiagnostic(
        diagnostics,
        "entry-shape",
        `${location} must be an object entry.`
      );
      continue;
    }

    const requirementId = entry.requirementId;
    if (typeof requirementId !== "string" || !/^[A-Z]+-[0-9]+$/u.test(requirementId)) {
      pushDiagnostic(
        diagnostics,
        "requirement-id",
        `${location} has invalid requirementId '${String(requirementId)}'.`
      );
      continue;
    }

    mapIds.push(requirementId);
    mapIdSet.add(requirementId);

    if (!canonicalIdSet.has(requirementId)) {
      pushDiagnostic(
        diagnostics,
        "unknown-requirement",
        `${location} references unknown requirement '${requirementId}'.`
      );
    }

    let entryIsCovering = true;

    if (!Array.isArray(entry.tests) || entry.tests.length === 0) {
      pushDiagnostic(
        diagnostics,
        "tests-missing",
        `${requirementId} must map to at least one concrete test reference.`
      );
      entryIsCovering = false;
    } else {
      const testKeys = [];
      for (let testIndex = 0; testIndex < entry.tests.length; testIndex += 1) {
        const testRef = entry.tests[testIndex];
        const testLocation = `${location}.tests[${testIndex}]`;

        if (!testRef || typeof testRef !== "object" || Array.isArray(testRef)) {
          pushDiagnostic(
            diagnostics,
            "test-shape",
            `${testLocation} must be an object.`
          );
          entryIsCovering = false;
          continue;
        }

        const testId = testRef.testId;
        const testPath = testRef.path;
        const selector = testRef.selector;
        const status = testRef.status;

        if (typeof testId !== "string" || testId.trim().length === 0) {
          pushDiagnostic(
            diagnostics,
            "test-id",
            `${testLocation} must define a non-empty testId.`
          );
          entryIsCovering = false;
        }
        if (typeof testPath !== "string" || testPath.trim().length === 0) {
          pushDiagnostic(
            diagnostics,
            "test-path",
            `${testLocation} must define a non-empty path.`
          );
          entryIsCovering = false;
        } else {
          const resolvedPath = path.resolve(testPath);
          // File existence check keeps test references concrete and non-heuristic.
          if (!(await fileExists(resolvedPath))) {
            pushDiagnostic(
              diagnostics,
              "test-path-missing",
              `${testLocation} points to missing file '${testPath}'.`
            );
            entryIsCovering = false;
          }
        }
        if (typeof selector !== "string" || selector.trim().length === 0) {
          pushDiagnostic(
            diagnostics,
            "test-selector",
            `${testLocation} must define a non-empty selector.`
          );
          entryIsCovering = false;
        }
        if (status !== "stable" && status !== "flaky" && status !== "quarantined") {
          pushDiagnostic(
            diagnostics,
            "test-status",
            `${testLocation} has invalid status '${String(status)}'.`
          );
          entryIsCovering = false;
        }
        if (status === "flaky" || status === "quarantined") {
          pushDiagnostic(
            diagnostics,
            "test-status-disallowed",
            `${requirementId} references ${status} tests; flaky/quarantined tests do not count toward 100% coverage.`
          );
          entryIsCovering = false;
        }

        testKeys.push(`${testPath ?? ""}::${testId ?? ""}`);
      }

      if (!isSorted(testKeys)) {
        pushDiagnostic(
          diagnostics,
          "tests-order",
          `${requirementId} test references must be in deterministic sorted order by path::testId.`
        );
        entryIsCovering = false;
      }
    }

    if (!Array.isArray(entry.commands) || entry.commands.length === 0) {
      pushDiagnostic(
        diagnostics,
        "commands-missing",
        `${requirementId} must include at least one runnable verification command.`
      );
      entryIsCovering = false;
    } else {
      for (let commandIndex = 0; commandIndex < entry.commands.length; commandIndex += 1) {
        const command = entry.commands[commandIndex];
        if (typeof command !== "string" || command.trim().length === 0) {
          pushDiagnostic(
            diagnostics,
            "command-empty",
            `${location}.commands[${commandIndex}] must be a non-empty command string.`
          );
          entryIsCovering = false;
        }
      }
      if (!isSorted(entry.commands)) {
        pushDiagnostic(
          diagnostics,
          "commands-order",
          `${requirementId} commands must be in deterministic sorted order.`
        );
        entryIsCovering = false;
      }
    }

    if (entryIsCovering && canonicalIdSet.has(requirementId)) {
      coveredIds.add(requirementId);
    }
  }

  if (!isSorted(mapIds)) {
    pushDiagnostic(
      diagnostics,
      "requirements-order",
      "Traceability map requirement entries must be in deterministic sorted order by requirementId."
    );
  }

  const duplicateRequirementIds = findDuplicates(mapIds);
  if (duplicateRequirementIds.length > 0) {
    pushDiagnostic(
      diagnostics,
      "requirements-duplicate",
      `Traceability map contains duplicate requirement entries: ${duplicateRequirementIds.join(", ")}.`
    );
  }

  const missingRequirementIds = canonicalUniqueIds.filter((id) => !mapIdSet.has(id));
  if (missingRequirementIds.length > 0) {
    pushDiagnostic(
      diagnostics,
      "requirements-unmapped",
      `Missing traceability mappings for requirements: ${missingRequirementIds.join(", ")}.`
    );
  }

  const extraRequirementIds = mapIds
    .filter((id) => !canonicalIdSet.has(id))
    .sort((left, right) => left.localeCompare(right));
  if (extraRequirementIds.length > 0) {
    pushDiagnostic(
      diagnostics,
      "requirements-extra",
      `Traceability map includes unknown requirements: ${extraRequirementIds.join(", ")}.`
    );
  }

  const canonicalCount = canonicalUniqueIds.length;
  const coveredCount = coveredIds.size;
  const coveragePercent =
    canonicalCount === 0 ? 0 : (coveredCount / canonicalCount) * 100;

  if (coveragePercent < 100) {
    pushDiagnostic(
      diagnostics,
      "coverage-below-100",
      `Traceability coverage is below 100 (${formatCoverage(coveragePercent)}%).`
    );
  }

  process.stdout.write(
    [
      `schema-version=${map.schemaVersion ?? "missing"}`,
      `snapshot-id=${map.snapshotId ?? "missing"}`,
      `canonical-requirements=${canonicalCount}`,
      `mapped-requirements=${mapIdSet.size}`,
      `covered-requirements=${coveredCount}`,
      `coverage-percent=${formatCoverage(coveragePercent)}`,
      `summary-path=${path.relative(process.cwd(), summaryPath)}`,
    ].join("\n") + "\n"
  );

  if (diagnostics.length > 0) {
    diagnostics
      .sort((left, right) => {
        if (left.code === right.code) {
          return left.message.localeCompare(right.message);
        }
        return left.code.localeCompare(right.code);
      })
      .forEach((diagnostic) => {
        process.stderr.write(
          `error-code=${diagnostic.code} message=${diagnostic.message}\n`
        );
      });
    process.exit(1);
  }

  process.stdout.write("status=pass\n");
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});

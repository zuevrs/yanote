#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import process from "node:process";

function parseArgs(argv) {
  const args = {
    output: "",
    version: "",
    previousTag: "",
    changelog: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--output") {
      args.output = next ?? "";
      index += 1;
    } else if (arg === "--version") {
      args.version = next ?? "";
      index += 1;
    } else if (arg === "--previous-tag") {
      args.previousTag = next ?? "";
      index += 1;
    } else if (arg === "--changelog") {
      args.changelog = next ?? "";
      index += 1;
    } else if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: node scripts/release/render-release-notes.mjs --output <path> --version <vX.Y.Z>",
      "",
      "Optional:",
      "  --previous-tag <tag>  Previous release tag for changelog scope",
      "  --changelog <path>     Path to pre-rendered changelog markdown",
    ].join("\n")
  );
}

function buildNotes({ version, previousTag, changelog }) {
  const releaseVersion = version || process.env.RELEASE_TAG || "v0.0.0";
  const resolvedPreviousTag =
    previousTag || process.env.PREVIOUS_RELEASE_TAG || "none";
  const changelogPath = changelog || process.env.CHANGELOG_PATH || "";
  const changelogScopeLine = `Changelog scope: since previous release tag \`${resolvedPreviousTag}\`.`;
  const changelogBlock = changelogPath
    ? `- Changelog source: \`${changelogPath}\``
    : "- Changelog source: auto-generated release notes configuration (`.github/release.yml`).";

  return [
    `# Release ${releaseVersion}`,
    "",
    "## Summary",
    "- This release is generated from a deterministic, tag-driven pipeline.",
    `- ${changelogScopeLine}`,
    "",
    "## Breaking Changes",
    "- None documented.",
    "",
    "## Upgrade Notes",
    "- Upgrade by using the versioned assets and manifest for this release.",
    changelogBlock,
    "",
    "## Verification Highlights",
    "- Release assets include SBOM, SHA-256 checksums, per-asset proof files, and a shared manifest.",
    "- Workflow enforces preflight checks and one explicit approval gate before publication.",
    "",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.output) {
    throw new Error("Missing required --output argument.");
  }

  const notes = buildNotes(args);
  await writeFile(args.output, notes, "utf8");
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});

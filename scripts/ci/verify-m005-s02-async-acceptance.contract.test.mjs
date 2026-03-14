import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scriptPath = path.resolve("scripts/ci/verify-m005-s02-async-acceptance.sh");

async function loadScriptSource() {
  return readFile(scriptPath, "utf8");
}

function extractStageCalls(source) {
  return [...source.matchAll(/run_stage\s+"([^"]+)"\s+"([^"]+)"\s+"\$\{ROOT_DIR\}\/([^"]+)"/g)].map(
    ([, label, title, delegatedPath]) => ({
      label,
      title,
      delegatedPath
    })
  );
}

test("acceptance runner keeps the stable run_stage shell pattern", async () => {
  const source = await loadScriptSource();
  assert.match(source, /run_stage\(\) \{/);
  assert.match(source, /printf -v command_display '%q ' "\$@"/);
  assert.match(source, /echo "==> \[\$\{label\}\] \$\{title\}"/);
  assert.match(source, /echo "\[\$\{label\}\] run: \$\{command_display% \}"/);
  assert.match(source, /echo "<== \[\$\{label\}\] ok"/);
});

test("acceptance runner composes the delegated verifiers in stable stage order", async () => {
  const source = await loadScriptSource();
  assert.deepEqual(extractStageCalls(source), [
    {
      label: "M005-S02-01",
      title: "Async landing and guide path contract",
      delegatedPath: "scripts/docs/verify-m005-s01-async-path.sh"
    },
    {
      label: "M005-S02-02",
      title: "Async owner/support boundary contract",
      delegatedPath: "scripts/docs/verify-m005-s01-async-boundaries.sh"
    },
    {
      label: "M005-S02-03",
      title: "Single-service async metadata propagation proof",
      delegatedPath: "scripts/ci/verify-m004-s02-metadata-propagation.sh"
    },
    {
      label: "M005-S02-04",
      title: "Two-service live Kafka proof and async diagnostics",
      delegatedPath: "scripts/ci/verify-m004-s03-live-kafka-proof.sh"
    }
  ]);
});

test("acceptance runner stays delegation-only and does not inline lower-level proof logic", async () => {
  const source = await loadScriptSource();

  const delegatedPaths = [...source.matchAll(/scripts\/(?:ci|docs)\/[-a-z0-9.]+/g)].map(([match]) => match);
  assert.deepEqual(delegatedPaths, [
    "scripts/docs/verify-m005-s01-async-path.sh",
    "scripts/docs/verify-m005-s01-async-boundaries.sh",
    "scripts/ci/verify-m004-s02-metadata-propagation.sh",
    "scripts/ci/verify-m004-s03-live-kafka-proof.sh"
  ]);

  assert.doesNotMatch(source, /\.\/gradlew\b/);
  assert.doesNotMatch(source, /yanote\.cjs\s+async-report/);
  assert.doesNotMatch(source, /merge-async-events-jsonl\.mjs/);
  assert.doesNotMatch(source, /python3\s+-/);
});

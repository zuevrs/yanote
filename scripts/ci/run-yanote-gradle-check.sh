#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

YANOTE_OUT_DIR="${YANOTE_OUT_DIR:-build/yanote/aggregate/check}"
CI_DIR=".yanote-ci"
FIXTURE_DIR="${CI_DIR}/gradle-check-fixture"

mkdir -p "${YANOTE_OUT_DIR}" "${CI_DIR}"
rm -rf "${FIXTURE_DIR}"
mkdir -p "${FIXTURE_DIR}"

export YANOTE_REPO_ROOT="${ROOT_DIR}"

cat > "${FIXTURE_DIR}/settings.gradle.kts" <<EOF
pluginManagement {
    includeBuild("${ROOT_DIR}/yanote-gradle-plugin")
}
rootProject.name = "yanote-ci-gradle-check"
EOF

cat > "${FIXTURE_DIR}/build.gradle.kts" <<'EOF'
import dev.yanote.gradle.tasks.YanoteCheckTask
import java.io.File

plugins {
    id("dev.yanote.gradle")
}

fun parseCsv(envName: String): List<String> {
    return System.getenv(envName)
        ?.split(',')
        ?.map { it.trim() }
        ?.filter { it.isNotEmpty() }
        ?: emptyList()
}

fun resolveFromRoot(root: File, candidate: String?): String? {
    val normalized = candidate?.trim().orEmpty()
    if (normalized.isEmpty()) {
        return null
    }
    val file = File(normalized)
    return if (file.isAbsolute) {
        file.absolutePath
    } else {
        root.resolve(normalized).absolutePath
    }
}

val repoRoot = File(
    System.getenv("YANOTE_REPO_ROOT")
        ?: error("YANOTE_REPO_ROOT must be provided by run-yanote-gradle-check.sh")
)

yanote {
    profile.set("ci")

    resolveFromRoot(repoRoot, System.getenv("INPUT_POLICY_PATH"))?.let {
        policyPath.set(it)
    }

    System.getenv("INPUT_MIN_COVERAGE")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.toIntOrNull()
        ?.let { minCoverage.set(it) }

    System.getenv("INPUT_MIN_AGGREGATE")
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.toIntOrNull()
        ?.let { minAggregate.set(it) }

    criticalOperations.set(parseCsv("INPUT_CRITICAL_OPERATIONS"))
    exclude.set(parseCsv("INPUT_EXCLUDE_PATTERNS"))
}

tasks.named<YanoteCheckTask>("yanoteCheck") {
    specPath.set(repoRoot.resolve("yanote-js/test/fixtures/openapi/simple.yaml").absolutePath)
    eventsPath.set(repoRoot.resolve("yanote-js/test/fixtures/events/events.valid.fixture.jsonl").absolutePath)
    analyzerPath.set(repoRoot.resolve("dist/node-analyzer/bin/yanote.cjs").absolutePath)
    outputDir.set(layout.dir(provider { repoRoot.resolve("build/yanote/aggregate/check") }))
}
EOF

GRADLE_DIST_CMD=(./gradlew distNodeAnalyzer --stacktrace)
GRADLE_CHECK_CMD=(./gradlew -p "${FIXTURE_DIR}" --stacktrace yanoteCheck)

{
    printf '%q ' "${GRADLE_DIST_CMD[@]}"
    printf '\n'
    printf '%q ' "${GRADLE_CHECK_CMD[@]}"
    printf '\n'
} > "${CI_DIR}/yanote-command.txt"

set +e
"${GRADLE_DIST_CMD[@]}" > "${CI_DIR}/yanote-validation.stdout.log" 2> "${CI_DIR}/yanote-validation.stderr.log"
exit_code=$?
if [[ "${exit_code}" -eq 0 ]]; then
    "${GRADLE_CHECK_CMD[@]}" >> "${CI_DIR}/yanote-validation.stdout.log" 2>> "${CI_DIR}/yanote-validation.stderr.log"
    exit_code=$?
fi
set -e

printf '%s\n' "${exit_code}" > "${CI_DIR}/yanote-exit-code.txt"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "exit_code=${exit_code}" >> "${GITHUB_OUTPUT}"
fi

exit "${exit_code}"

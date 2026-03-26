#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

YANOTE_OUT_DIR="${YANOTE_OUT_DIR:-build/yanote/aggregate/check}"
YANOTE_CI_DIR="${YANOTE_CI_DIR:-.yanote-ci}"
YANOTE_GRADLE_FIXTURE_DIR="${YANOTE_GRADLE_FIXTURE_DIR:-${YANOTE_CI_DIR}/gradle-check-fixture}"
YANOTE_GRADLE_TASK="${YANOTE_GRADLE_TASK:-yanoteCheck}"
YANOTE_SKIP_DIST_NODE_ANALYZER="${YANOTE_SKIP_DIST_NODE_ANALYZER:-false}"
INPUT_SPEC_PATH="${INPUT_SPEC_PATH:-yanote-js/test/fixtures/openapi/simple.yaml}"
INPUT_EVENTS_PATH="${INPUT_EVENTS_PATH:-yanote-js/test/fixtures/events/events.ci.fixture.jsonl}"
FIXTURE_DIR="${YANOTE_GRADLE_FIXTURE_DIR}"

case "${YANOTE_GRADLE_TASK}" in
  yanoteCheck|yanoteReport) ;;
  *)
    echo "ERROR: YANOTE_GRADLE_TASK must be yanoteCheck or yanoteReport, got '${YANOTE_GRADLE_TASK}'." >&2
    exit 2
    ;;
esac

mkdir -p "${YANOTE_CI_DIR}" "${YANOTE_OUT_DIR}"
rm -rf "${FIXTURE_DIR}"
mkdir -p "${FIXTURE_DIR}"

export YANOTE_REPO_ROOT="${ROOT_DIR}"
export INPUT_SPEC_PATH
export INPUT_EVENTS_PATH
export YANOTE_OUT_DIR
export YANOTE_GRADLE_TASK

cat > "${FIXTURE_DIR}/settings.gradle.kts" <<EOF
pluginManagement {
    includeBuild("${ROOT_DIR}")
}
rootProject.name = "yanote-ci-gradle-check"
EOF

cat > "${FIXTURE_DIR}/build.gradle.kts" <<'EOF'
import dev.yanote.gradle.tasks.YanoteCheckTask
import dev.yanote.gradle.tasks.YanoteReportTask
import java.io.File

plugins {
    id("io.github.zuevrs.yanote.gradle")
}

fun parseCsv(envName: String): List<String> {
    return System.getenv(envName)
        ?.split(',')
        ?.map { it.trim() }
        ?.filter { it.isNotEmpty() }
        ?: emptyList()
}

fun resolveInput(root: File, candidate: String?, allowRemote: Boolean = false): String? {
    val normalized = candidate?.trim().orEmpty()
    if (normalized.isEmpty()) {
        return null
    }
    if (allowRemote && (normalized.startsWith("http://") || normalized.startsWith("https://"))) {
        return normalized
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
val requestedTask = System.getenv("YANOTE_GRADLE_TASK")?.trim().orEmpty().ifEmpty { "yanoteCheck" }
val outputDirPath = resolveInput(repoRoot, System.getenv("YANOTE_OUT_DIR"))
    ?: error("YANOTE_OUT_DIR must be provided by run-yanote-gradle-check.sh")
val specInput = resolveInput(repoRoot, System.getenv("INPUT_SPEC_PATH"), allowRemote = true)
    ?: error("INPUT_SPEC_PATH must be provided by run-yanote-gradle-check.sh")
val eventsInput = resolveInput(repoRoot, System.getenv("INPUT_EVENTS_PATH"))
    ?: error("INPUT_EVENTS_PATH must be provided by run-yanote-gradle-check.sh")
val analyzerInput = repoRoot.resolve("dist/node-analyzer/bin/yanote.cjs").absolutePath

yanote {
    profile.set("ci")

    resolveInput(repoRoot, System.getenv("INPUT_POLICY_PATH"))?.let {
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

when (requestedTask) {
    "yanoteCheck" -> tasks.named<YanoteCheckTask>("yanoteCheck") {
        specPath.set(specInput)
        eventsPath.set(eventsInput)
        analyzerPath.set(analyzerInput)
        outputDir.set(layout.dir(provider { File(outputDirPath) }))
    }
    "yanoteReport" -> tasks.named<YanoteReportTask>("yanoteReport") {
        specPath.set(specInput)
        eventsPath.set(eventsInput)
        analyzerPath.set(analyzerInput)
        outputDir.set(layout.dir(provider { File(outputDirPath) }))
    }
    else -> error("Unsupported YANOTE_GRADLE_TASK=$requestedTask")
}
EOF

GRADLE_DIST_CMD=(./gradlew distNodeAnalyzer --stacktrace)
if [[ "${YANOTE_GRADLE_TASK}" == "yanoteReport" ]]; then
  GRADLE_RUN_CMD=(./gradlew -p "${FIXTURE_DIR}" --stacktrace yanoteReport)
else
  GRADLE_RUN_CMD=(./gradlew -p "${FIXTURE_DIR}" --stacktrace yanoteCheck)
fi

{
    if [[ "${YANOTE_SKIP_DIST_NODE_ANALYZER}" == "true" ]]; then
        printf '%s\n' "SKIPPED distNodeAnalyzer (YANOTE_SKIP_DIST_NODE_ANALYZER=true)"
    else
        printf '%q ' "${GRADLE_DIST_CMD[@]}"
        printf '\n'
    fi
    printf '%q ' "${GRADLE_RUN_CMD[@]}"
    printf '\n'
} > "${YANOTE_CI_DIR}/yanote-command.txt"

: > "${YANOTE_CI_DIR}/yanote-validation.stdout.log"
: > "${YANOTE_CI_DIR}/yanote-validation.stderr.log"

set +e
exit_code=0
if [[ "${YANOTE_SKIP_DIST_NODE_ANALYZER}" != "true" ]]; then
  "${GRADLE_DIST_CMD[@]}" >> "${YANOTE_CI_DIR}/yanote-validation.stdout.log" 2>> "${YANOTE_CI_DIR}/yanote-validation.stderr.log"
  exit_code=$?
fi
if [[ "${exit_code}" -eq 0 ]]; then
  "${GRADLE_RUN_CMD[@]}" >> "${YANOTE_CI_DIR}/yanote-validation.stdout.log" 2>> "${YANOTE_CI_DIR}/yanote-validation.stderr.log"
  exit_code=$?
fi
set -e

printf '%s\n' "${exit_code}" > "${YANOTE_CI_DIR}/yanote-exit-code.txt"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "exit_code=${exit_code}" >> "${GITHUB_OUTPUT}"
fi

exit "${exit_code}"

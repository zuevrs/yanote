package dev.yanote.gradle.tasks

import org.gradle.api.GradleException
import java.io.File

internal data class GradleAnalyzerInvocation(
    val file: File,
    val commandPrefix: List<String>,
    val contract: String
)

private val NODE_SCRIPT_EXTENSIONS = setOf("cjs", "mjs", "js")
private const val LEGACY_RAW_ANALYZER_BASENAME = "yanote.cjs"

internal fun resolveAnalyzerInvocation(
    taskName: String,
    rawInput: String?,
    fileResolver: (String) -> File
): GradleAnalyzerInvocation? {
    val normalized = rawInput?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    val file = fileResolver(normalized).absoluteFile

    if (file.name == LEGACY_RAW_ANALYZER_BASENAME) {
        throw GradleException(
            "$taskName analyzerPath must point to the standalone launcher contract, not the raw yanote.cjs runtime: ${file.absolutePath}"
        )
    }

    if (file.exists() && file.isDirectory) {
        throw GradleException(
            "$taskName analyzerPath must point to a launcher file, not a directory: ${file.absolutePath}"
        )
    }

    val extension = file.extension.lowercase()
    val usesNodeRuntime = extension in NODE_SCRIPT_EXTENSIONS
    if (file.exists() && !usesNodeRuntime && !file.canExecute()) {
        throw GradleException(
            "$taskName analyzerPath must be executable: ${file.absolutePath}"
        )
    }

    return GradleAnalyzerInvocation(
        file = file,
        commandPrefix = if (usesNodeRuntime) listOf("node", file.absolutePath) else listOf(file.absolutePath),
        contract = if (file.name == "yanote") "standalone-launcher" else "custom-override"
    )
}

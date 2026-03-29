package dev.yanote.gradle.tasks

import org.gradle.api.GradleException
import java.io.File
import java.net.URI
import java.net.URISyntaxException

internal data class GradleSpecInput(
    val kind: String,
    val executionValue: String,
    val displayValue: String,
    val provenanceReference: String,
    val isRemote: Boolean
)

private val WINDOWS_DRIVE_RE = Regex("^[A-Za-z]:[\\\\/].*")
private val URL_SCHEME_RE = Regex("^[A-Za-z][A-Za-z\\d+.-]*:")

internal fun resolveGradleSpecInput(
    taskName: String,
    rawInput: String,
    fileResolver: (String) -> File
): GradleSpecInput {
    val normalized = rawInput.trim()
    val remote = resolveSupportedRemoteSpecInput(taskName, normalized)
    if (remote != null) {
        return remote
    }

    if (looksLikeUnsupportedRemoteUrl(normalized)) {
        throw GradleException(
            "$taskName supports only local file/directory paths or public single-document http(s) spec URLs."
        )
    }

    val localFile = fileResolver(normalized)
    val kind = if (localFile.exists() && localFile.isDirectory) {
        "local-directory"
    } else {
        "local-file"
    }

    return GradleSpecInput(
        kind = kind,
        executionValue = normalized,
        displayValue = normalized,
        provenanceReference = normalized,
        isRemote = false
    )
}

internal fun renderAnalyzerArgsSurface(
    command: List<String>,
    specInput: GradleSpecInput?,
    analyzerPath: String,
    analyzerContract: String
): String {
    val displayArgs = sanitizeSpecArgumentForDisplay(command, specInput)
    val lines = mutableListOf(displayArgs.joinToString(" "))
    lines += "analyzer_path=$analyzerPath"
    lines += "analyzer_contract=$analyzerContract"
    if (specInput != null) {
        lines += "spec_source_kind=${specInput.kind}"
        lines += "spec_source_ref=${specInput.provenanceReference}"
    }
    return lines.joinToString(System.lineSeparator())
}

private fun sanitizeSpecArgumentForDisplay(args: List<String>, specInput: GradleSpecInput?): List<String> {
    if (specInput == null || !specInput.isRemote) {
        return args
    }

    val displayArgs = args.toMutableList()
    for (index in 0 until displayArgs.lastIndex) {
        if (displayArgs[index] == "--spec") {
            displayArgs[index + 1] = specInput.displayValue
            break
        }
    }
    return displayArgs
}

private fun resolveSupportedRemoteSpecInput(taskName: String, input: String): GradleSpecInput? {
    if (WINDOWS_DRIVE_RE.matches(input)) {
        return null
    }

    val parsed = tryParseUri(input) ?: return null
    val scheme = parsed.scheme?.lowercase() ?: return null
    if (scheme != "http" && scheme != "https") {
        throw GradleException(
            "$taskName supports only local file/directory paths or public single-document http(s) spec URLs."
        )
    }

    if (!parsed.userInfo.isNullOrEmpty() || !parsed.rawQuery.isNullOrEmpty() || !parsed.rawFragment.isNullOrEmpty()) {
        throw GradleException(
            "$taskName remote spec URLs must not include credentials, query strings, or fragments."
        )
    }

    if (parsed.host.isNullOrBlank()) {
        throw GradleException(
            "$taskName remote spec URLs must include a host and point to one document."
        )
    }

    val rawPath = parsed.rawPath.orEmpty().trim()
    val basename = rawPath.substringAfterLast('/', "")
    if (rawPath.isEmpty() || rawPath.endsWith("/") || basename.isEmpty() || basename == "." || basename == "..") {
        throw GradleException(
            "$taskName remote spec URLs must point to one document, not a directory-like path."
        )
    }

    val sanitized = URI(
        scheme,
        null,
        parsed.host,
        parsed.port,
        parsed.path,
        null,
        null
    ).toASCIIString()

    return GradleSpecInput(
        kind = "remote-url",
        executionValue = sanitized,
        displayValue = "<remote-url>",
        provenanceReference = sanitized,
        isRemote = true
    )
}

private fun looksLikeUnsupportedRemoteUrl(input: String): Boolean {
    if (WINDOWS_DRIVE_RE.matches(input)) {
        return false
    }
    return URL_SCHEME_RE.containsMatchIn(input)
}

private fun tryParseUri(input: String): URI? {
    return try {
        val uri = URI(input)
        if (uri.scheme.isNullOrBlank()) {
            null
        } else {
            uri
        }
    } catch (_: URISyntaxException) {
        null
    } catch (_: IllegalArgumentException) {
        null
    }
}

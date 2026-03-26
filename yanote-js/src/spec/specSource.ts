import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import http, { type IncomingMessage } from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";

export type SpecSourceKind = "local-file" | "local-directory" | "remote-url";

export type SpecSourceProvenance = {
  kind: SpecSourceKind;
  reference: string;
};

export type ResolvedSpecSource = {
  kind: SpecSourceKind;
  materializedPath: string;
  provenance: SpecSourceProvenance;
  cleanup: () => Promise<void>;
};

export type SpecSourceErrorCode =
  | "INPUT_SPEC_SOURCE_NOT_FOUND"
  | "INPUT_SPEC_SOURCE_READ_FAILED"
  | "INPUT_SPEC_REMOTE_SCHEME_UNSUPPORTED"
  | "INPUT_SPEC_REMOTE_URL_UNSAFE"
  | "INPUT_SPEC_REMOTE_URL_AMBIGUOUS"
  | "INPUT_SPEC_REMOTE_FETCH_FAILED";

export class SpecSourceError extends Error {
  constructor(
    public readonly code: SpecSourceErrorCode,
    reason: string,
    public readonly hint: string
  ) {
    super(reason);
    this.name = "SpecSourceError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const REMOTE_FETCH_TIMEOUT_MS = 10_000;
const REMOTE_SOURCE_PREFIX = "yanote-remote-spec-";
const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const WINDOWS_DRIVE_RE = /^[a-zA-Z]:[\\/]/;

export async function resolveSpecSource(specInput: string): Promise<ResolvedSpecSource> {
  const maybeUrl = tryParseUrl(specInput);
  if (maybeUrl) {
    if (maybeUrl.protocol !== "http:" && maybeUrl.protocol !== "https:") {
      throw new SpecSourceError(
        "INPUT_SPEC_REMOTE_SCHEME_UNSUPPORTED",
        "Remote spec URL must use http or https.",
        "Use a local file or directory path, or provide a public single-document http(s) URL."
      );
    }

    return resolveRemoteSpecSource(maybeUrl);
  }

  if (looksLikeUnsupportedUrlScheme(specInput)) {
    throw new SpecSourceError(
      "INPUT_SPEC_REMOTE_SCHEME_UNSUPPORTED",
      "Remote spec URL must use http or https.",
      "Use a local file or directory path, or provide a public single-document http(s) URL."
    );
  }

  return resolveLocalSpecSource(specInput);
}

export function isSpecSourceError(error: unknown): error is SpecSourceError {
  return error instanceof SpecSourceError;
}

function tryParseUrl(value: string): URL | null {
  if (WINDOWS_DRIVE_RE.test(value)) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function looksLikeUnsupportedUrlScheme(value: string): boolean {
  if (WINDOWS_DRIVE_RE.test(value)) {
    return false;
  }

  return URL_SCHEME_RE.test(value);
}

async function resolveLocalSpecSource(specInput: string): Promise<ResolvedSpecSource> {
  try {
    const sourceStats = await stat(specInput);
    if (sourceStats.isDirectory()) {
      return {
        kind: "local-directory",
        materializedPath: specInput,
        provenance: {
          kind: "local-directory",
          reference: specInput
        },
        cleanup: async () => {}
      };
    }

    if (sourceStats.isFile()) {
      return {
        kind: "local-file",
        materializedPath: specInput,
        provenance: {
          kind: "local-file",
          reference: specInput
        },
        cleanup: async () => {}
      };
    }

    throw new SpecSourceError(
      "INPUT_SPEC_SOURCE_NOT_FOUND",
      "Spec input must resolve to a file, directory, or supported remote URL.",
      "Provide a local file, a local directory, or a public single-document http(s) URL."
    );
  } catch (error) {
    if (isNodeError(error, "ENOENT") || isNodeError(error, "ENOTDIR")) {
      throw new SpecSourceError(
        "INPUT_SPEC_SOURCE_NOT_FOUND",
        "Spec input must resolve to a file, directory, or supported remote URL.",
        "Provide a local file, a local directory, or a public single-document http(s) URL."
      );
    }

    if (isNodeError(error, "EACCES")) {
      throw new SpecSourceError(
        "INPUT_SPEC_SOURCE_READ_FAILED",
        "Unable to read the spec input from disk.",
        "Check the local spec path and file permissions."
      );
    }

    throw error;
  }
}

async function resolveRemoteSpecSource(specUrl: URL): Promise<ResolvedSpecSource> {
  if (specUrl.username.length > 0 || specUrl.password.length > 0 || specUrl.search.length > 0 || specUrl.hash.length > 0) {
    throw new SpecSourceError(
      "INPUT_SPEC_REMOTE_URL_UNSAFE",
      "Remote spec URL must not include credentials, query strings, or fragments.",
      "Use a public single-document http(s) URL without userinfo, query parameters, or fragments."
    );
  }

  const pathname = specUrl.pathname.trim();
  const basename = path.posix.basename(pathname);
  if (pathname.length === 0 || pathname.endsWith("/") || basename.length === 0 || basename === "." || basename === "..") {
    throw new SpecSourceError(
      "INPUT_SPEC_REMOTE_URL_AMBIGUOUS",
      "Remote spec URL must point to a single document, not a directory-like path.",
      "Provide a public http(s) URL whose path ends with one spec document."
    );
  }

  const sanitizedUrl = sanitizeRemoteSpecUrl(specUrl);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), REMOTE_SOURCE_PREFIX));
  const materializedPath = path.join(tempDir, sanitizeRemoteBasename(basename));

  try {
    const response = await fetchRemoteSpec(sanitizedUrl);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new SpecSourceError(
        "INPUT_SPEC_REMOTE_FETCH_FAILED",
        `Unable to fetch remote spec: HTTP ${response.statusCode}.`,
        "Confirm the remote document is reachable without authentication and returns HTTP 200."
      );
    }

    await writeFile(materializedPath, response.body, "utf8");

    return {
      kind: "remote-url",
      materializedPath,
      provenance: {
        kind: "remote-url",
        reference: sanitizedUrl
      },
      cleanup: async () => {
        await rm(tempDir, { recursive: true, force: true });
      }
    };
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });

    if (isSpecSourceError(error)) {
      throw error;
    }

    throw new SpecSourceError(
      "INPUT_SPEC_REMOTE_FETCH_FAILED",
      "Unable to fetch remote spec.",
      "Confirm the remote document is reachable without authentication and returns a single OpenAPI or AsyncAPI document."
    );
  }
}

async function fetchRemoteSpec(
  url: string,
  redirectsRemaining = 5
): Promise<{ statusCode: number; body: string }> {
  const currentUrl = new URL(url);
  const response = await requestRemoteSpec(currentUrl);
  const statusCode = response.statusCode ?? 0;

  if (
    statusCode >= 300 &&
    statusCode < 400 &&
    typeof response.headers.location === "string" &&
    response.headers.location.length > 0
  ) {
    if (redirectsRemaining === 0) {
      throw new SpecSourceError(
        "INPUT_SPEC_REMOTE_FETCH_FAILED",
        "Unable to fetch remote spec: too many redirects.",
        "Point --spec at the final public http(s) document URL."
      );
    }

    return fetchRemoteSpec(new URL(response.headers.location, currentUrl).toString(), redirectsRemaining - 1);
  }

  return {
    statusCode,
    body: response.body
  };
}

async function requestRemoteSpec(
  url: URL
): Promise<{ statusCode: number | undefined; headers: IncomingMessage["headers"]; body: string }> {
  const transport = url.protocol === "https:" ? https : http;

  return await new Promise((resolve, reject) => {
    const request = transport.request(
      url,
      {
        method: "GET",
        agent: false,
        headers: {
          accept: "application/yaml, application/json, text/yaml, text/plain;q=0.8, */*;q=0.1"
        }
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.once("error", reject);
        response.once("end", () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body
          });
        });
      }
    );

    request.once("error", reject);
    request.setTimeout(REMOTE_FETCH_TIMEOUT_MS, () => {
      request.destroy(new Error("Remote spec request timed out."));
    });
    request.end();
  });
}

function sanitizeRemoteSpecUrl(specUrl: URL): string {
  const sanitized = new URL(specUrl.toString());
  sanitized.username = "";
  sanitized.password = "";
  sanitized.search = "";
  sanitized.hash = "";
  return sanitized.toString();
}

function sanitizeRemoteBasename(value: string): string {
  const normalized = decodeURIComponent(value).replace(/[^A-Za-z0-9._-]/g, "_");
  return normalized.length > 0 ? normalized : "remote-spec";
}

function isNodeError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return Boolean(error) && typeof error === "object" && "code" in error && (error as NodeJS.ErrnoException).code === code;
}

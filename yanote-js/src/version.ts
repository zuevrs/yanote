export const DEFAULT_TOOL_VERSION = "0.0.0";

export function resolveToolVersion(): string {
  const envToolVersion = process.env.YANOTE_TOOL_VERSION?.trim();
  return envToolVersion && envToolVersion.length > 0 ? envToolVersion : DEFAULT_TOOL_VERSION;
}


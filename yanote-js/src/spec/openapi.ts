import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";
import type { OperationKey } from "../model/operationKey.js";
import { buildHttpSemantics } from "./semantics.js";

export async function loadOpenApiOperations(specPath: string): Promise<OperationKey[]> {
  const api = (await SwaggerParser.dereference(specPath)) as OpenAPI.Document;
  const semantics = buildHttpSemantics(api);
  if (semantics.hasInvalid) {
    const details = semantics.diagnostics
      .filter((diag) => diag.kind === "invalid")
      .map((diag) => `${diag.method ? `${diag.method} ` : ""}${diag.route ?? "<unknown-route>"}: ${diag.message}`)
      .join("; ");
    throw new Error(`OpenAPI semantic extraction failed: ${details}`);
  }
  return semantics.operations;
}


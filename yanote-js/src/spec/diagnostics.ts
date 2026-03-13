import type { AsyncAction } from "../model/operationKey.js";

export type SemanticDiagnosticKind = "invalid" | "ambiguous" | "unmatched";

export type SemanticAsyncDiagnosticContext = {
  runtime?: string;
  channel?: string;
  action?: AsyncAction;
  message?: string;
  asyncapiVersion?: string;
  protocol?: string;
};

export type SemanticDiagnostic = {
  kind: SemanticDiagnosticKind;
  message: string;
  method?: string;
  route?: string;
  async?: SemanticAsyncDiagnosticContext;
  candidates?: string[];
};

export type SemanticDiagnosticsBundle = {
  diagnostics: SemanticDiagnostic[];
  hasInvalid: boolean;
};

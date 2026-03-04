export type SemanticDiagnosticKind = "invalid" | "ambiguous" | "unmatched";

export type SemanticDiagnostic = {
  kind: SemanticDiagnosticKind;
  message: string;
  method?: string;
  route?: string;
  candidates?: string[];
};

export type SemanticDiagnosticsBundle = {
  diagnostics: SemanticDiagnostic[];
  hasInvalid: boolean;
};

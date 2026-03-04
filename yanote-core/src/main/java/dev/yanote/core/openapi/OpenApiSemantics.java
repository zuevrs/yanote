package dev.yanote.core.openapi;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public record OpenApiSemantics(
        Set<OperationKey> operations,
        List<SemanticDiagnostic> diagnostics
) {
    public OpenApiSemantics {
        operations = operations == null
                ? Set.of()
                : Collections.unmodifiableSet(new LinkedHashSet<>(operations));
        diagnostics = diagnostics == null ? List.of() : List.copyOf(diagnostics);
    }

    public boolean hasInvalidDiagnostics() {
        return diagnostics.stream().anyMatch(diag -> "invalid".equals(diag.kind()));
    }
}

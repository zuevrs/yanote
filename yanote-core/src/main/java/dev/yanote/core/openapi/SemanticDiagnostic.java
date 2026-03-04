package dev.yanote.core.openapi;

import java.util.List;
import java.util.Locale;

public record SemanticDiagnostic(
        String kind,
        String message,
        String method,
        String route,
        List<String> candidates
) {
    public SemanticDiagnostic {
        kind = kind == null ? "invalid" : kind.trim();
        message = message == null ? "" : message.trim();
        method = method == null || method.isBlank() ? null : method.toUpperCase(Locale.ROOT);
        route = route == null || route.isBlank() ? null : route.trim();
        candidates = candidates == null ? List.of() : List.copyOf(candidates);
    }

    public static SemanticDiagnostic invalid(String message, String method, String route) {
        return new SemanticDiagnostic("invalid", message, method, route, List.of());
    }
}

package dev.yanote.core.openapi;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.PathItem;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

public final class OpenApiOperations {
    private static final Pattern TEMPLATE_PARAM_PATTERN = Pattern.compile("\\{[^/}]+}");

    public Set<OperationKey> extract(OpenAPI openApi) {
        return extractSemantics(openApi).operations();
    }

    public OpenApiSemantics extractSemantics(OpenAPI openApi) {
        if (openApi == null || openApi.getPaths() == null) {
            return new OpenApiSemantics(Collections.emptySet(), List.of());
        }

        Set<OperationKey> result = new LinkedHashSet<>();
        List<SemanticDiagnostic> diagnostics = new ArrayList<>();
        for (Map.Entry<String, PathItem> entry : openApi.getPaths().entrySet()) {
            String templatedPath = entry.getKey();
            PathItem item = entry.getValue();
            if (item == null) {
                diagnostics.add(SemanticDiagnostic.invalid("Path item is missing", null, templatedPath));
                continue;
            }
            String canonicalRoute = normalizeTemplatedRoute(templatedPath);
            item.readOperationsMap().forEach((method, operation) -> {
                if (operation == null) {
                    diagnostics.add(SemanticDiagnostic.invalid("Operation is missing", method.name(), templatedPath));
                    return;
                }
                result.add(new OperationKey(method.name(), canonicalRoute));
            });
        }
        return new OpenApiSemantics(result, diagnostics);
    }

    private String normalizeTemplatedRoute(String route) {
        if (route == null) {
            return null;
        }
        String trimmed = route.trim();
        return TEMPLATE_PARAM_PATTERN.matcher(trimmed).replaceAll("{param}");
    }
}


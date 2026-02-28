package dev.yanote.core.openapi;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.PathItem;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

public final class OpenApiOperations {

    public Set<OperationKey> extract(OpenAPI openApi) {
        if (openApi == null || openApi.getPaths() == null) {
            return Collections.emptySet();
        }

        Set<OperationKey> result = new LinkedHashSet<>();
        for (Map.Entry<String, PathItem> entry : openApi.getPaths().entrySet()) {
            String templatedPath = entry.getKey();
            PathItem item = entry.getValue();
            if (item == null) {
                continue;
            }
            item.readOperationsMap().forEach((method, operation) -> {
                if (operation == null) {
                    return;
                }
                result.add(new OperationKey(method.name(), templatedPath));
            });
        }
        return result;
    }
}


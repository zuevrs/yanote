package dev.yanote.core.openapi;

import java.util.Locale;
import java.util.Objects;

public record OperationKey(String method, String route) {

    public OperationKey {
        method = method.toUpperCase(Locale.ROOT);
        route = route.trim();
    }

    @Override
    public String toString() {
        return method + " " + route;
    }
}


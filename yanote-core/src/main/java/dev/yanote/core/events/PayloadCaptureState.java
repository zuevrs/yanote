package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum PayloadCaptureState {
    CAPTURED("captured"),
    OMITTED("omitted");

    private final String jsonValue;

    PayloadCaptureState(String jsonValue) {
        this.jsonValue = jsonValue;
    }

    @JsonValue
    public String jsonValue() {
        return jsonValue;
    }

    @JsonCreator
    public static PayloadCaptureState fromJson(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "captured" -> CAPTURED;
            case "omitted" -> OMITTED;
            default -> throw new IllegalArgumentException("Unsupported payload capture state: " + value);
        };
    }
}

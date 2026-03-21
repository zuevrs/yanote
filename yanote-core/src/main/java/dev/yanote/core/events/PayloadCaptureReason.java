package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum PayloadCaptureReason {
    MALFORMED("malformed"),
    OVERSIZED("oversized"),
    UNSUPPORTED("unsupported"),
    POLICY_FILTERED("policy-filtered");

    private final String jsonValue;

    PayloadCaptureReason(String jsonValue) {
        this.jsonValue = jsonValue;
    }

    @JsonValue
    public String jsonValue() {
        return jsonValue;
    }

    @JsonCreator
    public static PayloadCaptureReason fromJson(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "malformed" -> MALFORMED;
            case "oversized" -> OVERSIZED;
            case "unsupported" -> UNSUPPORTED;
            case "policy-filtered" -> POLICY_FILTERED;
            default -> throw new IllegalArgumentException("Unsupported payload capture reason: " + value);
        };
    }
}

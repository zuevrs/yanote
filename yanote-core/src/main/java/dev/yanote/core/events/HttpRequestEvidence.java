package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record HttpRequestEvidence(
        State state,
        List<String> values,
        Reason reason
) {

    public HttpRequestEvidence {
        if (state == null) {
            throw new IllegalArgumentException("state must not be null");
        }
        values = normalizeValues(values);
        if (state == State.CAPTURED) {
            if (values == null || values.isEmpty()) {
                throw new IllegalArgumentException("captured evidence must include at least one value");
            }
            reason = null;
        } else {
            values = null;
            if (reason == null) {
                throw new IllegalArgumentException("redacted or omitted evidence must include a reason");
            }
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public enum State {
        CAPTURED("captured"),
        REDACTED("redacted"),
        OMITTED("omitted");

        private final String jsonValue;

        State(String jsonValue) {
            this.jsonValue = jsonValue;
        }

        @JsonValue
        public String jsonValue() {
            return jsonValue;
        }

        @JsonCreator
        public static State fromJson(String value) {
            if (value == null) {
                return null;
            }
            String normalized = value.trim().toLowerCase(Locale.ROOT);
            return switch (normalized) {
                case "captured" -> CAPTURED;
                case "redacted" -> REDACTED;
                case "omitted" -> OMITTED;
                default -> throw new IllegalArgumentException("Unsupported request evidence state: " + value);
            };
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public enum Reason {
        SENSITIVE("sensitive"),
        OVERSIZED("oversized"),
        UNSUPPORTED("unsupported"),
        UNAVAILABLE("unavailable");

        private final String jsonValue;

        Reason(String jsonValue) {
            this.jsonValue = jsonValue;
        }

        @JsonValue
        public String jsonValue() {
            return jsonValue;
        }

        @JsonCreator
        public static Reason fromJson(String value) {
            if (value == null) {
                return null;
            }
            String normalized = value.trim().toLowerCase(Locale.ROOT);
            return switch (normalized) {
                case "sensitive" -> SENSITIVE;
                case "oversized" -> OVERSIZED;
                case "unsupported" -> UNSUPPORTED;
                case "unavailable" -> UNAVAILABLE;
                default -> throw new IllegalArgumentException("Unsupported request evidence reason: " + value);
            };
        }
    }

    public static HttpRequestEvidence captured(List<String> values) {
        return new HttpRequestEvidence(State.CAPTURED, values, null);
    }

    public static HttpRequestEvidence redacted(Reason reason) {
        return new HttpRequestEvidence(State.REDACTED, null, reason);
    }

    public static HttpRequestEvidence omitted(Reason reason) {
        return new HttpRequestEvidence(State.OMITTED, null, reason);
    }

    private static List<String> normalizeValues(List<String> value) {
        if (value == null || value.isEmpty()) {
            return null;
        }

        List<String> normalized = new ArrayList<>();
        for (String item : value) {
            if (item != null) {
                normalized.add(item);
            }
        }

        if (normalized.isEmpty()) {
            return null;
        }

        return List.copyOf(normalized);
    }
}

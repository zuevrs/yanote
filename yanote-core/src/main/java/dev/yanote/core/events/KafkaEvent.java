package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Locale;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record KafkaEvent(
        long ts,
        Action action,
        String channel,
        String message,
        String service,
        String instance,
        JsonNode payload,
        Boolean error,
        @JsonProperty("test.run_id") String testRunId,
        @JsonProperty("test.suite") String testSuite
) implements YanoteEvent {

    public KafkaEvent {
        if (action == null) {
            throw new IllegalArgumentException("action must not be null");
        }
        channel = normalizeRequired(channel, "channel");
        message = normalizeOptional(message);
        service = normalizeOptional(service);
        instance = normalizeOptional(instance);
        payload = normalizePayload(payload);
    }

    public enum Action {
        SEND("send"),
        RECEIVE("receive");

        private final String jsonValue;

        Action(String jsonValue) {
            this.jsonValue = jsonValue;
        }

        @JsonValue
        public String jsonValue() {
            return jsonValue;
        }

        @JsonCreator
        public static Action fromJson(String value) {
            if (value == null) {
                return null;
            }
            String normalized = value.trim().toLowerCase(Locale.ROOT);
            return switch (normalized) {
                case "send" -> SEND;
                case "receive" -> RECEIVE;
                default -> throw new IllegalArgumentException("Unsupported kafka action: " + value);
            };
        }
    }

    private static String normalizeRequired(String value, String fieldName) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return normalized;
    }

    private static String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private static JsonNode normalizePayload(JsonNode payload) {
        if (payload == null || payload.isNull() || payload.isMissingNode()) {
            return null;
        }
        return payload;
    }
}

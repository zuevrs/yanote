package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AmqpEvent(
        long ts,
        Action action,
        String channel,
        String message,
        String service,
        String instance,
        JsonNode payload,
        PayloadCaptureState payloadState,
        PayloadCaptureReason payloadReason,
        Map<String, HeaderEvidence> headers,
        Boolean error,
        @JsonProperty("test.run_id") String testRunId,
        @JsonProperty("test.suite") String testSuite
) implements YanoteEvent {

    public AmqpEvent {
        if (action == null) {
            throw new IllegalArgumentException("action must not be null");
        }
        channel = normalizeRequired(channel, "channel");
        message = normalizeOptional(message);
        service = normalizeOptional(service);
        instance = normalizeOptional(instance);
        payload = normalizePayload(payload);
        payloadState = normalizeOptionalState(payloadState);
        payloadReason = normalizeOptionalReason(payloadReason);
        headers = normalizeHeaders(headers);
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
                default -> throw new IllegalArgumentException("Unsupported amqp action: " + value);
            };
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record HeaderEvidence(
            HeaderCaptureState state,
            String value,
            HeaderCaptureReason reason
    ) {
        public HeaderEvidence {
            if (state == null) {
                throw new IllegalArgumentException("header state must not be null");
            }
            value = normalizeOptional(value);
            if (state == HeaderCaptureState.CAPTURED && value == null) {
                throw new IllegalArgumentException("captured header value must not be blank");
            }
            if (state == HeaderCaptureState.CAPTURED) {
                reason = null;
            }
            if (state != HeaderCaptureState.CAPTURED) {
                value = null;
            }
        }
    }

    public enum HeaderCaptureState {
        CAPTURED("captured"),
        REDACTED("redacted"),
        OMITTED("omitted");

        private final String jsonValue;

        HeaderCaptureState(String jsonValue) {
            this.jsonValue = jsonValue;
        }

        @JsonValue
        public String jsonValue() {
            return jsonValue;
        }

        @JsonCreator
        public static HeaderCaptureState fromJson(String value) {
            if (value == null) {
                return null;
            }
            String normalized = value.trim().toLowerCase(Locale.ROOT);
            return switch (normalized) {
                case "captured" -> CAPTURED;
                case "redacted" -> REDACTED;
                case "omitted" -> OMITTED;
                default -> throw new IllegalArgumentException("Unsupported amqp header capture state: " + value);
            };
        }
    }

    public enum HeaderCaptureReason {
        SENSITIVE("sensitive"),
        OVERSIZED("oversized"),
        UNSUPPORTED("unsupported");

        private final String jsonValue;

        HeaderCaptureReason(String jsonValue) {
            this.jsonValue = jsonValue;
        }

        @JsonValue
        public String jsonValue() {
            return jsonValue;
        }

        @JsonCreator
        public static HeaderCaptureReason fromJson(String value) {
            if (value == null) {
                return null;
            }
            String normalized = value.trim().toLowerCase(Locale.ROOT);
            return switch (normalized) {
                case "sensitive" -> SENSITIVE;
                case "oversized" -> OVERSIZED;
                case "unsupported" -> UNSUPPORTED;
                default -> throw new IllegalArgumentException("Unsupported amqp header capture reason: " + value);
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

    private static PayloadCaptureState normalizeOptionalState(PayloadCaptureState value) {
        return value;
    }

    private static PayloadCaptureReason normalizeOptionalReason(PayloadCaptureReason value) {
        return value;
    }

    private static Map<String, HeaderEvidence> normalizeHeaders(Map<String, HeaderEvidence> value) {
        if (value == null || value.isEmpty()) {
            return null;
        }

        Map<String, HeaderEvidence> normalized = new TreeMap<>();
        for (Map.Entry<String, HeaderEvidence> entry : value.entrySet()) {
            String key = normalizeOptional(entry.getKey());
            HeaderEvidence headerEvidence = entry.getValue();
            if (key == null || headerEvidence == null) {
                continue;
            }
            normalized.put(key, headerEvidence);
        }

        if (normalized.isEmpty()) {
            return null;
        }

        return Collections.unmodifiableMap(new LinkedHashMap<>(normalized));
    }
}

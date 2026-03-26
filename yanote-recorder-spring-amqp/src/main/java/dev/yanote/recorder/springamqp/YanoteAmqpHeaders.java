package dev.yanote.recorder.springamqp;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.amqp.core.MessageProperties;
import dev.yanote.core.events.AmqpEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;

public final class YanoteAmqpHeaders {
    public static final String TEST_RUN_ID = "yanote.test.run_id";
    public static final String TEST_SUITE = "yanote.test.suite";
    public static final String MESSAGE_HINT = "yanote.message";

    private static final int MAX_RETAINED_HEADER_BYTES = 1024;

    private YanoteAmqpHeaders() {
    }

    public static void applyContextIfAbsent(MessageProperties messageProperties) {
        TestMetadata context = TestMetadataContextHolder.current();
        if (context == null) {
            return;
        }
        putIfAbsent(messageProperties, TEST_RUN_ID, context.testRunId());
        putIfAbsent(messageProperties, TEST_SUITE, context.testSuite());
    }

    public static void setHeaders(MessageProperties messageProperties, String testRunId, String testSuite, String messageHint) {
        replace(messageProperties, TEST_RUN_ID, testRunId);
        replace(messageProperties, TEST_SUITE, testSuite);
        replace(messageProperties, MESSAGE_HINT, messageHint);
    }

    public static String readTestRunId(MessageProperties messageProperties) {
        return read(messageProperties, TEST_RUN_ID);
    }

    public static String readTestSuite(MessageProperties messageProperties) {
        return read(messageProperties, TEST_SUITE);
    }

    public static String readMessageHint(MessageProperties messageProperties) {
        return read(messageProperties, MESSAGE_HINT);
    }

    public static RetainedHeaders retainHeaders(MessageProperties messageProperties) {
        if (messageProperties == null || messageProperties.getHeaders().isEmpty()) {
            return RetainedHeaders.empty();
        }

        Map<String, AmqpEvent.HeaderEvidence> retained = new LinkedHashMap<>();
        List<String> warnings = new ArrayList<>();
        for (Map.Entry<String, Object> entry : messageProperties.getHeaders().entrySet()) {
            String key = normalize(entry.getKey());
            if (key == null) {
                continue;
            }

            RetainedHeader retainedHeader = retainHeaderValue(key, entry.getValue());
            retained.put(key, retainedHeader.headerEvidence());
            if (retainedHeader.warning() != null) {
                warnings.add(retainedHeader.warning());
            }
        }

        return new RetainedHeaders(retained.isEmpty() ? null : retained, List.copyOf(warnings));
    }

    private static RetainedHeader retainHeaderValue(String key, Object rawValue) {
        if (isSensitiveHeader(key)) {
            return new RetainedHeader(
                    new AmqpEvent.HeaderEvidence(
                            AmqpEvent.HeaderCaptureState.REDACTED,
                            null,
                            AmqpEvent.HeaderCaptureReason.SENSITIVE
                    ),
                    "redacted sensitive AMQP header '" + key + "'"
            );
        }

        if (rawValue == null) {
            return omitted(key, AmqpEvent.HeaderCaptureReason.UNSUPPORTED, "AMQP header value was null");
        }

        String normalizedValue = switch (rawValue) {
            case CharSequence value -> normalize(value.toString());
            case Number value -> normalize(value.toString());
            case Boolean value -> value.toString();
            case Enum<?> value -> normalize(value.name());
            default -> null;
        };

        if (normalizedValue == null) {
            return omitted(
                    key,
                    AmqpEvent.HeaderCaptureReason.UNSUPPORTED,
                    "unsupported AMQP header type: " + rawValue.getClass().getName()
            );
        }

        if (containsControlCharacters(normalizedValue)) {
            return omitted(key, AmqpEvent.HeaderCaptureReason.UNSUPPORTED, "AMQP header value contained control characters");
        }

        int encodedLength = normalizedValue.getBytes(StandardCharsets.UTF_8).length;
        if (encodedLength > MAX_RETAINED_HEADER_BYTES) {
            return omitted(
                    key,
                    AmqpEvent.HeaderCaptureReason.OVERSIZED,
                    "AMQP header size " + encodedLength + " bytes exceeded safe capture limit " + MAX_RETAINED_HEADER_BYTES
            );
        }

        return new RetainedHeader(
                new AmqpEvent.HeaderEvidence(
                        AmqpEvent.HeaderCaptureState.CAPTURED,
                        normalizedValue,
                        null
                ),
                null
        );
    }

    private static RetainedHeader omitted(String key, AmqpEvent.HeaderCaptureReason reason, String detail) {
        return new RetainedHeader(
                new AmqpEvent.HeaderEvidence(
                        AmqpEvent.HeaderCaptureState.OMITTED,
                        null,
                        reason
                ),
                "omitted AMQP header '" + key + "' (" + detail + ")"
        );
    }

    private static void putIfAbsent(MessageProperties messageProperties, String key, String value) {
        String normalized = normalize(value);
        if (normalized == null || messageProperties.getHeaders().containsKey(key)) {
            return;
        }
        messageProperties.setHeader(key, normalized);
    }

    private static void replace(MessageProperties messageProperties, String key, String value) {
        messageProperties.getHeaders().remove(key);
        String normalized = normalize(value);
        if (normalized != null) {
            messageProperties.setHeader(key, normalized);
        }
    }

    private static String read(MessageProperties messageProperties, String key) {
        Object rawValue = messageProperties.getHeaders().get(key);
        if (!(rawValue instanceof CharSequence charSequence)) {
            return null;
        }
        String normalized = normalize(charSequence.toString());
        if (normalized == null || containsControlCharacters(normalized)) {
            return null;
        }
        return normalized;
    }

    private static boolean isSensitiveHeader(String key) {
        String normalizedKey = key.toLowerCase(Locale.ROOT);
        return normalizedKey.contains("authorization")
                || normalizedKey.contains("cookie")
                || normalizedKey.contains("token")
                || normalizedKey.contains("secret")
                || normalizedKey.contains("password")
                || normalizedKey.contains("api-key")
                || normalizedKey.contains("apikey")
                || normalizedKey.contains("credential")
                || normalizedKey.contains("session")
                || normalizedKey.contains("jwt");
    }

    private static boolean containsControlCharacters(String value) {
        return value.codePoints().anyMatch(Character::isISOControl);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    record RetainedHeader(AmqpEvent.HeaderEvidence headerEvidence, String warning) {
    }

    public record RetainedHeaders(Map<String, AmqpEvent.HeaderEvidence> headers, List<String> warnings) {
        static RetainedHeaders empty() {
            return new RetainedHeaders(null, List.of());
        }
    }
}

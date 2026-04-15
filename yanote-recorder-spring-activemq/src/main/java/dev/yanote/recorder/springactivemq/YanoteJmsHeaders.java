package dev.yanote.recorder.springactivemq;

import dev.yanote.core.events.JmsEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import jakarta.jms.Destination;
import jakarta.jms.JMSException;
import jakarta.jms.Message;
import jakarta.jms.Queue;
import jakarta.jms.Topic;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class YanoteJmsHeaders {
    public static final String TEST_RUN_ID = "yanote.test.run_id";
    public static final String TEST_SUITE = "yanote.test.suite";
    public static final String MESSAGE_HINT = "yanote.message";

    private static final String TEST_RUN_ID_WIRE = "yanote_test_run_id";
    private static final String TEST_SUITE_WIRE = "yanote_test_suite";
    private static final String MESSAGE_HINT_WIRE = "yanote_message";
    private static final Map<String, String> WIRE_TO_LOGICAL_KEYS = Map.of(
            TEST_RUN_ID_WIRE, TEST_RUN_ID,
            TEST_SUITE_WIRE, TEST_SUITE,
            MESSAGE_HINT_WIRE, MESSAGE_HINT
    );

    private static final int MAX_RETAINED_HEADER_BYTES = 1024;

    private YanoteJmsHeaders() {
    }

    public static void applyContextIfAbsent(Message message) {
        if (message == null) {
            return;
        }
        TestMetadata context = TestMetadataContextHolder.current();
        if (context == null) {
            return;
        }
        putStringPropertyIfAbsent(message, TEST_RUN_ID, context.testRunId());
        putStringPropertyIfAbsent(message, TEST_SUITE, context.testSuite());
    }

    public static void setHeaders(Message message, String testRunId, String testSuite, String messageHint) {
        replaceStringProperty(message, TEST_RUN_ID, testRunId);
        replaceStringProperty(message, TEST_SUITE, testSuite);
        replaceStringProperty(message, MESSAGE_HINT, messageHint);
    }

    public static String readTestRunId(Message message) {
        return readStringProperty(message, TEST_RUN_ID);
    }

    public static String readTestSuite(Message message) {
        return readStringProperty(message, TEST_SUITE);
    }

    public static String readMessageHint(Message message) {
        String explicit = readStringProperty(message, MESSAGE_HINT);
        if (explicit != null) {
            return explicit;
        }
        try {
            return normalize(message == null ? null : message.getJMSType());
        } catch (JMSException ex) {
            return null;
        }
    }

    public static RetainedHeaders retainHeaders(Message message) {
        if (message == null) {
            return RetainedHeaders.empty();
        }

        Map<String, JmsEvent.HeaderEvidence> retained = new LinkedHashMap<>();
        List<String> warnings = new ArrayList<>();

        retainStandardHeader(retained, warnings, "JMSCorrelationID", readCorrelationId(message));
        retainStandardHeader(retained, warnings, "JMSReplyTo", describeReplyTo(message));
        retainStandardHeader(retained, warnings, "JMSType", readJmsType(message));

        try {
            Enumeration<?> propertyNames = message.getPropertyNames();
            while (propertyNames != null && propertyNames.hasMoreElements()) {
                Object rawName = propertyNames.nextElement();
                String rawKey = normalize(String.valueOf(rawName));
                if (rawKey == null) {
                    continue;
                }
                String logicalKey = logicalPropertyKey(rawKey);
                RetainedHeader retainedHeader = retainApplicationProperty(message, rawKey, logicalKey);
                retained.put(logicalKey, retainedHeader.headerEvidence());
                if (retainedHeader.warning() != null) {
                    warnings.add(retainedHeader.warning());
                }
            }
        } catch (JMSException ex) {
            warnings.add("failed to enumerate JMS properties: " + ex.getMessage());
        }

        return new RetainedHeaders(retained.isEmpty() ? null : retained, List.copyOf(warnings));
    }

    public static String describeDestination(Object destinationHint) {
        if (destinationHint instanceof String destinationName) {
            return normalize(destinationName);
        }
        if (destinationHint instanceof Queue queue) {
            try {
                return normalize(queue.getQueueName());
            } catch (JMSException ex) {
                return null;
            }
        }
        if (destinationHint instanceof Topic topic) {
            try {
                return normalize(topic.getTopicName());
            } catch (JMSException ex) {
                return null;
            }
        }
        if (destinationHint instanceof Destination destination) {
            return normalize(destination.toString());
        }
        return null;
    }

    private static void retainStandardHeader(
            Map<String, JmsEvent.HeaderEvidence> retained,
            List<String> warnings,
            String key,
            String value
    ) {
        if (value == null) {
            return;
        }
        RetainedHeader retainedHeader = retainScalarValue(key, value);
        retained.put(key, retainedHeader.headerEvidence());
        if (retainedHeader.warning() != null) {
            warnings.add(retainedHeader.warning());
        }
    }

    private static RetainedHeader retainApplicationProperty(Message message, String rawKey, String logicalKey) {
        if (isSensitiveHeader(logicalKey)) {
            return new RetainedHeader(
                    new JmsEvent.HeaderEvidence(
                            JmsEvent.HeaderCaptureState.REDACTED,
                            null,
                            JmsEvent.HeaderCaptureReason.SENSITIVE
                    ),
                    "redacted sensitive JMS property '" + logicalKey + "'"
            );
        }

        try {
            Object rawValue = message.getObjectProperty(rawKey);
            if (rawValue == null) {
                return omitted(logicalKey, JmsEvent.HeaderCaptureReason.UNSUPPORTED, "JMS property value was null");
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
                        logicalKey,
                        JmsEvent.HeaderCaptureReason.UNSUPPORTED,
                        "unsupported JMS property type: " + rawValue.getClass().getName()
                );
            }
            return retainScalarValue(logicalKey, normalizedValue);
        } catch (JMSException ex) {
            return omitted(logicalKey, JmsEvent.HeaderCaptureReason.UNSUPPORTED, "failed to read JMS property: " + ex.getMessage());
        }
    }

    private static RetainedHeader retainScalarValue(String key, String value) {
        if (isSensitiveHeader(key)) {
            return new RetainedHeader(
                    new JmsEvent.HeaderEvidence(
                            JmsEvent.HeaderCaptureState.REDACTED,
                            null,
                            JmsEvent.HeaderCaptureReason.SENSITIVE
                    ),
                    "redacted sensitive JMS header '" + key + "'"
            );
        }

        String normalizedValue = normalize(value);
        if (normalizedValue == null) {
            return omitted(key, JmsEvent.HeaderCaptureReason.UNSUPPORTED, "JMS value was blank");
        }
        if (containsControlCharacters(normalizedValue)) {
            return omitted(key, JmsEvent.HeaderCaptureReason.UNSUPPORTED, "JMS value contained control characters");
        }
        int encodedLength = normalizedValue.getBytes(StandardCharsets.UTF_8).length;
        if (encodedLength > MAX_RETAINED_HEADER_BYTES) {
            return omitted(
                    key,
                    JmsEvent.HeaderCaptureReason.OVERSIZED,
                    "JMS value size " + encodedLength + " bytes exceeded safe capture limit " + MAX_RETAINED_HEADER_BYTES
            );
        }
        return new RetainedHeader(
                new JmsEvent.HeaderEvidence(
                        JmsEvent.HeaderCaptureState.CAPTURED,
                        normalizedValue,
                        null
                ),
                null
        );
    }

    private static RetainedHeader omitted(String key, JmsEvent.HeaderCaptureReason reason, String detail) {
        return new RetainedHeader(
                new JmsEvent.HeaderEvidence(
                        JmsEvent.HeaderCaptureState.OMITTED,
                        null,
                        reason
                ),
                "omitted JMS header '" + key + "' (" + detail + ")"
        );
    }

    private static String readCorrelationId(Message message) {
        try {
            return normalize(message.getJMSCorrelationID());
        } catch (JMSException ex) {
            return null;
        }
    }

    private static String readJmsType(Message message) {
        try {
            return normalize(message.getJMSType());
        } catch (JMSException ex) {
            return null;
        }
    }

    private static String describeReplyTo(Message message) {
        try {
            return describeDestination(message.getJMSReplyTo());
        } catch (JMSException ex) {
            return null;
        }
    }

    private static void putStringPropertyIfAbsent(Message message, String logicalKey, String value) {
        String normalized = normalize(value);
        if (message == null || normalized == null) {
            return;
        }
        String wireKey = wirePropertyKey(logicalKey);
        try {
            if (!message.propertyExists(wireKey)) {
                message.setStringProperty(wireKey, normalized);
            }
        } catch (JMSException ex) {
            // best effort only; recorder must not break message delivery
        }
    }

    private static void replaceStringProperty(Message message, String logicalKey, String value) {
        String normalized = normalize(value);
        if (message == null) {
            return;
        }
        String wireKey = wirePropertyKey(logicalKey);
        try {
            if (normalized != null) {
                message.setStringProperty(wireKey, normalized);
            }
        } catch (JMSException ex) {
            // best effort only; recorder must not break message delivery
        }
    }

    private static String readStringProperty(Message message, String logicalKey) {
        if (message == null) {
            return null;
        }
        String preferredWireKey = wirePropertyKey(logicalKey);
        try {
            if (message.propertyExists(preferredWireKey)) {
                return normalize(message.getStringProperty(preferredWireKey));
            }
            if (message.propertyExists(logicalKey)) {
                return normalize(message.getStringProperty(logicalKey));
            }
            return null;
        } catch (JMSException ex) {
            return null;
        }
    }

    private static String wirePropertyKey(String logicalKey) {
        return switch (logicalKey) {
            case TEST_RUN_ID -> TEST_RUN_ID_WIRE;
            case TEST_SUITE -> TEST_SUITE_WIRE;
            case MESSAGE_HINT -> MESSAGE_HINT_WIRE;
            default -> logicalKey;
        };
    }

    private static String logicalPropertyKey(String rawKey) {
        return WIRE_TO_LOGICAL_KEYS.getOrDefault(rawKey, rawKey);
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

    record RetainedHeader(JmsEvent.HeaderEvidence headerEvidence, String warning) {
    }

    public record RetainedHeaders(Map<String, JmsEvent.HeaderEvidence> headers, List<String> warnings) {
        static RetainedHeaders empty() {
            return new RetainedHeaders(null, List.of());
        }
    }
}

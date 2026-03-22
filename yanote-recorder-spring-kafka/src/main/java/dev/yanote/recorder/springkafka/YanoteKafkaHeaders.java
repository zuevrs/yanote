package dev.yanote.recorder.springkafka;

import dev.yanote.core.events.KafkaEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.header.internals.RecordHeader;

public final class YanoteKafkaHeaders {
    public static final String TEST_RUN_ID = "yanote.test.run_id";
    public static final String TEST_SUITE = "yanote.test.suite";
    public static final String MESSAGE_HINT = "yanote.message";

    private static final int MAX_RETAINED_HEADER_BYTES = 1024;

    private YanoteKafkaHeaders() {
    }

    public static void applyContextIfAbsent(Headers headers) {
        TestMetadata context = TestMetadataContextHolder.current();
        if (context == null) {
            return;
        }
        putIfAbsent(headers, TEST_RUN_ID, context.testRunId());
        putIfAbsent(headers, TEST_SUITE, context.testSuite());
    }

    public static void setHeaders(Headers headers, String testRunId, String testSuite, String messageHint) {
        replace(headers, TEST_RUN_ID, testRunId);
        replace(headers, TEST_SUITE, testSuite);
        replace(headers, MESSAGE_HINT, messageHint);
    }

    public static String readTestRunId(Headers headers) {
        return read(headers, TEST_RUN_ID);
    }

    public static String readTestSuite(Headers headers) {
        return read(headers, TEST_SUITE);
    }

    public static String readMessageHint(Headers headers) {
        return read(headers, MESSAGE_HINT);
    }

    public static Map<String, KafkaEvent.HeaderEvidence> retainHeaders(Headers headers) {
        if (headers == null) {
            return null;
        }

        Map<String, KafkaEvent.HeaderEvidence> retained = new LinkedHashMap<>();
        for (Header header : headers) {
            String key = normalize(header.key());
            if (key == null) {
                continue;
            }
            retained.put(key, retainHeaderValue(key, header.value()));
        }
        return retained.isEmpty() ? null : retained;
    }

    private static KafkaEvent.HeaderEvidence retainHeaderValue(String key, byte[] rawValue) {
        if (isSensitiveHeader(key)) {
            return new KafkaEvent.HeaderEvidence(
                    KafkaEvent.HeaderCaptureState.REDACTED,
                    null,
                    KafkaEvent.HeaderCaptureReason.SENSITIVE
            );
        }

        if (rawValue == null || rawValue.length == 0) {
            return new KafkaEvent.HeaderEvidence(
                    KafkaEvent.HeaderCaptureState.OMITTED,
                    null,
                    KafkaEvent.HeaderCaptureReason.UNSUPPORTED
            );
        }

        if (rawValue.length > MAX_RETAINED_HEADER_BYTES) {
            return new KafkaEvent.HeaderEvidence(
                    KafkaEvent.HeaderCaptureState.OMITTED,
                    null,
                    KafkaEvent.HeaderCaptureReason.OVERSIZED
            );
        }

        String normalizedValue = decodeAndNormalize(rawValue);
        if (normalizedValue == null) {
            return new KafkaEvent.HeaderEvidence(
                    KafkaEvent.HeaderCaptureState.OMITTED,
                    null,
                    KafkaEvent.HeaderCaptureReason.UNSUPPORTED
            );
        }

        return new KafkaEvent.HeaderEvidence(
                KafkaEvent.HeaderCaptureState.CAPTURED,
                normalizedValue,
                null
        );
    }

    private static void putIfAbsent(Headers headers, String key, String value) {
        String normalized = normalize(value);
        if (normalized == null || headers.lastHeader(key) != null) {
            return;
        }
        headers.add(new RecordHeader(key, normalized.getBytes(StandardCharsets.UTF_8)));
    }

    private static void replace(Headers headers, String key, String value) {
        headers.remove(key);
        String normalized = normalize(value);
        if (normalized != null) {
            headers.add(new RecordHeader(key, normalized.getBytes(StandardCharsets.UTF_8)));
        }
    }

    private static String read(Headers headers, String key) {
        Header header = headers.lastHeader(key);
        if (header == null || header.value() == null) {
            return null;
        }
        return decodeAndNormalize(header.value());
    }

    private static String decodeAndNormalize(byte[] rawValue) {
        try {
            CharsetDecoder decoder = StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT);
            String decoded = decoder.decode(ByteBuffer.wrap(rawValue)).toString();
            String normalized = normalize(decoded);
            if (normalized == null || containsControlCharacters(normalized)) {
                return null;
            }
            return normalized;
        } catch (CharacterCodingException ex) {
            return null;
        }
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
        return value.codePoints().anyMatch(codePoint -> Character.isISOControl(codePoint));
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}

package dev.yanote.recorder.springkafka;

import java.nio.charset.StandardCharsets;
import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.header.internals.RecordHeader;

public final class YanoteKafkaHeaders {
    public static final String TEST_RUN_ID = "yanote.test.run_id";
    public static final String TEST_SUITE = "yanote.test.suite";
    public static final String MESSAGE_HINT = "yanote.message";

    private YanoteKafkaHeaders() {
    }

    public static void applyContextIfAbsent(Headers headers) {
        YanoteKafkaContextHolder.YanoteKafkaContext context = YanoteKafkaContextHolder.current();
        if (context == null) {
            return;
        }
        putIfAbsent(headers, TEST_RUN_ID, context.testRunId());
        putIfAbsent(headers, TEST_SUITE, context.testSuite());
        putIfAbsent(headers, MESSAGE_HINT, context.messageHint());
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
        return normalize(new String(header.value(), StandardCharsets.UTF_8));
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}

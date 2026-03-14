package dev.yanote.recorder.springkafka;

import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import org.apache.kafka.common.header.Headers;

public final class YanoteKafkaContextHolder {
    private static final ThreadLocal<String> MESSAGE_HINT = new ThreadLocal<>();

    private YanoteKafkaContextHolder() {
    }

    public static YanoteKafkaContext current() {
        TestMetadata testMetadata = TestMetadataContextHolder.current();
        String messageHint = MESSAGE_HINT.get();
        if (testMetadata == null && messageHint == null) {
            return null;
        }
        return new YanoteKafkaContext(
                testMetadata == null ? null : testMetadata.testRunId(),
                testMetadata == null ? null : testMetadata.testSuite(),
                messageHint
        );
    }

    public static void set(String testRunId, String testSuite, String messageHint) {
        TestMetadataContextHolder.set(testRunId, testSuite);
        String normalizedMessageHint = normalize(messageHint);
        if (normalizedMessageHint == null) {
            MESSAGE_HINT.remove();
            return;
        }
        MESSAGE_HINT.set(normalizedMessageHint);
    }

    public static void setFromHeaders(Headers headers) {
        TestMetadataContextHolder.set(
                YanoteKafkaHeaders.readTestRunId(headers),
                YanoteKafkaHeaders.readTestSuite(headers)
        );
        MESSAGE_HINT.remove();
    }

    public static void clear() {
        TestMetadataContextHolder.clear();
        MESSAGE_HINT.remove();
    }

    public record YanoteKafkaContext(String testRunId, String testSuite, String messageHint) {
        public YanoteKafkaContext {
            testRunId = normalize(testRunId);
            testSuite = normalize(testSuite);
            messageHint = normalize(messageHint);
        }

        public boolean isEmpty() {
            return testRunId == null && testSuite == null && messageHint == null;
        }
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}

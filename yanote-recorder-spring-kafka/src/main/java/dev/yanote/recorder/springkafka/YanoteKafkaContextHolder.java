package dev.yanote.recorder.springkafka;

public final class YanoteKafkaContextHolder {
    private static final ThreadLocal<YanoteKafkaContext> CONTEXT = new ThreadLocal<>();

    private YanoteKafkaContextHolder() {
    }

    public static YanoteKafkaContext current() {
        return CONTEXT.get();
    }

    public static void set(String testRunId, String testSuite, String messageHint) {
        YanoteKafkaContext context = new YanoteKafkaContext(testRunId, testSuite, messageHint);
        if (context.isEmpty()) {
            CONTEXT.remove();
            return;
        }
        CONTEXT.set(context);
    }

    public static void setFromHeaders(org.apache.kafka.common.header.Headers headers) {
        set(
                YanoteKafkaHeaders.readTestRunId(headers),
                YanoteKafkaHeaders.readTestSuite(headers),
                YanoteKafkaHeaders.readMessageHint(headers)
        );
    }

    public static void clear() {
        CONTEXT.remove();
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

        private static String normalize(String value) {
            if (value == null) {
                return null;
            }
            String normalized = value.trim();
            return normalized.isEmpty() ? null : normalized;
        }
    }
}

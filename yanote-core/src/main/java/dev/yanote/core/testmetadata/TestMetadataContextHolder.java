package dev.yanote.core.testmetadata;

public final class TestMetadataContextHolder {
    private static final ThreadLocal<TestMetadata> CONTEXT = new ThreadLocal<>();

    private TestMetadataContextHolder() {
    }

    public static TestMetadata current() {
        return CONTEXT.get();
    }

    public static void set(String testRunId, String testSuite) {
        set(new TestMetadata(testRunId, testSuite));
    }

    public static void set(TestMetadata testMetadata) {
        if (testMetadata == null || testMetadata.isEmpty()) {
            CONTEXT.remove();
            return;
        }
        CONTEXT.set(testMetadata);
    }

    public static void clear() {
        CONTEXT.remove();
    }
}

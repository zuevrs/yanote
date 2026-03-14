package dev.yanote.core.testmetadata;

public record TestMetadata(String testRunId, String testSuite) {
    public TestMetadata {
        testRunId = normalize(testRunId);
        testSuite = normalize(testSuite);
    }

    public boolean isEmpty() {
        return testRunId == null && testSuite == null;
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}

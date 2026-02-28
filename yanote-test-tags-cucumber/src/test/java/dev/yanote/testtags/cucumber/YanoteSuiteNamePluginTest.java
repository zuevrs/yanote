package dev.yanote.testtags.cucumber;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.URI;
import org.junit.jupiter.api.Test;

class YanoteSuiteNamePluginTest {

    @Test
    void shouldUseFeatureUriFileName() {
        YanoteSuiteNamePlugin plugin = new YanoteSuiteNamePlugin();

        String suite = plugin.resolveSuiteName(
                URI.create("file:///home/ci/features/user-service/coverage.feature"),
                "fallback"
        );

        assertEquals("coverage", suite);
    }

    @Test
    void shouldFallBackToFallbackName() {
        YanoteSuiteNamePlugin plugin = new YanoteSuiteNamePlugin();

        String suite = plugin.resolveSuiteName(null, "RunnerSuite");
        assertEquals("RunnerSuite", suite);
    }

    @Test
    void shouldReturnDirectoryNameForDirectoryUri() {
        YanoteSuiteNamePlugin plugin = new YanoteSuiteNamePlugin();

        assertEquals("features", plugin.resolveSuiteName(URI.create("file:///home/ci/features/"), ""));
    }
}

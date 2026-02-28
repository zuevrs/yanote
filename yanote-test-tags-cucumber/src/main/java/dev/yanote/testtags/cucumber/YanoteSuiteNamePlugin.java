package dev.yanote.testtags.cucumber;

import io.cucumber.plugin.ConcurrentEventListener;
import io.cucumber.plugin.event.EventPublisher;
import io.cucumber.plugin.event.TestCaseStarted;
import java.net.URI;
import java.nio.file.Path;

/**
 * Cucumber plugin that sets test suite name for yanote request tagging.
 */
public final class YanoteSuiteNamePlugin implements ConcurrentEventListener {
    public static final String SUITE_PROPERTY = "yanote.suite";

    private final String propertyKey;

    public YanoteSuiteNamePlugin() {
        this(SUITE_PROPERTY);
    }

    public YanoteSuiteNamePlugin(String propertyKey) {
        this.propertyKey = propertyKey;
    }

    @Override
    public void setEventPublisher(EventPublisher publisher) {
        publisher.registerHandlerFor(TestCaseStarted.class, this::handle);
    }

    void handle(TestCaseStarted event) {
        if (event == null || event.getTestCase() == null) {
            return;
        }

        String suite = resolveSuiteName(event.getTestCase().getUri(), event.getTestCase().getName());
        if (suite != null && !suite.isBlank()) {
            System.setProperty(propertyKey, suite);
        }
    }

    public String resolveSuiteName(URI uri, String fallbackName) {
        if (uri == null || uri.toString().isBlank()) {
            return normalize(fallbackName);
        }

        String path = uri.getPath();
        if (path == null || path.isBlank()) {
            return normalize(fallbackName);
        }

        String fileName = Path.of(path).getFileName().toString();
        return normalize(fileName);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.strip();
        if (normalized.isEmpty()) {
            return null;
        }
        int extensionSeparator = normalized.lastIndexOf('.');
        if (extensionSeparator > 0) {
            normalized = normalized.substring(0, extensionSeparator);
        }
        return normalized;
    }
}

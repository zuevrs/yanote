package dev.yanote.recorder.springmvc;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;

class HttpMetadataContextBridgeTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @TempDir
    Path tempDir;

    @AfterEach
    void clearContext() {
        TestMetadataContextHolder.clear();
    }

    @Test
    void shouldSeedSharedContextForRequestLifecycleAndClearAfterRecording() throws Exception {
        Path eventsPath = tempDir.resolve("events.jsonl");
        HttpEventRecordingFilter filter = new HttpEventRecordingFilter(
                eventsPath.toString(),
                "mvc-bridge-service",
                new RouteTemplateResolver()
        );
        MockHttpServletRequest request = requestWithMetadata("run-1", "suite-a");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<TestMetadata> metadataSeenInHandler = new AtomicReference<>();

        filter.doFilter(request, response, (req, res) -> {
            metadataSeenInHandler.set(TestMetadataContextHolder.current());
            ((MockHttpServletResponse) res).setStatus(201);
        });

        assertThat(metadataSeenInHandler.get()).isEqualTo(new TestMetadata("run-1", "suite-a"));
        assertThat(TestMetadataContextHolder.current()).isNull();

        List<String> lines = Files.readAllLines(eventsPath);
        assertThat(lines).hasSize(1);
        HttpEvent event = OBJECT_MAPPER.readValue(lines.get(0), HttpEvent.class);
        assertThat(event.testRunId()).isEqualTo("run-1");
        assertThat(event.testSuite()).isEqualTo("suite-a");
        assertThat(event.route()).isEqualTo("/v1/users/{id}");
        assertThat(event.status()).isEqualTo(201);
    }

    @Test
    void shouldClearSharedContextWhenRecorderWriteFails() throws Exception {
        Path eventsDirectory = Files.createDirectory(tempDir.resolve("events-dir"));
        HttpEventRecordingFilter filter = new HttpEventRecordingFilter(
                eventsDirectory.toString(),
                "mvc-bridge-service",
                new RouteTemplateResolver()
        );
        MockHttpServletRequest request = requestWithMetadata("run-2", "suite-b");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<TestMetadata> metadataSeenInHandler = new AtomicReference<>();

        filter.doFilter(request, response, (req, res) -> metadataSeenInHandler.set(TestMetadataContextHolder.current()));

        assertThat(metadataSeenInHandler.get()).isEqualTo(new TestMetadata("run-2", "suite-b"));
        assertThat(TestMetadataContextHolder.current()).isNull();
    }

    private static MockHttpServletRequest requestWithMetadata(String runId, String suite) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/v1/users/123");
        request.addHeader("X-Test-Run-Id", runId);
        request.addHeader("X-Test-Suite", suite);
        request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, "/v1/users/{id}");
        return request;
    }
}

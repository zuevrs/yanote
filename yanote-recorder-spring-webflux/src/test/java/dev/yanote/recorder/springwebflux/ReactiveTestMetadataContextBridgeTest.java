package dev.yanote.recorder.springwebflux;

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
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.util.pattern.PathPatternParser;

class ReactiveTestMetadataContextBridgeTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @TempDir
    Path tempDir;

    @AfterEach
    void clearContext() {
        TestMetadataContextHolder.clear();
    }

    @Test
    void shouldSeedReactiveBridgeForExchangeLifecycleAndClearAfterRecording() throws Exception {
        Path eventsPath = tempDir.resolve("events.jsonl");
        ReactiveTestMetadataBridge bridge = new ReactiveTestMetadataBridge();
        HttpEventRecordingWebFilter filter = new HttpEventRecordingWebFilter(
                eventsPath.toString(),
                "webflux-bridge-service",
                new ReactiveRouteTemplateResolver(),
                new ReactiveHttpRequestEvidenceCapture(),
                new ReactiveHttpPayloadCapture(),
                bridge
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(requestWithMetadata("run-1", "suite-a"));
        AtomicReference<TestMetadata> metadataSeenInExchange = new AtomicReference<>();
        AtomicReference<TestMetadata> metadataSeenInContext = new AtomicReference<>();
        AtomicReference<TestMetadata> metadataSeenInThreadLocal = new AtomicReference<>();

        filter.filter(exchange, currentExchange -> {
            currentExchange.getAttributes().put(
                    HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE,
                    PathPatternParser.defaultInstance.parse("/v1/users/{id}")
            );
            currentExchange.getResponse().setStatusCode(HttpStatus.CREATED);
            metadataSeenInExchange.set(bridge.current(currentExchange));
            metadataSeenInThreadLocal.set(TestMetadataContextHolder.current());
            return bridge.current()
                    .doOnNext(metadataSeenInContext::set)
                    .then();
        }).block();

        assertThat(metadataSeenInExchange.get()).isEqualTo(new TestMetadata("run-1", "suite-a"));
        assertThat(metadataSeenInContext.get()).isEqualTo(new TestMetadata("run-1", "suite-a"));
        assertThat(metadataSeenInThreadLocal.get()).isNull();
        assertThat(bridge.current(exchange)).isNull();
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
    void shouldClearReactiveBridgeWhenRecorderWriteFails() throws Exception {
        Path eventsDirectory = Files.createDirectory(tempDir.resolve("events-dir"));
        ReactiveTestMetadataBridge bridge = new ReactiveTestMetadataBridge();
        HttpEventRecordingWebFilter filter = new HttpEventRecordingWebFilter(
                eventsDirectory.toString(),
                "webflux-bridge-service",
                new ReactiveRouteTemplateResolver(),
                new ReactiveHttpRequestEvidenceCapture(),
                new ReactiveHttpPayloadCapture(),
                bridge
        );
        MockServerWebExchange exchange = MockServerWebExchange.from(requestWithMetadata("run-2", "suite-b"));
        AtomicReference<TestMetadata> metadataSeenInExchange = new AtomicReference<>();
        AtomicReference<TestMetadata> metadataSeenInContext = new AtomicReference<>();
        AtomicReference<TestMetadata> metadataSeenInThreadLocal = new AtomicReference<>();

        filter.filter(exchange, currentExchange -> {
            metadataSeenInExchange.set(bridge.current(currentExchange));
            metadataSeenInThreadLocal.set(TestMetadataContextHolder.current());
            return bridge.current()
                    .doOnNext(metadataSeenInContext::set)
                    .then();
        }).block();

        assertThat(metadataSeenInExchange.get()).isEqualTo(new TestMetadata("run-2", "suite-b"));
        assertThat(metadataSeenInContext.get()).isEqualTo(new TestMetadata("run-2", "suite-b"));
        assertThat(metadataSeenInThreadLocal.get()).isNull();
        assertThat(bridge.current(exchange)).isNull();
        assertThat(TestMetadataContextHolder.current()).isNull();
    }

    private static MockServerHttpRequest requestWithMetadata(String runId, String suite) {
        return MockServerHttpRequest.get("/v1/users/123")
                .header("X-Test-Run-Id", runId)
                .header("X-Test-Suite", suite)
                .build();
    }
}

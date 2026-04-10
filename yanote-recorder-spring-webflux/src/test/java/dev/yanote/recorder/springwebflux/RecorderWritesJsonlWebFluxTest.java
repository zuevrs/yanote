package dev.yanote.recorder.springwebflux;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.events.HttpRequestEvidence;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@SpringBootTest(
        classes = RecorderWritesJsonlWebFluxTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@AutoConfigureWebTestClient
@ImportAutoConfiguration(YanoteReactiveRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=webflux-recorder-service",
        "spring.main.web-application-type=reactive"
})
class RecorderWritesJsonlWebFluxTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Path EVENTS_PATH = Path.of(System.getProperty("java.io.tmpdir"), "yanote-webflux-recorder-events.jsonl");

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void recorderProperties(DynamicPropertyRegistry registry) {
        registry.add("yanote.recorder.events-path", EVENTS_PATH::toString);
    }

    @Test
    void shouldWriteOneEventWithBoundedJsonPayloadsForFiniteExchange() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        webTestClient.post()
                .uri(uriBuilder -> uriBuilder.path("/v1/users/{id}").queryParam("expand", "roles", "teams").build("123"))
                .header("X-Test-Run-Id", "run-1")
                .header("X-Test-Suite", "suite-a")
                .header("X-Trace-Id", "trace-1", "trace-2")
                .header("Authorization", "Bearer secret")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .cookie("theme", "dark")
                .cookie("SESSION", "secret-session")
                .bodyValue(Map.of("name", "Ada"))
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .json("""
                        {"id":"123","name":"Ada"}
                        """);

        HttpEvent event = readSingleEvent();
        assertEquals("POST", event.method());
        assertEquals("/v1/users/{id}", event.route());
        assertEquals("run-1", event.testRunId());
        assertEquals("suite-a", event.testSuite());
        assertEquals(201, event.status());
        assertEquals("webflux-recorder-service", event.service());
        assertEquals(List.of("123"), event.pathParams().get("id").values());
        assertEquals(List.of("roles", "teams"), event.queryParams().get("expand").values());
        assertEquals(List.of("trace-1", "trace-2"), event.requestHeaders().get("x-trace-id").values());
        assertEquals(HttpRequestEvidence.State.REDACTED, event.requestHeaders().get("authorization").state());
        assertFalse(event.requestHeaders().containsKey("x-test-run-id"));
        assertFalse(event.requestHeaders().containsKey("x-test-suite"));
        assertEquals(List.of("dark"), event.cookies().get("theme").values());
        assertEquals(HttpRequestEvidence.State.REDACTED, event.cookies().get("SESSION").state());
        assertEquals(OBJECT_MAPPER.readTree("""
                {"name":"Ada"}
                """), event.requestBody());
        assertEquals(dev.yanote.core.events.PayloadCaptureState.CAPTURED, event.requestBodyState());
        assertNull(event.requestBodyReason());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, event.requestContentType());
        assertEquals(OBJECT_MAPPER.readTree("""
                {"id":"123","name":"Ada"}
                """), event.responseBody());
        assertEquals(dev.yanote.core.events.PayloadCaptureState.CAPTURED, event.responseBodyState());
        assertNull(event.responseBodyReason());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, event.responseContentType());
    }

    private static HttpEvent readSingleEvent() throws Exception {
        List<String> lines = Files.readAllLines(EVENTS_PATH);
        assertEquals(1, lines.size());
        return OBJECT_MAPPER.readValue(lines.get(0), HttpEvent.class);
    }

    @SpringBootApplication
    static class TestApp {

        @RestController
        static class TestController {
            @PostMapping(value = "/v1/users/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
            @ResponseStatus(HttpStatus.CREATED)
            Mono<Map<String, Object>> createUser(@PathVariable("id") String id, @RequestBody Map<String, Object> requestBody) {
                return Mono.just(Map.of("id", id, "name", requestBody.get("name")));
            }
        }
    }
}

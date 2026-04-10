package dev.yanote.recorder.springwebflux;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@SpringBootTest(
        classes = RecorderPayloadOmissionWebFluxTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@AutoConfigureWebTestClient
@ImportAutoConfiguration(YanoteReactiveRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=webflux-payload-omission-service",
        "spring.main.web-application-type=reactive"
})
class RecorderPayloadOmissionWebFluxTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Path EVENTS_PATH = Path.of(System.getProperty("java.io.tmpdir"), "yanote-webflux-payload-omission-events.jsonl");

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void recorderProperties(DynamicPropertyRegistry registry) {
        registry.add("yanote.recorder.events-path", EVENTS_PATH::toString);
    }

    @Test
    void shouldOmitOversizedRequestPayloadsTruthfully() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);
        String oversizedJson = jsonWithRepeatedValue(ReactiveHttpPayloadCapture.MAX_CAPTURE_BYTES);

        webTestClient.post()
                .uri("/payloads/oversized-request")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(oversizedJson)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .json("""
                        {"accepted":true}
                        """);

        HttpEvent event = readSingleEvent();
        assertNull(event.requestBody());
        assertEquals(PayloadCaptureState.OMITTED, event.requestBodyState());
        assertEquals(PayloadCaptureReason.OVERSIZED, event.requestBodyReason());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, event.requestContentType());
        assertEquals(OBJECT_MAPPER.readTree("""
                {"accepted":true}
                """), event.responseBody());
        assertEquals(PayloadCaptureState.CAPTURED, event.responseBodyState());
        assertNull(event.responseBodyReason());
    }

    @Test
    void shouldOmitMalformedRequestPayloadsTruthfully() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        webTestClient.post()
                .uri("/payloads/malformed-request")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue("{\"name\":")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .json("""
                        {"accepted":true}
                        """);

        HttpEvent event = readSingleEvent();
        assertNull(event.requestBody());
        assertEquals(PayloadCaptureState.OMITTED, event.requestBodyState());
        assertEquals(PayloadCaptureReason.MALFORMED, event.requestBodyReason());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, event.requestContentType());
        assertEquals(OBJECT_MAPPER.readTree("""
                {"accepted":true}
                """), event.responseBody());
        assertEquals(PayloadCaptureState.CAPTURED, event.responseBodyState());
        assertNull(event.responseBodyReason());
    }

    @Test
    void shouldOmitFiniteNonJsonPayloadsAsPolicyFiltered() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        webTestClient.post()
                .uri("/payloads/plain")
                .contentType(MediaType.TEXT_PLAIN)
                .accept(MediaType.TEXT_PLAIN)
                .bodyValue("hello")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .isEqualTo("HELLO");

        HttpEvent event = readSingleEvent();
        assertNull(event.requestBody());
        assertEquals(PayloadCaptureState.OMITTED, event.requestBodyState());
        assertEquals(PayloadCaptureReason.POLICY_FILTERED, event.requestBodyReason());
        assertTrue(event.requestContentType().startsWith(MediaType.TEXT_PLAIN_VALUE));
        assertNull(event.responseBody());
        assertEquals(PayloadCaptureState.OMITTED, event.responseBodyState());
        assertEquals(PayloadCaptureReason.POLICY_FILTERED, event.responseBodyReason());
        assertTrue(event.responseContentType().startsWith(MediaType.TEXT_PLAIN_VALUE));
    }

    @Test
    void shouldOmitOversizedResponsePayloadsTruthfully() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        webTestClient.post()
                .uri("/payloads/oversized-response")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("name", "Ada"))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.value").isEqualTo(largeValue(ReactiveHttpPayloadCapture.MAX_CAPTURE_BYTES));

        HttpEvent event = readSingleEvent();
        assertEquals(OBJECT_MAPPER.readTree("""
                {"name":"Ada"}
                """), event.requestBody());
        assertEquals(PayloadCaptureState.CAPTURED, event.requestBodyState());
        assertNull(event.requestBodyReason());
        assertNull(event.responseBody());
        assertEquals(PayloadCaptureState.OMITTED, event.responseBodyState());
        assertEquals(PayloadCaptureReason.OVERSIZED, event.responseBodyReason());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, event.responseContentType());
    }

    @Test
    void shouldOmitMalformedJsonResponsesTruthfully() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        webTestClient.get()
                .uri("/payloads/malformed-response")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .isEqualTo("{\"broken\":");

        HttpEvent event = readSingleEvent();
        assertNull(event.requestBody());
        assertNull(event.requestBodyState());
        assertNull(event.requestBodyReason());
        assertNull(event.requestContentType());
        assertNull(event.responseBody());
        assertEquals(PayloadCaptureState.OMITTED, event.responseBodyState());
        assertEquals(PayloadCaptureReason.MALFORMED, event.responseBodyReason());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, event.responseContentType());
    }

    @Test
    void shouldOmitSseResponsesAsUnsupported() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        webTestClient.get()
                .uri("/payloads/sse")
                .accept(MediaType.TEXT_EVENT_STREAM)
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(String.class)
                .hasSize(1);

        HttpEvent event = readSingleEvent();
        assertNull(event.responseBody());
        assertEquals(PayloadCaptureState.OMITTED, event.responseBodyState());
        assertEquals(PayloadCaptureReason.UNSUPPORTED, event.responseBodyReason());
        assertTrue(event.responseContentType().startsWith(MediaType.TEXT_EVENT_STREAM_VALUE));
    }

    @Test
    void shouldCaptureFiniteJsonResponseOnExceptionalCompletion() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        webTestClient.get()
                .uri("/payloads/exceptional")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
                .expectBody()
                .json("""
                        {"error":"boom"}
                        """);

        HttpEvent event = readSingleEvent();
        assertEquals(500, event.status());
        assertNull(event.requestBody());
        assertNull(event.requestBodyState());
        assertNull(event.requestBodyReason());
        assertEquals(OBJECT_MAPPER.readTree("""
                {"error":"boom"}
                """), event.responseBody());
        assertEquals(PayloadCaptureState.CAPTURED, event.responseBodyState());
        assertNull(event.responseBodyReason());
        assertEquals(MediaType.APPLICATION_JSON_VALUE, event.responseContentType());
    }

    private static HttpEvent readSingleEvent() throws Exception {
        List<String> lines = Files.readAllLines(EVENTS_PATH);
        assertEquals(1, lines.size());
        return OBJECT_MAPPER.readValue(lines.get(0), HttpEvent.class);
    }

    private static String jsonWithRepeatedValue(int repeatCount) {
        return "{\"value\":\"" + largeValue(repeatCount) + "\"}";
    }

    private static String largeValue(int repeatCount) {
        return "x".repeat(repeatCount);
    }

    @SpringBootApplication
    static class TestApp {

        @RestController
        @RequestMapping("/payloads")
        static class TestController {
            @PostMapping(value = "/oversized-request", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
            Mono<Map<String, Object>> oversizedRequest(@RequestBody String requestBody) {
                return Mono.just(Map.of("accepted", requestBody.length() > 0));
            }

            @PostMapping(value = "/malformed-request", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
            Mono<Map<String, Object>> malformedRequest(@RequestBody String requestBody) {
                return Mono.just(Map.of("accepted", requestBody.length() > 0));
            }

            @PostMapping(value = "/plain", consumes = MediaType.TEXT_PLAIN_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
            Mono<String> plain(@RequestBody String requestBody) {
                return Mono.just(requestBody.toUpperCase(Locale.ROOT));
            }

            @PostMapping(value = "/oversized-response", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
            Mono<ResponseEntity<String>> oversizedResponse(@RequestBody Map<String, Object> requestBody) {
                String responseJson = jsonWithRepeatedValue(ReactiveHttpPayloadCapture.MAX_CAPTURE_BYTES);
                return Mono.just(ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(responseJson));
            }

            @GetMapping(value = "/malformed-response", produces = MediaType.APPLICATION_JSON_VALUE)
            Mono<ResponseEntity<String>> malformedResponse() {
                return Mono.just(ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"broken\":"));
            }

            @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
            Flux<String> sse() {
                return Flux.just("data:{\"tick\":1}\\n\\n");
            }

            @GetMapping(value = "/exceptional", produces = MediaType.APPLICATION_JSON_VALUE)
            Mono<Map<String, Object>> exceptional() {
                return Mono.error(new IllegalStateException("boom"));
            }
        }

        @RestControllerAdvice
        static class TestExceptionHandler {
            @ExceptionHandler(IllegalStateException.class)
            @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
            Map<String, Object> handleIllegalState(IllegalStateException ex) {
                return Map.of("error", ex.getMessage());
            }
        }
    }
}

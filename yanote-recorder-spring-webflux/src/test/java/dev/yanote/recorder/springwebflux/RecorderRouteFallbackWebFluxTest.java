package dev.yanote.recorder.springwebflux;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.HttpEvent;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;

@SpringBootTest(
        classes = {RecorderRouteFallbackWebFluxTest.TestApp.class, RecorderRouteFallbackWebFluxTest.TestConfig.class},
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@AutoConfigureWebTestClient
@ImportAutoConfiguration(YanoteReactiveRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=webflux-fallback-service",
        "spring.main.web-application-type=reactive"
})
class RecorderRouteFallbackWebFluxTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Path EVENTS_PATH = Path.of(System.getProperty("java.io.tmpdir"), "yanote-webflux-fallback-events.jsonl");

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void recorderProperties(DynamicPropertyRegistry registry) {
        registry.add("yanote.recorder.events-path", EVENTS_PATH::toString);
    }

    @Test
    void shouldFallBackToRawRequestPathWhenMatchedPatternAttributeIsUnavailable() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        webTestClient.get()
                .uri("/v1/fallback/123?debug=true")
                .header("X-Test-Run-Id", "run-2")
                .header("X-Test-Suite", "suite-b")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.ACCEPTED)
                .expectBody(String.class).isEqualTo("123");

        HttpEvent event = readSingleEvent();
        assertEquals("GET", event.method());
        assertEquals("/v1/fallback/123", event.route());
        assertEquals("run-2", event.testRunId());
        assertEquals("suite-b", event.testSuite());
        assertEquals(202, event.status());
        assertEquals("webflux-fallback-service", event.service());
        assertNull(event.pathParams());
        assertEquals(List.of("true"), event.queryParams().get("debug").values());
    }

    private static HttpEvent readSingleEvent() throws Exception {
        List<String> lines = Files.readAllLines(EVENTS_PATH);
        assertEquals(1, lines.size());
        return OBJECT_MAPPER.readValue(lines.get(0), HttpEvent.class);
    }

    @SpringBootApplication
    static class TestApp {
        @org.springframework.web.bind.annotation.RestController
        static class TestController {
            @GetMapping("/v1/fallback/{id}")
            @ResponseStatus(HttpStatus.ACCEPTED)
            Mono<String> fallback(@PathVariable("id") String id) {
                return Mono.just(id);
            }
        }
    }

    @Configuration
    static class TestConfig {
        @Bean
        @Order(Ordered.LOWEST_PRECEDENCE)
        WebFilter clearHandlerMappingAttributesFilter() {
            return (ServerWebExchange exchange, org.springframework.web.server.WebFilterChain chain) -> chain.filter(exchange)
                    .then(Mono.fromRunnable(() -> {
                        exchange.getAttributes().remove(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
                        exchange.getAttributes().remove(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
                    }));
        }
    }
}

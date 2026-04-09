package dev.yanote.recorder.springwebflux;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@SpringBootTest(
        classes = RecorderIoFailureDoesNotBreakExchangeTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@AutoConfigureWebTestClient
@ImportAutoConfiguration(YanoteReactiveRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=webflux-io-failure-test",
        "spring.main.web-application-type=reactive"
})
class RecorderIoFailureDoesNotBreakExchangeTest {

    private static final Path EVENTS_DIR = Path.of(System.getProperty("java.io.tmpdir"), "yanote-webflux-events-dir");

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void recorderProperties(DynamicPropertyRegistry registry) {
        registry.add("yanote.recorder.events-path", EVENTS_DIR::toString);
    }

    @Test
    void shouldNotFailExchangeWhenRecorderCannotWriteEventsFile() throws Exception {
        Files.createDirectories(EVENTS_DIR);

        webTestClient.post()
                .uri("/ping")
                .header("X-Test-Run-Id", "run-3")
                .header("X-Test-Suite", "suite-c")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("message", "pong"))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .json("""
                        {"message":"pong"}
                        """);
    }

    @SpringBootApplication
    static class TestApp {
        @RestController
        static class TestController {
            @PostMapping(value = "/ping", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
            Mono<Map<String, Object>> ping(@RequestBody Map<String, Object> requestBody) {
                return Mono.just(Map.of("message", requestBody.get("message")));
            }
        }
    }
}

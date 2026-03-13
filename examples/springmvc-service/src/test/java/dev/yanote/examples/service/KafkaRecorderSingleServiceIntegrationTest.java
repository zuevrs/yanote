package dev.yanote.examples.service;

import static org.assertj.core.api.Assertions.assertThat;

import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.events.KafkaEvent;
import dev.yanote.core.events.YanoteEvent;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@SpringBootTest(
        classes = ExampleServiceApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@TestPropertySource(properties = "example.kafka.enabled=true")
class KafkaRecorderSingleServiceIntegrationTest {

    private static final Path EVENTS_PATH = resolveEventsPath();
    private static final String TEST_RUN_ID = resolveEnv("YANOTE_RUN_ID", "example-kafka-run");
    private static final String TEST_SUITE = resolveEnv("YANOTE_SUITE", "example-kafka-suite");

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    @Autowired
    private TestRestTemplate restTemplate;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
        registry.add("yanote.recorder.events-path", () -> EVENTS_PATH.toString());
    }

    @Test
    void shouldWriteMixedHttpAndKafkaEvidenceForOnePublishConsumeCycle() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.set(ExampleServiceApplication.RUN_ID_HEADER, TEST_RUN_ID);
        headers.set(ExampleServiceApplication.SUITE_HEADER, TEST_SUITE);

        org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(
                "/users",
                new HttpEntity<>("alice", headers),
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("created:alice");

        Awaitility.await()
                .atMost(Duration.ofSeconds(15))
                .untilAsserted(() -> {
                    List<YanoteEvent> events = readEvents();
                    assertThat(events).hasSize(3);
                    assertThat(events).filteredOn(KafkaEvent.class::isInstance).hasSize(2);
                });

        List<YanoteEvent> events = readEvents();
        HttpEvent httpEvent = events.stream()
                .filter(HttpEvent.class::isInstance)
                .map(HttpEvent.class::cast)
                .findFirst()
                .orElseThrow();
        List<KafkaEvent> kafkaEvents = events.stream()
                .filter(KafkaEvent.class::isInstance)
                .map(KafkaEvent.class::cast)
                .toList();

        assertThat(httpEvent.method()).isEqualTo("POST");
        assertThat(httpEvent.route()).isEqualTo("/users");
        assertThat(httpEvent.status()).isEqualTo(200);
        assertThat(httpEvent.service()).isEqualTo("examples-service");
        assertThat(httpEvent.testRunId()).isEqualTo(TEST_RUN_ID);
        assertThat(httpEvent.testSuite()).isEqualTo(TEST_SUITE);
        assertThat(httpEvent.error()).isFalse();

        assertThat(kafkaEvents).hasSize(2);
        assertThat(kafkaEvents).extracting(KafkaEvent::action)
                .containsExactlyInAnyOrder(KafkaEvent.Action.SEND, KafkaEvent.Action.RECEIVE);
        assertThat(kafkaEvents).extracting(KafkaEvent::channel)
                .containsOnly(ExampleServiceApplication.USER_EVENTS_TOPIC);
        assertThat(kafkaEvents).extracting(KafkaEvent::message)
                .containsOnly(ExampleServiceApplication.USER_CREATED_MESSAGE);
        assertThat(kafkaEvents).extracting(KafkaEvent::service)
                .containsOnly("examples-service");
        assertThat(kafkaEvents).extracting(KafkaEvent::testRunId)
                .containsOnly(TEST_RUN_ID);
        assertThat(kafkaEvents).extracting(KafkaEvent::testSuite)
                .containsOnly(TEST_SUITE);
        assertThat(kafkaEvents).allSatisfy(event -> assertThat(event.error()).isFalse());
    }

    private static List<YanoteEvent> readEvents() throws Exception {
        return new EventJsonlReader().read(EVENTS_PATH);
    }

    private static Path resolveEventsPath() {
        String env = System.getenv("YANOTE_EVENTS_PATH");
        if (env != null && !env.isBlank()) {
            return Path.of(env);
        }
        return Path.of(System.getProperty("java.io.tmpdir"), "yanote-example-kafka-" + UUID.randomUUID() + ".jsonl");
    }

    private static String resolveEnv(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}

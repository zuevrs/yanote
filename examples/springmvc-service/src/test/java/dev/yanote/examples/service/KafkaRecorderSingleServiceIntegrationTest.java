package dev.yanote.examples.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
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
@TestPropertySource(properties = {
        "example.kafka.roles.producer.enabled=true",
        "example.kafka.roles.listeners.enabled=true",
        "example.kafka.roles.republish.enabled=true",
        "spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer",
        "spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer",
        "spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer",
        "spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer",
        "spring.kafka.consumer.properties.spring.json.trusted.packages=dev.yanote.examples.service"
})
class KafkaRecorderSingleServiceIntegrationTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Path EVENTS_PATH = resolveEventsPath();
    private static final String TEST_RUN_ID = resolveEnv("YANOTE_RUN_ID", "example-kafka-run");
    private static final String TEST_SUITE = resolveEnv("YANOTE_SUITE", "example-kafka-suite");
    private static final String CREATE_USER_REQUEST_JSON = """
            {
              "name": "alice",
              "email": "alice@example.com"
            }
            """;

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
    void shouldWriteRawJsonlProofForHttpKafkaRepublishFlow() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(ExampleServiceApplication.RUN_ID_HEADER, TEST_RUN_ID);
        headers.set(ExampleServiceApplication.SUITE_HEADER, TEST_SUITE);

        org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(
                "/users",
                new HttpEntity<>(CREATE_USER_REQUEST_JSON, headers),
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(OBJECT_MAPPER.readTree(response.getBody())).isEqualTo(expectedCreateUserResponse());

        Awaitility.await()
                .atMost(Duration.ofSeconds(20))
                .untilAsserted(() -> {
                    List<JsonNode> events = readEvents();
                    assertThat(events).hasSize(5);
                    assertThat(events.stream().filter(event -> "kafka".equals(text(event, "kind"))).count()).isEqualTo(4);
                });

        List<JsonNode> events = readEvents();
        JsonNode httpEvent = findSingle(events, "http", null, null);
        JsonNode firstSend = findSingle(events, "kafka", "send", ExampleServiceApplication.USER_EVENTS_TOPIC);
        JsonNode firstReceive = findSingle(events, "kafka", "receive", ExampleServiceApplication.USER_EVENTS_TOPIC);
        JsonNode republishedSend = findSingle(events, "kafka", "send", ExampleServiceApplication.USER_REPUBLISHED_TOPIC);
        JsonNode republishedReceive = findSingle(events, "kafka", "receive", ExampleServiceApplication.USER_REPUBLISHED_TOPIC);

        assertThat(text(httpEvent, "method")).isEqualTo("POST");
        assertThat(text(httpEvent, "route")).isEqualTo("/users");
        assertThat(httpEvent.get("status").intValue()).isEqualTo(201);
        assertThat(text(httpEvent, "requestContentType")).isEqualTo("application/json");
        assertThat(text(httpEvent, "responseContentType")).isEqualTo("application/json");
        assertThat(text(httpEvent, "requestBodyState")).isEqualTo("captured");
        assertThat(httpEvent.get("requestBodyReason")).isNull();
        assertThat(text(httpEvent, "responseBodyState")).isEqualTo("captured");
        assertThat(httpEvent.get("responseBodyReason")).isNull();
        assertThat(httpEvent.get("requestBody")).isEqualTo(expectedCreateUserRequest());
        assertThat(httpEvent.get("responseBody")).isEqualTo(expectedCreateUserResponse());
        assertThat(text(httpEvent, "service")).isEqualTo("examples-service");
        assertThat(text(httpEvent, "test.run_id")).isEqualTo(TEST_RUN_ID);
        assertThat(text(httpEvent, "test.suite")).isEqualTo(TEST_SUITE);
        assertThat(httpEvent.get("error").booleanValue()).isFalse();

        assertKafkaEvent(firstSend, ExampleServiceApplication.USER_EVENTS_TOPIC, ExampleServiceApplication.USER_CREATED_MESSAGE);
        assertKafkaEvent(firstReceive, ExampleServiceApplication.USER_EVENTS_TOPIC, ExampleServiceApplication.USER_CREATED_MESSAGE);
        assertKafkaEvent(
                republishedSend,
                ExampleServiceApplication.USER_REPUBLISHED_TOPIC,
                ExampleServiceApplication.USER_REPUBLISHED_MESSAGE
        );
        assertKafkaEvent(
                republishedReceive,
                ExampleServiceApplication.USER_REPUBLISHED_TOPIC,
                ExampleServiceApplication.USER_REPUBLISHED_MESSAGE
        );

        assertThat(messagesForChannel(events, ExampleServiceApplication.USER_EVENTS_TOPIC))
                .containsOnly(ExampleServiceApplication.USER_CREATED_MESSAGE);
        assertThat(messagesForChannel(events, ExampleServiceApplication.USER_REPUBLISHED_TOPIC))
                .containsOnly(ExampleServiceApplication.USER_REPUBLISHED_MESSAGE);
    }

    private static void assertKafkaEvent(JsonNode event, String channel, String message) throws Exception {
        assertThat(text(event, "kind")).isEqualTo("kafka");
        assertThat(text(event, "channel")).isEqualTo(channel);
        assertThat(text(event, "message")).isEqualTo(message);
        assertThat(text(event, "payloadState")).isEqualTo("captured");
        assertThat(event.get("payloadReason")).isNull();
        assertThat(event.get("payload")).isEqualTo(expectedKafkaPayload());
        assertThat(text(event, "service")).isEqualTo("examples-service");
        assertThat(text(event, "test.run_id")).isEqualTo(TEST_RUN_ID);
        assertThat(text(event, "test.suite")).isEqualTo(TEST_SUITE);
        assertThat(event.get("error").booleanValue()).isFalse();
    }

    private static JsonNode findSingle(List<JsonNode> events, String kind, String action, String channel) {
        List<JsonNode> matches = events.stream()
                .filter(event -> kind.equals(text(event, "kind")))
                .filter(event -> action == null || action.equals(text(event, "action")))
                .filter(event -> channel == null || channel.equals(text(event, "channel")))
                .toList();
        assertThat(matches)
                .withFailMessage("Expected one %s event for action=%s channel=%s but found %s", kind, action, channel, matches)
                .hasSize(1);
        return matches.get(0);
    }

    private static List<String> messagesForChannel(List<JsonNode> events, String channel) {
        return events.stream()
                .filter(event -> "kafka".equals(text(event, "kind")))
                .filter(event -> channel.equals(text(event, "channel")))
                .map(event -> text(event, "message"))
                .toList();
    }

    private static List<JsonNode> readEvents() throws Exception {
        if (!Files.exists(EVENTS_PATH)) {
            return List.of();
        }

        List<JsonNode> events = new ArrayList<>();
        for (String line : Files.readAllLines(EVENTS_PATH)) {
            if (!line.isBlank()) {
                events.add(OBJECT_MAPPER.readTree(line));
            }
        }
        return events;
    }

    private static JsonNode expectedCreateUserRequest() throws Exception {
        return OBJECT_MAPPER.readTree(CREATE_USER_REQUEST_JSON);
    }

    private static JsonNode expectedCreateUserResponse() throws Exception {
        return OBJECT_MAPPER.readTree("""
                {
                  "id": "user-alice",
                  "name": "alice",
                  "email": "alice@example.com",
                  "created": true
                }
                """);
    }

    private static JsonNode expectedKafkaPayload() throws Exception {
        return OBJECT_MAPPER.readTree("""
                {
                  "name": "alice",
                  "email": "alice@example.com"
                }
                """);
    }

    private static String text(JsonNode event, String field) {
        JsonNode value = event.get(field);
        return value == null || value.isNull() ? null : value.asText();
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

package dev.yanote.examples.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
class KafkaRecorderTwoServiceIntegrationTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Path PRODUCER_EVENTS_PATH = resolveEventsPath(
            "YANOTE_PRODUCER_EVENTS_PATH",
            "yanote-example-kafka-two-service-producer"
    );
    private static final Path CONSUMER_EVENTS_PATH = resolveEventsPath(
            "YANOTE_CONSUMER_EVENTS_PATH",
            "yanote-example-kafka-two-service-consumer"
    );
    private static final String TEST_RUN_ID = resolveEnv("YANOTE_RUN_ID", "example-kafka-two-service-run");
    private static final String TEST_SUITE = resolveEnv("YANOTE_SUITE", "example-kafka-two-service-suite");
    private static final String PRODUCER_SERVICE =
            resolveEnv("YANOTE_PRODUCER_SERVICE_NAME", "producer-role-service");
    private static final String CONSUMER_SERVICE =
            resolveEnv("YANOTE_CONSUMER_SERVICE_NAME", "consumer-role-service");
    private static final String CREATE_USER_REQUEST_JSON = """
            {
              "name": "alice",
              "email": "alice@example.com"
            }
            """;

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    @Test
    void shouldWriteSeparateProducerAndConsumerEvidenceForLiveKafkaHandoff() throws Exception {
        Files.deleteIfExists(PRODUCER_EVENTS_PATH);
        Files.deleteIfExists(CONSUMER_EVENTS_PATH);

        try (ConfigurableApplicationContext consumerContext = startService(
                        CONSUMER_SERVICE,
                        CONSUMER_EVENTS_PATH,
                        false,
                        true,
                        true,
                        false,
                        false
                );
                ConfigurableApplicationContext producerContext = startService(
                        PRODUCER_SERVICE,
                        PRODUCER_EVENTS_PATH,
                        true,
                        false,
                        false,
                        false,
                        false
                )) {
            HttpResponse<String> response = HttpClient.newHttpClient().send(
                    HttpRequest.newBuilder(producerUsersUri(producerContext))
                            .header("Content-Type", "application/json")
                            .header(ExampleServiceApplication.RUN_ID_HEADER, TEST_RUN_ID)
                            .header(ExampleServiceApplication.SUITE_HEADER, TEST_SUITE)
                            .POST(HttpRequest.BodyPublishers.ofString(CREATE_USER_REQUEST_JSON, StandardCharsets.UTF_8))
                            .build(),
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );

            assertThat(response.statusCode()).isEqualTo(201);
            assertThat(OBJECT_MAPPER.readTree(response.body())).isEqualTo(expectedCreateUserResponse());

            Awaitility.await()
                    .atMost(Duration.ofSeconds(20))
                    .untilAsserted(() -> {
                        assertThat(readEvents(PRODUCER_EVENTS_PATH)).hasSize(2);
                        assertThat(readEvents(CONSUMER_EVENTS_PATH)).hasSize(1);
                    });

            List<JsonNode> producerEvents = readEvents(PRODUCER_EVENTS_PATH);
            List<JsonNode> consumerEvents = readEvents(CONSUMER_EVENTS_PATH);

            JsonNode producerHttp = findSingle(producerEvents, "http", null, null);
            JsonNode producerSend = findSingle(
                    producerEvents,
                    "kafka",
                    "send",
                    ExampleServiceApplication.USER_EVENTS_TOPIC
            );
            JsonNode consumerReceive = findSingle(
                    consumerEvents,
                    "kafka",
                    "receive",
                    ExampleServiceApplication.USER_EVENTS_TOPIC
            );

            assertThat(producerEvents.stream().map(event -> text(event, "service"))).containsOnly(PRODUCER_SERVICE);
            assertThat(consumerEvents.stream().map(event -> text(event, "service"))).containsOnly(CONSUMER_SERVICE);
            assertThat(producerEvents.stream().filter(event -> "kafka".equals(text(event, "kind"))).count()).isEqualTo(1);
            assertThat(consumerEvents.stream().filter(event -> "http".equals(text(event, "kind"))).count()).isZero();
            assertThat(producerEvents.stream()
                            .filter(event -> "kafka".equals(text(event, "kind")))
                            .map(event -> text(event, "action")))
                    .containsOnly("send");
            assertThat(consumerEvents.stream()
                            .filter(event -> "kafka".equals(text(event, "kind")))
                            .map(event -> text(event, "action")))
                    .containsOnly("receive");

            assertThat(text(producerHttp, "route")).isEqualTo("/users");
            assertThat(text(producerHttp, "method")).isEqualTo("POST");
            assertThat(producerHttp.get("status").intValue()).isEqualTo(201);
            assertThat(text(producerHttp, "requestContentType")).isEqualTo("application/json");
            assertThat(text(producerHttp, "responseContentType")).isEqualTo("application/json");
            assertThat(text(producerHttp, "requestBodyState")).isEqualTo("captured");
            assertThat(producerHttp.get("requestBodyReason")).isNull();
            assertThat(text(producerHttp, "responseBodyState")).isEqualTo("captured");
            assertThat(producerHttp.get("responseBodyReason")).isNull();
            assertThat(producerHttp.get("requestBody")).isEqualTo(expectedCreateUserRequest());
            assertThat(producerHttp.get("responseBody")).isEqualTo(expectedCreateUserResponse());
            assertThat(producerHttp.get("error").booleanValue()).isFalse();
            assertThat(text(producerHttp, "service")).isEqualTo(PRODUCER_SERVICE);
            assertThat(text(producerHttp, "test.run_id")).isEqualTo(TEST_RUN_ID);
            assertThat(text(producerHttp, "test.suite")).isEqualTo(TEST_SUITE);

            assertKafkaEvent(producerSend, PRODUCER_SERVICE, "send");
            assertKafkaEvent(consumerReceive, CONSUMER_SERVICE, "receive");
        }
    }

    private static void assertKafkaEvent(JsonNode event, String expectedService, String expectedAction) throws Exception {
        assertThat(text(event, "kind")).isEqualTo("kafka");
        assertThat(text(event, "action")).isEqualTo(expectedAction);
        assertThat(text(event, "channel")).isEqualTo(ExampleServiceApplication.USER_EVENTS_TOPIC);
        assertThat(text(event, "message")).isEqualTo(ExampleServiceApplication.USER_CREATED_MESSAGE);
        assertThat(text(event, "payloadState")).isEqualTo("captured");
        assertThat(event.get("payloadReason")).isNull();
        assertThat(event.get("payload")).isEqualTo(expectedKafkaPayload());
        assertThat(text(event, "service")).isEqualTo(expectedService);
        assertThat(text(event, "test.run_id")).isEqualTo(TEST_RUN_ID);
        assertThat(text(event, "test.suite")).isEqualTo(TEST_SUITE);
        assertThat(event.get("error").booleanValue()).isFalse();
        JsonNode headers = event.get("headers");
        assertThat(headers).isNotNull();
        assertCapturedHeader(headers, "yanote.message", ExampleServiceApplication.USER_CREATED_MESSAGE);
        assertCapturedHeader(headers, "yanote.test.run_id", TEST_RUN_ID);
        assertCapturedHeader(headers, "yanote.test.suite", TEST_SUITE);
        assertCapturedHeader(
                headers,
                ExampleServiceApplication.CORRELATION_ID_HEADER,
                ExampleServiceApplication.proofCorrelationId(ExampleServiceApplication.USER_CREATED_MESSAGE)
        );
        assertCapturedHeader(
                headers,
                ExampleServiceApplication.REPLY_TO_HEADER,
                ExampleServiceApplication.proofReplyAddress(ExampleServiceApplication.USER_EVENTS_TOPIC)
        );
    }

    private static void assertCapturedHeader(JsonNode headers, String headerName, String expectedValue) {
        JsonNode header = headers.get(headerName);
        assertThat(header)
                .withFailMessage("Expected retained %s header in %s", headerName, headers)
                .isNotNull();
        assertThat(text(header, "state")).isEqualTo("captured");
        assertThat(text(header, "value")).isEqualTo(expectedValue);
        assertThat(header.get("reason")).isNull();
    }

    private static ConfigurableApplicationContext startService(
            String serviceName,
            Path eventsPath,
            boolean producerEnabled,
            boolean listenersEnabled,
            boolean userCreatedListenerEnabled,
            boolean userRepublishedListenerEnabled,
            boolean republishEnabled
    ) {
        return new SpringApplicationBuilder(ExampleServiceApplication.class)
                .run(
                        "--server.port=0",
                        "--spring.kafka.bootstrap-servers=" + KAFKA.getBootstrapServers(),
                        "--spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer",
                        "--spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer",
                        "--spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer",
                        "--spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer",
                        "--spring.kafka.consumer.properties.spring.json.trusted.packages=dev.yanote.examples.service",
                        "--yanote.recorder.service-name=" + serviceName,
                        "--yanote.recorder.events-path=" + eventsPath,
                        "--spring.kafka.consumer.group-id=" + serviceName + "-group",
                        "--example.kafka.roles.producer.enabled=" + producerEnabled,
                        "--example.kafka.roles.listeners.enabled=" + listenersEnabled,
                        "--example.kafka.roles.listeners.user-created.enabled=" + userCreatedListenerEnabled,
                        "--example.kafka.roles.listeners.user-republished.enabled=" + userRepublishedListenerEnabled,
                        "--example.kafka.roles.republish.enabled=" + republishEnabled
                );
    }

    private static URI producerUsersUri(ConfigurableApplicationContext producerContext) {
        int port = Integer.parseInt(producerContext.getEnvironment().getRequiredProperty("local.server.port"));
        return URI.create("http://127.0.0.1:" + port + "/users");
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

    private static List<JsonNode> readEvents(Path eventsPath) throws Exception {
        if (!Files.exists(eventsPath)) {
            return List.of();
        }

        List<JsonNode> events = new ArrayList<>();
        for (String line : Files.readAllLines(eventsPath)) {
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

    private static Path resolveEventsPath(String envKey, String prefix) {
        String env = System.getenv(envKey);
        if (env != null && !env.isBlank()) {
            return Path.of(env);
        }
        return Path.of(System.getProperty("java.io.tmpdir"), prefix + "-" + UUID.randomUUID() + ".jsonl");
    }

    private static String resolveEnv(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}

package dev.yanote.core.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class EventJsonlRoundTripTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void shouldWriteAndReadHttpEventRoundTrip() throws Exception {
        HttpEvent first = HttpEvent.of(
                1689000000000L,
                "POST",
                "/v1/users",
                "run-1",
                "suite-a",
                201,
                OBJECT_MAPPER.readTree("{\"email\":\"ada@example.com\",\"roles\":[\"admin\"]}"),
                "application/json",
                OBJECT_MAPPER.readTree("{\"id\":\"user-1\",\"active\":true}"),
                "application/json"
        );
        HttpEvent second = HttpEvent.of(1689000000100L, "GET", "/v1/users/{id}", "run-1", "suite-a", 200);

        Path tempFile = Files.createTempFile("yanote-events-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(first);
            writer.write(second);
        }

        EventJsonlReader reader = new EventJsonlReader();
        List<YanoteEvent> events = reader.read(tempFile);

        assertEquals(2, events.size());
        assertHttpEventRoundTrips(first, events.get(0));
        assertHttpEventRoundTrips(second, events.get(1));
    }

    @Test
    void shouldReadMixedHttpAndKafkaEventsFromOneJsonlFile() throws Exception {
        HttpEvent httpEvent = HttpEvent.of(
                1689000000000L,
                "POST",
                "/v1/users",
                "run-1",
                "suite-a",
                201,
                OBJECT_MAPPER.readTree("{\"email\":\"ada@example.com\"}"),
                "application/json",
                OBJECT_MAPPER.readTree("{\"id\":\"user-1\"}"),
                "application/json"
        );
        KafkaEvent kafkaEvent = new KafkaEvent(
                1689000000100L,
                KafkaEvent.Action.SEND,
                "users.signedup",
                null,
                "accounts-service",
                null,
                OBJECT_MAPPER.readTree("""
                        {"userId":"alice","roles":["admin"]}
                        """),
                false,
                "run-1",
                "suite-a"
        );

        Path tempFile = Files.createTempFile("yanote-events-mixed-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(httpEvent);
            writer.write(kafkaEvent);
        }

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(2, events.size());
        assertHttpEventRoundTrips(httpEvent, events.get(0));
        assertKafkaEventRoundTrips(kafkaEvent, events.get(1));
    }

    private void assertHttpEventRoundTrips(HttpEvent expected, YanoteEvent actualEvent) throws Exception {
        HttpEvent actual = assertInstanceOf(HttpEvent.class, actualEvent);
        assertEquals(expected.method(), actual.method());
        assertEquals(expected.route(), actual.route());
        assertEquals(expected.status(), actual.status());
        assertEquals(expected.testRunId(), actual.testRunId());
        assertEquals(expected.testSuite(), actual.testSuite());
        assertEquals(expected.requestContentType(), actual.requestContentType());
        assertEquals(expected.responseContentType(), actual.responseContentType());
        assertEquals(expected.requestBody(), actual.requestBody());
        assertEquals(expected.responseBody(), actual.responseBody());
        assertEquals(OBJECT_MAPPER.writeValueAsString(expected), OBJECT_MAPPER.writeValueAsString(actual));
    }

    private void assertKafkaEventRoundTrips(KafkaEvent expected, YanoteEvent actualEvent) throws Exception {
        KafkaEvent actual = assertInstanceOf(KafkaEvent.class, actualEvent);
        assertEquals(expected.action(), actual.action());
        assertEquals(expected.channel(), actual.channel());
        assertEquals(expected.testRunId(), actual.testRunId());
        assertEquals(expected.testSuite(), actual.testSuite());
        assertEquals(OBJECT_MAPPER.writeValueAsString(expected), OBJECT_MAPPER.writeValueAsString(actual));
    }
}

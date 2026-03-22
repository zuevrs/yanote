package dev.yanote.core.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;

class EventJsonlRoundTripTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void shouldWriteAndReadHttpEventRoundTrip() throws Exception {
        HttpEvent first = new HttpEvent(
                1689000000000L,
                "POST",
                "/v1/users",
                "run-1",
                "suite-a",
                201,
                OBJECT_MAPPER.readTree("{\"email\":\"ada@example.com\",\"roles\":[\"admin\"]}"),
                PayloadCaptureState.CAPTURED,
                null,
                "application/json",
                OBJECT_MAPPER.readTree("{\"id\":\"user-1\",\"active\":true}"),
                PayloadCaptureState.CAPTURED,
                null,
                "application/json",
                null,
                null,
                false
        );
        HttpEvent second = HttpEvent.of(1689000000100L, "GET", "/v1/users/{id}", "run-1", "suite-a", 200);

        Path tempFile = Files.createTempFile("yanote-events-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(first);
            writer.write(second);
        }

        List<String> jsonlLines = Files.readAllLines(tempFile, StandardCharsets.UTF_8);
        assertEquals(2, jsonlLines.size());
        assertEquals(
                "{\"kind\":\"http\",\"ts\":1689000000000,\"method\":\"POST\",\"route\":\"/v1/users\",\"status\":201,\"requestBody\":{\"email\":\"ada@example.com\",\"roles\":[\"admin\"]},\"requestBodyState\":\"captured\",\"requestContentType\":\"application/json\",\"responseBody\":{\"id\":\"user-1\",\"active\":true},\"responseBodyState\":\"captured\",\"responseContentType\":\"application/json\",\"service\":null,\"instance\":null,\"error\":false,\"test.run_id\":\"run-1\",\"test.suite\":\"suite-a\"}",
                jsonlLines.get(0)
        );
        assertFalse(jsonlLines.get(1).contains("requestBodyState"));
        assertFalse(jsonlLines.get(1).contains("requestBodyReason"));
        assertFalse(jsonlLines.get(1).contains("responseBodyState"));
        assertFalse(jsonlLines.get(1).contains("responseBodyReason"));
        assertFalse(jsonlLines.get(1).contains("\"requestBodyState\":null"));
        assertFalse(jsonlLines.get(1).contains("\"responseBodyState\":null"));

        EventJsonlReader reader = new EventJsonlReader();
        List<YanoteEvent> events = reader.read(tempFile);

        assertEquals(2, events.size());
        assertHttpEventRoundTrips(first, events.get(0));
        assertHttpEventRoundTrips(second, events.get(1));
    }

    @Test
    void shouldReadLegacyHttpEventWithoutCaptureProvenance() throws Exception {
        Path tempFile = Files.createTempFile("yanote-http-legacy-", ".jsonl");
        Files.writeString(
                tempFile,
                "{\"kind\":\"http\",\"ts\":1689000000200,\"method\":\"GET\",\"route\":\"/legacy\",\"status\":200,\"responseBody\":{\"ok\":true},\"responseContentType\":\"application/json\",\"service\":null,\"instance\":null,\"error\":false,\"test.run_id\":\"run-legacy\",\"test.suite\":\"suite-legacy\"}\n",
                StandardCharsets.UTF_8
        );

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        HttpEvent event = assertInstanceOf(HttpEvent.class, events.get(0));
        assertNull(event.requestBodyState());
        assertNull(event.requestBodyReason());
        assertNull(event.responseBodyState());
        assertNull(event.responseBodyReason());
        assertEquals("application/json", event.responseContentType());
        assertEquals(OBJECT_MAPPER.readTree("{\"ok\":true}"), event.responseBody());
    }

    @Test
    void shouldReadMixedHttpAndKafkaEventsFromOneJsonlFile() throws Exception {
        HttpEvent httpEvent = new HttpEvent(
                1689000000000L,
                "POST",
                "/v1/users",
                "run-1",
                "suite-a",
                201,
                OBJECT_MAPPER.readTree("{\"email\":\"ada@example.com\"}"),
                PayloadCaptureState.CAPTURED,
                null,
                "application/json",
                OBJECT_MAPPER.readTree("{\"id\":\"user-1\"}"),
                PayloadCaptureState.CAPTURED,
                null,
                "application/json",
                null,
                null,
                false
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
                PayloadCaptureState.CAPTURED,
                null,
                null,
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
        assertEquals(expected.requestBodyState(), actual.requestBodyState());
        assertEquals(expected.requestBodyReason(), actual.requestBodyReason());
        assertEquals(expected.requestContentType(), actual.requestContentType());
        assertEquals(expected.responseBodyState(), actual.responseBodyState());
        assertEquals(expected.responseBodyReason(), actual.responseBodyReason());
        assertEquals(expected.responseContentType(), actual.responseContentType());
        assertEquals(expected.requestBody(), actual.requestBody());
        assertEquals(expected.responseBody(), actual.responseBody());
        assertEquals(OBJECT_MAPPER.writeValueAsString(expected), OBJECT_MAPPER.writeValueAsString(actual));
    }

    private void assertKafkaEventRoundTrips(KafkaEvent expected, YanoteEvent actualEvent) throws Exception {
        KafkaEvent actual = assertInstanceOf(KafkaEvent.class, actualEvent);
        assertEquals(expected.action(), actual.action());
        assertEquals(expected.channel(), actual.channel());
        assertEquals(expected.payloadState(), actual.payloadState());
        assertEquals(expected.payloadReason(), actual.payloadReason());
        assertEquals(expected.headers(), actual.headers());
        assertEquals(expected.testRunId(), actual.testRunId());
        assertEquals(expected.testSuite(), actual.testSuite());
        assertEquals(OBJECT_MAPPER.writeValueAsString(expected), OBJECT_MAPPER.writeValueAsString(actual));
    }
}

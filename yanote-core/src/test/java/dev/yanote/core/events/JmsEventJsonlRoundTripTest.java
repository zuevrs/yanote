package dev.yanote.core.events;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;

class JmsEventJsonlRoundTripTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void shouldSerializePayloadBearingJmsEvidence() throws Exception {
        JsonNode payload = json("""
                {"user":{"id":"alice","roles":["admin"]},"active":true}
                """);
        JmsEvent event = new JmsEvent(
                1710000000600L,
                JmsEvent.Action.SEND,
                " orders.queue ",
                " OrderCreated ",
                "orders-service",
                null,
                payload,
                PayloadCaptureState.CAPTURED,
                null,
                Map.of(
                        "JMSCorrelationID", new JmsEvent.HeaderEvidence(
                                JmsEvent.HeaderCaptureState.CAPTURED,
                                "corr-123",
                                null
                        ),
                        "authorization", new JmsEvent.HeaderEvidence(
                                JmsEvent.HeaderCaptureState.REDACTED,
                                null,
                                JmsEvent.HeaderCaptureReason.SENSITIVE
                        ),
                        "binary-header", new JmsEvent.HeaderEvidence(
                                JmsEvent.HeaderCaptureState.OMITTED,
                                null,
                                JmsEvent.HeaderCaptureReason.UNSUPPORTED
                        )
                ),
                false,
                "run-1",
                "suite-a"
        );

        Path tempFile = Files.createTempFile("yanote-jms-events-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(event);
        }

        String jsonlLine = Files.readString(tempFile, StandardCharsets.UTF_8).trim();
        assertEquals(
                "{\"kind\":\"jms\",\"ts\":1710000000600,\"action\":\"send\",\"channel\":\"orders.queue\",\"message\":\"OrderCreated\",\"service\":\"orders-service\",\"payload\":{\"user\":{\"id\":\"alice\",\"roles\":[\"admin\"]},\"active\":true},\"payloadState\":\"captured\",\"headers\":{\"JMSCorrelationID\":{\"state\":\"captured\",\"value\":\"corr-123\"},\"authorization\":{\"state\":\"redacted\",\"reason\":\"sensitive\"},\"binary-header\":{\"state\":\"omitted\",\"reason\":\"unsupported\"}},\"error\":false,\"test.run_id\":\"run-1\",\"test.suite\":\"suite-a\"}",
                jsonlLine
        );
        assertFalse(jsonlLine.contains("\"payloadReason\":null"));
        assertFalse(jsonlLine.contains("super-secret-token"));

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        assertInstanceOf(JmsEvent.class, events.get(0));
        assertEquals(
                new JmsEvent(
                        1710000000600L,
                        JmsEvent.Action.SEND,
                        "orders.queue",
                        "OrderCreated",
                        "orders-service",
                        null,
                        payload,
                        PayloadCaptureState.CAPTURED,
                        null,
                        Map.of(
                                "JMSCorrelationID", new JmsEvent.HeaderEvidence(
                                        JmsEvent.HeaderCaptureState.CAPTURED,
                                        "corr-123",
                                        null
                                ),
                                "authorization", new JmsEvent.HeaderEvidence(
                                        JmsEvent.HeaderCaptureState.REDACTED,
                                        null,
                                        JmsEvent.HeaderCaptureReason.SENSITIVE
                                ),
                                "binary-header", new JmsEvent.HeaderEvidence(
                                        JmsEvent.HeaderCaptureState.OMITTED,
                                        null,
                                        JmsEvent.HeaderCaptureReason.UNSUPPORTED
                                )
                        ),
                        false,
                        "run-1",
                        "suite-a"
                ),
                events.get(0)
        );
    }

    @Test
    void shouldKeepOmittedPayloadProvenanceWithoutSerializingNullPlaceholders() throws Exception {
        JmsEvent event = new JmsEvent(
                1710000000700L,
                JmsEvent.Action.RECEIVE,
                "orders.reply",
                "   ",
                null,
                null,
                null,
                PayloadCaptureState.OMITTED,
                PayloadCaptureReason.UNSUPPORTED,
                null,
                null,
                "run-2",
                "suite-b"
        );

        Path tempFile = Files.createTempFile("yanote-jms-events-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(event);
        }

        String jsonlLine = Files.readString(tempFile, StandardCharsets.UTF_8).trim();
        assertEquals(
                "{\"kind\":\"jms\",\"ts\":1710000000700,\"action\":\"receive\",\"channel\":\"orders.reply\",\"payloadState\":\"omitted\",\"payloadReason\":\"unsupported\",\"test.run_id\":\"run-2\",\"test.suite\":\"suite-b\"}",
                jsonlLine
        );
        assertFalse(jsonlLine.contains("\"payload\":null"));
        assertFalse(jsonlLine.contains("\"payloadState\":null"));
        assertFalse(jsonlLine.contains("\"payloadReason\":null"));
        assertFalse(jsonlLine.contains("\"headers\":null"));

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        assertEquals(
                new JmsEvent(
                        1710000000700L,
                        JmsEvent.Action.RECEIVE,
                        "orders.reply",
                        null,
                        null,
                        null,
                        null,
                        PayloadCaptureState.OMITTED,
                        PayloadCaptureReason.UNSUPPORTED,
                        null,
                        null,
                        "run-2",
                        "suite-b"
                ),
                events.get(0)
        );
    }

    @Test
    void shouldReadLegacyJmsEventWithoutCaptureProvenance() throws Exception {
        Path tempFile = Files.createTempFile("yanote-jms-legacy-", ".jsonl");
        Files.writeString(
                tempFile,
                "{\"kind\":\"jms\",\"ts\":1710000000800,\"action\":\"send\",\"channel\":\"orders.legacy\",\"message\":\"LegacyEvent\",\"payload\":{\"ok\":true},\"test.run_id\":\"run-legacy\",\"test.suite\":\"suite-legacy\"}\n",
                StandardCharsets.UTF_8
        );

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        JmsEvent event = assertInstanceOf(JmsEvent.class, events.get(0));
        assertNull(event.payloadState());
        assertNull(event.payloadReason());
        assertNull(event.headers());
        assertEquals(json("{\"ok\":true}"), event.payload());
    }

    private static JsonNode json(String value) throws Exception {
        return OBJECT_MAPPER.readTree(value);
    }
}

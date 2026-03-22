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

class KafkaEventJsonlRoundTripTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void shouldSerializePayloadBearingKafkaEvidence() throws Exception {
        JsonNode payload = json("""
                {"user":{"id":"alice","roles":["admin"]},"active":true}
                """);
        KafkaEvent event = new KafkaEvent(
                1710000000000L,
                KafkaEvent.Action.SEND,
                " users.signedup ",
                " UserSignedUp ",
                "accounts-service",
                null,
                payload,
                PayloadCaptureState.CAPTURED,
                null,
                Map.of(
                        "trace-id", new KafkaEvent.HeaderEvidence(
                                KafkaEvent.HeaderCaptureState.CAPTURED,
                                "trace-123",
                                null
                        ),
                        "authorization", new KafkaEvent.HeaderEvidence(
                                KafkaEvent.HeaderCaptureState.REDACTED,
                                null,
                                KafkaEvent.HeaderCaptureReason.SENSITIVE
                        ),
                        "binary-header", new KafkaEvent.HeaderEvidence(
                                KafkaEvent.HeaderCaptureState.OMITTED,
                                null,
                                KafkaEvent.HeaderCaptureReason.UNSUPPORTED
                        )
                ),
                false,
                "run-1",
                "suite-a"
        );

        Path tempFile = Files.createTempFile("yanote-kafka-events-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(event);
        }

        String jsonlLine = Files.readString(tempFile, StandardCharsets.UTF_8).trim();
        assertEquals(
                "{\"kind\":\"kafka\",\"ts\":1710000000000,\"action\":\"send\",\"channel\":\"users.signedup\",\"message\":\"UserSignedUp\",\"service\":\"accounts-service\",\"payload\":{\"user\":{\"id\":\"alice\",\"roles\":[\"admin\"]},\"active\":true},\"payloadState\":\"captured\",\"headers\":{\"authorization\":{\"state\":\"redacted\",\"reason\":\"sensitive\"},\"binary-header\":{\"state\":\"omitted\",\"reason\":\"unsupported\"},\"trace-id\":{\"state\":\"captured\",\"value\":\"trace-123\"}},\"error\":false,\"test.run_id\":\"run-1\",\"test.suite\":\"suite-a\"}",
                jsonlLine
        );
        assertFalse(jsonlLine.contains("\"payloadReason\":null"));
        assertFalse(jsonlLine.contains("super-secret-token"));

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        assertInstanceOf(KafkaEvent.class, events.get(0));
        assertEquals(
                new KafkaEvent(
                        1710000000000L,
                        KafkaEvent.Action.SEND,
                        "users.signedup",
                        "UserSignedUp",
                        "accounts-service",
                        null,
                        payload,
                        PayloadCaptureState.CAPTURED,
                        null,
                        Map.of(
                                "trace-id", new KafkaEvent.HeaderEvidence(
                                        KafkaEvent.HeaderCaptureState.CAPTURED,
                                        "trace-123",
                                        null
                                ),
                                "authorization", new KafkaEvent.HeaderEvidence(
                                        KafkaEvent.HeaderCaptureState.REDACTED,
                                        null,
                                        KafkaEvent.HeaderCaptureReason.SENSITIVE
                                ),
                                "binary-header", new KafkaEvent.HeaderEvidence(
                                        KafkaEvent.HeaderCaptureState.OMITTED,
                                        null,
                                        KafkaEvent.HeaderCaptureReason.UNSUPPORTED
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
        KafkaEvent event = new KafkaEvent(
                1710000000100L,
                KafkaEvent.Action.RECEIVE,
                "users.deleted",
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

        Path tempFile = Files.createTempFile("yanote-kafka-events-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(event);
        }

        String jsonlLine = Files.readString(tempFile, StandardCharsets.UTF_8).trim();
        assertEquals(
                "{\"kind\":\"kafka\",\"ts\":1710000000100,\"action\":\"receive\",\"channel\":\"users.deleted\",\"payloadState\":\"omitted\",\"payloadReason\":\"unsupported\",\"test.run_id\":\"run-2\",\"test.suite\":\"suite-b\"}",
                jsonlLine
        );
        assertFalse(jsonlLine.contains("\"payload\":null"));
        assertFalse(jsonlLine.contains("\"payloadState\":null"));
        assertFalse(jsonlLine.contains("\"payloadReason\":null"));
        assertFalse(jsonlLine.contains("\"headers\":null"));

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        assertEquals(
                new KafkaEvent(
                        1710000000100L,
                        KafkaEvent.Action.RECEIVE,
                        "users.deleted",
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
    void shouldReadLegacyKafkaEventWithoutCaptureProvenance() throws Exception {
        Path tempFile = Files.createTempFile("yanote-kafka-legacy-", ".jsonl");
        Files.writeString(
                tempFile,
                "{\"kind\":\"kafka\",\"ts\":1710000000200,\"action\":\"send\",\"channel\":\"users.legacy\",\"message\":\"LegacyEvent\",\"payload\":{\"ok\":true},\"test.run_id\":\"run-legacy\",\"test.suite\":\"suite-legacy\"}\n",
                StandardCharsets.UTF_8
        );

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        KafkaEvent event = assertInstanceOf(KafkaEvent.class, events.get(0));
        assertNull(event.payloadState());
        assertNull(event.payloadReason());
        assertNull(event.headers());
        assertEquals(json("{\"ok\":true}"), event.payload());
    }

    private static JsonNode json(String value) throws Exception {
        return OBJECT_MAPPER.readTree(value);
    }
}

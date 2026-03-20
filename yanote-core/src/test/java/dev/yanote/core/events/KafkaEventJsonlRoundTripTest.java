package dev.yanote.core.events;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

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
                "{\"kind\":\"kafka\",\"ts\":1710000000000,\"action\":\"send\",\"channel\":\"users.signedup\",\"message\":\"UserSignedUp\",\"service\":\"accounts-service\",\"payload\":{\"user\":{\"id\":\"alice\",\"roles\":[\"admin\"]},\"active\":true},\"error\":false,\"test.run_id\":\"run-1\",\"test.suite\":\"suite-a\"}",
                jsonlLine
        );

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
                        false,
                        "run-1",
                        "suite-a"
                ),
                events.get(0)
        );
    }

    @Test
    void shouldKeepMessageOptionalWithoutInferringIt() throws Exception {
        KafkaEvent event = new KafkaEvent(
                1710000000100L,
                KafkaEvent.Action.RECEIVE,
                "users.deleted",
                "   ",
                null,
                null,
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
                "{\"kind\":\"kafka\",\"ts\":1710000000100,\"action\":\"receive\",\"channel\":\"users.deleted\",\"test.run_id\":\"run-2\",\"test.suite\":\"suite-b\"}",
                jsonlLine
        );

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
                        null,
                        "run-2",
                        "suite-b"
                ),
                events.get(0)
        );
    }

    private static JsonNode json(String value) throws Exception {
        return OBJECT_MAPPER.readTree(value);
    }
}

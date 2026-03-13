package dev.yanote.core.events;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EventJsonlRoundTripTest {

    @Test
    void shouldWriteAndReadHttpEventRoundTrip() throws Exception {
        HttpEvent first = HttpEvent.of(1689000000000L, "GET", "/v1/users/{id}", "run-1", "suite-a", 200);
        HttpEvent second = HttpEvent.of(1689000000100L, "POST", "/v1/users", "run-1", "suite-a", 201);

        Path tempFile = Files.createTempFile("yanote-events-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(first);
            writer.write(second);
        }

        EventJsonlReader reader = new EventJsonlReader();
        List<YanoteEvent> events = reader.read(tempFile);

        assertEquals(List.of(first, second), events);
    }

    @Test
    void shouldReadMixedHttpAndKafkaEventsFromOneJsonlFile() throws Exception {
        HttpEvent httpEvent = HttpEvent.of(1689000000000L, "GET", "/v1/users/{id}", "run-1", "suite-a", 200);
        KafkaEvent kafkaEvent = new KafkaEvent(
                1689000000100L,
                KafkaEvent.Action.SEND,
                "users.signedup",
                null,
                "accounts-service",
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
        assertEquals(List.of(httpEvent, kafkaEvent), events);
    }
}

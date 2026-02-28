package dev.yanote.core.events;

import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;

class EventJsonlRoundTripTest {

    @Test
    void shouldWriteAndReadEventRoundTrip() throws Exception {
        HttpEvent first = HttpEvent.of(1689000000000L, "GET", "/v1/users/{id}", "run-1", "suite-a", 200);
        HttpEvent second = HttpEvent.of(1689000000100L, "POST", "/v1/users", "run-1", "suite-a", 201);

        Path tempFile = Files.createTempFile("yanote-events-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(first);
            writer.write(second);
        }

        EventJsonlReader reader = new EventJsonlReader();
        List<HttpEvent> events = reader.read(tempFile);

        assertEquals(2, events.size());
        assertEquals(first, events.get(0));
        assertEquals(second, events.get(1));
    }
}


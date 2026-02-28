package dev.yanote.core.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public final class EventJsonlReader {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public List<HttpEvent> read(Path path) throws IOException {
        List<HttpEvent> events = new ArrayList<>();
        if (!Files.exists(path)) {
            return events;
        }

        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;
            long lineNo = 0;
            while ((line = reader.readLine()) != null) {
                lineNo++;
                if (line.isBlank()) {
                    continue;
                }
                try {
                    events.add(OBJECT_MAPPER.readValue(line, HttpEvent.class));
                } catch (IOException ex) {
                    throw new IOException("Failed to parse JSONL line " + lineNo + ": " + line, ex);
                }
            }
        }
        return events;
    }
}


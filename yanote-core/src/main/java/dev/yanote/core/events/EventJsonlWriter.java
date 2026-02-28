package dev.yanote.core.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public final class EventJsonlWriter implements AutoCloseable {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final Path path;

    public EventJsonlWriter(Path path) throws IOException {
        Path parent = path.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        this.path = path;
    }

    public void write(HttpEvent event) throws IOException {
        try (BufferedWriter writer = Files.newBufferedWriter(
                path,
                StandardOpenOption.CREATE,
                StandardOpenOption.APPEND
        )) {
            writer.write(OBJECT_MAPPER.writeValueAsString(event));
            writer.newLine();
        }
    }

    @Override
    public void close() throws IOException {
        // no-op: writer is created per write
    }
}


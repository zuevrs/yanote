package dev.yanote.core.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class EventJsonlWriter implements AutoCloseable {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final BufferedWriter writer;

    public EventJsonlWriter(Path path) throws IOException {
        Path parent = path.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        this.writer = Files.newBufferedWriter(path);
    }

    public void write(HttpEvent event) throws IOException {
        writer.write(OBJECT_MAPPER.writeValueAsString(event));
        writer.newLine();
        writer.flush();
    }

    @Override
    public void close() throws IOException {
        writer.close();
    }
}


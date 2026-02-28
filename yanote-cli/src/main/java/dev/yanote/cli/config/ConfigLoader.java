package dev.yanote.cli.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ConfigLoader {
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    public YanoteConfig load(Path path) {
        if (path == null) {
            return null;
        }
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("Config file not found: " + path);
        }
        try {
            return yamlMapper.readValue(path.toFile(), YanoteConfig.class);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to parse config: " + path, ex);
        }
    }
}

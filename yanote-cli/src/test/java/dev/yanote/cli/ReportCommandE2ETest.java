package dev.yanote.cli;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import picocli.CommandLine;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReportCommandE2ETest {

    @Test
    void shouldGenerateReportFromOpenApiAndEvents() throws IOException {
        Path tempDir = Files.createTempDirectory("yanote-report-cli");

        CommandLine cli = new CommandLine(new Main());

        Path openapiPath = Path.of("src/test/resources/openapi/simple.yaml");
        Path eventsPath = Path.of("src/test/resources/events/events.jsonl");

        int exitCode = cli.execute(
                "report",
                "--openapi", openapiPath.toString(),
                "--events", eventsPath.toString(),
                "--out", tempDir.toString()
        );

        assertEquals(0, exitCode);
        JsonNode report = new ObjectMapper().readTree(Files.readString(tempDir.resolve("yanote-report.json")));
        assertEquals(2.0, report.path("summary").path("covered").asDouble());
        assertEquals(3.0, report.path("summary").path("total").asDouble());

        String summaryText = new String(Files.readAllBytes(tempDir.resolve("yanote-summary.txt")));
        assertTrue(summaryText.contains("Coverage: 2/3"));

        assertTrue(report.path("uncoveredOperations").toString().contains("/users/{id}"));
    }
}

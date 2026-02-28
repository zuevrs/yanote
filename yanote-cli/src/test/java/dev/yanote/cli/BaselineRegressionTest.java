package dev.yanote.cli;

import dev.yanote.cli.baseline.Baseline;
import dev.yanote.cli.baseline.BaselineComparator;
import dev.yanote.core.openapi.OperationKey;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import picocli.CommandLine;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BaselineRegressionTest {

    @Test
    void shouldFailOnRegressionWhenBaselineCoveredOpsAreMissing() throws IOException {
        Path tempDir = Files.createTempDirectory("yanote-baseline-cli");
        Path outDir = tempDir.resolve("out");
        Path baselinePath = tempDir.resolve("baseline.json");
        Path eventsPath = tempDir.resolve("events.jsonl");
        Path openapiPath = Path.of("src/test/resources/openapi/simple.yaml");

        Baseline baseline = new Baseline(List.of(
                new OperationKey("GET", "/users"),
                new OperationKey("GET", "/users/{id}")
        ));
        Files.writeString(baselinePath, new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(baseline.coveredOperations()));

        Files.writeString(eventsPath, "{\"ts\":1000,\"kind\":\"http\",\"method\":\"GET\",\"route\":\"/users\",\"test.run_id\":\"run-1\",\"test.suite\":\"S1\",\"status\":200}\n");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CommandLine cli = new CommandLine(new Main());
        cli.setOut(new PrintWriter(out, true));
        cli.setErr(new PrintWriter(out, true));

        int exitCode = cli.execute(
                "report",
                "--openapi", openapiPath.toString(),
                "--events", eventsPath.toString(),
                "--out", outDir.toString(),
                "--baseline", baselinePath.toString(),
                "--fail-on-regression"
        );

        assertNotEquals(0, exitCode);
        assertTrue(out.toString().contains("Missing baseline coverage"));
        assertTrue(out.toString().contains("GET /users/{id}"));
    }

    @Test
    void comparatorShouldFindMissingCoveredOperations() {
        Baseline baseline = new Baseline(List.of(
                new OperationKey("GET", "/users"),
                new OperationKey("POST", "/users")
        ));
        Set<OperationKey> current = Set.of(new OperationKey("GET", "/users"));

        Set<OperationKey> regressions = new BaselineComparator().findRegressions(baseline, current);
        assertEquals(Set.of(new OperationKey("POST", "/users")), regressions);

        String message = new BaselineComparator().formatRegressions(regressions);
        assertTrue(message.contains("POST /users"));
    }
}

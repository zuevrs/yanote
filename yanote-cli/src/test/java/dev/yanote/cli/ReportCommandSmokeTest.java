package dev.yanote.cli;

import org.junit.jupiter.api.Test;
import picocli.CommandLine;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReportCommandSmokeTest {

    @Test
    void shouldShowHelpForReportCommand() {
        ByteArrayOutputStream outContent = new ByteArrayOutputStream();
        CommandLine cli = new CommandLine(new Main());
        cli.setOut(new PrintWriter(outContent));
        int exitCode = cli.execute("report", "--help");

        assertEquals(0, exitCode);
        String output = outContent.toString();
        assertTrue(output.contains("--openapi"));
        assertTrue(output.contains("--events"));
        assertTrue(output.contains("--out"));
    }
}

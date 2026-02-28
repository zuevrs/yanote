package dev.yanote.cli;

import picocli.CommandLine;
import picocli.CommandLine.Command;

@Command(
        name = "yanote",
        description = "Compute coverage over OpenAPI operations using service-call events",
        mixinStandardHelpOptions = true,
        subcommands = {ReportCommand.class}
)
public class Main implements Runnable {

    public static void main(String[] args) {
        int exitCode = new CommandLine(new Main()).execute(args);
        if (exitCode != 0) {
            System.exit(exitCode);
        }
    }

    @Override
    public void run() {
        System.out.println("Use `yanote report` for coverage generation");
    }
}

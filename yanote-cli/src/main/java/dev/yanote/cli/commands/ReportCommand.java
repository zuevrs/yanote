package dev.yanote.cli;

import dev.yanote.cli.config.ConfigLoader;
import dev.yanote.cli.config.YanoteConfig;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Command(
        name = "report",
        description = "Generate HTTP API coverage report",
        mixinStandardHelpOptions = true
)
public class ReportCommand implements Runnable {

    @Option(names = {"-s", "--openapi"}, description = "Path to OpenAPI file")
    private Path openapiPath;

    @Option(names = {"-e", "--events"}, description = "Path to JSONL events file (or directory)")
    private Path eventsPath;

    @Option(names = {"-o", "--out"}, description = "Directory for report output")
    private Path outputDir;

    @Option(names = {"-c", "--config"}, description = "Configuration file (YAML)")
    private Path configPath;

    @Option(names = "--exclude", description = "Exclude route patterns")
    private List<String> excludePatterns = new ArrayList<>();

    @Option(names = "--min-coverage", description = "Fail if total coverage lower than this percent")
    private Double minCoverage;

    @Option(names = "--baseline", description = "Baseline report JSON file")
    private Path baselinePath;

    @Option(names = "--fail-on-regression", description = "Fail on any regression comparing with baseline")
    private boolean failOnRegression;

    @Override
    public void run() {
        YanoteConfig config = new ConfigLoader().load(configPath);
        if (config != null) {
            if (openapiPath == null && config.openapiPath() != null) {
                openapiPath = Path.of(config.openapiPath());
            }
            if (eventsPath == null && config.eventsPath() != null) {
                eventsPath = Path.of(config.eventsPath());
            }
            if (outputDir == null && config.outputDir() != null) {
                outputDir = Path.of(config.outputDir());
            }
            if (minCoverage == null && config.minCoveragePercent() != null) {
                minCoverage = config.minCoveragePercent();
            }
            if (baselinePath == null && config.baselinePath() != null) {
                baselinePath = Path.of(config.baselinePath());
            }
            if (excludePatterns.isEmpty() && !config.excludePatterns().isEmpty()) {
                excludePatterns = new ArrayList<>(config.excludePatterns());
            }
            if (!failOnRegression) {
                failOnRegression = config.failOnRegression();
            }
        }

        System.out.println("OpenAPI:");
        System.out.println("  openapiPath=" + openapiPath);
        System.out.println("  eventsPath=" + eventsPath);
        System.out.println("  outputDir=" + outputDir);
        System.out.println("  minCoverage=" + minCoverage);
        System.out.println("  baselinePath=" + baselinePath);
        System.out.println("  failOnRegression=" + failOnRegression);
        System.out.println("  exclude=" + excludePatterns);
    }
}

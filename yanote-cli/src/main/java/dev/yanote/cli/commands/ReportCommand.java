package dev.yanote.cli.commands;

import dev.yanote.cli.config.ConfigLoader;
import dev.yanote.cli.config.YanoteConfig;
import dev.yanote.cli.baseline.Baseline;
import dev.yanote.cli.baseline.BaselineComparator;
import dev.yanote.cli.output.ReportWriters;
import dev.yanote.core.coverage.CoverageReport;
import dev.yanote.core.coverage.CoverageCalculator;
import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.openapi.OpenApiLoader;
import dev.yanote.core.openapi.OpenApiOperations;
import dev.yanote.core.openapi.OperationKey;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;

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

    @Option(names = "--fail-on-regression", description = "Fail if current run lost baseline coverage")
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
            if (excludePatterns.isEmpty() && !config.excludePatterns().isEmpty()) {
                excludePatterns = new ArrayList<>(config.excludePatterns());
            }
            if (baselinePath == null && config.baselinePath() != null) {
                baselinePath = Path.of(config.baselinePath());
            }
            if (!failOnRegression) {
                failOnRegression = config.failOnRegression();
            }
        }

        if (openapiPath == null || eventsPath == null || outputDir == null) {
            throw new IllegalArgumentException("--openapi, --events and --out are required unless provided through config");
        }

        List<HttpEvent> events;
        try {
            events = readEvents(eventsPath);
        } catch (IOException ex) {
            throw new UncheckedIOException("Unable to read events", ex);
        } catch (UncheckedIOException ex) {
            throw ex;
        }

        var operations = new OpenApiOperations().extract(new OpenApiLoader().load(openapiPath.toString()));
        var report = new CoverageCalculator().calculate(operations, events, excludePatterns);

        var summary = report.summary();
        System.out.println("Coverage " + summary.coveredOperations() + "/" + summary.totalOperations() + " (" + summary.coveragePercent() + "%)");

        if (baselinePath != null) {
            Set<OperationKey> regressions = checkBaseline(report, baselinePath);
            if (failOnRegression && !regressions.isEmpty()) {
                throw new IllegalStateException(new BaselineComparator().formatRegressions(regressions));
            }
            if (!regressions.isEmpty()) {
                System.out.println(new BaselineComparator().formatRegressions(regressions));
            }
        }

        try {
            new ReportWriters().writeSummary(report, outputDir);
        } catch (IOException ex) {
            throw new UncheckedIOException("Unable to write report", ex);
        }

        if (minCoverage != null && summary.coveragePercent() + 0.0001 < minCoverage) {
            throw new IllegalStateException("Coverage regression detected: " + summary.coveragePercent() + " < " + minCoverage);
        }
    }

    private Set<OperationKey> checkBaseline(CoverageReport report, Path baselinePath) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<OperationKey> covered = mapper.readValue(
                    baselinePath.toFile(),
                    mapper.getTypeFactory().constructCollectionType(List.class, OperationKey.class)
            );
            Set<OperationKey> baselineCovered = new LinkedHashSet<>(covered);
            return new BaselineComparator().findRegressions(new Baseline(List.copyOf(baselineCovered)), report.coveredOperations());
        } catch (IOException ex) {
            throw new UncheckedIOException("Unable to read baseline", ex);
        }
    }

    private List<HttpEvent> readEvents(Path eventsPath) throws IOException {
        if (Files.isDirectory(eventsPath)) {
            List<HttpEvent> result = new ArrayList<>();
            try (Stream<Path> pathStream = Files.list(eventsPath)) {
                pathStream.filter(path -> path.toString().endsWith(".jsonl"))
                        .sorted()
                        .forEach(path -> {
                            try {
                                result.addAll(new EventJsonlReader().read(path));
                            } catch (IOException ex) {
                                throw new UncheckedIOException(ex);
                            }
                        });
            }
            return result;
        }
        return new EventJsonlReader().read(eventsPath);
    }
}

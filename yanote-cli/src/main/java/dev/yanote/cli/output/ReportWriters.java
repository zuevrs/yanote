package dev.yanote.cli.output;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import dev.yanote.core.coverage.CoverageReport;
import dev.yanote.core.coverage.CoverageSummary;
import dev.yanote.core.openapi.OperationKey;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class ReportWriters {

    private static final String REPORT_FILE = "yanote-report.json";
    private static final String SUMMARY_FILE = "yanote-summary.txt";

    public void writeSummary(CoverageReport report, Path outputDir) throws IOException {
        Files.createDirectories(outputDir);
        writeJson(report, outputDir.resolve(REPORT_FILE));
        writeText(report.summary(), outputDir.resolve(SUMMARY_FILE));
    }

    private void writeJson(CoverageReport report, Path jsonPath) {
        ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
        Map<String, Object> payload = new LinkedHashMap<>();
        CoverageSummary summary = report.summary();

        payload.put("summary", Map.of(
                "total", summary.totalOperations(),
                "covered", summary.coveredOperations(),
                "coveragePercent", summary.coveragePercent()
        ));

        payload.put("coveredOperations", toReportList(report.coveredOperations()));
        payload.put("uncoveredOperations", toReportList(report.uncoveredOperations()));
        payload.put("operationToSuites", toSuiteMap(report.operationToSuites()));

        try {
            mapper.writeValue(jsonPath.toFile(), payload);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private void writeText(CoverageSummary summary, Path summaryPath) {
        String content = "Coverage: " + summary.coveredOperations() + "/" + summary.totalOperations()
                + " (" + summary.coveragePercent() + "% )\n";
        try {
            Files.writeString(summaryPath, content);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private List<Map<String, String>> toReportList(Set<OperationKey> operations) {
        return operations.stream()
                .map(operation -> Map.of("method", operation.method(), "route", operation.route()))
                .toList();
    }

    private Map<String, Set<String>> toSuiteMap(Map<OperationKey, Set<String>> operationToSuites) {
        Map<String, Set<String>> result = new LinkedHashMap<>();
        for (Map.Entry<OperationKey, Set<String>> entry : operationToSuites.entrySet()) {
            result.put(entry.getKey().method() + " " + entry.getKey().route(), new LinkedHashSet<>(entry.getValue()));
        }
        return result;
    }
}

package dev.yanote.cli.config;

import java.util.List;

public record YanoteConfig(
        String openapiPath,
        String eventsPath,
        String outputDir,
        List<String> excludePatterns,
        Double minCoveragePercent,
        String baselinePath,
        boolean failOnRegression
) {
    public YanoteConfig {
        if (excludePatterns == null) {
            excludePatterns = List.of();
        }
    }
}

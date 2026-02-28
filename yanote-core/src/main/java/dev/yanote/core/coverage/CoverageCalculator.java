package dev.yanote.core.coverage;

import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.openapi.OperationKey;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class CoverageCalculator {
    public CoverageReport calculate(Set<OperationKey> operations, List<HttpEvent> events, List<String> excludePatterns) {
        Set<OperationKey> allOperations = normalizeAndFilterOperations(operations, excludePatterns);
        Map<OperationKey, Set<String>> suitesByOperation = buildSuiteMapping(allOperations, events);
        Set<OperationKey> covered = new LinkedHashSet<>(suitesByOperation.keySet());
        Set<OperationKey> uncovered = new LinkedHashSet<>(allOperations);
        uncovered.removeAll(covered);
        CoverageSummary summary = new CoverageSummary(allOperations.size(), covered.size());
        return new CoverageReport(
                allOperations,
                covered,
                uncovered,
                suitesByOperation,
                summary
        );
    }

    private Set<OperationKey> normalizeAndFilterOperations(Set<OperationKey> operations, List<String> excludePatterns) {
        Set<OperationKey> normalized = new LinkedHashSet<>();
        for (OperationKey op : operations) {
            if (op == null || op.route() == null || op.method() == null) {
                continue;
            }
            if (isExcluded(op.route(), excludePatterns)) {
                continue;
            }
            normalized.add(new OperationKey(op.method(), op.route()));
        }
        return normalized;
    }

    private Map<OperationKey, Set<String>> buildSuiteMapping(Set<OperationKey> allOperations, List<HttpEvent> events) {
        Map<OperationKey, Set<String>> result = new LinkedHashMap<>();
        for (HttpEvent event : events) {
            if (event == null || !"http".equals(event.kind()) || event.method() == null || event.route() == null) {
                continue;
            }
            OperationKey current = new OperationKey(event.method(), event.route());
            if (!allOperations.contains(current)) {
                continue;
            }
            result.computeIfAbsent(current, key -> new LinkedHashSet<>())
                    .add(normalizeSuite(event.testSuite()));
        }
        return result;
    }

    private boolean isExcluded(String route, List<String> excludePatterns) {
        if (excludePatterns == null) {
            return false;
        }
        for (String pattern : excludePatterns) {
            if (pattern == null || pattern.isBlank()) {
                continue;
            }
            if (route.startsWith(pattern) || route.equals(pattern)) {
                return true;
            }
            if (isRegexMatch(route, pattern)) {
                return true;
            }
        }
        return false;
    }

    private boolean isRegexMatch(String route, String pattern) {
        if (pattern.contains("*")) {
            String regex = pattern.replace(".", "\\.")
                    .replace("+", "\\+")
                    .replace("?", "\\?")
                    .replace("*", ".*");
            return route.matches(regex);
        }
        return false;
    }

    private String normalizeSuite(String suite) {
        return suite == null || suite.isBlank() ? "unknown" : suite;
    }
}


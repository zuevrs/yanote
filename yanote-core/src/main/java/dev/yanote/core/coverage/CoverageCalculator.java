package dev.yanote.core.coverage;

import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.openapi.OperationKey;
import dev.yanote.core.openapi.OperationMatcher;
import dev.yanote.core.openapi.SemanticDiagnostic;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class CoverageCalculator {
    private final OperationMatcher operationMatcher = new OperationMatcher();

    public CoverageReport calculate(Set<OperationKey> operations, List<HttpEvent> events, List<String> excludePatterns) {
        Set<OperationKey> allOperations = normalizeAndFilterOperations(operations, excludePatterns);
        Map<OperationKey, Set<String>> suitesByOperation = new LinkedHashMap<>();
        List<SemanticDiagnostic> semanticDiagnostics = new ArrayList<>();

        for (HttpEvent event : events) {
            if (event == null || event.method() == null || event.route() == null) {
                continue;
            }

            OperationMatcher.MatchResult matchResult = operationMatcher.match(allOperations, event);
            semanticDiagnostics.addAll(matchResult.diagnostics());
            if (matchResult.operation().isEmpty()) {
                continue;
            }
            OperationKey matchedOperation = matchResult.operation().orElseThrow();
            suitesByOperation.computeIfAbsent(matchedOperation, key -> new LinkedHashSet<>())
                    .add(normalizeSuite(event.testSuite()));
        }

        Set<OperationKey> covered = new LinkedHashSet<>(suitesByOperation.keySet());
        Set<OperationKey> uncovered = new LinkedHashSet<>(allOperations);
        uncovered.removeAll(covered);
        CoverageSummary summary = new CoverageSummary(allOperations.size(), covered.size());
        return new CoverageReport(
                allOperations,
                covered,
                uncovered,
                suitesByOperation,
                semanticDiagnostics,
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


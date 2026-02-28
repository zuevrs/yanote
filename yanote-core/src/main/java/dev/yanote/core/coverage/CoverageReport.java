package dev.yanote.core.coverage;

import dev.yanote.core.openapi.OperationKey;
import java.util.Collections;
import java.util.Map;
import java.util.Set;

public final class CoverageReport {
    private final Set<OperationKey> allOperations;
    private final Set<OperationKey> coveredOperations;
    private final Set<OperationKey> uncoveredOperations;
    private final Map<OperationKey, Set<String>> operationToSuites;
    private final CoverageSummary summary;

    public CoverageReport(
            Set<OperationKey> allOperations,
            Set<OperationKey> coveredOperations,
            Set<OperationKey> uncoveredOperations,
            Map<OperationKey, Set<String>> operationToSuites,
            CoverageSummary summary
    ) {
        this.allOperations = Collections.unmodifiableSet(allOperations);
        this.coveredOperations = Collections.unmodifiableSet(coveredOperations);
        this.uncoveredOperations = Collections.unmodifiableSet(uncoveredOperations);
        this.operationToSuites = Collections.unmodifiableMap(operationToSuites);
        this.summary = summary;
    }

    public Set<OperationKey> allOperations() {
        return allOperations;
    }

    public Set<OperationKey> coveredOperations() {
        return coveredOperations;
    }

    public Set<OperationKey> uncoveredOperations() {
        return uncoveredOperations;
    }

    public Map<OperationKey, Set<String>> operationToSuites() {
        return operationToSuites;
    }

    public CoverageSummary summary() {
        return summary;
    }
}


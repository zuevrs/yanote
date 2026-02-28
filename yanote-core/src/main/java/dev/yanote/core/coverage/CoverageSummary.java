package dev.yanote.core.coverage;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class CoverageSummary {
    private final int totalOperations;
    private final int coveredOperations;
    private final double coveragePercent;

    public CoverageSummary(int totalOperations, int coveredOperations) {
        this.totalOperations = totalOperations;
        this.coveredOperations = coveredOperations;
        if (totalOperations == 0) {
            this.coveragePercent = 100.0;
        } else {
            BigDecimal percent = BigDecimal.valueOf(coveredOperations * 100.0 / totalOperations);
            this.coveragePercent = percent.setScale(2, RoundingMode.HALF_UP).doubleValue();
        }
    }

    public int totalOperations() {
        return totalOperations;
    }

    public int coveredOperations() {
        return coveredOperations;
    }

    public double coveragePercent() {
        return coveragePercent;
    }
}


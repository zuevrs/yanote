package dev.yanote.cli.baseline;

import dev.yanote.core.openapi.OperationKey;
import java.util.List;

public record Baseline(List<OperationKey> coveredOperations) {
    public Baseline {
        if (coveredOperations == null) {
            coveredOperations = List.of();
        }
    }
}

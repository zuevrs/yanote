package dev.yanote.cli.baseline;

import dev.yanote.core.openapi.OperationKey;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class BaselineComparator {

    public Set<OperationKey> findRegressions(Baseline baseline, List<OperationKey> currentCoveredOperations) {
        return findRegressions(baseline, new LinkedHashSet<>(currentCoveredOperations));
    }

    public Set<OperationKey> findRegressions(Baseline baseline, Set<OperationKey> currentCoveredOperations) {
        LinkedHashSet<OperationKey> expected = new LinkedHashSet<>(baseline.coveredOperations());
        expected.removeAll(currentCoveredOperations);
        return expected;
    }

    public boolean hasRegressions(Baseline baseline, Set<OperationKey> currentCoveredOperations) {
        return !findRegressions(baseline, currentCoveredOperations).isEmpty();
    }

    public String formatRegressions(Set<OperationKey> regressions) {
        if (regressions.isEmpty()) {
            return "No baseline regressions";
        }

        StringBuilder message = new StringBuilder();
        message.append("Missing baseline coverage for ").append(regressions.size()).append(" operation(s):");
        for (OperationKey op : regressions) {
            message.append(' ').append(op.method()).append(' ').append(op.route()).append(',');
        }
        message.setLength(message.length() - 1);
        return message.toString();
    }
}

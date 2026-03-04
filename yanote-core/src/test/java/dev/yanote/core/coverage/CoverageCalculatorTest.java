package dev.yanote.core.coverage;

import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.openapi.OperationKey;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CoverageCalculatorTest {

    @Test
    void shouldDelegateMatchingToOperationMatcherIncludingFallback() {
        Set<OperationKey> operations = Set.of(
                new OperationKey("GET", "/users/{param}"),
                new OperationKey("GET", "/health")
        );
        List<HttpEvent> events = List.of(
                HttpEvent.of("GET", "/users/123", "run-1", "S1", 200),
                HttpEvent.of("GET", "/users/123", "run-1", "S1", 200)
        );

        CoverageReport report = new CoverageCalculator().calculate(operations, events, List.of());

        assertEquals(2, report.summary().totalOperations());
        assertEquals(1, report.summary().coveredOperations());
        assertEquals(50.0, report.summary().coveragePercent(), 0.01);

        assertEquals(1, report.uncoveredOperations().size());
        assertTrue(report.uncoveredOperations().contains(new OperationKey("GET", "/health")));

        assertEquals(Set.of("S1"), report.operationToSuites().get(new OperationKey("GET", "/users/{param}")));
        assertTrue(report.semanticDiagnostics().isEmpty());
    }

    @Test
    void shouldCarryAmbiguousAndUnmatchedDiagnostics() {
        Set<OperationKey> operations = Set.of(
                new OperationKey("GET", "/reports/{param}"),
                new OperationKey("GET", "/{param}/2024")
        );
        List<HttpEvent> events = List.of(
                HttpEvent.of("GET", "/reports/2024", "run-1", "S1", 200),
                HttpEvent.of("GET", "/missing/path", "run-1", "S1", 200)
        );

        CoverageReport report = new CoverageCalculator().calculate(operations, events, List.of());

        assertEquals(0, report.coveredOperations().size());
        assertTrue(report.semanticDiagnostics().stream().anyMatch(d ->
                "ambiguous".equals(d.kind()) && "/reports/2024".equals(d.route())
        ));
        assertTrue(report.semanticDiagnostics().stream().anyMatch(d ->
                "unmatched".equals(d.kind()) && "/missing/path".equals(d.route())
        ));
    }
}

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
    void shouldBuildCoverageReportBySuiteAndExcludingDuplicates() {
        Set<OperationKey> operations = Set.of(
                new OperationKey("GET", "/a"),
                new OperationKey("POST", "/b"),
                new OperationKey("GET", "/c")
        );
        List<HttpEvent> events = List.of(
                HttpEvent.of("GET", "/a", "run-1", "S1", 200),
                HttpEvent.of("GET", "/a", "run-1", "S1", 200),
                HttpEvent.of("GET", "/a", "run-1", "S2", 200),
                HttpEvent.of("POST", "/b", "run-1", "S1", 201)
        );

        CoverageReport report = new CoverageCalculator().calculate(operations, events, List.of());

        assertEquals(3, report.summary().totalOperations());
        assertEquals(2, report.summary().coveredOperations());
        assertEquals(66.67, report.summary().coveragePercent(), 0.01);

        assertEquals(1, report.uncoveredOperations().size());
        assertTrue(report.uncoveredOperations().contains(new OperationKey("GET", "/c")));

        assertEquals(Set.of("S1"), report.operationToSuites().get(new OperationKey("POST", "/b")));
        assertEquals(Set.of("S1", "S2"), report.operationToSuites().get(new OperationKey("GET", "/a")));
    }
}

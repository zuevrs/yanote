package dev.yanote.core.openapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.HttpEvent;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OperationMatcherParityFixtureTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldMatchSharedMatchingParityCases() throws Exception {
        Path fixturePath = Path.of("..", "test", "fixtures", "spec-semantics", "matching-cases.json");
        JsonNode root = objectMapper.readTree(Files.readString(fixturePath));
        JsonNode cases = root.path("cases");

        List<String> seenCaseIds = new ArrayList<>();
        OperationMatcher matcher = new OperationMatcher();
        for (JsonNode fixtureCase : cases) {
            String caseId = fixtureCase.path("caseId").asText();
            seenCaseIds.add(caseId);

            Set<OperationKey> operations = parseOperations(fixtureCase.path("operations"));
            List<HttpEvent> events = parseEvents(fixtureCase.path("events"));

            Set<OperationKey> covered = new LinkedHashSet<>();
            List<SemanticDiagnostic> diagnostics = new ArrayList<>();
            for (HttpEvent event : events) {
                OperationMatcher.MatchResult match = matcher.match(operations, event);
                match.operation().ifPresent(covered::add);
                diagnostics.addAll(match.diagnostics());
            }

            for (SemanticDiagnostic diagnostic : diagnostics) {
                if (!"ambiguous".equals(diagnostic.kind())) continue;
                List<String> sorted = diagnostic.candidates().stream().sorted().toList();
                assertEquals(sorted, diagnostic.candidates(), "candidate ordering mismatch for " + caseId);
            }

            List<String> actualCovered = covered.stream().map(OperationKey::toString).toList();
            List<String> expectedCovered = toStringList(fixtureCase.path("expectedCovered"));

            List<Map<String, Object>> actualDiagnostics = normalizeDiagnostics(diagnostics);
            List<Map<String, Object>> expectedDiagnostics = normalizeDiagnostics(fixtureCase.path("expectedDiagnostics"));

            assertEquals(expectedCovered, actualCovered, "covered mismatch for " + caseId);
            assertEquals(expectedDiagnostics, actualDiagnostics, "diagnostics mismatch for " + caseId);
        }

        assertEquals(
                toStringList(cases, "caseId"),
                seenCaseIds
        );
    }

    private Set<OperationKey> parseOperations(JsonNode operationNode) {
        Set<OperationKey> operations = new LinkedHashSet<>();
        for (JsonNode rawNode : operationNode) {
            String raw = rawNode.asText();
            int separator = raw.indexOf(' ');
            String method = raw.substring(0, separator);
            String route = raw.substring(separator + 1);
            operations.add(new OperationKey(method, route));
        }
        return operations;
    }

    private List<HttpEvent> parseEvents(JsonNode eventNode) {
        List<HttpEvent> events = new ArrayList<>();
        int index = 0;
        for (JsonNode rawEvent : eventNode) {
            index += 1;
            String method = rawEvent.path("method").asText();
            String route = rawEvent.path("route").asText();
            String suite = rawEvent.has("suite") ? rawEvent.path("suite").asText() : "suite-parity";
            events.add(HttpEvent.of(method, route, "run-" + index, suite, 200));
        }
        return events;
    }

    private List<String> toStringList(JsonNode arrayNode) {
        List<String> output = new ArrayList<>();
        for (JsonNode node : arrayNode) {
            output.add(node.asText());
        }
        return output;
    }

    private List<String> toStringList(JsonNode arrayNode, String fieldName) {
        List<String> output = new ArrayList<>();
        for (JsonNode node : arrayNode) {
            output.add(node.path(fieldName).asText());
        }
        return output;
    }

    private List<Map<String, Object>> normalizeDiagnostics(List<SemanticDiagnostic> diagnostics) {
        List<Map<String, Object>> output = new ArrayList<>();
        for (SemanticDiagnostic diagnostic : diagnostics) {
            Map<String, Object> normalized = new LinkedHashMap<>();
            normalized.put("kind", diagnostic.kind());
            normalized.put("method", diagnostic.method());
            normalized.put("route", diagnostic.route());
            normalized.put("candidates", diagnostic.candidates().stream().sorted().toList());
            output.add(normalized);
        }
        return output;
    }

    private List<Map<String, Object>> normalizeDiagnostics(JsonNode diagnosticsNode) {
        List<Map<String, Object>> output = new ArrayList<>();
        for (JsonNode diagnosticNode : diagnosticsNode) {
            Map<String, Object> normalized = new LinkedHashMap<>();
            normalized.put("kind", diagnosticNode.path("kind").asText());
            normalized.put("method", diagnosticNode.has("method") ? diagnosticNode.path("method").asText() : null);
            normalized.put("route", diagnosticNode.has("route") ? diagnosticNode.path("route").asText() : null);

            List<String> candidates = new ArrayList<>();
            if (diagnosticNode.has("candidates")) {
                for (JsonNode candidateNode : diagnosticNode.path("candidates")) {
                    candidates.add(candidateNode.asText());
                }
                candidates = candidates.stream().sorted().toList();
            }
            normalized.put("candidates", candidates);
            output.add(normalized);
        }
        return output;
    }
}

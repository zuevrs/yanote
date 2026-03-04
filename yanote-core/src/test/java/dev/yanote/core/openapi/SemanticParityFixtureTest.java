package dev.yanote.core.openapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SemanticParityFixtureTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldMatchSharedOperationParityCases() throws Exception {
        Path fixturePath = Path.of("..", "test", "fixtures", "spec-semantics", "operation-cases.json");
        JsonNode root = objectMapper.readTree(Files.readString(fixturePath));
        JsonNode cases = root.path("cases");

        List<String> seenCaseIds = new ArrayList<>();
        for (JsonNode fixtureCase : cases) {
            String caseId = fixtureCase.path("caseId").asText();
            seenCaseIds.add(caseId);

            Path tempSpec = Files.createTempFile("yanote-op-case-", ".json");
            try {
                Map<String, Object> specDoc = new LinkedHashMap<>();
                specDoc.put("openapi", "3.0.0");
                specDoc.put("info", Map.of("title", "parity", "version", "1.0.0"));
                specDoc.put("paths", toOpenApiPaths(fixtureCase.path("paths")));
                Files.writeString(tempSpec, objectMapper.writeValueAsString(specDoc));

                OpenApiSemantics semantics = new OpenApiLoader().loadSemantics(tempSpec.toString());
                List<String> actualOperations = semantics.operations().stream().map(OperationKey::toString).toList();
                List<String> expectedOperations = toStringList(fixtureCase.path("expectedOperations"));

                List<Map<String, Object>> actualDiagnostics = normalizeDiagnostics(semantics.diagnostics());
                List<Map<String, Object>> expectedDiagnostics = normalizeDiagnostics(fixtureCase.path("expectedDiagnostics"));

                assertEquals(expectedOperations, actualOperations, "operation mismatch for " + caseId);
                assertEquals(expectedDiagnostics, actualDiagnostics, "diagnostic mismatch for " + caseId);
            } finally {
                Files.deleteIfExists(tempSpec);
            }
        }

        assertEquals(
                toStringList(cases, "caseId"),
                seenCaseIds
        );
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

    private Map<String, Object> toOpenApiPaths(JsonNode pathsNode) {
        Map<String, Object> paths = new LinkedHashMap<>();
        pathsNode.fields().forEachRemaining(pathEntry -> {
            JsonNode pathItemNode = pathEntry.getValue();
            if (!pathItemNode.isObject()) {
                paths.put(pathEntry.getKey(), objectMapper.convertValue(pathItemNode, Object.class));
                return;
            }

            Map<String, Object> pathItem = new LinkedHashMap<>();
            pathItemNode.fields().forEachRemaining(methodEntry -> {
                JsonNode operationNode = methodEntry.getValue();
                if (!operationNode.isObject()) {
                    pathItem.put(methodEntry.getKey(), objectMapper.convertValue(operationNode, Object.class));
                    return;
                }

                Map<String, Object> operation = objectMapper.convertValue(operationNode, LinkedHashMap.class);
                if (!operation.containsKey("responses")) {
                    operation.put("responses", Map.of("200", Map.of("description", "ok")));
                }
                pathItem.put(methodEntry.getKey(), operation);
            });
            paths.put(pathEntry.getKey(), pathItem);
        });
        return paths;
    }
}

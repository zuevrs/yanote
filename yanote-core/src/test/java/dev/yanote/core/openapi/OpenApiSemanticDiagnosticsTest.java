package dev.yanote.core.openapi;

import java.net.URI;
import java.net.URL;
import java.nio.file.Paths;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenApiSemanticDiagnosticsTest {

    @Test
    void shouldEmitInvalidDiagnosticsWithPathAndMethodContext() throws Exception {
        URL resource = OpenApiSemanticDiagnosticsTest.class
                .getClassLoader()
                .getResource("openapi/semantics/invalid-openapi.yaml");
        assertTrue(resource != null);

        URI resourceUri = resource.toURI();
        String specPath = Paths.get(resourceUri).toString();
        OpenApiSemantics semantics = new OpenApiLoader().loadSemantics(specPath);

        assertTrue(semantics.hasInvalidDiagnostics());
        assertTrue(
                semantics.diagnostics().stream().anyMatch(d ->
                        "invalid".equals(d.kind()) && "/broken".equals(d.route())
                )
        );
        assertTrue(
                semantics.diagnostics().stream().anyMatch(d ->
                        "invalid".equals(d.kind()) && "POST".equals(d.method()) && "/users".equals(d.route())
                )
        );
    }

    @Test
    void shouldCarryCanonicalOperationsAndDiagnosticsTogether() throws Exception {
        URL resource = OpenApiSemanticDiagnosticsTest.class.getClassLoader().getResource("openapi/petstore.yaml");
        assertTrue(resource != null);

        URI resourceUri = resource.toURI();
        String specPath = Paths.get(resourceUri).toString();
        OpenApiSemantics semantics = new OpenApiLoader().loadSemantics(specPath);

        assertFalse(semantics.hasInvalidDiagnostics());
        assertTrue(semantics.diagnostics().isEmpty());
        assertEquals(3, semantics.operations().size());
    }

    @Test
    void shouldProduceDeterministicDiagnosticsOrderingAcrossRepeatedLoads() throws Exception {
        URL resource = OpenApiSemanticDiagnosticsTest.class
                .getClassLoader()
                .getResource("openapi/semantics/invalid-openapi.yaml");
        assertTrue(resource != null);

        URI resourceUri = resource.toURI();
        String specPath = Paths.get(resourceUri).toString();

        OpenApiLoader loader = new OpenApiLoader();
        OpenApiSemantics first = loader.loadSemantics(specPath);
        OpenApiSemantics second = loader.loadSemantics(specPath);

        assertEquals(first.operations(), second.operations());
        assertEquals(first.diagnostics(), second.diagnostics());
        assertTrue(first.hasInvalidDiagnostics());
    }
}

package dev.yanote.core.openapi;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.Paths;
import java.net.URI;
import java.net.URL;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenApiOperationsTest {

    @Test
    void shouldExtractDeterministicCanonicalKeysFromSemanticBundle() throws URISyntaxException {
        URL resource = OpenApiOperationsTest.class.getClassLoader().getResource("openapi/petstore.yaml");
        assertNotNull(resource);

        URI resourceUri = resource.toURI();
        String specPath = java.nio.file.Paths.get(resourceUri).toString();
        OpenApiSemantics semantics = new OpenApiLoader().loadSemantics(specPath);
        List<OperationKey> operations = new ArrayList<>(semantics.operations());

        assertTrue(semantics.diagnostics().isEmpty());
        assertEquals(
                List.of(
                        new OperationKey("GET", "/v1/users"),
                        new OperationKey("POST", "/v1/users"),
                        new OperationKey("GET", "/v1/users/{param}")
                ),
                operations
        );
    }

    @Test
    void shouldDeduplicateEquivalentTemplatedRoutesInStableOrder() {
        OpenAPI api = new OpenAPI();
        Paths paths = new Paths();

        PathItem first = new PathItem();
        first.setGet(new Operation());
        paths.addPathItem("/pets/{id}", first);

        PathItem second = new PathItem();
        second.setGet(new Operation());
        paths.addPathItem("/pets/{name}", second);

        api.setPaths(paths);

        OpenApiSemantics semantics = new OpenApiOperations().extractSemantics(api);
        assertEquals(
                List.of(new OperationKey("GET", "/pets/{param}")),
                new ArrayList<>(semantics.operations())
        );
        assertTrue(semantics.diagnostics().isEmpty());
    }

    @Test
    void shouldPreserveResolvedParserOptionsWhenLoadingSemantics() throws Exception {
        URL resource = OpenApiOperationsTest.class.getClassLoader().getResource("openapi/petstore.yaml");
        assertNotNull(resource);

        URI resourceUri = resource.toURI();
        String specPath = java.nio.file.Paths.get(resourceUri).toString();
        OpenApiSemantics semantics = new OpenApiLoader().loadSemantics(specPath);

        assertTrue(semantics.diagnostics().isEmpty());
        assertTrue(semantics.operations().contains(new OperationKey("GET", "/v1/users")));
        assertTrue(semantics.operations().contains(new OperationKey("POST", "/v1/users")));
        assertTrue(semantics.operations().contains(new OperationKey("GET", "/v1/users/{param}")));
    }
}

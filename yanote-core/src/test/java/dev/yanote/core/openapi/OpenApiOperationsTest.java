package dev.yanote.core.openapi;

import io.swagger.v3.oas.models.OpenAPI;
import java.net.URI;
import java.nio.file.Paths;
import java.util.Set;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenApiOperationsTest {

    @Test
    void shouldExtractOperationsFromOpenApiWithRefs() {
        URL resource = OpenApiOperationsTest.class.getClassLoader().getResource("openapi/petstore.yaml");
        assertNotNull(resource);

        URI resourceUri = resource.toURI();
        String specPath = Paths.get(resourceUri).toString();
        OpenAPI api = new OpenApiLoader().load(specPath);
        Set<OperationKey> operations = new OpenApiOperations().extract(api);

        assertEquals(3, operations.size());
        assertTrue(operations.contains(new OperationKey("GET", "/v1/users")));
        assertTrue(operations.contains(new OperationKey("POST", "/v1/users")));
        assertTrue(operations.contains(new OperationKey("GET", "/v1/users/{id}")));
    }
}


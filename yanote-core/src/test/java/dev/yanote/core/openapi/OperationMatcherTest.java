package dev.yanote.core.openapi;

import dev.yanote.core.events.HttpEvent;
import java.net.URI;
import java.net.URL;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OperationMatcherTest {

    @Test
    void shouldPreferExactCanonicalMatchBeforeTemplateFallback() throws Exception {
        OpenApiSemantics semantics = loadFixtureSemantics("openapi/semantics/ambiguous-template.yaml");
        OperationMatcher matcher = new OperationMatcher();

        OperationMatcher.MatchResult exact = matcher.match(
                semantics.operations(),
                HttpEvent.of("GET", "/users/{param}", "run-1", "suite-1")
        );

        assertTrue(exact.diagnostics().isEmpty());
        assertTrue(exact.operation().isPresent());
        assertEquals(new OperationKey("GET", "/users/{param}"), exact.operation().orElseThrow());
    }

    @Test
    void shouldFallbackToDeterministicTemplateMatchingForConcreteRoutes() throws Exception {
        OpenApiSemantics semantics = loadFixtureSemantics("openapi/semantics/ambiguous-template.yaml");
        OperationMatcher matcher = new OperationMatcher();

        OperationMatcher.MatchResult fallback = matcher.match(
                semantics.operations(),
                HttpEvent.of("GET", "/users/123", "run-1", "suite-1")
        );

        assertTrue(fallback.diagnostics().isEmpty());
        assertTrue(fallback.operation().isPresent());
        assertEquals(new OperationKey("GET", "/users/{param}"), fallback.operation().orElseThrow());
    }

    @Test
    void shouldEmitAmbiguousAndUnmatchedDiagnosticsWithoutAutoSelection() throws Exception {
        OpenApiSemantics semantics = loadFixtureSemantics("openapi/semantics/ambiguous-template.yaml");
        OperationMatcher matcher = new OperationMatcher();

        OperationMatcher.MatchResult ambiguous = matcher.match(
                semantics.operations(),
                HttpEvent.of("GET", "/reports/2024", "run-1", "suite-1")
        );
        assertFalse(ambiguous.operation().isPresent());
        assertTrue(ambiguous.diagnostics().stream().anyMatch(d ->
                "ambiguous".equals(d.kind())
                        && "GET".equals(d.method())
                        && "/reports/2024".equals(d.route())
                        && d.candidates().equals(List.of("GET /reports/{param}", "GET /{param}/2024"))
        ));

        OperationMatcher.MatchResult unmatched = matcher.match(
                semantics.operations(),
                HttpEvent.of("GET", "/not-found/path", "run-1", "suite-1")
        );
        assertFalse(unmatched.operation().isPresent());
        assertTrue(unmatched.diagnostics().stream().anyMatch(d ->
                "unmatched".equals(d.kind())
                        && "GET".equals(d.method())
                        && "/not-found/path".equals(d.route())
        ));
    }

    private OpenApiSemantics loadFixtureSemantics(String resourcePath) throws Exception {
        URL resource = OperationMatcherTest.class.getClassLoader().getResource(resourcePath);
        assertNotNull(resource);
        URI resourceUri = resource.toURI();
        String specPath = java.nio.file.Paths.get(resourceUri).toString();
        return new OpenApiLoader().loadSemantics(specPath);
    }
}

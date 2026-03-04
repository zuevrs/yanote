package dev.yanote.core.openapi;

import io.swagger.parser.OpenAPIParser;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.parser.core.models.ParseOptions;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.nio.file.Files;
import java.nio.file.Path;
import org.yaml.snakeyaml.Yaml;

public final class OpenApiLoader {
    private static final Pattern ROUTE_PATTERN = Pattern.compile("paths\\.'([^']+)'");
    private static final Pattern METHOD_PATTERN = Pattern.compile("\\.(get|put|post|delete|patch|options|head|trace)\\b");
    private static final List<String> HTTP_METHODS = List.of("get", "put", "post", "delete", "patch", "options", "head", "trace");

    public OpenAPI load(String specPath) {
        SwaggerParseResult result = parse(specPath);
        OpenAPI api = result.getOpenAPI();
        if (api == null) {
            List<String> messages = result.getMessages();
            throw new IllegalStateException("Unable to parse OpenAPI spec. " + messages);
        }
        return api;
    }

    public OpenApiSemantics loadSemantics(String specPath) {
        SwaggerParseResult result = parse(specPath);
        List<SemanticDiagnostic> rawDiagnostics = diagnosticsFromRawSpec(specPath);
        List<SemanticDiagnostic> diagnostics = new ArrayList<>(rawDiagnostics);
        if (rawDiagnostics.isEmpty()) {
            diagnostics.addAll(diagnosticsFromMessages(result.getMessages()));
        }
        diagnostics = dedupeDiagnostics(diagnostics);

        OpenAPI api = result.getOpenAPI();
        if (api == null) {
            if (diagnostics.isEmpty()) {
                diagnostics.add(SemanticDiagnostic.invalid("Unable to parse OpenAPI spec", null, null));
            }
            return new OpenApiSemantics(Set.of(), diagnostics);
        }

        OpenApiSemantics extracted = new OpenApiOperations().extractSemantics(api);
        List<SemanticDiagnostic> combinedDiagnostics = new ArrayList<>(diagnostics);
        combinedDiagnostics.addAll(extracted.diagnostics());
        combinedDiagnostics = dedupeDiagnostics(combinedDiagnostics);
        return new OpenApiSemantics(extracted.operations(), combinedDiagnostics);
    }

    private SwaggerParseResult parse(String specPath) {
        ParseOptions parseOptions = new ParseOptions();
        parseOptions.setResolve(true);
        parseOptions.setResolveFully(true);
        parseOptions.setResolveCombinators(false);

        return new OpenAPIParser().readLocation(specPath, null, parseOptions);
    }

    private List<SemanticDiagnostic> diagnosticsFromMessages(List<String> messages) {
        if (messages == null || messages.isEmpty()) {
            return new ArrayList<>();
        }

        List<SemanticDiagnostic> diagnostics = new ArrayList<>();
        for (String message : messages) {
            String method = extractMethod(message);
            if (method == null) {
                continue;
            }
            String route = extractRoute(message);
            diagnostics.add(SemanticDiagnostic.invalid(message, method, route));
        }
        return diagnostics;
    }

    private List<SemanticDiagnostic> diagnosticsFromRawSpec(String specPath) {
        List<SemanticDiagnostic> diagnostics = new ArrayList<>();
        Object root;
        try {
            root = new Yaml().load(Files.readString(Path.of(specPath)));
        } catch (Exception ex) {
            diagnostics.add(SemanticDiagnostic.invalid("Unable to inspect OpenAPI source for semantic validation", null, null));
            return diagnostics;
        }

        if (!(root instanceof Map<?, ?> rootMap)) {
            diagnostics.add(SemanticDiagnostic.invalid("OpenAPI source root must be a mapping", null, null));
            return diagnostics;
        }

        Object pathsValue = rootMap.get("paths");
        if (!(pathsValue instanceof Map<?, ?> pathsMap)) {
            diagnostics.add(SemanticDiagnostic.invalid("OpenAPI source is missing a valid paths mapping", null, null));
            return diagnostics;
        }

        for (Map.Entry<?, ?> pathEntry : pathsMap.entrySet()) {
            String route = String.valueOf(pathEntry.getKey());
            Object pathItem = pathEntry.getValue();
            if (!(pathItem instanceof Map<?, ?> pathItemMap)) {
                diagnostics.add(SemanticDiagnostic.invalid("Path item must be an object", null, route));
                continue;
            }

            for (String method : HTTP_METHODS) {
                if (!pathItemMap.containsKey(method)) {
                    continue;
                }
                Object operationValue = pathItemMap.get(method);
                if (!(operationValue instanceof Map<?, ?>)) {
                    diagnostics.add(SemanticDiagnostic.invalid("Operation must be an object", method.toUpperCase(Locale.ROOT), route));
                }
            }
        }

        return diagnostics;
    }

    private List<SemanticDiagnostic> dedupeDiagnostics(List<SemanticDiagnostic> diagnostics) {
        Set<SemanticDiagnostic> deduped = new LinkedHashSet<>(diagnostics);
        return new ArrayList<>(deduped);
    }

    private String extractRoute(String message) {
        if (message == null) {
            return null;
        }
        Matcher matcher = ROUTE_PATTERN.matcher(message);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String extractMethod(String message) {
        if (message == null) {
            return null;
        }
        Matcher matcher = METHOD_PATTERN.matcher(message.toLowerCase(Locale.ROOT));
        return matcher.find() ? matcher.group(1).toUpperCase() : null;
    }
}


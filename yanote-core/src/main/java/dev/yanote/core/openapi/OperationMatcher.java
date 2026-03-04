package dev.yanote.core.openapi;

import dev.yanote.core.events.HttpEvent;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class OperationMatcher {
    private static final Pattern TEMPLATE_PARAM = Pattern.compile("\\{[^/}]+}");
    private final Map<String, Pattern> templatePatternCache = new LinkedHashMap<>();

    public MatchResult match(Set<OperationKey> operations, HttpEvent event) {
        if (event == null || event.method() == null || event.route() == null) {
            return MatchResult.withDiagnostics(List.of(
                    SemanticDiagnostic.invalid("Event method/route is missing", null, null)
            ));
        }

        if (operations == null || operations.isEmpty()) {
            return unmatched(event.method(), event.route());
        }

        String method = event.method().toUpperCase(Locale.ROOT);
        String route = event.route();
        OperationKey exact = new OperationKey(method, route);
        if (operations.contains(exact)) {
            return MatchResult.matched(exact);
        }

        List<OperationKey> fallbackCandidates = new ArrayList<>();
        for (OperationKey operation : operations) {
            if (operation == null) continue;
            if (!method.equals(operation.method())) continue;
            if (!operation.route().contains("{")) continue;
            if (matchesTemplate(operation.route(), route)) {
                fallbackCandidates.add(operation);
            }
        }

        if (fallbackCandidates.size() == 1) {
            return MatchResult.matched(fallbackCandidates.get(0));
        }

        if (fallbackCandidates.size() > 1) {
            List<String> candidates = fallbackCandidates.stream().map(OperationKey::toString).toList();
            return MatchResult.withDiagnostics(List.of(new SemanticDiagnostic(
                    "ambiguous",
                    "Multiple operation templates matched event route",
                    method,
                    route,
                    candidates
            )));
        }

        return unmatched(method, route);
    }

    private MatchResult unmatched(String method, String route) {
        return MatchResult.withDiagnostics(List.of(new SemanticDiagnostic(
                "unmatched",
                "No operation matched event route",
                method,
                route,
                List.of()
        )));
    }

    private boolean matchesTemplate(String templateRoute, String concreteRoute) {
        Pattern pattern = templatePatternCache.computeIfAbsent(templateRoute, this::compileTemplatePattern);
        return pattern.matcher(concreteRoute).matches();
    }

    private Pattern compileTemplatePattern(String templateRoute) {
        StringBuilder expression = new StringBuilder("^");
        Matcher matcher = TEMPLATE_PARAM.matcher(templateRoute);
        int cursor = 0;
        while (matcher.find()) {
            expression.append(Pattern.quote(templateRoute.substring(cursor, matcher.start())));
            expression.append("([^/]+)");
            cursor = matcher.end();
        }
        expression.append(Pattern.quote(templateRoute.substring(cursor)));
        expression.append("$");
        return Pattern.compile(expression.toString());
    }

    public record MatchResult(
            Optional<OperationKey> operation,
            List<SemanticDiagnostic> diagnostics
    ) {
        public MatchResult {
            operation = operation == null ? Optional.empty() : operation;
            diagnostics = diagnostics == null ? List.of() : List.copyOf(diagnostics);
        }

        public static MatchResult matched(OperationKey operation) {
            return new MatchResult(Optional.of(operation), List.of());
        }

        public static MatchResult withDiagnostics(List<SemanticDiagnostic> diagnostics) {
            return new MatchResult(Optional.empty(), diagnostics);
        }
    }
}

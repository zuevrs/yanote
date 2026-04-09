package dev.yanote.recorder.springwebflux;

import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.util.pattern.PathPattern;

/** Resolves the truthful route template for a completed WebFlux exchange. */
public final class ReactiveRouteTemplateResolver {

    /**
     * Creates the reactive route-template resolver.
     */
    public ReactiveRouteTemplateResolver() {
    }

    /**
     * Resolves the matched route template when present, otherwise falls back to the raw request path.
     *
     * @param exchange completed server exchange
     * @return matched route template or truthful raw request path
     */
    public String resolve(ServerWebExchange exchange) {
        Object route = exchange.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (route instanceof PathPattern pathPattern) {
            return pathPattern.getPatternString();
        }
        if (route instanceof String path && !path.isBlank()) {
            return path;
        }
        return rawPath(exchange);
    }

    String rawPath(ServerWebExchange exchange) {
        String pathWithinApplication = exchange.getRequest().getPath().pathWithinApplication().value();
        if (pathWithinApplication != null && !pathWithinApplication.isBlank()) {
            return pathWithinApplication;
        }
        return exchange.getRequest().getURI().getRawPath();
    }
}

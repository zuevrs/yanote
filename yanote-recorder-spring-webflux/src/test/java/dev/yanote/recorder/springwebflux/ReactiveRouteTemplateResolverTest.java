package dev.yanote.recorder.springwebflux;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.util.pattern.PathPatternParser;

class ReactiveRouteTemplateResolverTest {

    private final ReactiveRouteTemplateResolver resolver = new ReactiveRouteTemplateResolver();

    @Test
    void shouldResolveMatchedPathPatternAttribute() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/v1/users/123").build());
        exchange.getAttributes().put(
                HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE,
                PathPatternParser.defaultInstance.parse("/v1/users/{id}")
        );

        assertThat(resolver.resolve(exchange)).isEqualTo("/v1/users/{id}");
    }

    @Test
    void shouldFallBackToRawRequestPathWhenMatchedPatternIsUnavailable() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/v1/fallback/123").build());

        assertThat(resolver.resolve(exchange)).isEqualTo("/v1/fallback/123");
    }
}

package dev.yanote.recorder.springwebflux;

import dev.yanote.core.testmetadata.TestMetadata;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;
import reactor.util.context.ContextView;

/**
 * Reactive-safe bridge for current test metadata during a WebFlux exchange.
 */
public final class ReactiveTestMetadataBridge {
    static final String EXCHANGE_ATTRIBUTE = ReactiveTestMetadataBridge.class.getName() + ".testMetadata";

    private static final Object CONTEXT_KEY = ReactiveTestMetadataBridge.class;

    /**
     * Creates the reactive test-metadata bridge.
     */
    public ReactiveTestMetadataBridge() {
    }

    /**
     * Reads current test metadata from the current Reactor subscriber context.
     *
     * @return current metadata or an empty publisher when none is present
     */
    public Mono<TestMetadata> current() {
        return Mono.deferContextual(contextView -> Mono.justOrEmpty(current(contextView)));
    }

    /**
     * Reads current test metadata from the current exchange state.
     *
     * @param exchange current exchange
     * @return current metadata or {@code null}
     */
    public TestMetadata current(ServerWebExchange exchange) {
        if (exchange == null) {
            return null;
        }
        return normalize(exchange.getAttribute(EXCHANGE_ATTRIBUTE));
    }

    /**
     * Reads current test metadata from a Reactor context view.
     *
     * @param contextView current Reactor context view
     * @return current metadata or {@code null}
     */
    public TestMetadata current(ContextView contextView) {
        if (contextView == null || !contextView.hasKey(CONTEXT_KEY)) {
            return null;
        }
        return normalize(contextView.get(CONTEXT_KEY));
    }

    void seed(ServerWebExchange exchange, TestMetadata testMetadata) {
        if (exchange == null) {
            return;
        }
        TestMetadata normalized = normalize(testMetadata);
        if (normalized == null) {
            exchange.getAttributes().remove(EXCHANGE_ATTRIBUTE);
            return;
        }
        exchange.getAttributes().put(EXCHANGE_ATTRIBUTE, normalized);
    }

    Context writeToContext(Context context, TestMetadata testMetadata) {
        TestMetadata normalized = normalize(testMetadata);
        if (normalized == null) {
            return context.delete(CONTEXT_KEY);
        }
        return context.put(CONTEXT_KEY, normalized);
    }

    void clear(ServerWebExchange exchange) {
        if (exchange != null) {
            exchange.getAttributes().remove(EXCHANGE_ATTRIBUTE);
        }
    }

    private TestMetadata normalize(Object value) {
        if (!(value instanceof TestMetadata testMetadata) || testMetadata.isEmpty()) {
            return null;
        }
        return testMetadata;
    }
}

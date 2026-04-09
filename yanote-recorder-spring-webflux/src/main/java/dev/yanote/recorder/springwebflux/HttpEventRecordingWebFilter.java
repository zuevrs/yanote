package dev.yanote.recorder.springwebflux;

import dev.yanote.core.events.EventJsonlWriter;
import dev.yanote.core.events.HttpEvent;
import java.io.IOException;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;

/** WebFlux filter that writes one metadata-only Yanote event for each finite exchange. */
public final class HttpEventRecordingWebFilter implements WebFilter, Ordered {
    private static final Logger log = LoggerFactory.getLogger(HttpEventRecordingWebFilter.class);
    private static final String RUN_ID_HEADER = "X-Test-Run-Id";
    private static final String SUITE_HEADER = "X-Test-Suite";

    private final String eventsPath;
    private final String serviceName;
    private final ReactiveRouteTemplateResolver routeTemplateResolver;
    private final ReactiveHttpRequestEvidenceCapture requestEvidenceCapture;

    /**
     * Creates the metadata-only WebFlux recorder filter.
     *
     * @param eventsPath target JSONL path for event output
     * @param serviceName configured service label for recorded events
     * @param routeTemplateResolver route-template resolver for matched exchanges
     * @param requestEvidenceCapture request-evidence capture helper
     */
    public HttpEventRecordingWebFilter(
            String eventsPath,
            String serviceName,
            ReactiveRouteTemplateResolver routeTemplateResolver,
            ReactiveHttpRequestEvidenceCapture requestEvidenceCapture
    ) {
        this.eventsPath = eventsPath;
        this.serviceName = serviceName;
        this.routeTemplateResolver = routeTemplateResolver;
        this.requestEvidenceCapture = requestEvidenceCapture;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String runId = exchange.getRequest().getHeaders().getFirst(RUN_ID_HEADER);
        String suite = exchange.getRequest().getHeaders().getFirst(SUITE_HEADER);
        return chain.filter(exchange)
                .doFinally(signalType -> {
                    if (signalType != SignalType.CANCEL) {
                        recordSafely(exchange, runId, suite);
                    }
                });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private void recordSafely(ServerWebExchange exchange, String runId, String suite) {
        ReactiveHttpRequestEvidenceCapture.RequestEvidenceSnapshot requestEvidence = requestEvidenceCapture.capture(exchange);
        Integer status = status(exchange);
        try {
            new EventJsonlWriter(Path.of(eventsPath)).write(new HttpEvent(
                    System.currentTimeMillis(),
                    exchange.getRequest().getMethod() == null ? null : exchange.getRequest().getMethod().name(),
                    routeTemplateResolver.resolve(exchange),
                    runId,
                    suite,
                    status,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    requestEvidence.pathParams(),
                    requestEvidence.queryParams(),
                    requestEvidence.requestHeaders(),
                    requestEvidence.cookies(),
                    serviceName,
                    null,
                    false
            ));
        } catch (IOException | RuntimeException ex) {
            log.warn("Failed to write yanote event to {} (dropping event)", eventsPath, ex);
        }
    }

    private Integer status(ServerWebExchange exchange) {
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        return statusCode == null ? null : statusCode.value();
    }
}

package dev.yanote.recorder.springwebflux;

import dev.yanote.core.events.EventJsonlWriter;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Path;
import org.reactivestreams.Publisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;

/** WebFlux filter that writes one Yanote event for each finite exchange. */
public final class HttpEventRecordingWebFilter implements WebFilter, Ordered {
    private static final Logger log = LoggerFactory.getLogger(HttpEventRecordingWebFilter.class);
    private static final String RUN_ID_HEADER = "X-Test-Run-Id";
    private static final String SUITE_HEADER = "X-Test-Suite";

    private final String eventsPath;
    private final String serviceName;
    private final ReactiveRouteTemplateResolver routeTemplateResolver;
    private final ReactiveHttpRequestEvidenceCapture requestEvidenceCapture;
    private final ReactiveHttpPayloadCapture payloadCapture;
    private final ReactiveTestMetadataBridge testMetadataBridge;

    /**
     * Creates the WebFlux recorder filter.
     *
     * @param eventsPath target JSONL path for event output
     * @param serviceName configured service label for recorded events
     * @param routeTemplateResolver route-template resolver for matched exchanges
     * @param requestEvidenceCapture request-evidence capture helper
     * @param payloadCapture payload capture helper
     * @param testMetadataBridge reactive-safe current test-metadata bridge
     */
    public HttpEventRecordingWebFilter(
            String eventsPath,
            String serviceName,
            ReactiveRouteTemplateResolver routeTemplateResolver,
            ReactiveHttpRequestEvidenceCapture requestEvidenceCapture,
            ReactiveHttpPayloadCapture payloadCapture,
            ReactiveTestMetadataBridge testMetadataBridge
    ) {
        this.eventsPath = eventsPath;
        this.serviceName = serviceName;
        this.routeTemplateResolver = routeTemplateResolver;
        this.requestEvidenceCapture = requestEvidenceCapture;
        this.payloadCapture = payloadCapture;
        this.testMetadataBridge = testMetadataBridge;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        TestMetadata testMetadata = new TestMetadata(
                exchange.getRequest().getHeaders().getFirst(RUN_ID_HEADER),
                exchange.getRequest().getHeaders().getFirst(SUITE_HEADER)
        );
        String method = exchange.getRequest().getMethod() == null ? null : exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getRawPath();

        ReactiveHttpPayloadCapture.CaptureSession requestPayload = payloadCapture.startCapture(
                "request",
                method,
                path,
                exchange.getRequest().getHeaders().getFirst(HttpHeaders.CONTENT_TYPE)
        );
        ReactiveHttpPayloadCapture.CaptureSession responsePayload = payloadCapture.startCapture(
                "response",
                method,
                path,
                exchange.getResponse().getHeaders().getFirst(HttpHeaders.CONTENT_TYPE)
        );

        ServerWebExchange decoratedExchange = decorateExchange(exchange, method, path, requestPayload, responsePayload);
        testMetadataBridge.seed(decoratedExchange, testMetadata);
        return chain.filter(decoratedExchange)
                .contextWrite(context -> testMetadataBridge.writeToContext(context, testMetadata))
                .doFinally(signalType -> {
                    try {
                        if (signalType != SignalType.CANCEL) {
                            recordSafely(decoratedExchange, testMetadata, requestPayload.finish(), responsePayload.finish());
                        }
                    } finally {
                        testMetadataBridge.clear(decoratedExchange);
                    }
                });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private ServerWebExchange decorateExchange(
            ServerWebExchange exchange,
            String method,
            String path,
            ReactiveHttpPayloadCapture.CaptureSession requestPayload,
            ReactiveHttpPayloadCapture.CaptureSession responsePayload
    ) {
        ServerHttpRequestDecorator requestDecorator = new ServerHttpRequestDecorator(exchange.getRequest()) {
            @Override
            public Flux<DataBuffer> getBody() {
                return super.getBody().doOnNext(dataBuffer -> captureChunk("request", method, path, requestPayload, dataBuffer));
            }
        };

        ServerHttpResponseDecorator responseDecorator = new ServerHttpResponseDecorator(exchange.getResponse()) {
            @Override
            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                responsePayload.observeContentType(getDelegate().getHeaders().getFirst(HttpHeaders.CONTENT_TYPE));
                if (body == null) {
                    return super.setComplete();
                }
                return super.writeWith(Flux.from(body)
                        .doOnNext(dataBuffer -> captureChunk("response", method, path, responsePayload, dataBuffer)));
            }

            @Override
            public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
                responsePayload.observeContentType(getDelegate().getHeaders().getFirst(HttpHeaders.CONTENT_TYPE));
                responsePayload.markUnsupported();
                if (body == null) {
                    return super.setComplete();
                }
                return super.writeAndFlushWith(Flux.from(body)
                        .map(publisher -> Flux.from(publisher)
                                .doOnNext(dataBuffer -> captureChunk("response", method, path, responsePayload, dataBuffer))));
            }

            @Override
            public Mono<Void> setComplete() {
                responsePayload.observeContentType(getDelegate().getHeaders().getFirst(HttpHeaders.CONTENT_TYPE));
                return super.setComplete();
            }
        };

        return exchange.mutate()
                .request(requestDecorator)
                .response(responseDecorator)
                .build();
    }

    private void captureChunk(
            String direction,
            String method,
            String path,
            ReactiveHttpPayloadCapture.CaptureSession payload,
            DataBuffer dataBuffer
    ) {
        try {
            payload.append(copyBytes(dataBuffer));
        } catch (RuntimeException ex) {
            payload.markUnexpectedFailure();
            log.warn(
                    "Failed to inspect yanote {} payload bytes for {} {} (omitting payload)",
                    direction,
                    method,
                    path,
                    ex
            );
        }
    }

    private byte[] copyBytes(DataBuffer dataBuffer) {
        int readableByteCount = dataBuffer.readableByteCount();
        if (readableByteCount == 0) {
            return new byte[0];
        }

        byte[] bytes = new byte[readableByteCount];
        int offset = 0;
        try (DataBuffer.ByteBufferIterator iterator = dataBuffer.readableByteBuffers()) {
            while (iterator.hasNext()) {
                ByteBuffer byteBuffer = iterator.next();
                int length = byteBuffer.remaining();
                byteBuffer.get(bytes, offset, length);
                offset += length;
            }
        }
        return bytes;
    }

    private void recordSafely(
            ServerWebExchange exchange,
            TestMetadata testMetadata,
            ReactiveHttpPayloadCapture.PayloadSnapshot requestPayload,
            ReactiveHttpPayloadCapture.PayloadSnapshot responsePayload
    ) {
        ReactiveHttpRequestEvidenceCapture.RequestEvidenceSnapshot requestEvidence = requestEvidenceCapture.capture(exchange);
        Integer status = status(exchange);
        try {
            new EventJsonlWriter(Path.of(eventsPath)).write(new HttpEvent(
                    System.currentTimeMillis(),
                    exchange.getRequest().getMethod() == null ? null : exchange.getRequest().getMethod().name(),
                    routeTemplateResolver.resolve(exchange),
                    testMetadata == null ? null : testMetadata.testRunId(),
                    testMetadata == null ? null : testMetadata.testSuite(),
                    status,
                    requestPayload.body(),
                    requestPayload.state(),
                    requestPayload.reason(),
                    requestPayload.contentType(),
                    responsePayload.body(),
                    responsePayload.state(),
                    responsePayload.reason(),
                    responsePayload.contentType(),
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

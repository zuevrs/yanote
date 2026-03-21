package dev.yanote.recorder.springmvc;

import dev.yanote.core.events.EventJsonlWriter;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

public class HttpEventRecordingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(HttpEventRecordingFilter.class);
    private static final String RUN_ID_HEADER = "X-Test-Run-Id";
    private static final String SUITE_HEADER = "X-Test-Suite";

    private final String eventsPath;
    private final String serviceName;
    private final RouteTemplateResolver routeTemplateResolver;
    private final HttpPayloadCapture payloadCapture;

    public HttpEventRecordingFilter(String eventsPath, String serviceName, RouteTemplateResolver routeTemplateResolver) {
        this(eventsPath, serviceName, routeTemplateResolver, new HttpPayloadCapture());
    }

    HttpEventRecordingFilter(
            String eventsPath,
            String serviceName,
            RouteTemplateResolver routeTemplateResolver,
            HttpPayloadCapture payloadCapture
    ) {
        this.eventsPath = eventsPath;
        this.serviceName = serviceName;
        this.routeTemplateResolver = routeTemplateResolver;
        this.payloadCapture = payloadCapture;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String runId = request.getHeader(RUN_ID_HEADER);
        String suite = request.getHeader(SUITE_HEADER);
        TestMetadataContextHolder.set(runId, suite);
        ContentCachingRequestWrapper requestWrapper = wrapRequest(request);
        ContentCachingResponseWrapper responseWrapper = wrapResponse(response);
        try {
            filterChain.doFilter(requestWrapper, responseWrapper);
            record(requestWrapper, responseWrapper, runId, suite);
        } finally {
            try {
                responseWrapper.copyBodyToResponse();
            } finally {
                TestMetadataContextHolder.clear();
            }
        }
    }

    private ContentCachingRequestWrapper wrapRequest(HttpServletRequest request) {
        if (request instanceof ContentCachingRequestWrapper wrapper) {
            return wrapper;
        }
        return new ContentCachingRequestWrapper(request);
    }

    private ContentCachingResponseWrapper wrapResponse(HttpServletResponse response) {
        if (response instanceof ContentCachingResponseWrapper wrapper) {
            return wrapper;
        }
        return new ContentCachingResponseWrapper(response);
    }

    private void record(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response, String runId, String suite) {
        String route = routeTemplateResolver.resolve(request);
        HttpPayloadCapture.PayloadSnapshot requestPayload = payloadCapture.captureRequest(request);
        HttpPayloadCapture.PayloadSnapshot responsePayload = payloadCapture.captureResponse(request, response);
        try {
            new EventJsonlWriter(Path.of(eventsPath)).write(new HttpEvent(
                    System.currentTimeMillis(),
                    request.getMethod(),
                    route,
                    runId,
                    suite,
                    response.getStatus(),
                    requestPayload.body(),
                    requestPayload.state(),
                    requestPayload.reason(),
                    requestPayload.contentType(),
                    responsePayload.body(),
                    responsePayload.state(),
                    responsePayload.reason(),
                    responsePayload.contentType(),
                    serviceName,
                    null,
                    false
            ));
        } catch (IOException ex) {
            log.warn("Failed to write yanote event to {} (dropping event)", eventsPath, ex);
        }
    }
}

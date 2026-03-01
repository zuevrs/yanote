package dev.yanote.recorder.springmvc;

import dev.yanote.core.events.HttpEvent;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;

public class HttpEventRecordingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(HttpEventRecordingFilter.class);
    private static final String RUN_ID_HEADER = "X-Test-Run-Id";
    private static final String SUITE_HEADER = "X-Test-Suite";

    private final String eventsPath;
    private final String serviceName;
    private final RouteTemplateResolver routeTemplateResolver;

    public HttpEventRecordingFilter(String eventsPath, String serviceName, RouteTemplateResolver routeTemplateResolver) {
        this.eventsPath = eventsPath;
        this.serviceName = serviceName;
        this.routeTemplateResolver = routeTemplateResolver;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        filterChain.doFilter(request, response);
        record(request, response);
    }

    private void record(HttpServletRequest request, HttpServletResponse response) {
        String runId = request.getHeader(RUN_ID_HEADER);
        String suite = request.getHeader(SUITE_HEADER);
        String route = routeTemplateResolver.resolve(request);
        try {
            new dev.yanote.core.events.EventJsonlWriter(java.nio.file.Path.of(eventsPath)).write(
                    HttpEvent.of(
                            request.getMethod(),
                            route,
                            runId,
                            suite,
                            response.getStatus(),
                            serviceName,
                            null
                    )
            );
        } catch (IOException ex) {
            log.warn("Failed to write yanote event to {} (dropping event)", eventsPath, ex);
        }
    }
}

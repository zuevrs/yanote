package dev.yanote.recorder.springmvc;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.util.pattern.PathPattern;

public final class RouteTemplateResolver {

    public String resolve(HttpServletRequest request) {
        Object route = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (route == null) {
            return request.getRequestURI();
        }
        if (route instanceof PathPattern pathPattern) {
            return pathPattern.getPatternString();
        }
        if (route instanceof String path) {
            return path;
        }
        return request.getRequestURI();
    }
}

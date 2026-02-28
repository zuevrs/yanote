package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Locale;

public record HttpEvent(
        long ts,
        String kind,
        String method,
        String route,
        @JsonProperty("test.run_id") String testRunId,
        @JsonProperty("test.suite") String testSuite,
        Integer status,
        String service,
        String instance,
        Boolean error
) implements YanoteEvent {

    public HttpEvent {
        kind = kind == null ? "http" : kind;
        method = method == null ? null : method.toUpperCase(Locale.ROOT);
        route = route == null ? null : route;
        if (error == null) {
            error = false;
        }
    }

    public static HttpEvent of(String method, String route, String testRunId, String testSuite) {
        return new HttpEvent(System.currentTimeMillis(), "http", method, route, testRunId, testSuite, null, null, null, false);
    }

    public static HttpEvent of(String method, String route, String testRunId, String testSuite, Integer status) {
        return new HttpEvent(System.currentTimeMillis(), "http", method, route, testRunId, testSuite, status, null, null, false);
    }

    public static HttpEvent of(String method, String route, String testRunId, String testSuite, Integer status, String service, String instance) {
        return new HttpEvent(System.currentTimeMillis(), "http", method, route, testRunId, testSuite, status, service, instance, false);
    }

    public static HttpEvent of(long ts, String method, String route, String testRunId, String testSuite, Integer status) {
        return new HttpEvent(ts, "http", method, route, testRunId, testSuite, status, null, null, false);
    }
}

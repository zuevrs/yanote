package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

public final class HttpEvent implements YanoteEvent {
    private final long ts;
    private final String kind;
    private final String method;
    private final String route;
    @JsonProperty("test.run_id")
    private final String testRunId;
    @JsonProperty("test.suite")
    private final String testSuite;
    private final Integer status;
    private final String service;
    private final String instance;
    private final Boolean error;

    public HttpEvent(
            long ts,
            String method,
            String route,
            String testRunId,
            String testSuite,
            Integer status,
            String service,
            String instance,
            Boolean error
    ) {
        this.ts = ts;
        this.kind = "http";
        this.method = method;
        this.route = route;
        this.testRunId = testRunId;
        this.testSuite = testSuite;
        this.status = status;
        this.service = service;
        this.instance = instance;
        this.error = error;
    }

    public long ts() {
        return ts;
    }

    public String kind() {
        return kind;
    }

    public String method() {
        return method;
    }

    public String route() {
        return route;
    }

    @JsonProperty("test.run_id")
    public String testRunId() {
        return testRunId;
    }

    @JsonProperty("test.suite")
    public String testSuite() {
        return testSuite;
    }

    public Integer status() {
        return status;
    }

    public String service() {
        return service;
    }

    public String instance() {
        return instance;
    }

    public Boolean error() {
        return error;
    }

    public static HttpEvent of(String method, String route, String testRunId, String testSuite) {
        return new HttpEvent(System.currentTimeMillis(), method, route, testRunId, testSuite, null, null, null, false);
    }

    public static HttpEvent of(String method, String route, String testRunId, String testSuite, Integer status, String service, String instance) {
        return new HttpEvent(System.currentTimeMillis(), method, route, testRunId, testSuite, status, service, instance, false);
    }

    public static HttpEvent of(long ts, String method, String route, String testRunId, String testSuite, Integer status) {
        return new HttpEvent(ts, method, route, testRunId, testSuite, status, null, null, false);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof HttpEvent that)) {
            return false;
        }
        return ts == that.ts
                && Objects.equals(kind, that.kind)
                && Objects.equals(method, that.method)
                && Objects.equals(route, that.route)
                && Objects.equals(testRunId, that.testRunId)
                && Objects.equals(testSuite, that.testSuite)
                && Objects.equals(status, that.status)
                && Objects.equals(service, that.service)
                && Objects.equals(instance, that.instance)
                && Objects.equals(error, that.error);
    }

    @Override
    public int hashCode() {
        return Objects.hash(ts, kind, method, route, testRunId, testSuite, status, service, instance, error);
    }

    @Override
    public String toString() {
        return "HttpEvent{"
                + "ts=" + ts
                + ", kind='" + kind + '\''
                + ", method='" + method + '\''
                + ", route='" + route + '\''
                + ", testRunId='" + testRunId + '\''
                + ", testSuite='" + testSuite + '\''
                + ", status=" + status
                + ", service='" + service + '\''
                + ", instance='" + instance + '\'' + ", error=" + error + '}';
    }
}


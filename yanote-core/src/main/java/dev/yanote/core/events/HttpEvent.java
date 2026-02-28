package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;
import java.util.Locale;

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

    @JsonCreator
    public HttpEvent(
            @JsonProperty("ts") long ts,
            @JsonProperty("kind") String kind,
            @JsonProperty("method") String method,
            @JsonProperty("route") String route,
            @JsonProperty("test.run_id") String testRunId,
            @JsonProperty("test.suite") String testSuite,
            @JsonProperty("status") Integer status,
            @JsonProperty("service") String service,
            @JsonProperty("instance") String instance,
            @JsonProperty("error") Boolean error
    ) {
        this.ts = ts;
        this.kind = kind == null ? "http" : kind;
        this.method = method == null ? null : method.toUpperCase(Locale.ROOT);
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
        return new HttpEvent(System.currentTimeMillis(), "http", method.toUpperCase(Locale.ROOT), route, testRunId, testSuite, status, service, instance, false);
    }

    public static HttpEvent of(long ts, String method, String route, String testRunId, String testSuite, Integer status) {
        return new HttpEvent(ts, "http", method.toUpperCase(Locale.ROOT), route, testRunId, testSuite, status, null, null, false);
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


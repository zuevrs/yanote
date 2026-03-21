package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record HttpEvent(
        long ts,
        String method,
        String route,
        @JsonProperty("test.run_id") String testRunId,
        @JsonProperty("test.suite") String testSuite,
        Integer status,
        @JsonInclude(JsonInclude.Include.NON_NULL) JsonNode requestBody,
        @JsonInclude(JsonInclude.Include.NON_NULL) PayloadCaptureState requestBodyState,
        @JsonInclude(JsonInclude.Include.NON_NULL) PayloadCaptureReason requestBodyReason,
        @JsonInclude(JsonInclude.Include.NON_NULL) String requestContentType,
        @JsonInclude(JsonInclude.Include.NON_NULL) JsonNode responseBody,
        @JsonInclude(JsonInclude.Include.NON_NULL) PayloadCaptureState responseBodyState,
        @JsonInclude(JsonInclude.Include.NON_NULL) PayloadCaptureReason responseBodyReason,
        @JsonInclude(JsonInclude.Include.NON_NULL) String responseContentType,
        String service,
        String instance,
        Boolean error
) implements YanoteEvent {

    public HttpEvent {
        method = method == null ? null : method.toUpperCase(Locale.ROOT);
        route = route == null ? null : route;
        requestBody = normalizeJsonValue(requestBody);
        requestBodyState = normalizeOptionalState(requestBodyState);
        requestBodyReason = normalizeOptionalReason(requestBodyReason);
        requestContentType = normalizeOptionalString(requestContentType);
        responseBody = normalizeJsonValue(responseBody);
        responseBodyState = normalizeOptionalState(responseBodyState);
        responseBodyReason = normalizeOptionalReason(responseBodyReason);
        responseContentType = normalizeOptionalString(responseContentType);
        if (error == null) {
            error = false;
        }
    }

    public static HttpEvent of(String method, String route, String testRunId, String testSuite) {
        return new HttpEvent(System.currentTimeMillis(), method, route, testRunId, testSuite, null, null, null, null, null, null, null, null, null, null, null, false);
    }

    public static HttpEvent of(String method, String route, String testRunId, String testSuite, Integer status) {
        return new HttpEvent(System.currentTimeMillis(), method, route, testRunId, testSuite, status, null, null, null, null, null, null, null, null, null, null, false);
    }

    public static HttpEvent of(String method, String route, String testRunId, String testSuite, Integer status, String service, String instance) {
        return new HttpEvent(System.currentTimeMillis(), method, route, testRunId, testSuite, status, null, null, null, null, null, null, null, null, service, instance, false);
    }

    public static HttpEvent of(long ts, String method, String route, String testRunId, String testSuite, Integer status) {
        return new HttpEvent(ts, method, route, testRunId, testSuite, status, null, null, null, null, null, null, null, null, null, null, false);
    }

    public static HttpEvent of(
            long ts,
            String method,
            String route,
            String testRunId,
            String testSuite,
            Integer status,
            JsonNode requestBody,
            String requestContentType,
            JsonNode responseBody,
            String responseContentType
    ) {
        return new HttpEvent(
                ts,
                method,
                route,
                testRunId,
                testSuite,
                status,
                requestBody,
                null,
                null,
                requestContentType,
                responseBody,
                null,
                null,
                responseContentType,
                null,
                null,
                false
        );
    }

    private static JsonNode normalizeJsonValue(JsonNode value) {
        if (value == null || value.isNull()) {
            return value;
        }
        if (value.isObject()) {
            ObjectNode normalized = JsonNodeFactory.instance.objectNode();
            Iterator<Map.Entry<String, JsonNode>> fields = value.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                JsonNode child = normalizeJsonValue(field.getValue());
                if (child == null) {
                    return null;
                }
                normalized.set(field.getKey(), child);
            }
            return normalized;
        }
        if (value.isArray()) {
            ArrayNode normalized = JsonNodeFactory.instance.arrayNode();
            for (JsonNode element : value) {
                JsonNode child = normalizeJsonValue(element);
                if (child == null) {
                    return null;
                }
                normalized.add(child);
            }
            return normalized;
        }
        if (value.isTextual() || value.isNumber() || value.isBoolean()) {
            return value;
        }
        return null;
    }

    private static PayloadCaptureState normalizeOptionalState(PayloadCaptureState value) {
        return value;
    }

    private static PayloadCaptureReason normalizeOptionalReason(PayloadCaptureReason value) {
        return value;
    }

    private static String normalizeOptionalString(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}

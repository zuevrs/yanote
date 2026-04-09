package dev.yanote.recorder.springwebflux;

import dev.yanote.core.events.HttpRequestEvidence;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.http.HttpCookie;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.server.ServerWebExchange;

final class ReactiveHttpRequestEvidenceCapture {
    static final int MAX_CAPTURED_VALUE_LENGTH = 2048;

    private static final String RUN_ID_HEADER = "x-test-run-id";
    private static final String SUITE_HEADER = "x-test-suite";
    private static final String COOKIE_HEADER = "cookie";

    RequestEvidenceSnapshot capture(ServerWebExchange exchange) {
        return new RequestEvidenceSnapshot(
                capturePathParams(exchange),
                captureQueryParams(exchange),
                captureRequestHeaders(exchange),
                captureCookies(exchange)
        );
    }

    private Map<String, HttpRequestEvidence> capturePathParams(ServerWebExchange exchange) {
        Object attribute = exchange.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (!(attribute instanceof Map<?, ?> rawValues) || rawValues.isEmpty()) {
            return null;
        }

        Map<String, HttpRequestEvidence> captured = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : rawValues.entrySet()) {
            String key = entry.getKey() instanceof String value ? normalizeKey(value, false) : null;
            if (key == null) {
                continue;
            }
            HttpRequestEvidence evidence = toEvidence(List.of(String.valueOf(entry.getValue())), false);
            if (evidence != null) {
                captured.put(key, evidence);
            }
        }
        return normalize(captured, false);
    }

    private Map<String, HttpRequestEvidence> captureQueryParams(ServerWebExchange exchange) {
        MultiValueMap<String, String> queryParams = exchange.getRequest().getQueryParams();
        if (queryParams == null || queryParams.isEmpty()) {
            return null;
        }

        Map<String, HttpRequestEvidence> captured = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> entry : queryParams.entrySet()) {
            String key = normalizeKey(entry.getKey(), false);
            if (key == null) {
                continue;
            }
            HttpRequestEvidence evidence = toEvidence(entry.getValue(), false);
            if (evidence != null) {
                captured.put(key, evidence);
            }
        }
        return normalize(captured, false);
    }

    private Map<String, HttpRequestEvidence> captureRequestHeaders(ServerWebExchange exchange) {
        MultiValueMap<String, String> headers = exchange.getRequest().getHeaders();
        if (headers == null || headers.isEmpty()) {
            return null;
        }

        Map<String, HttpRequestEvidence> captured = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
            String key = normalizeKey(entry.getKey(), true);
            if (key == null || RUN_ID_HEADER.equals(key) || SUITE_HEADER.equals(key) || COOKIE_HEADER.equals(key)) {
                continue;
            }
            HttpRequestEvidence evidence = toEvidence(entry.getValue(), isSensitiveName(key));
            if (evidence != null) {
                captured.put(key, evidence);
            }
        }
        return normalize(captured, true);
    }

    private Map<String, HttpRequestEvidence> captureCookies(ServerWebExchange exchange) {
        MultiValueMap<String, HttpCookie> cookies = exchange.getRequest().getCookies();
        if (cookies == null || cookies.isEmpty()) {
            return null;
        }

        Map<String, List<String>> rawCookies = new LinkedHashMap<>();
        for (Map.Entry<String, List<HttpCookie>> entry : cookies.entrySet()) {
            String key = normalizeKey(entry.getKey(), false);
            if (key == null || entry.getValue() == null || entry.getValue().isEmpty()) {
                continue;
            }
            List<String> values = rawCookies.computeIfAbsent(key, ignored -> new ArrayList<>());
            for (HttpCookie cookie : entry.getValue()) {
                if (cookie != null) {
                    values.add(cookie.getValue());
                }
            }
        }

        if (rawCookies.isEmpty()) {
            return null;
        }

        Map<String, HttpRequestEvidence> captured = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> entry : rawCookies.entrySet()) {
            HttpRequestEvidence evidence = toEvidence(entry.getValue(), isSensitiveName(entry.getKey()));
            if (evidence != null) {
                captured.put(entry.getKey(), evidence);
            }
        }
        return normalize(captured, false);
    }

    private HttpRequestEvidence toEvidence(List<String> values, boolean sensitive) {
        if (sensitive) {
            return HttpRequestEvidence.redacted(HttpRequestEvidence.Reason.SENSITIVE);
        }
        if (values == null || values.isEmpty()) {
            return null;
        }
        for (String value : values) {
            if (value == null) {
                return HttpRequestEvidence.omitted(HttpRequestEvidence.Reason.UNAVAILABLE);
            }
            if (isUnsupported(value)) {
                return HttpRequestEvidence.omitted(HttpRequestEvidence.Reason.UNSUPPORTED);
            }
            if (value.length() > MAX_CAPTURED_VALUE_LENGTH) {
                return HttpRequestEvidence.omitted(HttpRequestEvidence.Reason.OVERSIZED);
            }
        }
        return HttpRequestEvidence.captured(values);
    }

    private Map<String, HttpRequestEvidence> normalize(Map<String, HttpRequestEvidence> values, boolean lowercaseKeys) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        Map<String, HttpRequestEvidence> normalized = new TreeMap<>();
        for (Map.Entry<String, HttpRequestEvidence> entry : values.entrySet()) {
            String key = normalizeKey(entry.getKey(), lowercaseKeys);
            HttpRequestEvidence evidence = entry.getValue();
            if (key == null || evidence == null) {
                continue;
            }
            normalized.put(key, evidence);
        }
        return normalized.isEmpty() ? null : Collections.unmodifiableMap(new LinkedHashMap<>(normalized));
    }

    static boolean isSensitiveName(String value) {
        String normalized = normalizeKey(value, true);
        if (normalized == null) {
            return false;
        }
        return normalized.equals("authorization")
                || normalized.equals("proxy-authorization")
                || normalized.contains("token")
                || normalized.contains("secret")
                || normalized.contains("password")
                || normalized.contains("session")
                || normalized.contains("credential")
                || normalized.contains("jwt")
                || normalized.contains("api-key")
                || normalized.contains("apikey");
    }

    private static boolean isUnsupported(String value) {
        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);
            if (Character.isISOControl(current) && current != '\t') {
                return true;
            }
        }
        return false;
    }

    private static String normalizeKey(String value, boolean lowercase) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return lowercase ? normalized.toLowerCase(Locale.ROOT) : normalized;
    }

    record RequestEvidenceSnapshot(
            Map<String, HttpRequestEvidence> pathParams,
            Map<String, HttpRequestEvidence> queryParams,
            Map<String, HttpRequestEvidence> requestHeaders,
            Map<String, HttpRequestEvidence> cookies
    ) {
    }
}

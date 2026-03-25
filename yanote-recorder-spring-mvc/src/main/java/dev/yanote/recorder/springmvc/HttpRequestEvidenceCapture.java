package dev.yanote.recorder.springmvc;

import dev.yanote.core.events.HttpRequestEvidence;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.web.servlet.HandlerMapping;

final class HttpRequestEvidenceCapture {
    static final int MAX_CAPTURED_VALUE_LENGTH = 2048;

    private static final String RUN_ID_HEADER = "x-test-run-id";
    private static final String SUITE_HEADER = "x-test-suite";
    private static final String COOKIE_HEADER = "cookie";

    RequestEvidenceSnapshot capture(HttpServletRequest request) {
        return new RequestEvidenceSnapshot(
                capturePathParams(request),
                captureQueryParams(request),
                captureRequestHeaders(request),
                captureCookies(request)
        );
    }

    private Map<String, HttpRequestEvidence> capturePathParams(HttpServletRequest request) {
        Object attribute = request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
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

    private Map<String, HttpRequestEvidence> captureQueryParams(HttpServletRequest request) {
        Map<String, String[]> parameterMap = request.getParameterMap();
        if (parameterMap == null || parameterMap.isEmpty()) {
            return null;
        }

        Map<String, HttpRequestEvidence> captured = new LinkedHashMap<>();
        for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
            String key = normalizeKey(entry.getKey(), false);
            if (key == null) {
                continue;
            }
            HttpRequestEvidence evidence = toEvidence(asList(entry.getValue()), false);
            if (evidence != null) {
                captured.put(key, evidence);
            }
        }
        return normalize(captured, false);
    }

    private Map<String, HttpRequestEvidence> captureRequestHeaders(HttpServletRequest request) {
        Enumeration<String> headerNames = request.getHeaderNames();
        if (headerNames == null) {
            return null;
        }

        Map<String, HttpRequestEvidence> captured = new LinkedHashMap<>();
        while (headerNames.hasMoreElements()) {
            String key = normalizeKey(headerNames.nextElement(), true);
            if (key == null || RUN_ID_HEADER.equals(key) || SUITE_HEADER.equals(key) || COOKIE_HEADER.equals(key)) {
                continue;
            }
            HttpRequestEvidence evidence = toEvidence(Collections.list(request.getHeaders(key)), isSensitiveName(key));
            if (evidence != null) {
                captured.put(key, evidence);
            }
        }
        return normalize(captured, true);
    }

    private Map<String, HttpRequestEvidence> captureCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return null;
        }

        Map<String, List<String>> rawCookies = new LinkedHashMap<>();
        for (Cookie cookie : cookies) {
            if (cookie == null) {
                continue;
            }
            String key = normalizeKey(cookie.getName(), false);
            if (key == null) {
                continue;
            }
            rawCookies.computeIfAbsent(key, ignored -> new ArrayList<>()).add(cookie.getValue());
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

    private List<String> asList(String[] values) {
        if (values == null || values.length == 0) {
            return List.of();
        }
        List<String> captured = new ArrayList<>(values.length);
        Collections.addAll(captured, values);
        return captured;
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

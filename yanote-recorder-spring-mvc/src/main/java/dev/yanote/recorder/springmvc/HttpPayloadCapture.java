package dev.yanote.recorder.springmvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

final class HttpPayloadCapture {
    private static final Logger log = LoggerFactory.getLogger(HttpPayloadCapture.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_CAPTURE_BYTES = 64 * 1024;

    PayloadSnapshot captureRequest(ContentCachingRequestWrapper request) {
        return capture(
                "request",
                request.getMethod(),
                request.getRequestURI(),
                request.getContentType(),
                request.getContentAsByteArray()
        );
    }

    PayloadSnapshot captureResponse(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response) {
        return capture(
                "response",
                request.getMethod(),
                request.getRequestURI(),
                response.getContentType(),
                response.getContentAsByteArray()
        );
    }

    private PayloadSnapshot capture(String direction, String method, String path, String contentType, byte[] body) {
        String normalizedContentType = normalizeContentType(contentType);
        if (normalizedContentType == null || body == null || body.length == 0) {
            return new PayloadSnapshot(normalizedContentType, null);
        }
        if (!isJsonCompatible(direction, method, path, normalizedContentType)) {
            return new PayloadSnapshot(normalizedContentType, null);
        }
        if (body.length > MAX_CAPTURE_BYTES) {
            log.warn(
                    "Omitting yanote {} payload for {} {} because {} bytes exceed safe capture limit {}",
                    direction,
                    method,
                    path,
                    body.length,
                    MAX_CAPTURE_BYTES
            );
            return new PayloadSnapshot(normalizedContentType, null);
        }
        try {
            return new PayloadSnapshot(normalizedContentType, OBJECT_MAPPER.readTree(body));
        } catch (IOException ex) {
            log.warn(
                    "Failed to capture yanote {} payload for {} {} with Content-Type '{}' (omitting payload)",
                    direction,
                    method,
                    path,
                    normalizedContentType,
                    ex
            );
            return new PayloadSnapshot(normalizedContentType, null);
        }
    }

    private boolean isJsonCompatible(String direction, String method, String path, String contentType) {
        try {
            MediaType mediaType = MediaType.parseMediaType(contentType);
            if (mediaType.isCompatibleWith(MediaType.APPLICATION_JSON)) {
                return true;
            }
            String subtype = mediaType.getSubtype();
            return subtype != null && subtype.toLowerCase(Locale.ROOT).endsWith("+json");
        } catch (InvalidMediaTypeException ex) {
            log.warn(
                    "Failed to inspect yanote {} payload media type '{}' for {} {} (omitting payload)",
                    direction,
                    contentType,
                    method,
                    path,
                    ex
            );
            return false;
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return null;
        }
        String normalized = contentType.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    record PayloadSnapshot(String contentType, JsonNode body) {
    }
}

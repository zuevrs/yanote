package dev.yanote.recorder.springmvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
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
        if (body == null || body.length == 0) {
            return PayloadSnapshot.none(normalizedContentType);
        }
        if (normalizedContentType == null) {
            return PayloadSnapshot.omitted(normalizedContentType, PayloadCaptureReason.POLICY_FILTERED);
        }

        JsonCompatibility compatibility = inspectJsonCompatibility(direction, method, path, normalizedContentType);
        if (!compatibility.compatible()) {
            return PayloadSnapshot.omitted(normalizedContentType, compatibility.reason());
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
            return PayloadSnapshot.omitted(normalizedContentType, PayloadCaptureReason.OVERSIZED);
        }
        try {
            return PayloadSnapshot.captured(normalizedContentType, OBJECT_MAPPER.readTree(body));
        } catch (IOException ex) {
            log.warn(
                    "Failed to capture yanote {} payload for {} {} with Content-Type '{}' (omitting payload)",
                    direction,
                    method,
                    path,
                    normalizedContentType,
                    ex
            );
            return PayloadSnapshot.omitted(normalizedContentType, PayloadCaptureReason.MALFORMED);
        }
    }

    private JsonCompatibility inspectJsonCompatibility(String direction, String method, String path, String contentType) {
        try {
            MediaType mediaType = MediaType.parseMediaType(contentType);
            if (mediaType.isCompatibleWith(MediaType.APPLICATION_JSON)) {
                return JsonCompatibility.compatible();
            }
            String subtype = mediaType.getSubtype();
            if (subtype != null && subtype.toLowerCase(Locale.ROOT).endsWith("+json")) {
                return JsonCompatibility.compatible();
            }
            return JsonCompatibility.omitted(PayloadCaptureReason.POLICY_FILTERED);
        } catch (InvalidMediaTypeException ex) {
            log.warn(
                    "Failed to inspect yanote {} payload media type '{}' for {} {} (omitting payload)",
                    direction,
                    contentType,
                    method,
                    path,
                    ex
            );
            return JsonCompatibility.omitted(PayloadCaptureReason.POLICY_FILTERED);
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return null;
        }
        String normalized = contentType.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    record PayloadSnapshot(String contentType, JsonNode body, PayloadCaptureState state, PayloadCaptureReason reason) {
        static PayloadSnapshot none(String contentType) {
            return new PayloadSnapshot(contentType, null, null, null);
        }

        static PayloadSnapshot captured(String contentType, JsonNode body) {
            return new PayloadSnapshot(contentType, body, PayloadCaptureState.CAPTURED, null);
        }

        static PayloadSnapshot omitted(String contentType, PayloadCaptureReason reason) {
            return new PayloadSnapshot(contentType, null, PayloadCaptureState.OMITTED, reason);
        }
    }

    private record JsonCompatibility(boolean compatible, PayloadCaptureReason reason) {
        static JsonCompatibility compatible() {
            return new JsonCompatibility(true, null);
        }

        static JsonCompatibility omitted(PayloadCaptureReason reason) {
            return new JsonCompatibility(false, reason);
        }
    }
}

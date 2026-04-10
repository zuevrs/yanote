package dev.yanote.recorder.springwebflux;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;

final class ReactiveHttpPayloadCapture {
    static final int MAX_CAPTURE_BYTES = 64 * 1024;

    private static final Logger log = LoggerFactory.getLogger(ReactiveHttpPayloadCapture.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    CaptureSession startCapture(String direction, String method, String path, String contentType) {
        return new CaptureSession(direction, method, path, normalizeContentType(contentType));
    }

    final class CaptureSession {
        private final String direction;
        private final String method;
        private final String path;
        private final ByteArrayOutputStream body = new ByteArrayOutputStream();

        private String contentType;
        private boolean sawBytes;
        private boolean unexpectedFailure;
        private PayloadCaptureReason omittedReason;

        private CaptureSession(String direction, String method, String path, String contentType) {
            this.direction = direction;
            this.method = method;
            this.path = path;
            this.contentType = contentType;
        }

        void observeContentType(String contentType) {
            String normalized = normalizeContentType(contentType);
            if (normalized != null) {
                this.contentType = normalized;
            }
        }

        void markUnsupported() {
            if (omittedReason == null) {
                omittedReason = PayloadCaptureReason.UNSUPPORTED;
            }
        }

        void markUnexpectedFailure() {
            unexpectedFailure = true;
        }

        void append(byte[] bytes) {
            if (bytes == null || bytes.length == 0) {
                return;
            }

            sawBytes = true;
            if (omittedReason != null) {
                return;
            }

            JsonCompatibility compatibility = inspectJsonCompatibility(direction, method, path, contentType);
            if (!compatibility.isCompatible()) {
                omittedReason = compatibility.reason();
                return;
            }

            if (body.size() + bytes.length > MAX_CAPTURE_BYTES) {
                omittedReason = PayloadCaptureReason.OVERSIZED;
                return;
            }

            body.writeBytes(bytes);
        }

        PayloadSnapshot finish() {
            if (omittedReason != null) {
                return PayloadSnapshot.omitted(contentType, omittedReason);
            }
            if (unexpectedFailure) {
                return PayloadSnapshot.none(contentType);
            }
            if (!sawBytes) {
                return PayloadSnapshot.none(contentType);
            }

            JsonCompatibility compatibility = inspectJsonCompatibility(direction, method, path, contentType);
            if (!compatibility.isCompatible()) {
                return PayloadSnapshot.omitted(contentType, compatibility.reason());
            }

            try {
                return PayloadSnapshot.captured(contentType, OBJECT_MAPPER.readTree(body.toByteArray()));
            } catch (IOException ex) {
                log.warn(
                        "Failed to capture yanote {} payload for {} {} with Content-Type '{}' (omitting payload)",
                        direction,
                        method,
                        path,
                        contentType,
                        ex
                );
                return PayloadSnapshot.omitted(contentType, PayloadCaptureReason.MALFORMED);
            }
        }
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

    private JsonCompatibility inspectJsonCompatibility(String direction, String method, String path, String contentType) {
        if (contentType == null) {
            return JsonCompatibility.omitted(PayloadCaptureReason.POLICY_FILTERED);
        }

        try {
            MediaType mediaType = MediaType.parseMediaType(contentType);
            String subtype = mediaType.getSubtype();
            String normalizedSubtype = subtype == null ? null : subtype.toLowerCase(Locale.ROOT);
            if (mediaType.isCompatibleWith(MediaType.TEXT_EVENT_STREAM)) {
                return JsonCompatibility.omitted(PayloadCaptureReason.UNSUPPORTED);
            }
            if ("multipart".equalsIgnoreCase(mediaType.getType())) {
                return JsonCompatibility.omitted(PayloadCaptureReason.UNSUPPORTED);
            }
            if ("octet-stream".equals(normalizedSubtype) || "stream+json".equals(normalizedSubtype)) {
                return JsonCompatibility.omitted(PayloadCaptureReason.UNSUPPORTED);
            }
            if (mediaType.isCompatibleWith(MediaType.APPLICATION_JSON)) {
                return JsonCompatibility.captureAllowed();
            }
            if (normalizedSubtype != null && normalizedSubtype.endsWith("+json")) {
                return JsonCompatibility.captureAllowed();
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

    private record JsonCompatibility(boolean compatible, PayloadCaptureReason reason) {
        boolean isCompatible() {
            return compatible;
        }

        static JsonCompatibility captureAllowed() {
            return new JsonCompatibility(true, null);
        }

        static JsonCompatibility omitted(PayloadCaptureReason reason) {
            return new JsonCompatibility(false, reason);
        }
    }
}

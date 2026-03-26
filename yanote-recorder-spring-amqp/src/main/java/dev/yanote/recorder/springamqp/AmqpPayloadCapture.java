package dev.yanote.recorder.springamqp;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;

final class AmqpPayloadCapture {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_CAPTURE_BYTES = 64 * 1024;

    CaptureResult capture(Message message) {
        if (message == null) {
            return CaptureResult.none();
        }

        byte[] body = message.getBody();
        if (body == null || body.length == 0) {
            return CaptureResult.none();
        }

        if (body.length > MAX_CAPTURE_BYTES) {
            return CaptureResult.omitted(
                    PayloadCaptureReason.OVERSIZED,
                    "serialized AMQP payload size " + body.length + " bytes exceeds safe capture limit " + MAX_CAPTURE_BYTES
            );
        }

        MessageProperties properties = message.getMessageProperties();
        String contentType = properties == null ? null : normalize(properties.getContentType());

        try {
            if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("json")) {
                JsonNode jsonNode = OBJECT_MAPPER.readTree(body);
                if (jsonNode == null || jsonNode.isNull() || jsonNode.isMissingNode()) {
                    return CaptureResult.none();
                }
                return CaptureResult.captured(jsonNode);
            }

            String decoded = decodeUtf8(body);
            if (decoded == null) {
                return CaptureResult.omitted(
                        PayloadCaptureReason.UNSUPPORTED,
                        "unsupported AMQP payload encoding for content-type " + (contentType == null ? "<unknown>" : contentType)
                );
            }
            return CaptureResult.captured(TextNode.valueOf(decoded));
        } catch (IOException ex) {
            return CaptureResult.omitted(
                    PayloadCaptureReason.MALFORMED,
                    "malformed AMQP JSON payload for content-type " + contentType
            );
        }
    }

    private static String decodeUtf8(byte[] body) {
        try {
            CharsetDecoder decoder = StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT);
            String decoded = decoder.decode(ByteBuffer.wrap(body)).toString();
            String normalized = normalize(decoded);
            if (normalized == null || containsControlCharacters(normalized)) {
                return null;
            }
            return normalized;
        } catch (CharacterCodingException ex) {
            return null;
        }
    }

    private static boolean containsControlCharacters(String value) {
        return value.codePoints().anyMatch(Character::isISOControl);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    record CaptureResult(JsonNode payload, PayloadCaptureState state, PayloadCaptureReason reason, String warning) {
        static CaptureResult none() {
            return new CaptureResult(null, null, null, null);
        }

        static CaptureResult captured(JsonNode payload) {
            return new CaptureResult(payload, PayloadCaptureState.CAPTURED, null, null);
        }

        static CaptureResult omitted(PayloadCaptureReason reason, String warning) {
            return new CaptureResult(null, PayloadCaptureState.OMITTED, reason, warning);
        }
    }
}

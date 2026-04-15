package dev.yanote.recorder.springactivemq;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import jakarta.jms.BytesMessage;
import jakarta.jms.JMSException;
import jakarta.jms.Message;
import jakarta.jms.TextMessage;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

final class JmsPayloadCapture {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_CAPTURE_BYTES = 64 * 1024;

    CaptureResult capture(Message message) {
        if (message == null) {
            return CaptureResult.none();
        }

        try {
            if (message instanceof TextMessage textMessage) {
                return captureText(textMessage.getText());
            }
            if (message instanceof BytesMessage bytesMessage) {
                return captureBytes(bytesMessage);
            }
            return CaptureResult.omitted(
                    PayloadCaptureReason.UNSUPPORTED,
                    "unsupported JMS message type: " + message.getClass().getName()
            );
        } catch (JMSException ex) {
            return CaptureResult.omitted(PayloadCaptureReason.UNSUPPORTED, "failed to read JMS payload: " + ex.getMessage());
        }
    }

    private CaptureResult captureText(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return CaptureResult.none();
        }

        int encodedLength = normalized.getBytes(StandardCharsets.UTF_8).length;
        if (encodedLength > MAX_CAPTURE_BYTES) {
            return CaptureResult.omitted(
                    PayloadCaptureReason.OVERSIZED,
                    "serialized JMS text payload size " + encodedLength + " bytes exceeds safe capture limit " + MAX_CAPTURE_BYTES
            );
        }

        return parseStructuredOrText(normalized, "JMS text payload");
    }

    private CaptureResult captureBytes(BytesMessage bytesMessage) throws JMSException {
        long bodyLength = bytesMessage.getBodyLength();
        if (bodyLength <= 0) {
            return CaptureResult.none();
        }
        if (bodyLength > MAX_CAPTURE_BYTES) {
            return CaptureResult.omitted(
                    PayloadCaptureReason.OVERSIZED,
                    "serialized JMS bytes payload size " + bodyLength + " bytes exceeds safe capture limit " + MAX_CAPTURE_BYTES
            );
        }

        bytesMessage.reset();
        byte[] body = new byte[(int) bodyLength];
        int offset = 0;
        while (offset < body.length) {
            int read = bytesMessage.readBytes(body, body.length - offset);
            if (read == -1) {
                break;
            }
            offset += read;
        }
        bytesMessage.reset();

        if (offset <= 0) {
            return CaptureResult.none();
        }
        if (offset != body.length) {
            byte[] resized = new byte[offset];
            System.arraycopy(body, 0, resized, 0, offset);
            body = resized;
        }

        String decoded = decodeUtf8(body);
        if (decoded == null) {
            return CaptureResult.omitted(
                    PayloadCaptureReason.UNSUPPORTED,
                    "unsupported JMS bytes payload encoding; only bounded UTF-8 JSON/text is retained"
            );
        }
        return parseStructuredOrText(decoded, "JMS bytes payload");
    }

    private CaptureResult parseStructuredOrText(String decoded, String label) {
        if (!looksLikeJson(decoded)) {
            return CaptureResult.captured(TextNode.valueOf(decoded));
        }
        try {
            JsonNode jsonNode = OBJECT_MAPPER.readTree(decoded);
            if (jsonNode == null || jsonNode.isNull() || jsonNode.isMissingNode()) {
                return CaptureResult.none();
            }
            return CaptureResult.captured(jsonNode);
        } catch (IOException ex) {
            return CaptureResult.omitted(PayloadCaptureReason.MALFORMED, "malformed " + label + " JSON payload");
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

    private static boolean looksLikeJson(String value) {
        String trimmed = value.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
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

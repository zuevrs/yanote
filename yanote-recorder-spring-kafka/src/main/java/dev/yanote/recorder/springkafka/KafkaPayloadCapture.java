package dev.yanote.recorder.springkafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.BooleanNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.io.Writer;
import java.lang.reflect.Array;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.util.Iterator;
import java.util.Map;

final class KafkaPayloadCapture {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_CAPTURE_BYTES = 64 * 1024;

    CaptureResult capture(Object value) {
        if (value == null) {
            return CaptureResult.none();
        }

        try {
            JsonNode payload = toJsonNode(value);
            if (payload == null || payload instanceof NullNode || payload.isMissingNode()) {
                return CaptureResult.none();
            }
            int serializedBytes = OBJECT_MAPPER.writeValueAsBytes(payload).length;
            if (serializedBytes > MAX_CAPTURE_BYTES) {
                return CaptureResult.omitted(
                        PayloadCaptureReason.OVERSIZED,
                        "serialized kafka payload size " + serializedBytes + " bytes exceeds safe capture limit " + MAX_CAPTURE_BYTES
                );
            }
            return CaptureResult.captured(payload);
        } catch (UnsupportedPayloadException ex) {
            return CaptureResult.omitted(PayloadCaptureReason.UNSUPPORTED, ex.getMessage());
        } catch (JsonProcessingException ex) {
            return CaptureResult.omitted(
                    PayloadCaptureReason.UNSUPPORTED,
                    "unsupported kafka payload serialization failure for type: " + value.getClass().getName()
            );
        }
    }

    private JsonNode toJsonNode(Object value) {
        if (value == null) {
            return NullNode.getInstance();
        }
        if (value instanceof JsonNode jsonNode) {
            ensureSafeJsonTree(jsonNode, value.getClass().getName());
            return jsonNode;
        }
        if (value instanceof String stringValue) {
            return TextNode.valueOf(stringValue);
        }
        if (value instanceof Boolean booleanValue) {
            return BooleanNode.valueOf(booleanValue);
        }
        if (value instanceof Integer integerValue) {
            return JsonNodeFactory.instance.numberNode(integerValue);
        }
        if (value instanceof Long longValue) {
            return JsonNodeFactory.instance.numberNode(longValue);
        }
        if (value instanceof Short shortValue) {
            return JsonNodeFactory.instance.numberNode(shortValue);
        }
        if (value instanceof Byte byteValue) {
            return JsonNodeFactory.instance.numberNode(byteValue.intValue());
        }
        if (value instanceof BigInteger bigInteger) {
            return JsonNodeFactory.instance.numberNode(bigInteger);
        }
        if (value instanceof BigDecimal bigDecimal) {
            return JsonNodeFactory.instance.numberNode(bigDecimal);
        }
        if (value instanceof Float floatValue) {
            if (!Float.isFinite(floatValue)) {
                throw new UnsupportedPayloadException("floating-point kafka payload values must be finite");
            }
            return JsonNodeFactory.instance.numberNode(floatValue);
        }
        if (value instanceof Double doubleValue) {
            if (!Double.isFinite(doubleValue)) {
                throw new UnsupportedPayloadException("floating-point kafka payload values must be finite");
            }
            return JsonNodeFactory.instance.numberNode(doubleValue);
        }
        if (value instanceof Enum<?> enumValue) {
            return TextNode.valueOf(enumValue.name());
        }
        if (value instanceof Map<?, ?> mapValue) {
            return mapToJson(mapValue);
        }
        if (value instanceof Iterable<?> iterableValue) {
            return iterableToJson(iterableValue.iterator());
        }
        if (value instanceof byte[]
                || value instanceof char[]
                || value instanceof ByteBuffer
                || value instanceof InputStream
                || value instanceof OutputStream
                || value instanceof Reader
                || value instanceof Writer
                || value instanceof Class<?>
                || value instanceof Throwable) {
            throw new UnsupportedPayloadException("unsupported kafka payload type: " + value.getClass().getName());
        }
        if (value.getClass().isArray()) {
            return arrayToJson(value);
        }
        if (isPojoCandidate(value.getClass())) {
            return objectToJson(value);
        }

        throw new UnsupportedPayloadException("unsupported kafka payload type: " + value.getClass().getName());
    }

    private JsonNode mapToJson(Map<?, ?> mapValue) {
        var objectNode = JsonNodeFactory.instance.objectNode();
        for (Map.Entry<?, ?> entry : mapValue.entrySet()) {
            Object key = entry.getKey();
            if (!(key instanceof CharSequence)) {
                throw new UnsupportedPayloadException("kafka payload object keys must be strings");
            }
            objectNode.set(key.toString(), toJsonNode(entry.getValue()));
        }
        return objectNode;
    }

    private JsonNode iterableToJson(Iterator<?> iterator) {
        ArrayNode arrayNode = JsonNodeFactory.instance.arrayNode();
        while (iterator.hasNext()) {
            arrayNode.add(toJsonNode(iterator.next()));
        }
        return arrayNode;
    }

    private JsonNode arrayToJson(Object arrayValue) {
        ArrayNode arrayNode = JsonNodeFactory.instance.arrayNode();
        int length = Array.getLength(arrayValue);
        for (int index = 0; index < length; index++) {
            arrayNode.add(toJsonNode(Array.get(arrayValue, index)));
        }
        return arrayNode;
    }

    private JsonNode objectToJson(Object value) {
        JsonNode payload = OBJECT_MAPPER.valueToTree(value);
        ensureSafeJsonTree(payload, value.getClass().getName());
        return payload;
    }

    private boolean isPojoCandidate(Class<?> type) {
        if (type.isRecord()) {
            return true;
        }
        Package typePackage = type.getPackage();
        String packageName = typePackage == null ? "" : typePackage.getName();
        return !(packageName.startsWith("java.")
                || packageName.startsWith("javax.")
                || packageName.startsWith("jakarta.")
                || packageName.startsWith("kotlin.")
                || packageName.startsWith("scala."));
    }

    private void ensureSafeJsonTree(JsonNode value, String typeName) {
        if (value == null || value.isNull() || value.isMissingNode()) {
            return;
        }
        if (value.isBinary()) {
            throw new UnsupportedPayloadException("unsupported kafka payload type: " + typeName + " contains binary content");
        }
        if (value.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = value.fields();
            while (fields.hasNext()) {
                ensureSafeJsonTree(fields.next().getValue(), typeName);
            }
            return;
        }
        if (value.isArray()) {
            for (JsonNode element : value) {
                ensureSafeJsonTree(element, typeName);
            }
        }
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

    private static final class UnsupportedPayloadException extends RuntimeException {
        private UnsupportedPayloadException(String message) {
            super(message);
        }
    }
}

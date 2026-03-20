package dev.yanote.recorder.springkafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.BooleanNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;

import java.lang.reflect.Array;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Iterator;
import java.util.Map;

final class KafkaPayloadCapture {
    CaptureResult capture(Object value) {
        if (value == null) {
            return CaptureResult.none();
        }

        try {
            JsonNode payload = toJsonNode(value);
            if (payload == null || payload instanceof NullNode || payload.isMissingNode()) {
                return CaptureResult.none();
            }
            return CaptureResult.payload(payload);
        } catch (UnsupportedPayloadException ex) {
            return CaptureResult.omitted(ex.getMessage());
        }
    }

    private JsonNode toJsonNode(Object value) {
        if (value == null) {
            return NullNode.getInstance();
        }
        if (value instanceof JsonNode jsonNode) {
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
        if (value instanceof Map<?, ?> mapValue) {
            return mapToJson(mapValue);
        }
        if (value instanceof Iterable<?> iterableValue) {
            return iterableToJson(iterableValue.iterator());
        }
        if (value.getClass().isArray()) {
            return arrayToJson(value);
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

    record CaptureResult(JsonNode payload, String warning) {
        static CaptureResult none() {
            return new CaptureResult(null, null);
        }

        static CaptureResult payload(JsonNode payload) {
            return new CaptureResult(payload, null);
        }

        static CaptureResult omitted(String warning) {
            return new CaptureResult(null, warning);
        }
    }

    private static final class UnsupportedPayloadException extends RuntimeException {
        private UnsupportedPayloadException(String message) {
            super(message);
        }
    }
}

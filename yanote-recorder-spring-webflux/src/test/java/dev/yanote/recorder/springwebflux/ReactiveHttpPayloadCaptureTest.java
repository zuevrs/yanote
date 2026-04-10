package dev.yanote.recorder.springwebflux;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class ReactiveHttpPayloadCaptureTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ReactiveHttpPayloadCapture payloadCapture = new ReactiveHttpPayloadCapture();

    @Test
    void shouldCaptureBoundedJsonPayload() throws Exception {
        ReactiveHttpPayloadCapture.CaptureSession session = payloadCapture.startCapture(
                "request",
                "POST",
                "/v1/users",
                "application/json"
        );

        session.append("{\"name\":\"Ada\"}".getBytes(StandardCharsets.UTF_8));

        ReactiveHttpPayloadCapture.PayloadSnapshot snapshot = session.finish();
        assertEquals("application/json", snapshot.contentType());
        assertEquals(PayloadCaptureState.CAPTURED, snapshot.state());
        assertNull(snapshot.reason());
        assertEquals(OBJECT_MAPPER.readTree("{\"name\":\"Ada\"}"), snapshot.body());
    }

    @Test
    void shouldCaptureJsonSuffixContentType() throws Exception {
        ReactiveHttpPayloadCapture.CaptureSession session = payloadCapture.startCapture(
                "response",
                "GET",
                "/errors/42",
                "application/problem+json"
        );

        session.append("{\"type\":\"problem\"}".getBytes(StandardCharsets.UTF_8));

        ReactiveHttpPayloadCapture.PayloadSnapshot snapshot = session.finish();
        assertEquals("application/problem+json", snapshot.contentType());
        assertEquals(PayloadCaptureState.CAPTURED, snapshot.state());
        assertNull(snapshot.reason());
        assertEquals(OBJECT_MAPPER.readTree("{\"type\":\"problem\"}"), snapshot.body());
    }

    @Test
    void shouldOmitFiniteNonJsonPayloadAsPolicyFiltered() {
        ReactiveHttpPayloadCapture.CaptureSession session = payloadCapture.startCapture(
                "request",
                "POST",
                "/v1/plain",
                "text/plain"
        );

        session.append("hello".getBytes(StandardCharsets.UTF_8));

        ReactiveHttpPayloadCapture.PayloadSnapshot snapshot = session.finish();
        assertEquals("text/plain", snapshot.contentType());
        assertNull(snapshot.body());
        assertEquals(PayloadCaptureState.OMITTED, snapshot.state());
        assertEquals(PayloadCaptureReason.POLICY_FILTERED, snapshot.reason());
    }

    @Test
    void shouldOmitUnsupportedStreamingPayloads() {
        ReactiveHttpPayloadCapture.CaptureSession session = payloadCapture.startCapture(
                "response",
                "GET",
                "/stream",
                null
        );

        session.observeContentType("application/stream+json");
        session.append("{\"value\":1}".getBytes(StandardCharsets.UTF_8));

        ReactiveHttpPayloadCapture.PayloadSnapshot snapshot = session.finish();
        assertEquals("application/stream+json", snapshot.contentType());
        assertNull(snapshot.body());
        assertEquals(PayloadCaptureState.OMITTED, snapshot.state());
        assertEquals(PayloadCaptureReason.UNSUPPORTED, snapshot.reason());
    }

    @Test
    void shouldOmitOversizedPayloads() {
        String oversizedValue = "a".repeat(ReactiveHttpPayloadCapture.MAX_CAPTURE_BYTES);
        String oversizedJson = "{\"value\":\"" + oversizedValue + "\"}";

        ReactiveHttpPayloadCapture.CaptureSession session = payloadCapture.startCapture(
                "request",
                "POST",
                "/v1/users",
                "application/json"
        );

        session.append(oversizedJson.getBytes(StandardCharsets.UTF_8));

        ReactiveHttpPayloadCapture.PayloadSnapshot snapshot = session.finish();
        assertEquals("application/json", snapshot.contentType());
        assertNull(snapshot.body());
        assertEquals(PayloadCaptureState.OMITTED, snapshot.state());
        assertEquals(PayloadCaptureReason.OVERSIZED, snapshot.reason());
    }

    @Test
    void shouldOmitMalformedJsonPayloads() {
        ReactiveHttpPayloadCapture.CaptureSession session = payloadCapture.startCapture(
                "response",
                "POST",
                "/v1/users",
                "application/json"
        );

        session.append("{\"name\":".getBytes(StandardCharsets.UTF_8));

        ReactiveHttpPayloadCapture.PayloadSnapshot snapshot = session.finish();
        assertEquals("application/json", snapshot.contentType());
        assertNull(snapshot.body());
        assertEquals(PayloadCaptureState.OMITTED, snapshot.state());
        assertEquals(PayloadCaptureReason.MALFORMED, snapshot.reason());
    }
}

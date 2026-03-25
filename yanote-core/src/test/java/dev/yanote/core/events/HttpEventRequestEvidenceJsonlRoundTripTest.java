package dev.yanote.core.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;

public class HttpEventRequestEvidenceJsonlRoundTripTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void shouldWriteAndReadHttpEventWithRequestEvidenceRoundTrip() throws Exception {
        HttpEvent event = new HttpEvent(
                1689000000000L,
                "post",
                "/v1/users/{id}",
                "run-1",
                "suite-a",
                201,
                OBJECT_MAPPER.readTree("{\"name\":\"Ada\"}"),
                PayloadCaptureState.CAPTURED,
                null,
                "application/json",
                OBJECT_MAPPER.readTree("{\"id\":\"123\",\"name\":\"Ada\"}"),
                PayloadCaptureState.CAPTURED,
                null,
                "application/json",
                Map.of("id", HttpRequestEvidence.captured(List.of("123"))),
                Map.of(
                        "expand", HttpRequestEvidence.captured(List.of("roles", "teams")),
                        "token", HttpRequestEvidence.redacted(HttpRequestEvidence.Reason.SENSITIVE)
                ),
                Map.of(
                        "X-Trace-Id", HttpRequestEvidence.captured(List.of("trace-1", "trace-2")),
                        "Authorization", HttpRequestEvidence.redacted(HttpRequestEvidence.Reason.SENSITIVE)
                ),
                Map.of(
                        "prefs", HttpRequestEvidence.captured(List.of("compact")),
                        "SESSION", HttpRequestEvidence.redacted(HttpRequestEvidence.Reason.SENSITIVE)
                ),
                null,
                null,
                false
        );

        Path tempFile = Files.createTempFile("yanote-http-request-evidence-", ".jsonl");

        try (EventJsonlWriter writer = new EventJsonlWriter(tempFile)) {
            writer.write(event);
        }

        List<String> jsonlLines = Files.readAllLines(tempFile, StandardCharsets.UTF_8);
        assertEquals(1, jsonlLines.size());
        assertEquals(
                "{\"kind\":\"http\",\"ts\":1689000000000,\"method\":\"POST\",\"route\":\"/v1/users/{id}\",\"status\":201,\"requestBody\":{\"name\":\"Ada\"},\"requestBodyState\":\"captured\",\"requestContentType\":\"application/json\",\"responseBody\":{\"id\":\"123\",\"name\":\"Ada\"},\"responseBodyState\":\"captured\",\"responseContentType\":\"application/json\",\"pathParams\":{\"id\":{\"state\":\"captured\",\"values\":[\"123\"]}},\"queryParams\":{\"expand\":{\"state\":\"captured\",\"values\":[\"roles\",\"teams\"]},\"token\":{\"state\":\"redacted\",\"reason\":\"sensitive\"}},\"requestHeaders\":{\"authorization\":{\"state\":\"redacted\",\"reason\":\"sensitive\"},\"x-trace-id\":{\"state\":\"captured\",\"values\":[\"trace-1\",\"trace-2\"]}},\"cookies\":{\"SESSION\":{\"state\":\"redacted\",\"reason\":\"sensitive\"},\"prefs\":{\"state\":\"captured\",\"values\":[\"compact\"]}},\"service\":null,\"instance\":null,\"error\":false,\"test.run_id\":\"run-1\",\"test.suite\":\"suite-a\"}",
                jsonlLines.get(0)
        );

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        HttpEvent actual = assertInstanceOf(HttpEvent.class, events.get(0));
        assertEquals(OBJECT_MAPPER.writeValueAsString(event), OBJECT_MAPPER.writeValueAsString(actual));
        assertEquals(List.of("trace-1", "trace-2"), actual.requestHeaders().get("x-trace-id").values());
        assertEquals(HttpRequestEvidence.State.REDACTED, actual.cookies().get("SESSION").state());
    }

    @Test
    void shouldReadLegacyHttpEventWithoutRequestEvidence() throws Exception {
        Path tempFile = Files.createTempFile("yanote-http-request-evidence-legacy-", ".jsonl");
        Files.writeString(
                tempFile,
                "{\"kind\":\"http\",\"ts\":1689000000200,\"method\":\"GET\",\"route\":\"/legacy\",\"status\":200,\"responseBody\":{\"ok\":true},\"responseContentType\":\"application/json\",\"service\":null,\"instance\":null,\"error\":false,\"test.run_id\":\"run-legacy\",\"test.suite\":\"suite-legacy\"}\n",
                StandardCharsets.UTF_8
        );

        List<YanoteEvent> events = new EventJsonlReader().read(tempFile);
        assertEquals(1, events.size());
        HttpEvent event = assertInstanceOf(HttpEvent.class, events.get(0));
        assertNull(event.pathParams());
        assertNull(event.queryParams());
        assertNull(event.requestHeaders());
        assertNull(event.cookies());
        assertFalse(OBJECT_MAPPER.writeValueAsString(event).contains("pathParams"));
        assertEquals(OBJECT_MAPPER.readTree("{\"ok\":true}"), event.responseBody());
    }
}

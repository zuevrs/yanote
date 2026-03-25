package dev.yanote.recorder.springmvc;

import dev.yanote.core.events.HttpRequestEvidence;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.HandlerMapping;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

public class HttpRequestEvidenceCaptureTest {
    private final HttpRequestEvidenceCapture capture = new HttpRequestEvidenceCapture();

    @Test
    void shouldCaptureRepeatedValuesAndRedactSensitiveRequestEvidence() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/v1/users/123");
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("id", "123"));
        request.addParameter("expand", "roles", "teams");
        request.addParameter("page", "1");
        request.addHeader("X-Trace-Id", "trace-1");
        request.addHeader("X-Trace-Id", "trace-2");
        request.addHeader("Authorization", "Bearer super-secret");
        request.addHeader("X-Test-Run-Id", "run-1");
        request.addHeader("X-Test-Suite", "suite-a");
        request.setCookies(
                new Cookie("theme", "dark"),
                new Cookie("theme", "contrast"),
                new Cookie("SESSION", "secret-session")
        );

        HttpRequestEvidenceCapture.RequestEvidenceSnapshot snapshot = capture.capture(request);

        assertEquals(List.of("123"), snapshot.pathParams().get("id").values());
        assertEquals(HttpRequestEvidence.State.CAPTURED, snapshot.queryParams().get("expand").state());
        assertEquals(List.of("roles", "teams"), snapshot.queryParams().get("expand").values());
        assertEquals(List.of("trace-1", "trace-2"), snapshot.requestHeaders().get("x-trace-id").values());
        assertEquals(HttpRequestEvidence.State.REDACTED, snapshot.requestHeaders().get("authorization").state());
        assertEquals(HttpRequestEvidence.Reason.SENSITIVE, snapshot.requestHeaders().get("authorization").reason());
        assertFalse(snapshot.requestHeaders().containsKey("x-test-run-id"));
        assertFalse(snapshot.requestHeaders().containsKey("x-test-suite"));
        assertEquals(List.of("dark", "contrast"), snapshot.cookies().get("theme").values());
        assertEquals(HttpRequestEvidence.State.REDACTED, snapshot.cookies().get("SESSION").state());
    }

    @Test
    void shouldOmitOversizedAndUnsupportedValuesExplicitly() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/v1/users/123");
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("id", "123"));
        request.addParameter("huge", "x".repeat(HttpRequestEvidenceCapture.MAX_CAPTURED_VALUE_LENGTH + 1));
        request.addHeader("X-Binary", "bad\u0000value");
        request.setCookies(new Cookie("prefs", "y".repeat(HttpRequestEvidenceCapture.MAX_CAPTURED_VALUE_LENGTH + 1)));

        HttpRequestEvidenceCapture.RequestEvidenceSnapshot snapshot = capture.capture(request);

        assertEquals(HttpRequestEvidence.State.OMITTED, snapshot.queryParams().get("huge").state());
        assertEquals(HttpRequestEvidence.Reason.OVERSIZED, snapshot.queryParams().get("huge").reason());
        assertNull(snapshot.queryParams().get("huge").values());
        assertEquals(HttpRequestEvidence.State.OMITTED, snapshot.requestHeaders().get("x-binary").state());
        assertEquals(HttpRequestEvidence.Reason.UNSUPPORTED, snapshot.requestHeaders().get("x-binary").reason());
        assertEquals(HttpRequestEvidence.State.OMITTED, snapshot.cookies().get("prefs").state());
        assertEquals(HttpRequestEvidence.Reason.OVERSIZED, snapshot.cookies().get("prefs").reason());
    }
}

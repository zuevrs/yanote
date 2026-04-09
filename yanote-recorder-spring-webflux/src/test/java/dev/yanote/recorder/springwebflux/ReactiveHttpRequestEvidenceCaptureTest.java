package dev.yanote.recorder.springwebflux;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import dev.yanote.core.events.HttpRequestEvidence;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.reactive.HandlerMapping;

class ReactiveHttpRequestEvidenceCaptureTest {

    private final ReactiveHttpRequestEvidenceCapture capture = new ReactiveHttpRequestEvidenceCapture();

    @Test
    void shouldCaptureRepeatedValuesAndRedactSensitiveRequestEvidence() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/v1/users/123?expand=roles&expand=teams&page=1")
                .header("X-Trace-Id", "trace-1", "trace-2")
                .header("Authorization", "Bearer super-secret")
                .header("X-Test-Run-Id", "run-1")
                .header("X-Test-Suite", "suite-a")
                .cookie(new HttpCookie("theme", "dark"), new HttpCookie("theme", "contrast"), new HttpCookie("SESSION", "secret-session"))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getAttributes().put(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("id", "123"));

        ReactiveHttpRequestEvidenceCapture.RequestEvidenceSnapshot snapshot = capture.capture(exchange);

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
    void shouldOmitOversizedValuesExplicitly() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/v1/users/123?huge=" + "x".repeat(ReactiveHttpRequestEvidenceCapture.MAX_CAPTURED_VALUE_LENGTH + 1))
                .cookie(new HttpCookie("prefs", "y".repeat(ReactiveHttpRequestEvidenceCapture.MAX_CAPTURED_VALUE_LENGTH + 1)))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getAttributes().put(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("id", "123"));

        ReactiveHttpRequestEvidenceCapture.RequestEvidenceSnapshot snapshot = capture.capture(exchange);

        assertEquals(HttpRequestEvidence.State.OMITTED, snapshot.queryParams().get("huge").state());
        assertEquals(HttpRequestEvidence.Reason.OVERSIZED, snapshot.queryParams().get("huge").reason());
        assertEquals(HttpRequestEvidence.State.OMITTED, snapshot.cookies().get("prefs").state());
        assertEquals(HttpRequestEvidence.Reason.OVERSIZED, snapshot.cookies().get("prefs").reason());
    }
}

package dev.yanote.examples.tests;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.testtags.restassured.YanoteRestAssuredFilter;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class HttpRequestEvidenceE2eTest {

    private static final Path EVENTS_PATH = resolveEventsPath();
    private static final String BASE_URI = resolveBaseUri();
    private static final String SUITE = suiteFromEnv();
    private static final String RUN_ID = runIdFromEnv();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String REQUEST_ROUTE = "/request-evidence/users/user-42";
    private static final String RECORDED_ROUTE = "/request-evidence/users/{userId}";
    private static final String REQUEST_FLAVOR = "amber";
    private static final String CLIENT_MODE = "compact";
    private static final String AUTHORIZATION_SECRET = "Bearer proof-secret-token";
    private static final String SESSION_SECRET = "proof-session-secret";
    private static final String UNSUPPORTED_META = "opaque";
    private static final List<String> TAGS = List.of("alpha", "bravo");

    @BeforeAll
    static void setup() {
        System.setProperty("yanote.suite", SUITE);
        Assumptions.assumeTrue(waitForServiceReady(), "Demo service not available at " + BASE_URI + "; skip integration test");
    }

    @Test
    void shouldCaptureSupportedRepeatedQueryArraysAndUnsupportedQuerySemanticsWithoutLeakingSecrets() throws IOException {
        JsonNode responseBody = sendFocusedRequest();
        assertEquals("user-42", responseBody.path("userId").asText());
        assertTrue(responseBody.path("expand").asBoolean());
        assertEquals(REQUEST_FLAVOR, responseBody.path("requestFlavor").asText());
        assertEquals(CLIENT_MODE, responseBody.path("clientMode").asText());
        assertTrue(responseBody.path("authorizationProvided").asBoolean());
        assertTrue(responseBody.path("sessionProvided").asBoolean());
        assertEquals(0, responseBody.path("oversizedHintLength").asInt());
        assertTrue(responseBody.path("metaProvided").asBoolean());
        assertJsonArrayEquals(responseBody.path("tags"), TAGS);

        JsonNode event = findTaggedEvent();
        assertEquals("GET", event.path("method").asText());
        assertEquals(RECORDED_ROUTE, event.path("route").asText());
        assertEquals(200, event.path("status").asInt());
        assertEquals(RUN_ID, event.path("test.run_id").asText());
        assertEquals(SUITE, event.path("test.suite").asText());

        assertCapturedValue(event.path("pathParams").path("userId"), "user-42");
        assertCapturedValue(event.path("queryParams").path("expand"), "true");
        assertCapturedValues(event.path("queryParams").path("tags"), TAGS);
        assertCapturedValue(event.path("queryParams").path("meta"), UNSUPPORTED_META);
        assertTrue(event.path("queryParams").path("oversizedHint").isMissingNode());
        assertCapturedValue(event.path("requestHeaders").path("x-request-flavor"), REQUEST_FLAVOR);
        assertRedacted(event.path("requestHeaders").path("authorization"), "sensitive");
        assertCapturedValue(event.path("cookies").path("clientMode"), CLIENT_MODE);
        assertRedacted(event.path("cookies").path("SESSION"), "sensitive");

        assertTrue(event.path("requestHeaders").path("cookie").isMissingNode());
        assertTrue(event.path("requestHeaders").path("x-test-run-id").isMissingNode());
        assertTrue(event.path("requestHeaders").path("x-test-suite").isMissingNode());
        assertNoRawSecretLeak(event.toString());
    }

    private static JsonNode sendFocusedRequest() throws IOException {
        YanoteRestAssuredFilter filter = new YanoteRestAssuredFilter(RUN_ID, SUITE);
        Response response = RestAssured
                .given()
                .filter(filter)
                .baseUri(BASE_URI)
                .queryParam("expand", true)
                .queryParam("tags", TAGS.toArray())
                .queryParam("meta", UNSUPPORTED_META)
                .header("X-Request-Flavor", REQUEST_FLAVOR)
                .header("Authorization", AUTHORIZATION_SECRET)
                .cookie("clientMode", CLIENT_MODE)
                .cookie("SESSION", SESSION_SECRET)
                .get(REQUEST_ROUTE);
        response.then().statusCode(200);

        JsonNode responseBody = OBJECT_MAPPER.readTree(response.asString());
        assertNotNull(responseBody);
        return responseBody;
    }

    private static JsonNode findTaggedEvent() throws IOException {
        List<String> lines = Files.readAllLines(EVENTS_PATH);
        assertFalse(lines.isEmpty(), "Expected at least one recorded event");

        List<JsonNode> taggedEvents = lines.stream()
                .map(HttpRequestEvidenceE2eTest::parseEvent)
                .filter(event -> RUN_ID.equals(event.path("test.run_id").asText()))
                .filter(event -> SUITE.equals(event.path("test.suite").asText()))
                .filter(event -> "GET".equals(event.path("method").asText()))
                .filter(event -> RECORDED_ROUTE.equals(event.path("route").asText()))
                .toList();

        assertEquals(1, taggedEvents.size(), "Expected exactly one tagged focused request event");
        return taggedEvents.getFirst();
    }

    private static JsonNode parseEvent(String line) {
        try {
            return OBJECT_MAPPER.readTree(line);
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse event line: " + line, e);
        }
    }

    private static void assertCapturedValue(JsonNode evidence, String expectedValue) {
        assertCapturedValues(evidence, List.of(expectedValue));
    }

    private static void assertCapturedValues(JsonNode evidence, List<String> expectedValues) {
        assertEquals("captured", evidence.path("state").asText());
        JsonNode values = evidence.path("values");
        assertEquals(expectedValues.size(), values.size());
        for (int index = 0; index < expectedValues.size(); index++) {
            assertEquals(expectedValues.get(index), values.get(index).asText());
        }
        assertNull(evidence.path("reason").textValue());
    }

    private static void assertRedacted(JsonNode evidence, String expectedReason) {
        assertEquals("redacted", evidence.path("state").asText());
        assertEquals(expectedReason, evidence.path("reason").asText());
        assertTrue(evidence.path("values").isMissingNode() || evidence.path("values").isNull());
    }

    private static void assertNoRawSecretLeak(String serializedEvent) {
        assertFalse(serializedEvent.contains(AUTHORIZATION_SECRET), "Recorder artifact leaked Authorization value");
        assertFalse(serializedEvent.contains(SESSION_SECRET), "Recorder artifact leaked SESSION cookie value");
    }

    private static void assertJsonArrayEquals(JsonNode actualArray, List<String> expectedValues) {
        assertTrue(actualArray.isArray(), "Expected JSON array in response body");
        assertEquals(expectedValues.size(), actualArray.size());
        for (int index = 0; index < expectedValues.size(); index++) {
            assertEquals(expectedValues.get(index), actualArray.get(index).asText());
        }
    }

    private static String resolveBaseUri() {
        String systemProperty = System.getProperty("yanote.examples.base-uri");
        if (systemProperty != null && !systemProperty.isBlank()) {
            return systemProperty;
        }
        String env = System.getenv("YANOTE_BASE_URI");
        return env == null || env.isBlank() ? "http://localhost:8080" : env;
    }

    private static Path resolveEventsPath() {
        String eventsPath = System.getenv("YANOTE_EVENTS_PATH");
        return Path.of(eventsPath == null || eventsPath.isBlank() ? "/data/yanote/events.jsonl" : eventsPath);
    }

    private static String suiteFromEnv() {
        String suite = System.getenv("YANOTE_SUITE");
        return suite == null || suite.isBlank() ? "request-evidence-restassured" : suite;
    }

    private static String runIdFromEnv() {
        String runId = System.getenv("YANOTE_RUN_ID");
        return runId == null || runId.isBlank() ? "request-evidence-run" : runId;
    }

    private static boolean waitForServiceReady() {
        URI uri = URI.create(BASE_URI);
        String host = uri.getHost() == null || uri.getHost().isBlank() ? "127.0.0.1" : uri.getHost();
        int port = uri.getPort() > 0 ? uri.getPort() : 80;

        for (int attempt = 1; attempt <= 30; attempt++) {
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(host, port), 1000);
                return true;
            } catch (Exception ignored) {
                // waiting
            }

            try {
                Thread.sleep(1000);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while waiting for service", ex);
            }
        }

        return false;
    }
}

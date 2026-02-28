package dev.yanote.examples.tests;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.testtags.restassured.YanoteRestAssuredFilter;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class DemoServiceE2eTest {

    private static final Path EVENTS_PATH = resolveEventsPath();
    private static final String BASE_URI = resolveBaseUri();
    private static final String SUITE = suiteFromEnv();
    private static final String RUN_ID = runIdFromEnv();

    @BeforeAll
    static void setup() {
        System.setProperty("yanote.suite", SUITE);
        Assumptions.assumeTrue(waitForServiceReady(), "Demo service not available at " + BASE_URI + "; skip integration test");
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

    @Test
    void shouldHitDemoEndpointsAndCreateEvents() throws IOException {
        Files.deleteIfExists(EVENTS_PATH);

        sendGet("/users");
        sendGet("/users/123");
        sendPost("/users");
        sendGet("/admin/ping");

        List<String> lines = Files.readAllLines(EVENTS_PATH);
        assertFalse(lines.isEmpty(), "Expected at least one recorded event");

        ObjectMapper objectMapper = new ObjectMapper();
        List<HttpEvent> events = lines.stream()
                .map(line -> parseEvent(objectMapper, line))
                .toList();

        assertTrue(events.size() >= 4);

        List<String> routes = events.stream()
                .map(HttpEvent::route)
                .toList();

        assertTrue(routes.contains("/users"));
        assertTrue(routes.contains("/users/{id}"));
        assertTrue(routes.contains("/admin/ping"));

        assertTrue(events.stream().allMatch(event -> RUN_ID.equals(event.testRunId())));
        assertTrue(events.stream().allMatch(event -> SUITE.equals(event.testSuite())));
    }

    private static String suiteFromEnv() {
        String suite = System.getenv("YANOTE_SUITE");
        return suite == null || suite.isBlank() ? "examples-restassured" : suite;
    }

    private static String runIdFromEnv() {
        String runId = System.getenv("YANOTE_RUN_ID");
        return runId == null || runId.isBlank() ? "compose-run-1" : runId;
    }

    private static HttpEvent parseEvent(ObjectMapper objectMapper, String line) {
        try {
            return objectMapper.readValue(line, HttpEvent.class);
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse event line: " + line, e);
        }
    }

    private static boolean waitForServiceReady() {
        HttpClient client = HttpClient.newHttpClient();
        for (int attempt = 1; attempt <= 30; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(java.net.URI.create(BASE_URI + "/health"))
                        .timeout(Duration.ofSeconds(1))
                        .GET()
                        .build();

                HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
                if (response.statusCode() == 200) {
                    return true;
                }
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

    private static void sendGet(String path) {
        YanoteRestAssuredFilter filter = new YanoteRestAssuredFilter(RUN_ID, SUITE);
        Response response = RestAssured
                .given()
                .filter(filter)
                .baseUri(BASE_URI)
                .get(path);
        response.then().statusCode(200);
    }

    private static void sendPost(String path) {
        YanoteRestAssuredFilter filter = new YanoteRestAssuredFilter(RUN_ID, SUITE);
        Response response = RestAssured
                .given()
                .filter(filter)
                .baseUri(BASE_URI)
                .contentType("application/json")
                .body("new user")
                .post(path);
        response.then().statusCode(200);
    }
}

package dev.yanote.testtags.restassured;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import io.restassured.RestAssured;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.junit.jupiter.api.Test;

class YanoteRestAssuredFilterTest {

    @Test
    void shouldAddMissingYanoteHeaders() throws IOException {
        Map<String, String> headers = new ConcurrentHashMap<>();
        HttpServer server = startServer(headers);

        try {
            int port = server.getAddress().getPort();
            RestAssured
                    .given()
                    .filter(new YanoteRestAssuredFilter("run-1", "suite-a"))
                    .baseUri("http://127.0.0.1")
                    .port(port)
                    .get("/users/123")
                    .then()
                    .statusCode(200);

            assertEquals("run-1", headers.get("X-Test-Run-Id"));
            assertEquals("suite-a", headers.get("X-Test-Suite"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void shouldNotOverrideExistingYanoteHeaders() throws IOException {
        Map<String, String> headers = new ConcurrentHashMap<>();
        HttpServer server = startServer(headers);

        try {
            int port = server.getAddress().getPort();
            RestAssured
                    .given()
                    .filter(new YanoteRestAssuredFilter("run-1", "suite-a"))
                    .header(YanoteRestAssuredFilter.RUN_ID_HEADER, "existing-run")
                    .header(YanoteRestAssuredFilter.SUITE_HEADER, "existing-suite")
                    .baseUri("http://127.0.0.1")
                    .port(port)
                    .get("/users/123")
                    .then()
                    .statusCode(200);

            assertEquals("existing-run", headers.get("X-Test-Run-Id"));
            assertEquals("existing-suite", headers.get("X-Test-Suite"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void shouldResolveSuiteFromSystemPropertyOnly() {
        String previous = System.getProperty(YanoteRestAssuredFilter.SUITE_PROPERTY);
        try {
            System.setProperty(YanoteRestAssuredFilter.SUITE_PROPERTY, "integration-suite");
            assertEquals("integration-suite", YanoteRestAssuredFilter.resolveSuiteFromSystemProperty());
            assertNull(YanoteRestAssuredFilter.resolveRunIdFromEnv());
        } finally {
            if (previous == null) {
                System.clearProperty(YanoteRestAssuredFilter.SUITE_PROPERTY);
            } else {
                System.setProperty(YanoteRestAssuredFilter.SUITE_PROPERTY, previous);
            }
        }
    }

    private static HttpServer startServer(Map<String, String> capturedHeaders) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/users/123", new HeaderCaptureHandler(capturedHeaders));
        server.start();
        return server;
    }

    private static final class HeaderCaptureHandler implements HttpHandler {

        private final Map<String, String> capturedHeaders;

        HeaderCaptureHandler(Map<String, String> capturedHeaders) {
            this.capturedHeaders = capturedHeaders;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Headers requestHeaders = exchange.getRequestHeaders();
            capturedHeaders.put(YanoteRestAssuredFilter.RUN_ID_HEADER, requestHeaders.getFirst(YanoteRestAssuredFilter.RUN_ID_HEADER));
            capturedHeaders.put(YanoteRestAssuredFilter.SUITE_HEADER, requestHeaders.getFirst(YanoteRestAssuredFilter.SUITE_HEADER));

            byte[] body = "ok".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        }
    }
}

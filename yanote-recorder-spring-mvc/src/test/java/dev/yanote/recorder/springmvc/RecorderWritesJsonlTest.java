package dev.yanote.recorder.springmvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.HttpEvent;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@SpringBootTest(
        classes = {RecorderWritesJsonlTest.TestApp.class, RecorderWritesJsonlTest.TestConfig.class},
        webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.autoconfigure.exclude=dev.yanote.recorder.springmvc.YanoteRecorderAutoConfiguration")
class RecorderWritesJsonlTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Path EVENTS_PATH = Path.of(System.getProperty("java.io.tmpdir"), "yanote-recorder-events.jsonl");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldWritePayloadBearingEventAfterSupportedJsonRequest() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        mockMvc.perform(
                post("/v1/users/123")
                        .header("X-Test-Run-Id", "run-1")
                        .header("X-Test-Suite", "suite-a")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ada"}
                                """)
        )
                .andExpect(status().isCreated())
                .andExpect(content().json("""
                        {"id":"123","name":"Ada"}
                        """));

        HttpEvent event = readSingleEvent();
        assertEquals("POST", event.method());
        assertEquals("/v1/users/{id}", event.route());
        assertEquals("run-1", event.testRunId());
        assertEquals("suite-a", event.testSuite());
        assertEquals(201, event.status());
        assertTrue(event.requestContentType().startsWith(MediaType.APPLICATION_JSON_VALUE));
        assertTrue(event.responseContentType().startsWith(MediaType.APPLICATION_JSON_VALUE));
        assertEquals(PayloadCaptureState.CAPTURED, event.requestBodyState());
        assertNull(event.requestBodyReason());
        assertEquals(PayloadCaptureState.CAPTURED, event.responseBodyState());
        assertNull(event.responseBodyReason());
        assertJsonEquals("""
                {"name":"Ada"}
                """, event.requestBody());
        assertJsonEquals("""
                {"id":"123","name":"Ada"}
                """, event.responseBody());
    }

    @Test
    void shouldMarkPolicyFilteredPayloadOmissionsExplicitly() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        mockMvc.perform(
                post("/v1/notes/123")
                        .header("X-Test-Run-Id", "run-2")
                        .header("X-Test-Suite", "suite-b")
                        .contentType(MediaType.TEXT_PLAIN)
                        .accept(MediaType.TEXT_PLAIN)
                        .content("hello")
        )
                .andExpect(status().isOk())
                .andExpect(content().string("123:hello"));

        HttpEvent event = readSingleEvent();
        assertEquals("POST", event.method());
        assertEquals("/v1/notes/{id}", event.route());
        assertEquals("run-2", event.testRunId());
        assertEquals("suite-b", event.testSuite());
        assertEquals(200, event.status());
        assertTrue(event.requestContentType().startsWith(MediaType.TEXT_PLAIN_VALUE));
        assertTrue(event.responseContentType().startsWith(MediaType.TEXT_PLAIN_VALUE));
        assertNull(event.requestBody());
        assertEquals(PayloadCaptureState.OMITTED, event.requestBodyState());
        assertEquals(PayloadCaptureReason.POLICY_FILTERED, event.requestBodyReason());
        assertNull(event.responseBody());
        assertEquals(PayloadCaptureState.OMITTED, event.responseBodyState());
        assertEquals(PayloadCaptureReason.POLICY_FILTERED, event.responseBodyReason());
    }

    private static HttpEvent readSingleEvent() throws Exception {
        var lines = Files.readAllLines(EVENTS_PATH);
        assertEquals(1, lines.size());
        return OBJECT_MAPPER.readValue(lines.get(0), HttpEvent.class);
    }

    private static void assertJsonEquals(String expectedJson, JsonNode actual) throws Exception {
        assertEquals(OBJECT_MAPPER.readTree(expectedJson), actual);
    }

    @SpringBootApplication
    static class TestApp {

        @RestController
        static class TestController {
            @PostMapping(value = "/v1/users/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
            @ResponseStatus(HttpStatus.CREATED)
            Map<String, Object> createUser(@PathVariable("id") String id, @RequestBody Map<String, Object> requestBody) {
                return Map.of("id", id, "name", requestBody.get("name"));
            }

            @PostMapping(value = "/v1/notes/{id}", consumes = MediaType.TEXT_PLAIN_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
            String echoNote(@PathVariable("id") String id, @RequestBody String body) {
                return id + ":" + body;
            }
        }
    }

    @Configuration
    static class TestConfig {

        @Bean
        RouteTemplateResolver yanoteRouteTemplateResolver() {
            return new RouteTemplateResolver();
        }

        @Bean
        HttpEventRecordingFilter yanoteHttpEventRecordingFilter(RouteTemplateResolver yanoteRouteTemplateResolver) {
            return new HttpEventRecordingFilter(
                    EVENTS_PATH.toString(),
                    null,
                    yanoteRouteTemplateResolver
            );
        }

        @Bean
        FilterRegistrationBean<HttpEventRecordingFilter> yanoteHttpEventRecordingFilterRegistration(HttpEventRecordingFilter filter) {
            FilterRegistrationBean<HttpEventRecordingFilter> registration = new FilterRegistrationBean<>(filter);
            registration.addUrlPatterns("/*");
            registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
            return registration;
        }
    }
}

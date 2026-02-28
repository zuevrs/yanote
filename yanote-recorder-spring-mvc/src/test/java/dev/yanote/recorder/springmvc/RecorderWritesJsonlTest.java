package dev.yanote.recorder.springmvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.HttpEvent;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootTest(
        classes = {RecorderWritesJsonlTest.TestApp.class, RecorderWritesJsonlTest.TestConfig.class},
        webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.autoconfigure.exclude=dev.yanote.recorder.springmvc.YanoteRecorderAutoConfiguration")
class RecorderWritesJsonlTest {

    private static final Path EVENTS_PATH = Path.of(System.getProperty("java.io.tmpdir"), "yanote-recorder-events.jsonl");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldWriteTemplatedEventAfterRequest() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);

        mockMvc.perform(
                get("/v1/users/123")
                        .header("X-Test-Run-Id", "run-1")
                        .header("X-Test-Suite", "suite-a")
                        .contentType(MediaType.TEXT_PLAIN)
        )
                .andExpect(status().isOk())
                .andExpect(content().string("123"));

        List<String> lines = Files.readAllLines(EVENTS_PATH);
        assertEquals(1, lines.size());

        HttpEvent event = new ObjectMapper().readValue(lines.get(0), HttpEvent.class);
        assertEquals("GET", event.method());
        assertEquals("/v1/users/{id}", event.route());
        assertEquals("run-1", event.testRunId());
        assertEquals("suite-a", event.testSuite());
    }

    @SpringBootApplication
    static class TestApp {

        @RestController
        static class TestController {
            @GetMapping("/v1/users/{id}")
            String getUser(@PathVariable("id") String id) {
                return id;
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

package dev.yanote.recorder.springmvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootTest(
        classes = RecorderAutoConfigurationTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@AutoConfigureMockMvc
@ImportAutoConfiguration(YanoteRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=auto-config-service"
})
class RecorderAutoConfigurationTest {

    private static final Path EVENTS_PATH = Path.of(System.getProperty("java.io.tmpdir"), "yanote-autoconfig-recorder-events.jsonl");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext context;

    @DynamicPropertySource
    static void recorderProperties(DynamicPropertyRegistry registry) {
        registry.add("yanote.recorder.events-path", EVENTS_PATH::toString);
    }

    @Test
    void shouldRecordEventViaAutoConfiguration() throws Exception {
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
        assertEquals("auto-config-service", event.service());
        assertTrue(context.containsBean("yanoteHttpEventRecordingFilterRegistration"));
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
}

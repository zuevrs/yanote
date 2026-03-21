package dev.yanote.recorder.springmvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@SpringBootTest(
        classes = RecorderIoFailureDoesNotBreakRequestTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@AutoConfigureMockMvc
@ImportAutoConfiguration(YanoteRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=io-failure-test"
})
class RecorderIoFailureDoesNotBreakRequestTest {

    private static final Path EVENTS_DIR = Path.of(System.getProperty("java.io.tmpdir"), "yanote-recorder-events-dir");

    @Autowired
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void recorderProperties(DynamicPropertyRegistry registry) {
        registry.add("yanote.recorder.events-path", EVENTS_DIR::toString);
    }

    @Test
    void shouldNotFailRequestWhenRecorderCannotWriteEventsFile() throws Exception {
        Files.createDirectories(EVENTS_DIR);

        mockMvc.perform(
                post("/ping")
                        .header("X-Test-Run-Id", "run-1")
                        .header("X-Test-Suite", "suite-a")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"pong"}
                                """)
        )
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        {"message":"pong"}
                        """));
    }

    @SpringBootApplication
    static class TestApp {
        @RestController
        static class TestController {
            @PostMapping(value = "/ping", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
            Map<String, Object> ping(@RequestBody Map<String, Object> requestBody) {
                return Map.of("message", requestBody.get("message"));
            }
        }
    }
}

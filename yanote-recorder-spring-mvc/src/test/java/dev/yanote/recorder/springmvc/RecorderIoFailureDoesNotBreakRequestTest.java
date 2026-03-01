package dev.yanote.recorder.springmvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
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
                get("/ping")
                        .header("X-Test-Run-Id", "run-1")
                        .header("X-Test-Suite", "suite-a")
                        .contentType(MediaType.TEXT_PLAIN)
        )
                .andExpect(status().isOk())
                .andExpect(content().string("pong"));
    }

    @SpringBootApplication
    static class TestApp {
        @RestController
        static class TestController {
            @GetMapping("/ping")
            String ping() {
                return "pong";
            }
        }
    }
}


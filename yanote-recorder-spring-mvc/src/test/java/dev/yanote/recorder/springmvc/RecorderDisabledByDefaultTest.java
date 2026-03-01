package dev.yanote.recorder.springmvc;

import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

@SpringBootTest(
        classes = RecorderDisabledByDefaultTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK
)
@ImportAutoConfiguration(YanoteRecorderAutoConfiguration.class)
class RecorderDisabledByDefaultTest {

    @Autowired
    private ApplicationContext context;

    @Test
    void shouldNotRegisterFilterWhenEnabledPropertyMissing() {
        assertFalse(context.containsBean("yanoteHttpEventRecordingFilter"));
        assertFalse(context.containsBean("yanoteHttpEventRecordingFilterRegistration"));
    }

    @SpringBootApplication
    static class TestApp {
    }
}


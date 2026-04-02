package dev.yanote.recorder.springmvc;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.FilteredClassLoader;
import org.springframework.boot.test.context.runner.ReactiveWebApplicationContextRunner;

class RecorderReactiveCompatibilityTest {

    private final ReactiveWebApplicationContextRunner contextRunner = new ReactiveWebApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(YanoteRecorderAutoConfiguration.class))
            .withPropertyValues(
                    "yanote.recorder.enabled=true",
                    "yanote.recorder.events-path=build/test-reactive-events.jsonl"
            )
            .withClassLoader(new FilteredClassLoader(
                    "jakarta.servlet",
                    "org.springframework.web.servlet",
                    "org.springframework.boot.web.servlet"
            ));

    @Test
    void shouldBackOffCleanlyWhenServletStackIsUnavailable() {
        contextRunner.run((context) -> {
            assertThat(context).hasNotFailed();
            assertThat(context).doesNotHaveBean("yanoteRouteTemplateResolver");
            assertThat(context).doesNotHaveBean("yanoteHttpEventRecordingFilterRegistration");
        });
    }
}

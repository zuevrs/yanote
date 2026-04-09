package dev.yanote.recorder.springwebflux;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.test.context.runner.WebApplicationContextRunner;

class RecorderServletBackoffCompatibilityTest {

    private final WebApplicationContextRunner servletContextRunner = new WebApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(YanoteReactiveRecorderAutoConfiguration.class))
            .withPropertyValues(
                    "yanote.recorder.enabled=true",
                    "yanote.recorder.events-path=build/test-servlet-backoff-events.jsonl"
            );

    private final ApplicationContextRunner nonWebContextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(YanoteReactiveRecorderAutoConfiguration.class))
            .withPropertyValues(
                    "yanote.recorder.enabled=true",
                    "yanote.recorder.events-path=build/test-non-web-backoff-events.jsonl"
            );

    @Test
    void shouldBackOffCleanlyInServletWebApps() {
        servletContextRunner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).doesNotHaveBean(HttpEventRecordingWebFilter.class);
            assertThat(context).doesNotHaveBean(ReactiveRouteTemplateResolver.class);
            assertThat(context).doesNotHaveBean(ReactiveHttpRequestEvidenceCapture.class);
        });
    }

    @Test
    void shouldBackOffCleanlyInNonWebApplicationContexts() {
        nonWebContextRunner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).doesNotHaveBean(HttpEventRecordingWebFilter.class);
            assertThat(context).doesNotHaveBean(ReactiveRouteTemplateResolver.class);
            assertThat(context).doesNotHaveBean(ReactiveHttpRequestEvidenceCapture.class);
        });
    }
}

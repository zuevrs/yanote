package dev.yanote.recorder.springwebflux;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.FilteredClassLoader;
import org.springframework.boot.test.context.runner.ReactiveWebApplicationContextRunner;

class RecorderReactiveAutoConfigurationTest {

    private final ReactiveWebApplicationContextRunner contextRunner = new ReactiveWebApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(YanoteReactiveRecorderAutoConfiguration.class));

    @Test
    void shouldStayDisabledByDefault() {
        contextRunner.run(context -> {
            assertThat(context).doesNotHaveBean(YanoteReactiveRecorderMarker.class);
            assertThat(context).doesNotHaveBean("yanoteReactiveRecorderMarker");
        });
    }

    @Test
    void shouldRegisterMarkerBeanWhenEnabledInReactiveApp() {
        contextRunner.withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.events-path=build/test-webflux-events.jsonl",
                        "yanote.recorder.service-name=reactive-service"
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(YanoteReactiveRecorderMarker.class);
                    YanoteReactiveRecorderMarker marker = context.getBean(YanoteReactiveRecorderMarker.class);
                    assertThat(marker.getEventsPath()).isEqualTo("build/test-webflux-events.jsonl");
                    assertThat(marker.getServiceName()).isEqualTo("reactive-service");
                });
    }

    @Test
    void shouldBackOffCleanlyWhenRequiredReactiveSeamIsUnavailable() {
        contextRunner.withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.events-path=build/test-webflux-events.jsonl"
                )
                .withClassLoader(new FilteredClassLoader("org.springframework.web.server.WebFilter"))
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).doesNotHaveBean(YanoteReactiveRecorderMarker.class);
                    assertThat(context).doesNotHaveBean("yanoteReactiveRecorderMarker");
                });
    }
}

package dev.yanote.recorder.springwebflux;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.FilteredClassLoader;
import org.springframework.boot.test.context.runner.ReactiveWebApplicationContextRunner;
import org.springframework.web.server.WebFilter;

class RecorderReactiveAutoConfigurationTest {

    private final ReactiveWebApplicationContextRunner contextRunner = new ReactiveWebApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(YanoteReactiveRecorderAutoConfiguration.class));

    @Test
    void shouldStayDisabledByDefault() {
        contextRunner.run(context -> {
            assertThat(context).doesNotHaveBean(HttpEventRecordingWebFilter.class);
            assertThat(context).doesNotHaveBean("yanoteHttpEventRecordingWebFilter");
            assertThat(context).doesNotHaveBean(ReactiveRouteTemplateResolver.class);
            assertThat(context).doesNotHaveBean(ReactiveHttpRequestEvidenceCapture.class);
            assertThat(context).doesNotHaveBean(ReactiveHttpPayloadCapture.class);
        });
    }

    @Test
    void shouldRegisterRecorderBeansWhenEnabledInReactiveApp() {
        contextRunner.withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.events-path=build/test-webflux-events.jsonl",
                        "yanote.recorder.service-name=reactive-service"
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(HttpEventRecordingWebFilter.class);
                    assertThat(context).hasSingleBean(ReactiveRouteTemplateResolver.class);
                    assertThat(context).hasSingleBean(ReactiveHttpRequestEvidenceCapture.class);
                    assertThat(context).hasSingleBean(ReactiveHttpPayloadCapture.class);
                    assertThat(context).hasSingleBean(WebFilter.class);
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
                    assertThat(context).doesNotHaveBean(HttpEventRecordingWebFilter.class);
                    assertThat(context).doesNotHaveBean("yanoteHttpEventRecordingWebFilter");
                    assertThat(context).doesNotHaveBean(ReactiveRouteTemplateResolver.class);
                    assertThat(context).doesNotHaveBean(ReactiveHttpRequestEvidenceCapture.class);
                    assertThat(context).doesNotHaveBean(ReactiveHttpPayloadCapture.class);
                });
    }
}

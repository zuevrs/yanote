package dev.yanote.recorder.springwebflux;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

/**
 * Reactive-only auto-configuration for the metadata-only WebFlux recorder path.
 */
@AutoConfiguration(afterName = "org.springframework.boot.autoconfigure.web.reactive.WebFluxAutoConfiguration")
@EnableConfigurationProperties(YanoteReactiveRecorderProperties.class)
@ConditionalOnProperty(prefix = "yanote.recorder", name = "enabled", havingValue = "true", matchIfMissing = false)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.REACTIVE)
@ConditionalOnClass(name = {
        "org.springframework.web.server.WebFilter",
        "org.springframework.web.server.ServerWebExchange",
        "org.springframework.web.reactive.HandlerMapping"
})
public class YanoteReactiveRecorderAutoConfiguration {

    /**
     * Creates the reactive recorder auto-configuration.
     */
    public YanoteReactiveRecorderAutoConfiguration() {
    }

    @Bean
    public ReactiveRouteTemplateResolver yanoteReactiveRouteTemplateResolver() {
        return new ReactiveRouteTemplateResolver();
    }

    /**
     * Registers the reactive request-evidence capture helper.
     *
     * @return reactive request-evidence capture helper
     */
    @Bean
    public ReactiveHttpRequestEvidenceCapture yanoteReactiveHttpRequestEvidenceCapture() {
        return new ReactiveHttpRequestEvidenceCapture();
    }

    /**
     * Registers the metadata-only WebFlux recorder filter.
     *
     * @param properties bound recorder properties
     * @param routeTemplateResolver route-template resolver
     * @param requestEvidenceCapture request-evidence capture helper
     * @return metadata-only WebFlux recorder filter
     */
    @Bean
    public HttpEventRecordingWebFilter yanoteHttpEventRecordingWebFilter(
            YanoteReactiveRecorderProperties properties,
            ReactiveRouteTemplateResolver routeTemplateResolver,
            ReactiveHttpRequestEvidenceCapture requestEvidenceCapture
    ) {
        return new HttpEventRecordingWebFilter(
                properties.getEventsPath(),
                properties.getServiceName(),
                routeTemplateResolver,
                requestEvidenceCapture
        );
    }
}

package dev.yanote.recorder.springwebflux;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

/**
 * Reactive-only auto-configuration skeleton for the future WebFlux recorder path.
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
     * Creates the reactive auto-configuration skeleton.
     */
    public YanoteReactiveRecorderAutoConfiguration() {
    }

    /**
     * Registers a minimal internal marker bean so activation/back-off can be tested safely.
     *
     * @param properties bound reactive recorder properties
     * @return internal marker bean proving activation
     */
    @Bean
    public YanoteReactiveRecorderMarker yanoteReactiveRecorderMarker(YanoteReactiveRecorderProperties properties) {
        return new YanoteReactiveRecorderMarker(properties.getEventsPath(), properties.getServiceName());
    }
}

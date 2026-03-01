package dev.yanote.recorder.springmvc;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;

@AutoConfiguration
@EnableConfigurationProperties(YanoteRecorderProperties.class)
@ConditionalOnProperty(prefix = "yanote.recorder", name = "enabled", havingValue = "true", matchIfMissing = false)
public class YanoteRecorderAutoConfiguration {

    @Bean
    public RouteTemplateResolver yanoteRouteTemplateResolver() {
        return new RouteTemplateResolver();
    }

    @Bean
    public HttpEventRecordingFilter yanoteHttpEventRecordingFilter(
            YanoteRecorderProperties properties,
            RouteTemplateResolver routeTemplateResolver
    ) {
        return new HttpEventRecordingFilter(
                properties.getEventsPath(),
                properties.getServiceName(),
                routeTemplateResolver
        );
    }

    @Bean
    public FilterRegistrationBean<HttpEventRecordingFilter> yanoteHttpEventRecordingFilterRegistration(HttpEventRecordingFilter filter) {
        FilterRegistrationBean<HttpEventRecordingFilter> registration = new FilterRegistrationBean<>(filter);
        registration.addUrlPatterns("/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}

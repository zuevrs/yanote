package dev.yanote.recorder.springactivemq;

import java.nio.file.Path;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.jms.config.AbstractJmsListenerContainerFactory;
import org.springframework.jms.core.JmsTemplate;

@AutoConfiguration(afterName = {
        "org.springframework.boot.autoconfigure.jms.JmsAutoConfiguration",
        "org.springframework.boot.autoconfigure.jms.artemis.ArtemisAutoConfiguration"
})
@ConditionalOnClass(
        value = {JmsTemplate.class, AbstractJmsListenerContainerFactory.class},
        name = "org.apache.activemq.artemis.jms.client.ActiveMQConnectionFactory"
)
@EnableConfigurationProperties(YanoteActiveMqRecorderProperties.class)
@ConditionalOnProperty(prefix = "yanote.recorder", name = "enabled", havingValue = "true", matchIfMissing = false)
public class YanoteActiveMqRecorderAutoConfiguration {

    @Bean
    public YanoteJmsEventRecorder yanoteJmsEventRecorder(YanoteActiveMqRecorderProperties properties) {
        return new YanoteJmsEventRecorder(Path.of(properties.getEventsPath()), properties.getServiceName());
    }

    @Bean
    public YanoteJmsListenerAdvice yanoteJmsListenerAdvice(YanoteJmsEventRecorder recorder) {
        return new YanoteJmsListenerAdvice(recorder);
    }

    @Bean
    public static YanoteJmsInstrumentationBeanPostProcessor yanoteJmsInstrumentationBeanPostProcessor(
            YanoteJmsEventRecorder recorder,
            YanoteJmsListenerAdvice listenerAdvice
    ) {
        return new YanoteJmsInstrumentationBeanPostProcessor(recorder, listenerAdvice);
    }
}

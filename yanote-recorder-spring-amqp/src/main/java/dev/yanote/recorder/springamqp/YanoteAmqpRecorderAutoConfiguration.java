package dev.yanote.recorder.springamqp;

import java.nio.file.Path;
import org.springframework.amqp.rabbit.config.AbstractRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration(after = RabbitAutoConfiguration.class)
@ConditionalOnClass({RabbitTemplate.class, AbstractRabbitListenerContainerFactory.class})
@EnableConfigurationProperties(YanoteAmqpRecorderProperties.class)
@ConditionalOnProperty(prefix = "yanote.recorder", name = "enabled", havingValue = "true", matchIfMissing = false)
public class YanoteAmqpRecorderAutoConfiguration {

    @Bean
    public YanoteAmqpEventRecorder yanoteAmqpEventRecorder(YanoteAmqpRecorderProperties properties) {
        return new YanoteAmqpEventRecorder(Path.of(properties.getEventsPath()), properties.getServiceName());
    }

    @Bean
    public YanoteAmqpOutboundMessagePostProcessor yanoteAmqpOutboundMessagePostProcessor() {
        return new YanoteAmqpOutboundMessagePostProcessor();
    }

    @Bean
    public YanoteAmqpInboundMessagePostProcessor yanoteAmqpInboundMessagePostProcessor() {
        return new YanoteAmqpInboundMessagePostProcessor();
    }

    @Bean
    public YanoteAmqpListenerAdvice yanoteAmqpListenerAdvice(YanoteAmqpEventRecorder recorder) {
        return new YanoteAmqpListenerAdvice(recorder);
    }

    @Bean
    public static YanoteAmqpInstrumentationBeanPostProcessor yanoteAmqpInstrumentationBeanPostProcessor(
            YanoteAmqpEventRecorder recorder,
            YanoteAmqpOutboundMessagePostProcessor outboundMessagePostProcessor,
            YanoteAmqpInboundMessagePostProcessor inboundMessagePostProcessor,
            YanoteAmqpListenerAdvice listenerAdvice
    ) {
        return new YanoteAmqpInstrumentationBeanPostProcessor(
                recorder,
                outboundMessagePostProcessor,
                inboundMessagePostProcessor,
                listenerAdvice
        );
    }
}

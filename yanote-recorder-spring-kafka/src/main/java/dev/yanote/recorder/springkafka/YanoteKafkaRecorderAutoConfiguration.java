package dev.yanote.recorder.springkafka;

import java.nio.file.Path;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.AbstractKafkaListenerContainerFactory;
import org.springframework.kafka.core.KafkaTemplate;

@AutoConfiguration(after = KafkaAutoConfiguration.class)
@ConditionalOnClass({KafkaTemplate.class, AbstractKafkaListenerContainerFactory.class})
@EnableConfigurationProperties(YanoteKafkaRecorderProperties.class)
@ConditionalOnProperty(prefix = "yanote.recorder", name = "enabled", havingValue = "true", matchIfMissing = false)
public class YanoteKafkaRecorderAutoConfiguration {

    @Bean
    public YanoteKafkaEventRecorder yanoteKafkaEventRecorder(YanoteKafkaRecorderProperties properties) {
        return new YanoteKafkaEventRecorder(Path.of(properties.getEventsPath()), properties.getServiceName());
    }

    @Bean
    public YanoteKafkaProducerInterceptor yanoteKafkaProducerInterceptor() {
        return new YanoteKafkaProducerInterceptor();
    }

    @Bean
    public YanoteKafkaProducerListener yanoteKafkaProducerListener(YanoteKafkaEventRecorder recorder) {
        return new YanoteKafkaProducerListener(recorder);
    }

    @Bean
    public YanoteKafkaRecordInterceptor yanoteKafkaRecordInterceptor(YanoteKafkaEventRecorder recorder) {
        return new YanoteKafkaRecordInterceptor(recorder);
    }

    @Bean
    public YanoteKafkaInstrumentationBeanPostProcessor yanoteKafkaInstrumentationBeanPostProcessor(
            YanoteKafkaProducerInterceptor producerInterceptor,
            YanoteKafkaProducerListener producerListener,
            YanoteKafkaRecordInterceptor recordInterceptor
    ) {
        return new YanoteKafkaInstrumentationBeanPostProcessor(producerInterceptor, producerListener, recordInterceptor);
    }
}

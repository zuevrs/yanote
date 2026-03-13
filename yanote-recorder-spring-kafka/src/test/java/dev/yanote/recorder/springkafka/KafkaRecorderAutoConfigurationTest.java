package dev.yanote.recorder.springkafka;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerInterceptor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

class KafkaRecorderAutoConfigurationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(YanoteKafkaRecorderAutoConfiguration.class))
            .withUserConfiguration(TestKafkaConfiguration.class);

    @AfterEach
    void clearContext() {
        YanoteKafkaContextHolder.clear();
    }

    @Test
    void shouldStayDisabledByDefault() {
        contextRunner.run(context -> {
            assertThat(context).doesNotHaveBean(YanoteKafkaEventRecorder.class);
            assertThat(context).doesNotHaveBean(YanoteKafkaInstrumentationBeanPostProcessor.class);
        });
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldAttachProducerAndListenerHooksWhenEnabled() {
        contextRunner
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=auto-config-service"
                )
                .run(context -> {
                    KafkaTemplate<Object, Object> kafkaTemplate = context.getBean(KafkaTemplate.class);
                    ConcurrentKafkaListenerContainerFactory<Object, Object> listenerContainerFactory =
                            context.getBean(ConcurrentKafkaListenerContainerFactory.class);

                    Object producerInterceptor = ReflectionTestUtils.getField(kafkaTemplate, "producerInterceptor");
                    Object producerListener = ReflectionTestUtils.getField(kafkaTemplate, "producerListener");
                    Object recordInterceptor = ReflectionTestUtils.getField(listenerContainerFactory, "recordInterceptor");

                    assertThat(producerInterceptor).isNotNull();
                    assertThat(producerListener).isNotNull();
                    assertThat(recordInterceptor).isNotNull();
                    assertThat(context).hasSingleBean(YanoteKafkaEventRecorder.class);

                    YanoteKafkaContextHolder.set("run-1", "suite-a", "OrderCreated");
                    ProducerRecord<Object, Object> record = new ProducerRecord<>("orders", "payload");
                    ((ProducerInterceptor<Object, Object>) producerInterceptor).onSend(record);

                    assertThat(YanoteKafkaHeaders.readTestRunId(record.headers())).isEqualTo("run-1");
                    assertThat(YanoteKafkaHeaders.readTestSuite(record.headers())).isEqualTo("suite-a");
                    assertThat(YanoteKafkaHeaders.readMessageHint(record.headers())).isEqualTo("OrderCreated");
                });
    }

    @Configuration(proxyBeanMethods = false)
    static class TestKafkaConfiguration {
        @Bean
        ProducerFactory<Object, Object> producerFactory() {
            return new DefaultKafkaProducerFactory<>(Map.of(
                    ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092",
                    ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                    ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class
            ));
        }

        @Bean
        KafkaTemplate<Object, Object> kafkaTemplate(ProducerFactory<Object, Object> producerFactory) {
            return new KafkaTemplate<>(producerFactory);
        }

        @Bean
        ConsumerFactory<Object, Object> consumerFactory() {
            return new DefaultKafkaConsumerFactory<>(Map.of(
                    ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092",
                    ConsumerConfig.GROUP_ID_CONFIG, "yanote-auto-config-test",
                    ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                    ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
                    ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class
            ));
        }

        @Bean
        ConcurrentKafkaListenerContainerFactory<Object, Object> kafkaListenerContainerFactory(
                ConsumerFactory<Object, Object> consumerFactory
        ) {
            ConcurrentKafkaListenerContainerFactory<Object, Object> factory =
                    new ConcurrentKafkaListenerContainerFactory<>();
            factory.setConsumerFactory(consumerFactory);
            return factory;
        }
    }
}

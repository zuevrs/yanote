package dev.yanote.recorder.springkafka;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

@ExtendWith(OutputCaptureExtension.class)
class KafkaRecorderFailurePathTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(YanoteKafkaRecorderAutoConfiguration.class))
            .withUserConfiguration(TestKafkaConfiguration.class);

    @Test
    void shouldWarnAndDropEventsWhenRecordingFails(CapturedOutput output) throws Exception {
        Path eventsDirectory = Files.createTempDirectory("yanote-kafka-recorder-events-dir");

        contextRunner
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.events-path=" + eventsDirectory,
                        "yanote.recorder.service-name=failure-service"
                )
                .run(context -> {
                    YanoteKafkaProducerListener producerListener = context.getBean(YanoteKafkaProducerListener.class);
                    YanoteKafkaRecordInterceptor recordInterceptor = context.getBean(YanoteKafkaRecordInterceptor.class);

                    ProducerRecord<Object, Object> producerRecord = new ProducerRecord<>("orders", "payload");
                    YanoteKafkaHeaders.setHeaders(producerRecord.headers(), "run-1", "suite-a", null);
                    assertThatCode(() -> producerListener.onSuccess(producerRecord, null)).doesNotThrowAnyException();

                    ConsumerRecord<Object, Object> consumerRecord = new ConsumerRecord<>("orders", 0, 0L, null, "payload");
                    YanoteKafkaHeaders.setHeaders(consumerRecord.headers(), "run-1", "suite-a", null);
                    assertThatCode(() -> {
                        recordInterceptor.intercept(consumerRecord, null);
                        recordInterceptor.failure(consumerRecord, new IllegalStateException("boom"), null);
                        recordInterceptor.afterRecord(consumerRecord, null);
                    }).doesNotThrowAnyException();
                });

        assertThat(output.getOut())
                .contains("Failed to write yanote kafka event")
                .contains("dropping event");
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
                    ConsumerConfig.GROUP_ID_CONFIG, "yanote-failure-test",
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

package dev.yanote.recorder.springkafka;

import static org.assertj.core.api.Assertions.assertThat;

import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.KafkaEvent;
import dev.yanote.core.events.YanoteEvent;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerInterceptor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.AbstractKafkaListenerContainerFactory;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.RecordInterceptor;
import org.springframework.kafka.support.ProducerListener;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.ReflectionUtils;

class KafkaRecorderAutoConfigurationTest {

    @AfterEach
    void clearContext() {
        YanoteKafkaContextHolder.clear();
    }

    @Test
    void shouldStayDisabledByDefault() {
        newContextRunner(TestKafkaConfiguration.class).run(context -> {
            assertThat(context).doesNotHaveBean(YanoteKafkaEventRecorder.class);
            assertThat(context).doesNotHaveBean(YanoteKafkaInstrumentationBeanPostProcessor.class);
        });
    }

    @Test
    void shouldFailLoudlyWhenSpringKafkaInternalFieldNamesDrift() {
        assertReflectiveField(
                KafkaTemplate.class,
                "producerInterceptor",
                ProducerInterceptor.class,
                "KafkaTemplate producer interceptor hook"
        );
        assertReflectiveField(
                KafkaTemplate.class,
                "producerListener",
                ProducerListener.class,
                "KafkaTemplate producer listener hook"
        );
        assertReflectiveField(
                AbstractKafkaListenerContainerFactory.class,
                "recordInterceptor",
                RecordInterceptor.class,
                "Kafka listener record interceptor hook"
        );
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldAttachProducerAndListenerHooksWhenEnabled() {
        newContextRunner(TestKafkaConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=auto-config-service"
                )
                .run(context -> {
                    KafkaTemplate<Object, Object> kafkaTemplate = context.getBean(KafkaTemplate.class);
                    ConcurrentKafkaListenerContainerFactory<Object, Object> listenerContainerFactory =
                            context.getBean(ConcurrentKafkaListenerContainerFactory.class);

                    ProducerInterceptor<Object, Object> producerInterceptor =
                            readRequiredField(kafkaTemplate, "producerInterceptor", ProducerInterceptor.class);
                    ProducerListener<Object, Object> producerListener =
                            readRequiredField(kafkaTemplate, "producerListener", ProducerListener.class);
                    RecordInterceptor<Object, Object> recordInterceptor =
                            readRequiredField(listenerContainerFactory, "recordInterceptor", RecordInterceptor.class);

                    assertThat(producerInterceptor).isNotNull();
                    assertThat(producerListener).isNotNull();
                    assertThat(recordInterceptor).isNotNull();
                    assertThat(context).hasSingleBean(YanoteKafkaEventRecorder.class);

                    YanoteKafkaContextHolder.set("run-1", "suite-a", "OrderCreated");
                    ProducerRecord<Object, Object> record = new ProducerRecord<>("orders", "payload");
                    producerInterceptor.onSend(record);

                    assertThat(YanoteKafkaHeaders.readTestRunId(record.headers())).isEqualTo("run-1");
                    assertThat(YanoteKafkaHeaders.readTestSuite(record.headers())).isEqualTo("suite-a");
                    assertThat(YanoteKafkaHeaders.readMessageHint(record.headers())).isNull();
                });
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldComposeExistingKafkaHooksWithoutDroppingRecorderInstrumentation() throws Exception {
        Path eventsPath = Files.createTempFile("yanote-kafka-auto-config-chain-", ".jsonl");
        Files.deleteIfExists(eventsPath);

        newContextRunner(ExistingHooksKafkaConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.events-path=" + eventsPath,
                        "yanote.recorder.service-name=auto-config-service"
                )
                .run(context -> {
                    ExistingHookProbe probe = context.getBean(ExistingHookProbe.class);
                    KafkaTemplate<Object, Object> kafkaTemplate = context.getBean(KafkaTemplate.class);
                    ConcurrentKafkaListenerContainerFactory<Object, Object> listenerContainerFactory =
                            context.getBean(ConcurrentKafkaListenerContainerFactory.class);

                    ProducerInterceptor<Object, Object> producerInterceptor =
                            readRequiredField(kafkaTemplate, "producerInterceptor", ProducerInterceptor.class);
                    ProducerListener<Object, Object> producerListener =
                            readRequiredField(kafkaTemplate, "producerListener", ProducerListener.class);
                    RecordInterceptor<Object, Object> recordInterceptor =
                            readRequiredField(listenerContainerFactory, "recordInterceptor", RecordInterceptor.class);

                    YanoteKafkaContextHolder.set("run-chain", "suite-chain", "OrderCreated");
                    ProducerRecord<Object, Object> sendRecord = new ProducerRecord<>("orders", Map.of("name", "alice"));
                    ProducerRecord<Object, Object> interceptedSendRecord = producerInterceptor.onSend(sendRecord);

                    assertThat(interceptedSendRecord).isSameAs(sendRecord);
                    assertThat(probe.producerInterceptorInvocations.get()).isEqualTo(1);
                    assertThat(YanoteKafkaHeaders.readTestRunId(interceptedSendRecord.headers())).isEqualTo("run-chain");
                    assertThat(YanoteKafkaHeaders.readTestSuite(interceptedSendRecord.headers())).isEqualTo("suite-chain");
                    assertThat(interceptedSendRecord.headers().lastHeader("existing.interceptor")).isNotNull();

                    producerListener.onSuccess(interceptedSendRecord, null);
                    assertThat(probe.producerListenerSuccessInvocations.get()).isEqualTo(1);

                    ConsumerRecord<Object, Object> receiveRecord =
                            new ConsumerRecord<>("orders", 0, 0L, null, Map.of("name", "alice"));
                    receiveRecord.headers().add(new RecordHeader(
                            "existing.header",
                            "present".getBytes(StandardCharsets.UTF_8)
                    ));
                    YanoteKafkaHeaders.setHeaders(receiveRecord.headers(), "run-chain", "suite-chain", "OrderCreated");

                    ConsumerRecord<Object, Object> interceptedReceiveRecord = recordInterceptor.intercept(receiveRecord, null);
                    assertThat(interceptedReceiveRecord).isSameAs(receiveRecord);
                    assertThat(probe.recordInterceptorInvocations.get()).isEqualTo(1);
                    assertThat(YanoteKafkaContextHolder.current())
                            .isEqualTo(new YanoteKafkaContextHolder.YanoteKafkaContext("run-chain", "suite-chain", null));

                    recordInterceptor.success(receiveRecord, null);
                    recordInterceptor.afterRecord(receiveRecord, null);
                    assertThat(probe.afterRecordInvocations.get()).isEqualTo(1);
                    assertThat(YanoteKafkaContextHolder.current()).isNull();
                });

        List<KafkaEvent> events = readKafkaEvents(eventsPath);
        assertThat(events).hasSize(2);
        assertThat(events).extracting(KafkaEvent::action)
                .containsExactly(KafkaEvent.Action.SEND, KafkaEvent.Action.RECEIVE);

        KafkaEvent sendEvent = events.get(0);
        KafkaEvent receiveEvent = events.get(1);

        assertThat(sendEvent.service()).isEqualTo("auto-config-service");
        assertThat(sendEvent.testRunId()).isEqualTo("run-chain");
        assertThat(sendEvent.testSuite()).isEqualTo("suite-chain");
        assertThat(sendEvent.headers()).containsEntry(
                "existing.interceptor",
                new KafkaEvent.HeaderEvidence(
                        KafkaEvent.HeaderCaptureState.CAPTURED,
                        "present",
                        null
                )
        );

        assertThat(receiveEvent.service()).isEqualTo("auto-config-service");
        assertThat(receiveEvent.testRunId()).isEqualTo("run-chain");
        assertThat(receiveEvent.testSuite()).isEqualTo("suite-chain");
        assertThat(receiveEvent.headers()).containsEntry(
                "existing.header",
                new KafkaEvent.HeaderEvidence(
                        KafkaEvent.HeaderCaptureState.CAPTURED,
                        "present",
                        null
                )
        );
    }

    @SafeVarargs
    private static ApplicationContextRunner newContextRunner(Class<?>... userConfigurations) {
        return new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(YanoteKafkaRecorderAutoConfiguration.class))
                .withUserConfiguration(userConfigurations);
    }

    private static void assertReflectiveField(
            Class<?> owner,
            String fieldName,
            Class<?> expectedType,
            String contractLabel
    ) {
        java.lang.reflect.Field field = ReflectionUtils.findField(owner, fieldName);
        assertThat(field)
                .withFailMessage(
                        "Spring Kafka reflective seam drifted: expected %s field '%s' on %s.",
                        contractLabel,
                        fieldName,
                        owner.getName()
                )
                .isNotNull();
        assertThat(field.getType())
                .withFailMessage(
                        "Spring Kafka reflective seam drifted: field '%s' on %s is %s, expected assignable to %s.",
                        fieldName,
                        owner.getName(),
                        field.getType().getName(),
                        expectedType.getName()
                )
                .isAssignableTo(expectedType);
    }

    @SuppressWarnings("unchecked")
    private static <T> T readRequiredField(Object target, String fieldName, Class<T> expectedType) {
        Object value = ReflectionTestUtils.getField(target, fieldName);
        assertThat(value)
                .withFailMessage(
                        "Expected reflective Spring Kafka seam field '%s' to be populated on %s.",
                        fieldName,
                        target.getClass().getName()
                )
                .isNotNull();
        assertThat(value)
                .withFailMessage(
                        "Expected field '%s' on %s to be assignable to %s but was %s.",
                        fieldName,
                        target.getClass().getName(),
                        expectedType.getName(),
                        value.getClass().getName()
                )
                .isInstanceOf(expectedType);
        return (T) value;
    }

    private static List<KafkaEvent> readKafkaEvents(Path eventsPath) throws Exception {
        List<YanoteEvent> events = new EventJsonlReader().read(eventsPath);
        return events.stream().map(KafkaEvent.class::cast).toList();
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

    @Configuration(proxyBeanMethods = false)
    static class ExistingHooksKafkaConfiguration {
        @Bean
        ExistingHookProbe existingHookProbe() {
            return new ExistingHookProbe();
        }

        @Bean
        ProducerFactory<Object, Object> producerFactory() {
            return new DefaultKafkaProducerFactory<>(Map.of(
                    ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092",
                    ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                    ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class
            ));
        }

        @Bean
        ExistingProducerInterceptor existingProducerInterceptor(ExistingHookProbe probe) {
            return new ExistingProducerInterceptor(probe);
        }

        @Bean
        ExistingProducerListener existingProducerListener(ExistingHookProbe probe) {
            return new ExistingProducerListener(probe);
        }

        @Bean
        KafkaTemplate<Object, Object> kafkaTemplate(
                ProducerFactory<Object, Object> producerFactory,
                ExistingProducerInterceptor existingProducerInterceptor,
                ExistingProducerListener existingProducerListener
        ) {
            KafkaTemplate<Object, Object> kafkaTemplate = new KafkaTemplate<>(producerFactory);
            kafkaTemplate.setProducerInterceptor(existingProducerInterceptor);
            kafkaTemplate.setProducerListener(existingProducerListener);
            return kafkaTemplate;
        }

        @Bean
        ConsumerFactory<Object, Object> consumerFactory() {
            return new DefaultKafkaConsumerFactory<>(Map.of(
                    ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092",
                    ConsumerConfig.GROUP_ID_CONFIG, "yanote-auto-config-existing-hooks-test",
                    ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                    ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
                    ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class
            ));
        }

        @Bean
        ExistingRecordInterceptor existingRecordInterceptor(ExistingHookProbe probe) {
            return new ExistingRecordInterceptor(probe);
        }

        @Bean
        ConcurrentKafkaListenerContainerFactory<Object, Object> kafkaListenerContainerFactory(
                ConsumerFactory<Object, Object> consumerFactory,
                ExistingRecordInterceptor existingRecordInterceptor
        ) {
            ConcurrentKafkaListenerContainerFactory<Object, Object> factory =
                    new ConcurrentKafkaListenerContainerFactory<>();
            factory.setConsumerFactory(consumerFactory);
            factory.setRecordInterceptor(existingRecordInterceptor);
            return factory;
        }
    }

    static class ExistingHookProbe {
        private final AtomicInteger producerInterceptorInvocations = new AtomicInteger();
        private final AtomicInteger producerListenerSuccessInvocations = new AtomicInteger();
        private final AtomicInteger recordInterceptorInvocations = new AtomicInteger();
        private final AtomicInteger afterRecordInvocations = new AtomicInteger();
    }

    static final class ExistingProducerInterceptor implements ProducerInterceptor<Object, Object> {
        private final ExistingHookProbe probe;

        ExistingProducerInterceptor(ExistingHookProbe probe) {
            this.probe = probe;
        }

        @Override
        public ProducerRecord<Object, Object> onSend(ProducerRecord<Object, Object> record) {
            probe.producerInterceptorInvocations.incrementAndGet();
            record.headers().add(new RecordHeader("existing.interceptor", "present".getBytes(StandardCharsets.UTF_8)));
            return record;
        }

        @Override
        public void onAcknowledgement(RecordMetadata metadata, Exception exception) {
            // no-op for smoke coverage
        }

        @Override
        public void close() {
            // no-op for smoke coverage
        }

        @Override
        public void configure(Map<String, ?> configs) {
            // no-op for smoke coverage
        }
    }

    static final class ExistingProducerListener implements ProducerListener<Object, Object> {
        private final ExistingHookProbe probe;

        ExistingProducerListener(ExistingHookProbe probe) {
            this.probe = probe;
        }

        @Override
        public void onSuccess(ProducerRecord<Object, Object> producerRecord, RecordMetadata recordMetadata) {
            probe.producerListenerSuccessInvocations.incrementAndGet();
        }
    }

    static final class ExistingRecordInterceptor implements RecordInterceptor<Object, Object> {
        private final ExistingHookProbe probe;

        ExistingRecordInterceptor(ExistingHookProbe probe) {
            this.probe = probe;
        }

        @Override
        public ConsumerRecord<Object, Object> intercept(
                ConsumerRecord<Object, Object> record,
                org.apache.kafka.clients.consumer.Consumer<Object, Object> consumer
        ) {
            probe.recordInterceptorInvocations.incrementAndGet();
            return record;
        }

        @Override
        public void afterRecord(
                ConsumerRecord<Object, Object> record,
                org.apache.kafka.clients.consumer.Consumer<Object, Object> consumer
        ) {
            probe.afterRecordInvocations.incrementAndGet();
        }
    }
}

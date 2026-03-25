package dev.yanote.recorder.springkafka;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.KafkaEvent;
import dev.yanote.core.events.YanoteEvent;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.util.backoff.FixedBackOff;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers
@SpringBootTest(
        classes = KafkaRecorderSingleServiceIntegrationTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE
)
@ImportAutoConfiguration(YanoteKafkaRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=kafka-integration-test",
        "spring.kafka.consumer.auto-offset-reset=earliest",
        "spring.kafka.consumer.group-id=yanote-kafka-integration-group",
        "spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer",
        "spring.kafka.producer.value-serializer=org.apache.kafka.common.serialization.StringSerializer",
        "spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer",
        "spring.kafka.consumer.value-deserializer=org.apache.kafka.common.serialization.StringDeserializer",
        "spring.kafka.producer.properties.delivery.timeout.ms=3000",
        "spring.kafka.producer.properties.request.timeout.ms=1000",
        "spring.kafka.producer.properties.max.block.ms=3000",
        "spring.kafka.producer.retries=0"
})
class KafkaRecorderSingleServiceIntegrationTest {

    private static final String TOPIC = "orders.events";
    private static final Path EVENTS_PATH = Path.of(
            System.getProperty("java.io.tmpdir"),
            "yanote-kafka-single-service-" + UUID.randomUUID() + ".jsonl"
    );

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    @Autowired
    private TestApp.TestProducer producer;

    @Autowired
    private TestApp.ListenerProbe probe;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
        registry.add("yanote.recorder.events-path", EVENTS_PATH::toString);
    }

    @Test
    void shouldRecordSeparateTruthfulSendAndReceiveFacts() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);
        probe.reset();

        producer.send("ok", "run-success", "suite-a", "OrderCreated").get(10, TimeUnit.SECONDS);
        assertThat(probe.awaitSuccess()).isTrue();

        producer.send("boom", "run-failure", "suite-b", null).get(10, TimeUnit.SECONDS);
        assertThat(probe.awaitFailure()).isTrue();

        Awaitility.await()
                .atMost(Duration.ofSeconds(15))
                .untilAsserted(() -> assertThat(readKafkaEvents()).hasSize(4));

        KAFKA.stop();

        CompletableFuture<SendResult<String, String>> failedSend = producer.send("offline", "run-send-failure", "suite-c", null);
        assertThatThrownBy(() -> failedSend.get(15, TimeUnit.SECONDS)).isInstanceOf(Exception.class);

        Awaitility.await()
                .atMost(Duration.ofSeconds(15))
                .untilAsserted(() -> assertThat(readKafkaEvents()).hasSize(5));

        List<KafkaEvent> events = readKafkaEvents();
        assertThat(events).hasSize(5);
        assertThat(events).extracting(KafkaEvent::action)
                .containsExactlyInAnyOrder(
                        KafkaEvent.Action.SEND,
                        KafkaEvent.Action.RECEIVE,
                        KafkaEvent.Action.SEND,
                        KafkaEvent.Action.RECEIVE,
                        KafkaEvent.Action.SEND
                );
        assertThat(events).extracting(KafkaEvent::channel).containsOnly(TOPIC);
        assertThat(events).extracting(KafkaEvent::service).containsOnly("kafka-integration-test");

        KafkaEvent sendSuccess = findEvent(events, "run-success", "suite-a", KafkaEvent.Action.SEND);
        KafkaEvent receiveSuccess = findEvent(events, "run-success", "suite-a", KafkaEvent.Action.RECEIVE);
        KafkaEvent sendBeforeListenerFailure = findEvent(events, "run-failure", "suite-b", KafkaEvent.Action.SEND);
        KafkaEvent receiveFailure = findEvent(events, "run-failure", "suite-b", KafkaEvent.Action.RECEIVE);
        KafkaEvent sendFailure = findEvent(events, "run-send-failure", "suite-c", KafkaEvent.Action.SEND);

        assertThat(sendSuccess.error()).isFalse();
        assertThat(sendSuccess.message()).isEqualTo("OrderCreated");
        assertThat(sendSuccess.payload().asText()).isEqualTo("ok");
        assertThat(sendSuccess.testRunId()).isEqualTo("run-success");
        assertThat(sendSuccess.testSuite()).isEqualTo("suite-a");

        assertThat(receiveSuccess.error()).isFalse();
        assertThat(receiveSuccess.message()).isEqualTo("OrderCreated");
        assertThat(receiveSuccess.payload().asText()).isEqualTo("ok");
        assertThat(receiveSuccess.testRunId()).isEqualTo("run-success");
        assertThat(receiveSuccess.testSuite()).isEqualTo("suite-a");

        assertThat(sendBeforeListenerFailure.error()).isFalse();
        assertThat(sendBeforeListenerFailure.message()).isNull();
        assertThat(sendBeforeListenerFailure.payload().asText()).isEqualTo("boom");
        assertThat(sendBeforeListenerFailure.testRunId()).isEqualTo("run-failure");
        assertThat(sendBeforeListenerFailure.testSuite()).isEqualTo("suite-b");

        assertThat(receiveFailure.error()).isTrue();
        assertThat(receiveFailure.message()).isNull();
        assertThat(receiveFailure.payload().asText()).isEqualTo("boom");
        assertThat(receiveFailure.testRunId()).isEqualTo("run-failure");
        assertThat(receiveFailure.testSuite()).isEqualTo("suite-b");

        assertThat(sendFailure.error()).isTrue();
        assertThat(sendFailure.message()).isNull();
        assertThat(sendFailure.payload().asText()).isEqualTo("offline");
        assertThat(sendFailure.testRunId()).isEqualTo("run-send-failure");
        assertThat(sendFailure.testSuite()).isEqualTo("suite-c");
    }

    private static List<KafkaEvent> readKafkaEvents() throws Exception {
        List<YanoteEvent> events = new EventJsonlReader().read(EVENTS_PATH);
        return events.stream().map(KafkaEvent.class::cast).toList();
    }

    private static KafkaEvent findEvent(
            List<KafkaEvent> events,
            String runId,
            String suite,
            KafkaEvent.Action action
    ) {
        return events.stream()
                .filter(event -> runId.equals(event.testRunId()))
                .filter(event -> suite.equals(event.testSuite()))
                .filter(event -> action == event.action())
                .findFirst()
                .orElseThrow(() -> new AssertionError(
                        "Expected " + action + " event for runId=" + runId + ", suite=" + suite
                ));
    }

    @SpringBootApplication
    @EnableKafka
    static class TestApp {
        @Bean
        NewTopic ordersTopic() {
            return TopicBuilder.name(TOPIC).partitions(1).replicas(1).build();
        }

        @Bean
        ListenerProbe listenerProbe() {
            return new ListenerProbe();
        }

        @Bean
        DefaultErrorHandler kafkaErrorHandler() {
            return new DefaultErrorHandler(new FixedBackOff(0L, 0L));
        }

        @Bean
        TestProducer testProducer(KafkaTemplate<String, String> kafkaTemplate) {
            return new TestProducer(kafkaTemplate);
        }

        @Bean
        TestListener testListener(ListenerProbe listenerProbe) {
            return new TestListener(listenerProbe);
        }

        static class TestProducer {
            private final KafkaTemplate<String, String> kafkaTemplate;

            TestProducer(KafkaTemplate<String, String> kafkaTemplate) {
                this.kafkaTemplate = kafkaTemplate;
            }

            CompletableFuture<SendResult<String, String>> send(
                    String payload,
                    String runId,
                    String suite,
                    String messageHint
            ) {
                ProducerRecord<String, String> record = new ProducerRecord<>(TOPIC, payload);
                YanoteKafkaHeaders.setHeaders(record.headers(), runId, suite, messageHint);
                return kafkaTemplate.send(record);
            }
        }

        static class ListenerProbe {
            private final AtomicReference<CountDownLatch> successLatch = new AtomicReference<>(new CountDownLatch(1));
            private final AtomicReference<CountDownLatch> failureLatch = new AtomicReference<>(new CountDownLatch(1));

            void reset() {
                successLatch.set(new CountDownLatch(1));
                failureLatch.set(new CountDownLatch(1));
            }

            boolean awaitSuccess() throws InterruptedException {
                return successLatch.get().await(10, TimeUnit.SECONDS);
            }

            boolean awaitFailure() throws InterruptedException {
                return failureLatch.get().await(10, TimeUnit.SECONDS);
            }

            void markSuccess() {
                successLatch.get().countDown();
            }

            void markFailure() {
                failureLatch.get().countDown();
            }
        }

        static class TestListener {
            private final ListenerProbe listenerProbe;

            TestListener(ListenerProbe listenerProbe) {
                this.listenerProbe = listenerProbe;
            }

            @KafkaListener(topics = TOPIC)
            void handle(String payload) {
                if ("boom".equals(payload)) {
                    listenerProbe.markFailure();
                    throw new IllegalStateException("listener boom");
                }
                listenerProbe.markSuccess();
            }
        }
    }
}

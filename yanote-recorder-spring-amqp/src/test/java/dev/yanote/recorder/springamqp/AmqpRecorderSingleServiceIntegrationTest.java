package dev.yanote.recorder.springamqp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.yanote.core.events.AmqpEvent;
import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.YanoteEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest(
        classes = AmqpRecorderSingleServiceIntegrationTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE
)
@ImportAutoConfiguration(YanoteAmqpRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=amqp-integration-test",
        "spring.rabbitmq.username=guest",
        "spring.rabbitmq.password=guest",
        "spring.rabbitmq.connection-timeout=2000",
        "spring.rabbitmq.listener.simple.default-requeue-rejected=false",
        "spring.rabbitmq.listener.simple.retry.enabled=false"
})
class AmqpRecorderSingleServiceIntegrationTest {
    private static final String QUEUE = "yanote.amqp.integration.queue";
    private static final Path EVENTS_PATH = Path.of(
            System.getProperty("java.io.tmpdir"),
            "yanote-amqp-single-service-" + UUID.randomUUID() + ".jsonl"
    );

    @Container
    static final RabbitMQContainer RABBITMQ = new RabbitMQContainer("rabbitmq:3.13-management");

    @Autowired
    private TestApp.TestProducer producer;

    @Autowired
    private TestApp.ListenerProbe probe;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", RABBITMQ::getHost);
        registry.add("spring.rabbitmq.port", () -> RABBITMQ.getMappedPort(5672));
        registry.add("yanote.recorder.events-path", EVENTS_PATH::toString);
    }

    @AfterEach
    void clearContext() {
        probe.reset();
        YanoteAmqpListenerState.clear();
        YanoteAmqpSendContextHolder.clear();
    }

    @Test
    void shouldRecordSeparateTruthfulSendReceiveAndErrorFactsAgainstLiveRabbitMq() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);
        probe.reset();

        producer.send("ok", "run-success", "suite-a", "OrderCreated");
        producer.send("boom", "run-failure", "suite-b", "OrderFailed");
        producer.send("plain", null, null, null);

        assertThat(probe.awaitDeliveries()).as("listener deliveries for success/failure/no-metadata paths").isTrue();
        assertThat(probe.awaitFailure()).as("listener failure delivery").isTrue();

        Awaitility.await()
                .atMost(Duration.ofSeconds(20))
                .untilAsserted(() -> assertThat(readAmqpEvents()).hasSize(6));

        TestApp.ListenerObservation successObservation = probe.observation("ok");
        TestApp.ListenerObservation failureObservation = probe.observation("boom");
        TestApp.ListenerObservation noMetadataObservation = probe.observation("plain");

        assertThat(successObservation.testMetadata()).isEqualTo(new TestMetadata("run-success", "suite-a"));
        assertThat(successObservation.messageHint()).isEqualTo("OrderCreated");
        assertThat(successObservation.failure()).isFalse();

        assertThat(failureObservation.testMetadata()).isEqualTo(new TestMetadata("run-failure", "suite-b"));
        assertThat(failureObservation.messageHint()).isEqualTo("OrderFailed");
        assertThat(failureObservation.failure()).isTrue();

        assertThat(noMetadataObservation.testMetadata()).isNull();
        assertThat(noMetadataObservation.messageHint()).isNull();
        assertThat(noMetadataObservation.failure()).isFalse();

        assertThat(YanoteAmqpSendContextHolder.current()).isNull();

        RABBITMQ.stop();

        assertThatThrownBy(() -> producer.send("offline", "run-send-failure", "suite-c", "BrokerDown"))
                .isInstanceOf(AmqpException.class);
        assertThat(YanoteAmqpSendContextHolder.current()).isNull();

        Awaitility.await()
                .atMost(Duration.ofSeconds(20))
                .untilAsserted(() -> assertThat(readAmqpEvents()).hasSize(7));

        List<AmqpEvent> events = readAmqpEvents();
        assertThat(events).hasSize(7);
        assertThat(events).extracting(AmqpEvent::action)
                .containsExactlyInAnyOrder(
                        AmqpEvent.Action.SEND,
                        AmqpEvent.Action.RECEIVE,
                        AmqpEvent.Action.SEND,
                        AmqpEvent.Action.RECEIVE,
                        AmqpEvent.Action.SEND,
                        AmqpEvent.Action.RECEIVE,
                        AmqpEvent.Action.SEND
                );
        assertThat(events).extracting(AmqpEvent::channel).containsOnly(QUEUE);
        assertThat(events).extracting(AmqpEvent::service).containsOnly("amqp-integration-test");

        AmqpEvent sendSuccess = findEvent(events, "run-success", "suite-a", AmqpEvent.Action.SEND);
        AmqpEvent receiveSuccess = findEvent(events, "run-success", "suite-a", AmqpEvent.Action.RECEIVE);
        AmqpEvent sendBeforeListenerFailure = findEvent(events, "run-failure", "suite-b", AmqpEvent.Action.SEND);
        AmqpEvent receiveFailure = findEvent(events, "run-failure", "suite-b", AmqpEvent.Action.RECEIVE);
        AmqpEvent sendFailure = findEvent(events, "run-send-failure", "suite-c", AmqpEvent.Action.SEND);
        AmqpEvent sendNoMetadata = findNoMetadataEvent(events, AmqpEvent.Action.SEND);
        AmqpEvent receiveNoMetadata = findNoMetadataEvent(events, AmqpEvent.Action.RECEIVE);

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
        assertThat(sendBeforeListenerFailure.message()).isEqualTo("OrderFailed");
        assertThat(sendBeforeListenerFailure.payload().asText()).isEqualTo("boom");
        assertThat(sendBeforeListenerFailure.testRunId()).isEqualTo("run-failure");
        assertThat(sendBeforeListenerFailure.testSuite()).isEqualTo("suite-b");

        assertThat(receiveFailure.error()).isTrue();
        assertThat(receiveFailure.message()).isEqualTo("OrderFailed");
        assertThat(receiveFailure.payload().asText()).isEqualTo("boom");
        assertThat(receiveFailure.testRunId()).isEqualTo("run-failure");
        assertThat(receiveFailure.testSuite()).isEqualTo("suite-b");

        assertThat(sendNoMetadata.error()).isFalse();
        assertThat(sendNoMetadata.message()).isNull();
        assertThat(sendNoMetadata.payload().asText()).isEqualTo("plain");
        assertThat(sendNoMetadata.testRunId()).isNull();
        assertThat(sendNoMetadata.testSuite()).isNull();

        assertThat(receiveNoMetadata.error()).isFalse();
        assertThat(receiveNoMetadata.message()).isNull();
        assertThat(receiveNoMetadata.payload().asText()).isEqualTo("plain");
        assertThat(receiveNoMetadata.testRunId()).isNull();
        assertThat(receiveNoMetadata.testSuite()).isNull();

        assertThat(sendFailure.error()).isTrue();
        assertThat(sendFailure.message()).isEqualTo("BrokerDown");
        assertThat(sendFailure.payload().asText()).isEqualTo("offline");
        assertThat(sendFailure.testRunId()).isEqualTo("run-send-failure");
        assertThat(sendFailure.testSuite()).isEqualTo("suite-c");
    }

    private static List<AmqpEvent> readAmqpEvents() throws Exception {
        List<YanoteEvent> events = new EventJsonlReader().read(EVENTS_PATH);
        return events.stream().map(AmqpEvent.class::cast).toList();
    }

    private static AmqpEvent findEvent(
            List<AmqpEvent> events,
            String runId,
            String suite,
            AmqpEvent.Action action
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

    private static AmqpEvent findNoMetadataEvent(List<AmqpEvent> events, AmqpEvent.Action action) {
        return events.stream()
                .filter(event -> event.testRunId() == null)
                .filter(event -> event.testSuite() == null)
                .filter(event -> action == event.action())
                .findFirst()
                .orElseThrow(() -> new AssertionError("Expected metadata-free " + action + " event"));
    }

    @SpringBootApplication
    @EnableRabbit
    static class TestApp {
        @Bean
        Queue ordersQueue() {
            return new Queue(QUEUE, false, false, true);
        }

        @Bean
        ListenerProbe listenerProbe() {
            return new ListenerProbe();
        }

        @Bean
        TestProducer testProducer(RabbitTemplate rabbitTemplate) {
            return new TestProducer(rabbitTemplate);
        }

        @Bean
        TestListener testListener(ListenerProbe listenerProbe) {
            return new TestListener(listenerProbe);
        }

        static class TestProducer {
            private final RabbitTemplate rabbitTemplate;

            TestProducer(RabbitTemplate rabbitTemplate) {
                this.rabbitTemplate = rabbitTemplate;
            }

            void send(String payload, String runId, String suite, String messageHint) {
                MessageProperties properties = new MessageProperties();
                properties.setContentType(MessageProperties.CONTENT_TYPE_TEXT_PLAIN);
                YanoteAmqpHeaders.setHeaders(properties, runId, suite, messageHint);
                Message message = new Message(payload.getBytes(StandardCharsets.UTF_8), properties);
                rabbitTemplate.send("", QUEUE, message);
            }
        }

        static class ListenerProbe {
            private final Map<String, ListenerObservation> observations = new ConcurrentHashMap<>();
            private final AtomicReference<CountDownLatch> deliveryLatch = new AtomicReference<>(new CountDownLatch(3));
            private final AtomicReference<CountDownLatch> failureLatch = new AtomicReference<>(new CountDownLatch(1));

            void reset() {
                observations.clear();
                deliveryLatch.set(new CountDownLatch(3));
                failureLatch.set(new CountDownLatch(1));
            }

            void record(String payload, TestMetadata testMetadata, String messageHint, boolean failure) {
                observations.put(payload, new ListenerObservation(payload, testMetadata, messageHint, failure));
                deliveryLatch.get().countDown();
                if (failure) {
                    failureLatch.get().countDown();
                }
            }

            boolean awaitDeliveries() throws InterruptedException {
                return deliveryLatch.get().await(15, TimeUnit.SECONDS);
            }

            boolean awaitFailure() throws InterruptedException {
                return failureLatch.get().await(15, TimeUnit.SECONDS);
            }

            ListenerObservation observation(String payload) {
                ListenerObservation observation = observations.get(payload);
                if (observation == null) {
                    throw new AssertionError("Expected listener observation for payload=" + payload);
                }
                return observation;
            }
        }

        record ListenerObservation(String payload, TestMetadata testMetadata, String messageHint, boolean failure) {
        }

        static class TestListener {
            private final ListenerProbe listenerProbe;

            TestListener(ListenerProbe listenerProbe) {
                this.listenerProbe = listenerProbe;
            }

            @RabbitListener(queues = QUEUE)
            void handle(Message message) {
                String payload = new String(message.getBody(), StandardCharsets.UTF_8);
                listenerProbe.record(
                        payload,
                        dev.yanote.core.testmetadata.TestMetadataContextHolder.current(),
                        YanoteAmqpHeaders.readMessageHint(message.getMessageProperties()),
                        "boom".equals(payload)
                );
                if ("boom".equals(payload)) {
                    throw new IllegalStateException("listener boom");
                }
            }
        }
    }
}

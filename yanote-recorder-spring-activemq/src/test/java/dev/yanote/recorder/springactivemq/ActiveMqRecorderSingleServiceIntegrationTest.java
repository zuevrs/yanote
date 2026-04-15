package dev.yanote.recorder.springactivemq;

import static org.assertj.core.api.Assertions.assertThat;

import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.JmsEvent;
import dev.yanote.core.events.YanoteEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(
        classes = ActiveMqRecorderSingleServiceIntegrationTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE
)
@ImportAutoConfiguration(YanoteActiveMqRecorderAutoConfiguration.class)
@TestPropertySource(properties = {
        "yanote.recorder.enabled=true",
        "yanote.recorder.service-name=activemq-integration-test",
        "spring.artemis.mode=embedded",
        "spring.artemis.embedded.enabled=true",
        "spring.artemis.embedded.persistent=false",
        "spring.artemis.embedded.queues=yanote.jms.integration.queue"
})
class ActiveMqRecorderSingleServiceIntegrationTest {
    private static final String QUEUE = "yanote.jms.integration.queue";
    private static final String RUN_ID = "run-jms-live";
    private static final String SUITE = "suite-jms-live";
    private static final String MESSAGE_HINT = "OrderCreated";
    private static final String JMS_TYPE = "OrderCreatedType";
    private static final String CORRELATION_ID = "corr-jms-live-1";
    private static final String REPLY_TO = QUEUE;
    private static final String SAFE_PROPERTY = "tenant";
    private static final String SAFE_VALUE = "tenant-a";
    private static final String SECRET_PROPERTY = "authorization";
    private static final String SECRET_VALUE = "Bearer top-secret-token";
    private static final Path EVENTS_PATH = Path.of(java.util.Optional.ofNullable(System.getenv("YANOTE_ACTIVEMQ_EVENTS_PATH"))
            .orElseGet(() -> System.getProperty(
                    "yanote.activemq.events-path",
                    Path.of(
                            System.getProperty("java.io.tmpdir"),
                            "yanote-activemq-single-service-" + UUID.randomUUID() + ".jsonl"
                    ).toString()
            )));

    @Autowired
    private TestApp.TestProducer producer;

    @Autowired
    private TestApp.ListenerProbe probe;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("yanote.recorder.events-path", EVENTS_PATH::toString);
    }

    @AfterEach
    void clearContext() {
        probe.reset();
        YanoteJmsListenerState.clear();
        YanoteJmsSendContextHolder.clear();
        TestMetadataContextHolder.clear();
    }

    @Test
    void shouldRecordTruthfulSendAndReceiveFactsAgainstEmbeddedArtemis() throws Exception {
        Files.deleteIfExists(EVENTS_PATH);
        probe.reset();

        producer.send("{\"orderId\":\"ord-jms-1\",\"status\":\"created\"}");
        assertThat(probe.awaitDelivery()).isTrue();

        Awaitility.await()
                .atMost(Duration.ofSeconds(20))
                .untilAsserted(() -> assertThat(readJmsEvents()).hasSize(2));

        TestApp.ListenerObservation observation = probe.observation();
        assertThat(observation.payload()).isEqualTo("{\"orderId\":\"ord-jms-1\",\"status\":\"created\"}");
        assertThat(observation.testMetadata()).isEqualTo(new TestMetadata(RUN_ID, SUITE));
        assertThat(observation.messageHint()).isEqualTo(MESSAGE_HINT);

        List<JmsEvent> events = readJmsEvents();
        assertThat(events).hasSize(2);
        assertThat(events).extracting(JmsEvent::action)
                .containsExactlyInAnyOrder(JmsEvent.Action.SEND, JmsEvent.Action.RECEIVE);
        assertThat(events).extracting(JmsEvent::channel).containsOnly(QUEUE);
        assertThat(events).extracting(JmsEvent::service).containsOnly("activemq-integration-test");

        JmsEvent sendEvent = findEvent(events, JmsEvent.Action.SEND);
        JmsEvent receiveEvent = findEvent(events, JmsEvent.Action.RECEIVE);

        assertCommonEvent(sendEvent, false);
        assertCommonEvent(receiveEvent, false);

        assertThat(sendEvent.payload().get("orderId").asText()).isEqualTo("ord-jms-1");
        assertThat(receiveEvent.payload().get("status").asText()).isEqualTo("created");

        String rawJsonl = Files.readString(EVENTS_PATH);
        assertThat(rawJsonl).doesNotContain(SECRET_VALUE);
    }

    private static void assertCommonEvent(JmsEvent event, boolean error) {
        assertThat(event.error()).isEqualTo(error);
        assertThat(event.channel()).isEqualTo(QUEUE);
        assertThat(event.message()).isEqualTo(MESSAGE_HINT);
        assertThat(event.testRunId()).isEqualTo(RUN_ID);
        assertThat(event.testSuite()).isEqualTo(SUITE);
        assertThat(event.headers()).containsEntry(
                "JMSCorrelationID",
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, CORRELATION_ID, null)
        );
        assertThat(event.headers()).containsEntry(
                "JMSReplyTo",
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, REPLY_TO, null)
        );
        assertThat(event.headers()).containsEntry(
                "JMSType",
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, JMS_TYPE, null)
        );
        assertThat(event.headers()).containsEntry(
                YanoteJmsHeaders.MESSAGE_HINT,
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, MESSAGE_HINT, null)
        );
        assertThat(event.headers()).containsEntry(
                YanoteJmsHeaders.TEST_RUN_ID,
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, RUN_ID, null)
        );
        assertThat(event.headers()).containsEntry(
                YanoteJmsHeaders.TEST_SUITE,
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, SUITE, null)
        );
        assertThat(event.headers()).containsEntry(
                SAFE_PROPERTY,
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, SAFE_VALUE, null)
        );
        assertThat(event.headers()).containsEntry(
                SECRET_PROPERTY,
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.REDACTED, null, JmsEvent.HeaderCaptureReason.SENSITIVE)
        );
    }

    private static List<JmsEvent> readJmsEvents() throws Exception {
        List<YanoteEvent> events = new EventJsonlReader().read(EVENTS_PATH);
        return events.stream().map(JmsEvent.class::cast).toList();
    }

    private static JmsEvent findEvent(List<JmsEvent> events, JmsEvent.Action action) {
        return events.stream()
                .filter(event -> action == event.action())
                .findFirst()
                .orElseThrow(() -> new AssertionError("Expected " + action + " event"));
    }

    @SpringBootApplication
    @EnableJms
    static class TestApp {
        @Bean
        ListenerProbe listenerProbe() {
            return new ListenerProbe();
        }

        @Bean
        TestProducer testProducer(JmsTemplate jmsTemplate) {
            return new TestProducer(jmsTemplate);
        }

        @Bean
        TestListener testListener(ListenerProbe listenerProbe) {
            return new TestListener(listenerProbe);
        }

        static class TestProducer {
            private final JmsTemplate jmsTemplate;

            TestProducer(JmsTemplate jmsTemplate) {
                this.jmsTemplate = jmsTemplate;
            }

            void send(String payload) {
                jmsTemplate.send(QUEUE, session -> {
                    jakarta.jms.TextMessage message = session.createTextMessage(payload);
                    YanoteJmsHeaders.setHeaders(message, RUN_ID, SUITE, MESSAGE_HINT);
                    message.setJMSCorrelationID(CORRELATION_ID);
                    message.setJMSReplyTo(session.createQueue(REPLY_TO));
                    message.setJMSType(JMS_TYPE);
                    message.setStringProperty(SAFE_PROPERTY, SAFE_VALUE);
                    message.setStringProperty(SECRET_PROPERTY, SECRET_VALUE);
                    return message;
                });
            }
        }

        static class ListenerProbe {
            private final AtomicReference<CountDownLatch> deliveryLatch = new AtomicReference<>(new CountDownLatch(1));
            private final AtomicReference<ListenerObservation> observation = new AtomicReference<>();

            void reset() {
                deliveryLatch.set(new CountDownLatch(1));
                observation.set(null);
            }

            void record(String payload, TestMetadata testMetadata, String messageHint) {
                observation.set(new ListenerObservation(payload, testMetadata, messageHint));
                deliveryLatch.get().countDown();
            }

            boolean awaitDelivery() throws InterruptedException {
                return deliveryLatch.get().await(20, TimeUnit.SECONDS);
            }

            ListenerObservation observation() {
                ListenerObservation current = observation.get();
                if (current == null) {
                    throw new AssertionError("Expected listener observation");
                }
                return current;
            }
        }

        record ListenerObservation(String payload, TestMetadata testMetadata, String messageHint) {
        }

        static class TestListener {
            private final ListenerProbe listenerProbe;

            TestListener(ListenerProbe listenerProbe) {
                this.listenerProbe = listenerProbe;
            }

            @JmsListener(destination = QUEUE)
            void handle(jakarta.jms.Message message) throws Exception {
                String payload = ((jakarta.jms.TextMessage) message).getText();
                listenerProbe.record(
                        payload,
                        TestMetadataContextHolder.current(),
                        YanoteJmsHeaders.readMessageHint(message)
                );
            }
        }
    }
}

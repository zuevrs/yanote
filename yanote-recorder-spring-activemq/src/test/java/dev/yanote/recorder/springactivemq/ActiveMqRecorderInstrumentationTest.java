package dev.yanote.recorder.springactivemq;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.JmsEvent;
import dev.yanote.core.events.YanoteEvent;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import jakarta.jms.Connection;
import jakarta.jms.ConnectionFactory;
import jakarta.jms.JMSException;
import jakarta.jms.Message;
import jakarta.jms.MessageListener;
import jakarta.jms.MessageProducer;
import jakarta.jms.Queue;
import jakarta.jms.Session;
import jakarta.jms.TextMessage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.config.SimpleJmsListenerEndpoint;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.listener.AbstractMessageListenerContainer;

class ActiveMqRecorderInstrumentationTest {

    @AfterEach
    void clearMetadataContext() {
        TestMetadataContextHolder.clear();
        YanoteJmsListenerState.clear();
        YanoteJmsSendContextHolder.clear();
    }

    @Test
    void shouldRecordConvertAndSendThroughInstrumentedJmsTemplate() throws Exception {
        Path eventsPath = Files.createTempFile("yanote-jms-send-", ".jsonl");
        Files.deleteIfExists(eventsPath);

        newContextRunner(TestJmsConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=instrumented-jms-service",
                        "yanote.recorder.events-path=" + eventsPath
                )
                .run(context -> {
                    JmsTemplate jmsTemplate = context.getBean(JmsTemplate.class);
                    TestMetadataContextHolder.set("run-send", "suite-send");
                    try {
                        jmsTemplate.convertAndSend("orders.queue", "payload");
                    } finally {
                        TestMetadataContextHolder.clear();
                    }
                });

        List<JmsEvent> events = readJmsEvents(eventsPath);
        assertThat(events).hasSize(1);
        JmsEvent event = events.getFirst();
        assertThat(event.action()).isEqualTo(JmsEvent.Action.SEND);
        assertThat(event.channel()).isEqualTo("orders.queue");
        assertThat(event.payload().asText()).isEqualTo("payload");
        assertThat(event.testRunId()).isEqualTo("run-send");
        assertThat(event.testSuite()).isEqualTo("suite-send");
        assertThat(event.service()).isEqualTo("instrumented-jms-service");
        assertThat(event.error()).isFalse();
        assertThat(event.headers()).containsEntry(
                YanoteJmsHeaders.TEST_RUN_ID,
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, "run-send", null)
        );
        assertThat(event.headers()).containsEntry(
                YanoteJmsHeaders.TEST_SUITE,
                new JmsEvent.HeaderEvidence(JmsEvent.HeaderCaptureState.CAPTURED, "suite-send", null)
        );
    }

    @Test
    void shouldRecordSendFailureThroughInstrumentedJmsTemplate() throws Exception {
        Path eventsPath = Files.createTempFile("yanote-jms-send-failure-", ".jsonl");
        Files.deleteIfExists(eventsPath);

        newContextRunner(FailingSendJmsConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=instrumented-jms-service",
                        "yanote.recorder.events-path=" + eventsPath
                )
                .run(context -> {
                    JmsTemplate jmsTemplate = context.getBean(JmsTemplate.class);
                    TestMetadataContextHolder.set("run-send-failure", "suite-send-failure");
                    try {
                        assertThatThrownBy(() -> jmsTemplate.send("orders.queue", session -> session.createTextMessage("offline")))
                                .isInstanceOf(org.springframework.jms.JmsException.class);
                    } finally {
                        TestMetadataContextHolder.clear();
                    }
                });

        List<JmsEvent> events = readJmsEvents(eventsPath);
        assertThat(events).hasSize(1);
        JmsEvent event = events.getFirst();
        assertThat(event.action()).isEqualTo(JmsEvent.Action.SEND);
        assertThat(event.channel()).isEqualTo("orders.queue");
        assertThat(event.payload().asText()).isEqualTo("offline");
        assertThat(event.testRunId()).isEqualTo("run-send-failure");
        assertThat(event.testSuite()).isEqualTo("suite-send-failure");
        assertThat(event.error()).isTrue();
    }

    @Test
    void shouldRecordReceiveThroughInstrumentedListenerContainer() throws Exception {
        Path eventsPath = Files.createTempFile("yanote-jms-receive-", ".jsonl");
        Files.deleteIfExists(eventsPath);

        newContextRunner(TestJmsConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=instrumented-jms-service",
                        "yanote.recorder.events-path=" + eventsPath
                )
                .run(context -> {
                    AbstractMessageListenerContainer container = createContainer(context, message -> {
                        // no-op
                    });
                    MessageListener listener = (MessageListener) container.getMessageListener();
                    listener.onMessage(TestJmsConfiguration.newIncomingMessage("payload", "orders.queue", "run-receive", "suite-receive"));
                });

        List<JmsEvent> events = readJmsEvents(eventsPath);
        assertThat(events).hasSize(1);
        JmsEvent event = events.getFirst();
        assertThat(event.action()).isEqualTo(JmsEvent.Action.RECEIVE);
        assertThat(event.channel()).isEqualTo("orders.queue");
        assertThat(event.payload().asText()).isEqualTo("payload");
        assertThat(event.testRunId()).isEqualTo("run-receive");
        assertThat(event.testSuite()).isEqualTo("suite-receive");
        assertThat(event.service()).isEqualTo("instrumented-jms-service");
        assertThat(event.error()).isFalse();
    }

    @Test
    void shouldRecordListenerFailureThroughInstrumentedListenerContainer() throws Exception {
        Path eventsPath = Files.createTempFile("yanote-jms-receive-failure-", ".jsonl");
        Files.deleteIfExists(eventsPath);

        newContextRunner(TestJmsConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=instrumented-jms-service",
                        "yanote.recorder.events-path=" + eventsPath
                )
                .run(context -> {
                    AbstractMessageListenerContainer container = createContainer(context, message -> {
                        throw new IllegalStateException("listener boom");
                    });
                    MessageListener listener = (MessageListener) container.getMessageListener();
                    assertThatThrownBy(() -> listener.onMessage(
                            TestJmsConfiguration.newIncomingMessage("boom", "orders.queue", "run-receive-failure", "suite-receive-failure")
                    )).isInstanceOf(IllegalStateException.class);
                });

        List<JmsEvent> events = readJmsEvents(eventsPath);
        assertThat(events).hasSize(1);
        JmsEvent event = events.getFirst();
        assertThat(event.action()).isEqualTo(JmsEvent.Action.RECEIVE);
        assertThat(event.channel()).isEqualTo("orders.queue");
        assertThat(event.payload().asText()).isEqualTo("boom");
        assertThat(event.testRunId()).isEqualTo("run-receive-failure");
        assertThat(event.testSuite()).isEqualTo("suite-receive-failure");
        assertThat(event.error()).isTrue();
    }

    private static ApplicationContextRunner newContextRunner(Class<?>... userConfigurations) {
        return new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(YanoteActiveMqRecorderAutoConfiguration.class))
                .withUserConfiguration(userConfigurations);
    }

    private static AbstractMessageListenerContainer createContainer(org.springframework.boot.test.context.assertj.AssertableApplicationContext context, MessageListener listener) {
        DefaultJmsListenerContainerFactory listenerContainerFactory = context.getBean(DefaultJmsListenerContainerFactory.class);
        return listenerContainerFactory.createListenerContainer(endpoint(listener));
    }

    private static SimpleJmsListenerEndpoint endpoint(MessageListener listener) {
        SimpleJmsListenerEndpoint endpoint = new SimpleJmsListenerEndpoint();
        endpoint.setId("yanote-jms-endpoint");
        endpoint.setDestination("orders.queue");
        endpoint.setMessageListener(listener);
        return endpoint;
    }

    private static List<JmsEvent> readJmsEvents(Path eventsPath) throws Exception {
        List<YanoteEvent> events = new EventJsonlReader().read(eventsPath);
        return events.stream().map(JmsEvent.class::cast).toList();
    }

    @Configuration(proxyBeanMethods = false)
    static class TestJmsConfiguration {
        @Bean
        ConnectionFactory connectionFactory() throws Exception {
            return newConnectionFactory(false);
        }

        @Bean
        JmsTemplate jmsTemplate(ConnectionFactory connectionFactory) {
            return new JmsTemplate(connectionFactory);
        }

        @Bean
        DefaultJmsListenerContainerFactory jmsListenerContainerFactory(ConnectionFactory connectionFactory) {
            DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
            factory.setConnectionFactory(connectionFactory);
            return factory;
        }

        static TextMessage newIncomingMessage(String payload, String queueName, String runId, String suite) throws Exception {
            TextMessage textMessage = newTextMessage(payload, queueName);
            textMessage.setStringProperty(YanoteJmsHeaders.TEST_RUN_ID, runId);
            textMessage.setStringProperty(YanoteJmsHeaders.TEST_SUITE, suite);
            return textMessage;
        }

        static ConnectionFactory newConnectionFactory(boolean failOnSend) throws Exception {
            ConnectionFactory connectionFactory = mock(ConnectionFactory.class);
            Connection connection = mock(Connection.class);
            Session session = mock(Session.class);
            MessageProducer producer = mock(MessageProducer.class);

            when(connectionFactory.createConnection()).thenReturn(connection);
            when(connection.createSession(anyBoolean(), anyInt())).thenReturn(session);
            when(connection.createSession(anyInt())).thenReturn(session);
            when(connection.createSession()).thenReturn(session);
            when(session.createQueue(anyString())).thenAnswer(invocation -> queue(invocation.getArgument(0, String.class)));
            when(session.createProducer(any())).thenReturn(producer);
            when(session.createTextMessage(anyString())).thenAnswer(invocation -> newTextMessage(
                    invocation.getArgument(0, String.class),
                    "orders.queue"
            ));
            if (failOnSend) {
                doThrow(new JMSException("broker down")).when(producer).send(any(Message.class));
            }
            return connectionFactory;
        }

        private static TextMessage newTextMessage(String payload, String queueName) throws Exception {
            TextMessage message = mock(TextMessage.class);
            Map<String, Object> properties = new LinkedHashMap<>();
            Queue queue = queue(queueName);
            when(message.getText()).thenReturn(payload);
            when(message.getJMSDestination()).thenReturn(queue);
            when(message.getPropertyNames()).thenAnswer(invocation -> java.util.Collections.enumeration(new ArrayList<>(properties.keySet())));
            when(message.propertyExists(anyString())).thenAnswer(invocation -> properties.containsKey(invocation.getArgument(0, String.class)));
            when(message.getStringProperty(anyString())).thenAnswer(invocation -> {
                Object value = properties.get(invocation.getArgument(0, String.class));
                return value instanceof String ? (String) value : null;
            });
            when(message.getObjectProperty(anyString())).thenAnswer(invocation -> properties.get(invocation.getArgument(0, String.class)));
            doAnswer(invocation -> {
                properties.put(invocation.getArgument(0, String.class), invocation.getArgument(1, String.class));
                return null;
            }).when(message).setStringProperty(anyString(), anyString());
            return message;
        }

        private static Queue queue(String name) throws Exception {
            Queue queue = mock(Queue.class);
            when(queue.getQueueName()).thenReturn(name);
            return queue;
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class FailingSendJmsConfiguration extends TestJmsConfiguration {
        @Bean
        @Override
        ConnectionFactory connectionFactory() throws Exception {
            return newConnectionFactory(true);
        }
    }
}

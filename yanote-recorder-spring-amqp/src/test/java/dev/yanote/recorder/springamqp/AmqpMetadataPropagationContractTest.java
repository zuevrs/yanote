package dev.yanote.recorder.springamqp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.AmqpEvent;
import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import dev.yanote.core.events.YanoteEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import java.lang.reflect.AccessibleObject;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.aopalliance.intercept.MethodInvocation;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class AmqpMetadataPropagationContractTest {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @TempDir
    Path tempDir;

    @AfterEach
    void clearContext() {
        TestMetadataContextHolder.clear();
        YanoteAmqpListenerState.clear();
        YanoteAmqpSendContextHolder.clear();
    }

    @Test
    void shouldPreferExplicitOutboundHeadersOverAmbientContext() {
        TestMetadataContextHolder.set("ambient-run", "ambient-suite");
        Message message = message("payload", "orders.events", null, "ExplicitMessage");
        YanoteAmqpHeaders.setHeaders(message.getMessageProperties(), "explicit-run", "explicit-suite", "ExplicitMessage");

        new YanoteAmqpOutboundMessagePostProcessor().postProcessMessage(message);

        assertThat(YanoteAmqpHeaders.readTestRunId(message.getMessageProperties())).isEqualTo("explicit-run");
        assertThat(YanoteAmqpHeaders.readTestSuite(message.getMessageProperties())).isEqualTo("explicit-suite");
        assertThat(YanoteAmqpHeaders.readMessageHint(message.getMessageProperties())).isEqualTo("ExplicitMessage");
    }

    @Test
    void shouldOnlyAutoPropagateSuiteAndRun() {
        TestMetadataContextHolder.set("ambient-run", "ambient-suite");
        Message message = message("payload", "orders.events", null, null);

        new YanoteAmqpOutboundMessagePostProcessor().postProcessMessage(message);

        assertThat(YanoteAmqpHeaders.readTestRunId(message.getMessageProperties())).isEqualTo("ambient-run");
        assertThat(YanoteAmqpHeaders.readTestSuite(message.getMessageProperties())).isEqualTo("ambient-suite");
        assertThat(YanoteAmqpHeaders.readMessageHint(message.getMessageProperties())).isNull();
    }

    @Test
    void shouldIgnoreBlankMetadataHeaders() {
        MessageProperties properties = new MessageProperties();

        YanoteAmqpHeaders.setHeaders(properties, "  ", "\t", " UserCreated ");

        assertThat(YanoteAmqpHeaders.readTestRunId(properties)).isNull();
        assertThat(YanoteAmqpHeaders.readTestSuite(properties)).isNull();
        assertThat(YanoteAmqpHeaders.readMessageHint(properties)).isEqualTo("UserCreated");
    }

    @Test
    void shouldCaptureMessageBodyAndPreserveListenerAttribution() throws Throwable {
        Path eventsPath = tempDir.resolve("events.jsonl");
        YanoteAmqpInboundMessagePostProcessor inboundMessagePostProcessor = new YanoteAmqpInboundMessagePostProcessor();
        YanoteAmqpListenerAdvice listenerAdvice = new YanoteAmqpListenerAdvice(
                new YanoteAmqpEventRecorder(eventsPath, "amqp-contract-service")
        );
        Message message = message("payload", "orders.events", "orders.queue", "UserCreated");
        YanoteAmqpHeaders.setHeaders(message.getMessageProperties(), "run-1", "suite-a", "UserCreated");

        inboundMessagePostProcessor.postProcessMessage(message);

        assertThat(TestMetadataContextHolder.current()).isEqualTo(new TestMetadata("run-1", "suite-a"));
        assertThat(YanoteAmqpListenerState.currentMessage()).isSameAs(message);

        assertThatCode(() -> listenerAdvice.invoke(new StubMethodInvocation(false))).doesNotThrowAnyException();

        assertThat(TestMetadataContextHolder.current()).isNull();
        assertThat(YanoteAmqpListenerState.currentMessage()).isNull();

        List<AmqpEvent> events = readAmqpEvents(eventsPath);
        assertThat(events).hasSize(1);
        AmqpEvent event = events.get(0);
        assertThat(event.action()).isEqualTo(AmqpEvent.Action.RECEIVE);
        assertThat(event.channel()).isEqualTo("orders.events");
        assertThat(event.message()).isEqualTo("UserCreated");
        assertThat(event.payloadState()).isEqualTo(PayloadCaptureState.CAPTURED);
        assertThat(event.payloadReason()).isNull();
        assertThat(event.payload().asText()).isEqualTo("payload");
        assertThat(event.error()).isFalse();
        assertThat(event.testRunId()).isEqualTo("run-1");
        assertThat(event.testSuite()).isEqualTo("suite-a");
    }

    @Test
    void shouldRetainSafeHeadersRedactSensitiveOnesAndOmitUnsupportedValues(CapturedOutput output) throws Exception {
        Path eventsPath = tempDir.resolve("headers.jsonl");
        String secret = "Bearer super-secret-token";
        Message message = message("payload", "orders.events", null, "OutboundMessage");
        MessageProperties properties = message.getMessageProperties();
        YanoteAmqpHeaders.setHeaders(properties, "run-safe", "suite-safe", "OutboundMessage");
        properties.setHeader("trace-id", " trace-123 ");
        properties.setHeader("authorization", secret);
        properties.setHeader("oversized-header", "x".repeat(2048));
        properties.setHeader("binary-header", new byte[] {(byte) 0xC3, 0x28});

        new YanoteAmqpEventRecorder(eventsPath, "amqp-contract-service")
                .recordSend("events.exchange", "orders.events", message, false);

        AmqpEvent event = readAmqpEvents(eventsPath).get(0);
        assertThat(event.message()).isEqualTo("OutboundMessage");
        assertThat(event.testRunId()).isEqualTo("run-safe");
        assertThat(event.testSuite()).isEqualTo("suite-safe");
        assertThat(event.headers()).containsEntry(
                YanoteAmqpHeaders.MESSAGE_HINT,
                new AmqpEvent.HeaderEvidence(AmqpEvent.HeaderCaptureState.CAPTURED, "OutboundMessage", null)
        );
        assertThat(event.headers()).containsEntry(
                YanoteAmqpHeaders.TEST_RUN_ID,
                new AmqpEvent.HeaderEvidence(AmqpEvent.HeaderCaptureState.CAPTURED, "run-safe", null)
        );
        assertThat(event.headers()).containsEntry(
                YanoteAmqpHeaders.TEST_SUITE,
                new AmqpEvent.HeaderEvidence(AmqpEvent.HeaderCaptureState.CAPTURED, "suite-safe", null)
        );
        assertThat(event.headers()).containsEntry(
                "trace-id",
                new AmqpEvent.HeaderEvidence(AmqpEvent.HeaderCaptureState.CAPTURED, "trace-123", null)
        );
        assertThat(event.headers()).containsEntry(
                "authorization",
                new AmqpEvent.HeaderEvidence(
                        AmqpEvent.HeaderCaptureState.REDACTED,
                        null,
                        AmqpEvent.HeaderCaptureReason.SENSITIVE
                )
        );
        assertThat(event.headers()).containsEntry(
                "oversized-header",
                new AmqpEvent.HeaderEvidence(
                        AmqpEvent.HeaderCaptureState.OMITTED,
                        null,
                        AmqpEvent.HeaderCaptureReason.OVERSIZED
                )
        );
        assertThat(event.headers()).containsEntry(
                "binary-header",
                new AmqpEvent.HeaderEvidence(
                        AmqpEvent.HeaderCaptureState.OMITTED,
                        null,
                        AmqpEvent.HeaderCaptureReason.UNSUPPORTED
                )
        );

        String serialized = OBJECT_MAPPER.writeValueAsString(event);
        assertThat(serialized).doesNotContain(secret);
        assertThat(output.getOut()).contains("Adjusting yanote amqp header capture");
        assertThat(output.getOut()).doesNotContain(secret);
    }

    @Test
    void shouldMarkMalformedJsonPayloadAsOmittedAndWarn(CapturedOutput output) throws Exception {
        Path eventsPath = tempDir.resolve("malformed.jsonl");
        MessageProperties properties = new MessageProperties();
        properties.setContentType(MessageProperties.CONTENT_TYPE_JSON);
        properties.setReceivedRoutingKey("orders.events");
        YanoteAmqpHeaders.setHeaders(properties, "run-json", "suite-json", null);
        Message message = new Message("{".getBytes(StandardCharsets.UTF_8), properties);

        new YanoteAmqpEventRecorder(eventsPath, "amqp-contract-service")
                .recordSend("events.exchange", "orders.events", message, false);

        AmqpEvent event = readAmqpEvents(eventsPath).get(0);
        assertThat(event.payload()).isNull();
        assertThat(event.payloadState()).isEqualTo(PayloadCaptureState.OMITTED);
        assertThat(event.payloadReason()).isEqualTo(PayloadCaptureReason.MALFORMED);
        assertThat(output.getOut()).contains("Omitting yanote amqp payload");
    }

    @Test
    void shouldClearListenerContextWhenRecordingFailsAndPreventMetadataBleed() throws Throwable {
        Path eventsDirectory = Files.createDirectory(tempDir.resolve("events-dir"));
        YanoteAmqpInboundMessagePostProcessor inboundMessagePostProcessor = new YanoteAmqpInboundMessagePostProcessor();
        YanoteAmqpListenerAdvice listenerAdvice = new YanoteAmqpListenerAdvice(
                new YanoteAmqpEventRecorder(eventsDirectory, "amqp-contract-service")
        );
        Message failedMessage = message("payload-1", "orders.events", "orders.queue", "InboundMessage");
        YanoteAmqpHeaders.setHeaders(failedMessage.getMessageProperties(), "run-1", "suite-a", "InboundMessage");

        inboundMessagePostProcessor.postProcessMessage(failedMessage);
        assertThatThrownBy(() -> listenerAdvice.invoke(new StubMethodInvocation(true)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("boom");

        assertThat(TestMetadataContextHolder.current()).isNull();
        assertThat(YanoteAmqpListenerState.currentMessage()).isNull();

        Message nextMessage = message("payload-2", "orders.events", "orders.queue", null);
        inboundMessagePostProcessor.postProcessMessage(nextMessage);
        assertThat(TestMetadataContextHolder.current()).isNull();
        assertThat(YanoteAmqpListenerState.currentMessage()).isSameAs(nextMessage);
        assertThatCode(() -> listenerAdvice.invoke(new StubMethodInvocation(false))).doesNotThrowAnyException();
        assertThat(TestMetadataContextHolder.current()).isNull();
        assertThat(YanoteAmqpListenerState.currentMessage()).isNull();
    }

    private static Message message(String payload, String routingKey, String consumerQueue, String messageHint) {
        MessageProperties properties = new MessageProperties();
        properties.setContentType(MessageProperties.CONTENT_TYPE_TEXT_PLAIN);
        properties.setReceivedRoutingKey(routingKey);
        properties.setConsumerQueue(consumerQueue);
        if (messageHint != null) {
            properties.setHeader(YanoteAmqpHeaders.MESSAGE_HINT, messageHint);
        }
        return new Message(payload.getBytes(StandardCharsets.UTF_8), properties);
    }

    private static List<AmqpEvent> readAmqpEvents(Path eventsPath) throws Exception {
        List<YanoteEvent> events = new EventJsonlReader().read(eventsPath);
        return events.stream().map(AmqpEvent.class::cast).toList();
    }

    private static final class StubMethodInvocation implements MethodInvocation {
        private final boolean shouldThrow;

        private StubMethodInvocation(boolean shouldThrow) {
            this.shouldThrow = shouldThrow;
        }

        @Override
        public Method getMethod() {
            try {
                return StubMethodInvocation.class.getDeclaredMethod("proceedTarget");
            } catch (NoSuchMethodException ex) {
                throw new RuntimeException(ex);
            }
        }

        @Override
        public Object[] getArguments() {
            return new Object[0];
        }

        @Override
        public Object proceed() {
            if (shouldThrow) {
                throw new IllegalStateException("boom");
            }
            return null;
        }

        @Override
        public Object getThis() {
            return this;
        }

        @Override
        public AccessibleObject getStaticPart() {
            return getMethod();
        }

        @SuppressWarnings("unused")
        private void proceedTarget() {
            // marker method for MethodInvocation contract
        }
    }
}

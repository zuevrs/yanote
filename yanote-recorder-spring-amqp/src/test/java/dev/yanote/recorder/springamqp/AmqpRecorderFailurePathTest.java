package dev.yanote.recorder.springamqp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.yanote.core.events.AmqpEvent;
import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import dev.yanote.core.events.YanoteEvent;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;

@ExtendWith(OutputCaptureExtension.class)
class AmqpRecorderFailurePathTest {
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
    void shouldWarnAndDropEventsWhenRecordingFails(CapturedOutput output) throws Exception {
        Path eventsDirectory = Files.createDirectory(tempDir.resolve("events-dir"));
        Message message = textMessage("payload", "orders.events", "run-write-failure", "suite-a", null);

        YanoteAmqpEventRecorder recorder = new YanoteAmqpEventRecorder(eventsDirectory, "failure-service");
        assertThatCode(() -> {
            recorder.recordSend("", "orders.events", message, false);
            recorder.recordReceive(message, true);
        }).doesNotThrowAnyException();

        assertThat(output.getOut())
                .contains("Failed to write yanote amqp event")
                .contains("dropping event");
    }

    @Test
    void shouldRetainHeaderMarkersWithoutLeakingSensitiveValues(CapturedOutput output) throws Exception {
        Path eventsPath = tempDir.resolve("headers.jsonl");
        String secret = "Bearer super-secret-token";
        Message message = textMessage("payload", "orders.events", "run-safe", "suite-safe", "OrderCreated");
        MessageProperties properties = message.getMessageProperties();
        properties.setHeader("trace-id", " trace-123 ");
        properties.setHeader("authorization", secret);
        properties.setHeader("oversized-header", "x".repeat(2048));
        properties.setHeader("binary-header", new byte[] {(byte) 0xC3, 0x28});

        new YanoteAmqpEventRecorder(eventsPath, "failure-service")
                .recordSend("", "orders.events", message, false);

        AmqpEvent event = readSingleEvent(eventsPath);
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
    void shouldWarnAndMarkUnsupportedPayloadOmissions(CapturedOutput output) throws Exception {
        Path eventsPath = tempDir.resolve("unsupported.jsonl");
        MessageProperties properties = new MessageProperties();
        properties.setContentType("application/x-java-serialized-object");
        properties.setReceivedRoutingKey("orders.events");
        YanoteAmqpHeaders.setHeaders(properties, "run-unsupported", "suite-a", null);
        Message message = new Message(new byte[] {(byte) 0xAC, (byte) 0xED, 0x00, 0x05}, properties);

        new YanoteAmqpEventRecorder(eventsPath, "failure-service")
                .recordSend("", "orders.events", message, false);

        AmqpEvent event = readSingleEvent(eventsPath);
        assertThat(event.payload()).isNull();
        assertThat(event.payloadState()).isEqualTo(PayloadCaptureState.OMITTED);
        assertThat(event.payloadReason()).isEqualTo(PayloadCaptureReason.UNSUPPORTED);
        assertThat(output.getOut()).contains("Omitting yanote amqp payload");
    }

    @Test
    void shouldWarnAndMarkOversizedPayloadOmissions(CapturedOutput output) throws Exception {
        Path eventsPath = tempDir.resolve("oversized.jsonl");
        Message message = textMessage(
                "x".repeat(70 * 1024),
                "orders.events",
                "run-oversized",
                "suite-a",
                null
        );

        new YanoteAmqpEventRecorder(eventsPath, "failure-service")
                .recordSend("", "orders.events", message, false);

        AmqpEvent event = readSingleEvent(eventsPath);
        assertThat(event.payload()).isNull();
        assertThat(event.payloadState()).isEqualTo(PayloadCaptureState.OMITTED);
        assertThat(event.payloadReason()).isEqualTo(PayloadCaptureReason.OVERSIZED);
        assertThat(output.getOut())
                .contains("Omitting yanote amqp payload")
                .contains("safe capture limit");
    }

    private static Message textMessage(
            String payload,
            String routingKey,
            String runId,
            String suite,
            String messageHint
    ) {
        MessageProperties properties = new MessageProperties();
        properties.setContentType(MessageProperties.CONTENT_TYPE_TEXT_PLAIN);
        properties.setReceivedRoutingKey(routingKey);
        YanoteAmqpHeaders.setHeaders(properties, runId, suite, messageHint);
        return new Message(payload.getBytes(StandardCharsets.UTF_8), properties);
    }

    private static AmqpEvent readSingleEvent(Path eventsPath) {
        try {
            List<YanoteEvent> events = new EventJsonlReader().read(eventsPath);
            assertThat(events).hasSize(1);
            return (AmqpEvent) events.get(0);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}

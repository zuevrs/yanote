package dev.yanote.recorder.springactivemq;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.JmsEvent;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import dev.yanote.core.events.YanoteEvent;
import jakarta.jms.ObjectMessage;
import jakarta.jms.Queue;
import jakarta.jms.TextMessage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

class JmsEventRecorderPayloadPolicyTest {

    @Test
    void shouldCaptureStructuredJsonTextPayloadTruthfully() throws Exception {
        Path eventsPath = Files.createTempFile("yanote-jms-json-", ".jsonl");
        Files.deleteIfExists(eventsPath);

        YanoteJmsEventRecorder recorder = new YanoteJmsEventRecorder(eventsPath, "payload-policy-service");
        Queue queue = queue("orders.queue");
        TextMessage message = mock(TextMessage.class);
        when(message.getText()).thenReturn("{\"orderId\":\"ord-1\",\"status\":\"created\"}");
        when(message.getJMSDestination()).thenReturn(queue);
        when(message.getPropertyNames()).thenReturn(java.util.Collections.emptyEnumeration());

        recorder.recordSend(queue, message, false);

        JmsEvent event = readSingleEvent(eventsPath);
        assertThat(event.payloadState()).isEqualTo(PayloadCaptureState.CAPTURED);
        assertThat(event.payloadReason()).isNull();
        assertThat(event.payload().get("orderId").asText()).isEqualTo("ord-1");
        assertThat(event.payload().get("status").asText()).isEqualTo("created");
    }

    @Test
    void shouldOmitUnsupportedObjectMessagePayloadTruthfully() throws Exception {
        Path eventsPath = Files.createTempFile("yanote-jms-unsupported-", ".jsonl");
        Files.deleteIfExists(eventsPath);

        YanoteJmsEventRecorder recorder = new YanoteJmsEventRecorder(eventsPath, "payload-policy-service");
        Queue queue = queue("orders.queue");
        ObjectMessage message = mock(ObjectMessage.class);
        when(message.getJMSDestination()).thenReturn(queue);
        when(message.getPropertyNames()).thenReturn(java.util.Collections.emptyEnumeration());

        recorder.recordReceive(queue, message, false);

        JmsEvent event = readSingleEvent(eventsPath);
        assertThat(event.payload()).isNull();
        assertThat(event.payloadState()).isEqualTo(PayloadCaptureState.OMITTED);
        assertThat(event.payloadReason()).isEqualTo(PayloadCaptureReason.UNSUPPORTED);
    }

    private static Queue queue(String name) throws Exception {
        Queue queue = mock(Queue.class);
        when(queue.getQueueName()).thenReturn(name);
        return queue;
    }

    private static JmsEvent readSingleEvent(Path eventsPath) throws Exception {
        List<YanoteEvent> events = new EventJsonlReader().read(eventsPath);
        assertThat(events).hasSize(1);
        return (JmsEvent) events.getFirst();
    }
}

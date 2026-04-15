package dev.yanote.recorder.springactivemq;

import dev.yanote.core.events.EventJsonlWriter;
import dev.yanote.core.events.JmsEvent;
import java.io.IOException;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.jms.Message;

public class YanoteJmsEventRecorder {
    private static final Logger log = LoggerFactory.getLogger(YanoteJmsEventRecorder.class);

    private final Path eventsPath;
    private final String serviceName;
    private final JmsPayloadCapture payloadCapture = new JmsPayloadCapture();

    public YanoteJmsEventRecorder(Path eventsPath, String serviceName) {
        this.eventsPath = eventsPath;
        this.serviceName = serviceName;
    }

    public void recordSend(Object destinationHint, Message message, boolean error) {
        record(JmsEvent.Action.SEND, destinationHint, message, error);
    }

    public void recordReceive(Object destinationHint, Message message, boolean error) {
        record(JmsEvent.Action.RECEIVE, destinationHint, message, error);
    }

    private void record(JmsEvent.Action action, Object destinationHint, Message message, boolean error) {
        String channel = firstNonBlank(
                YanoteJmsHeaders.describeDestination(destinationHint),
                readMessageDestination(message),
                "unknown"
        );
        if (channel == null) {
            log.warn("Dropping yanote JMS event because channel was not available for action={} at {}", action.jsonValue(), eventsPath);
            return;
        }

        JmsPayloadCapture.CaptureResult payloadResult = payloadCapture.capture(message);
        if (payloadResult.warning() != null) {
            log.warn(
                    "Omitting yanote jms payload for action={} channel={} at {} ({})",
                    action.jsonValue(),
                    channel,
                    eventsPath,
                    payloadResult.warning()
            );
        }

        YanoteJmsHeaders.RetainedHeaders retainedHeaders = YanoteJmsHeaders.retainHeaders(message);
        for (String warning : retainedHeaders.warnings()) {
            log.warn(
                    "Adjusting yanote jms header capture for action={} channel={} at {} ({})",
                    action.jsonValue(),
                    channel,
                    eventsPath,
                    warning
            );
        }

        Map<String, JmsEvent.HeaderEvidence> headers = retainedHeaders.headers();
        if (headers != null) {
            headers = new LinkedHashMap<>(headers);
        }

        JmsEvent event = new JmsEvent(
                System.currentTimeMillis(),
                action,
                channel,
                YanoteJmsHeaders.readMessageHint(message),
                serviceName,
                null,
                payloadResult.payload(),
                payloadResult.state(),
                payloadResult.reason(),
                headers,
                error,
                YanoteJmsHeaders.readTestRunId(message),
                YanoteJmsHeaders.readTestSuite(message)
        );

        try (EventJsonlWriter writer = new EventJsonlWriter(eventsPath)) {
            writer.write(event);
        } catch (IOException ex) {
            log.warn("Failed to write yanote jms event to {} (dropping event)", eventsPath, ex);
        }
    }

    Path eventsPath() {
        return eventsPath;
    }

    String serviceName() {
        return serviceName;
    }

    private static String readMessageDestination(Message message) {
        if (message == null) {
            return null;
        }
        try {
            return YanoteJmsHeaders.describeDestination(message.getJMSDestination());
        } catch (Exception ex) {
            return null;
        }
    }

    private static String firstNonBlank(String... candidates) {
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return null;
    }
}

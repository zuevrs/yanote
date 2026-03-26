package dev.yanote.recorder.springamqp;

import dev.yanote.core.events.AmqpEvent;
import dev.yanote.core.events.EventJsonlWriter;
import java.io.IOException;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;

public class YanoteAmqpEventRecorder {
    private static final Logger log = LoggerFactory.getLogger(YanoteAmqpEventRecorder.class);

    private final Path eventsPath;
    private final String serviceName;
    private final AmqpPayloadCapture payloadCapture = new AmqpPayloadCapture();

    public YanoteAmqpEventRecorder(Path eventsPath, String serviceName) {
        this.eventsPath = eventsPath;
        this.serviceName = serviceName;
    }

    public void recordSend(String exchange, String routingKey, Message message, boolean error) {
        record(
                AmqpEvent.Action.SEND,
                resolveOutboundChannel(exchange, routingKey, message == null ? null : message.getMessageProperties()),
                message,
                error
        );
    }

    public void recordReceive(Message message, boolean error) {
        record(AmqpEvent.Action.RECEIVE, resolveInboundChannel(message == null ? null : message.getMessageProperties()), message, error);
    }

    private void record(AmqpEvent.Action action, String channel, Message message, boolean error) {
        String normalizedChannel = normalize(channel);
        if (normalizedChannel == null) {
            log.warn("Dropping yanote AMQP event because channel was not available for action={} at {}", action.jsonValue(), eventsPath);
            return;
        }

        MessageProperties properties = message == null ? null : message.getMessageProperties();
        AmqpPayloadCapture.CaptureResult payloadResult = payloadCapture.capture(message);
        if (payloadResult.warning() != null) {
            log.warn(
                    "Omitting yanote amqp payload for action={} channel={} at {} ({})",
                    action.jsonValue(),
                    normalizedChannel,
                    eventsPath,
                    payloadResult.warning()
            );
        }

        YanoteAmqpHeaders.RetainedHeaders retainedHeaders = properties == null
                ? YanoteAmqpHeaders.RetainedHeaders.empty()
                : YanoteAmqpHeaders.retainHeaders(properties);
        for (String warning : retainedHeaders.warnings()) {
            log.warn(
                    "Adjusting yanote amqp header capture for action={} channel={} at {} ({})",
                    action.jsonValue(),
                    normalizedChannel,
                    eventsPath,
                    warning
            );
        }

        Map<String, AmqpEvent.HeaderEvidence> headers = retainedHeaders.headers();
        if (headers != null) {
            headers = new LinkedHashMap<>(headers);
        }

        AmqpEvent event = new AmqpEvent(
                System.currentTimeMillis(),
                action,
                normalizedChannel,
                properties == null ? null : YanoteAmqpHeaders.readMessageHint(properties),
                serviceName,
                null,
                payloadResult.payload(),
                payloadResult.state(),
                payloadResult.reason(),
                headers,
                error,
                properties == null ? null : YanoteAmqpHeaders.readTestRunId(properties),
                properties == null ? null : YanoteAmqpHeaders.readTestSuite(properties)
        );

        try (EventJsonlWriter writer = new EventJsonlWriter(eventsPath)) {
            writer.write(event);
        } catch (IOException ex) {
            log.warn("Failed to write yanote amqp event to {} (dropping event)", eventsPath, ex);
        }
    }

    static String resolveOutboundChannel(String exchange, String routingKey, MessageProperties properties) {
        return firstNonBlank(
                routingKey,
                properties == null ? null : properties.getReceivedRoutingKey(),
                properties == null ? null : properties.getConsumerQueue(),
                exchange,
                properties == null ? null : properties.getReceivedExchange(),
                "unknown"
        );
    }

    static String resolveInboundChannel(MessageProperties properties) {
        return firstNonBlank(
                properties == null ? null : properties.getReceivedRoutingKey(),
                properties == null ? null : properties.getConsumerQueue(),
                properties == null ? null : properties.getReceivedExchange(),
                "unknown"
        );
    }

    private static String firstNonBlank(String... candidates) {
        for (String candidate : candidates) {
            String normalized = normalize(candidate);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}

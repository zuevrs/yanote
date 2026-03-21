package dev.yanote.recorder.springkafka;

import dev.yanote.core.events.EventJsonlWriter;
import dev.yanote.core.events.KafkaEvent;
import java.io.IOException;
import java.nio.file.Path;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.Headers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class YanoteKafkaEventRecorder {
    private static final Logger log = LoggerFactory.getLogger(YanoteKafkaEventRecorder.class);

    private final Path eventsPath;
    private final String serviceName;
    private final KafkaPayloadCapture payloadCapture = new KafkaPayloadCapture();

    public YanoteKafkaEventRecorder(Path eventsPath, String serviceName) {
        this.eventsPath = eventsPath;
        this.serviceName = serviceName;
    }

    public void recordSend(ProducerRecord<?, ?> record, boolean error) {
        record(KafkaEvent.Action.SEND, record.topic(), record.value(), record.headers(), error);
    }

    public void recordReceive(ConsumerRecord<?, ?> record, boolean error) {
        record(KafkaEvent.Action.RECEIVE, record.topic(), record.value(), record.headers(), error);
    }

    private void record(KafkaEvent.Action action, String channel, Object payloadValue, Headers headers, boolean error) {
        KafkaPayloadCapture.CaptureResult captureResult = payloadCapture.capture(payloadValue);
        if (captureResult.warning() != null) {
            log.warn(
                    "Omitting yanote kafka payload for action={} channel={} at {} ({})",
                    action.jsonValue(),
                    channel,
                    eventsPath,
                    captureResult.warning()
            );
        }

        KafkaEvent event = new KafkaEvent(
                System.currentTimeMillis(),
                action,
                channel,
                YanoteKafkaHeaders.readMessageHint(headers),
                serviceName,
                null,
                captureResult.payload(),
                captureResult.state(),
                captureResult.reason(),
                error,
                YanoteKafkaHeaders.readTestRunId(headers),
                YanoteKafkaHeaders.readTestSuite(headers)
        );

        try (EventJsonlWriter writer = new EventJsonlWriter(eventsPath)) {
            writer.write(event);
        } catch (IOException ex) {
            log.warn("Failed to write yanote kafka event to {} (dropping event)", eventsPath, ex);
        }
    }
}

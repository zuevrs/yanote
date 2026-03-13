package dev.yanote.recorder.springkafka;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.springframework.kafka.support.ProducerListener;

public class YanoteKafkaProducerListener implements ProducerListener<Object, Object> {
    private final YanoteKafkaEventRecorder recorder;

    public YanoteKafkaProducerListener(YanoteKafkaEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public void onSuccess(ProducerRecord<Object, Object> producerRecord, RecordMetadata recordMetadata) {
        recorder.recordSend(producerRecord, false);
    }

    @Override
    public void onError(ProducerRecord<Object, Object> producerRecord, RecordMetadata recordMetadata, Exception exception) {
        recorder.recordSend(producerRecord, true);
    }
}

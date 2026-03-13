package dev.yanote.recorder.springkafka;

import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.listener.RecordInterceptor;

public class YanoteKafkaRecordInterceptor implements RecordInterceptor<Object, Object> {
    private final YanoteKafkaEventRecorder recorder;

    public YanoteKafkaRecordInterceptor(YanoteKafkaEventRecorder recorder) {
        this.recorder = recorder;
    }

    @Override
    public ConsumerRecord<Object, Object> intercept(ConsumerRecord<Object, Object> record, Consumer<Object, Object> consumer) {
        YanoteKafkaContextHolder.setFromHeaders(record.headers());
        return record;
    }

    @Override
    public void success(ConsumerRecord<Object, Object> record, Consumer<Object, Object> consumer) {
        recorder.recordReceive(record, false);
    }

    @Override
    public void failure(ConsumerRecord<Object, Object> record, Exception exception, Consumer<Object, Object> consumer) {
        recorder.recordReceive(record, true);
    }

    @Override
    public void afterRecord(ConsumerRecord<Object, Object> record, Consumer<Object, Object> consumer) {
        YanoteKafkaContextHolder.clear();
    }

    @Override
    public void clearThreadState(Consumer<?, ?> consumer) {
        YanoteKafkaContextHolder.clear();
    }
}

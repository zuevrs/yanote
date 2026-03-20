package dev.yanote.recorder.springkafka;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.KafkaEvent;
import dev.yanote.core.events.YanoteEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class KafkaMetadataPropagationContractTest {
    private static final String TOPIC = "orders.events";

    @TempDir
    Path tempDir;

    @AfterEach
    void clearContext() {
        YanoteKafkaContextHolder.clear();
    }

    @Test
    void shouldPreferExplicitOutboundHeadersOverAmbientContext() {
        YanoteKafkaContextHolder.set("ambient-run", "ambient-suite", "AmbientMessage");
        ProducerRecord<Object, Object> record = new ProducerRecord<>(TOPIC, "payload");
        YanoteKafkaHeaders.setHeaders(record.headers(), "explicit-run", "explicit-suite", "ExplicitMessage");

        new YanoteKafkaProducerInterceptor().onSend(record);

        assertThat(YanoteKafkaHeaders.readTestRunId(record.headers())).isEqualTo("explicit-run");
        assertThat(YanoteKafkaHeaders.readTestSuite(record.headers())).isEqualTo("explicit-suite");
        assertThat(YanoteKafkaHeaders.readMessageHint(record.headers())).isEqualTo("ExplicitMessage");
    }

    @Test
    void shouldOnlyAutoPropagateSuiteAndRun() {
        YanoteKafkaContextHolder.set("ambient-run", "ambient-suite", "AmbientMessage");
        ProducerRecord<Object, Object> record = new ProducerRecord<>(TOPIC, "payload");

        new YanoteKafkaProducerInterceptor().onSend(record);

        assertThat(YanoteKafkaHeaders.readTestRunId(record.headers())).isEqualTo("ambient-run");
        assertThat(YanoteKafkaHeaders.readTestSuite(record.headers())).isEqualTo("ambient-suite");
        assertThat(YanoteKafkaHeaders.readMessageHint(record.headers())).isNull();
    }

    @Test
    void shouldSeedListenerContextForHandlingAndClearItAfterSuccess() throws Exception {
        Path eventsPath = tempDir.resolve("events.jsonl");
        YanoteKafkaRecordInterceptor interceptor = new YanoteKafkaRecordInterceptor(
                new YanoteKafkaEventRecorder(eventsPath, "kafka-contract-service")
        );
        ConsumerRecord<Object, Object> record = consumerRecord(Map.of("userId", "alice", "active", true), "run-1", "suite-a", "InboundMessage");

        interceptor.intercept(record, null);

        assertThat(TestMetadataContextHolder.current()).isEqualTo(new TestMetadata("run-1", "suite-a"));
        assertThat(YanoteKafkaContextHolder.current()).isEqualTo(
                new YanoteKafkaContextHolder.YanoteKafkaContext("run-1", "suite-a", null)
        );

        interceptor.success(record, null);
        interceptor.afterRecord(record, null);

        assertThat(TestMetadataContextHolder.current()).isNull();
        assertThat(YanoteKafkaContextHolder.current()).isNull();

        List<KafkaEvent> events = readKafkaEvents(eventsPath);
        assertThat(events).hasSize(1);
        KafkaEvent event = events.get(0);
        assertThat(event.action()).isEqualTo(KafkaEvent.Action.RECEIVE);
        assertThat(event.channel()).isEqualTo(TOPIC);
        assertThat(event.message()).isEqualTo("InboundMessage");
        assertThat(event.payload()).isNotNull();
        assertThat(event.payload().get("userId").asText()).isEqualTo("alice");
        assertThat(event.payload().get("active").asBoolean()).isTrue();
        assertThat(event.error()).isFalse();
        assertThat(event.testRunId()).isEqualTo("run-1");
        assertThat(event.testSuite()).isEqualTo("suite-a");
    }

    @Test
    void shouldOmitUnsupportedPayloadsWithoutBreakingMetadataCapture() throws Exception {
        Path eventsPath = tempDir.resolve("unsupported-payload-events.jsonl");
        YanoteKafkaRecordInterceptor interceptor = new YanoteKafkaRecordInterceptor(
                new YanoteKafkaEventRecorder(eventsPath, "kafka-contract-service")
        );
        ConsumerRecord<Object, Object> record = consumerRecord(new Object(), "run-unsupported", "suite-x", "InboundMessage");

        assertThatCode(() -> {
            interceptor.intercept(record, null);
            interceptor.success(record, null);
            interceptor.afterRecord(record, null);
        }).doesNotThrowAnyException();

        List<KafkaEvent> events = readKafkaEvents(eventsPath);
        assertThat(events).hasSize(1);
        KafkaEvent event = events.get(0);
        assertThat(event.message()).isEqualTo("InboundMessage");
        assertThat(event.payload()).isNull();
        assertThat(event.testRunId()).isEqualTo("run-unsupported");
        assertThat(event.testSuite()).isEqualTo("suite-x");
    }

    @Test
    void shouldClearListenerContextWhenRecordingFailsAndPreventMetadataBleed() throws Exception {
        Path eventsDirectory = Files.createDirectory(tempDir.resolve("events-dir"));
        YanoteKafkaRecordInterceptor interceptor = new YanoteKafkaRecordInterceptor(
                new YanoteKafkaEventRecorder(eventsDirectory, "kafka-contract-service")
        );
        ConsumerRecord<Object, Object> failedRecord = consumerRecord("payload-1", "run-1", "suite-a", "InboundMessage");

        assertThatCode(() -> {
            interceptor.intercept(failedRecord, null);
            interceptor.failure(failedRecord, new IllegalStateException("boom"), null);
            interceptor.afterRecord(failedRecord, null);
        }).doesNotThrowAnyException();

        assertThat(TestMetadataContextHolder.current()).isNull();
        assertThat(YanoteKafkaContextHolder.current()).isNull();

        ConsumerRecord<Object, Object> nextRecord = consumerRecord("payload-2", null, null, null);
        interceptor.intercept(nextRecord, null);
        assertThat(TestMetadataContextHolder.current()).isNull();
        assertThat(YanoteKafkaContextHolder.current()).isNull();
        interceptor.afterRecord(nextRecord, null);
    }

    private static ConsumerRecord<Object, Object> consumerRecord(
            Object payload,
            String runId,
            String suite,
            String messageHint
    ) {
        ConsumerRecord<Object, Object> record = new ConsumerRecord<>(TOPIC, 0, 0L, null, payload);
        YanoteKafkaHeaders.setHeaders(record.headers(), runId, suite, messageHint);
        return record;
    }

    private static List<KafkaEvent> readKafkaEvents(Path eventsPath) throws Exception {
        List<YanoteEvent> events = new EventJsonlReader().read(eventsPath);
        return events.stream().map(KafkaEvent.class::cast).toList();
    }
}

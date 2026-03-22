package dev.yanote.recorder.springkafka;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import dev.yanote.core.events.EventJsonlReader;
import dev.yanote.core.events.KafkaEvent;
import dev.yanote.core.events.PayloadCaptureReason;
import dev.yanote.core.events.PayloadCaptureState;
import dev.yanote.core.events.YanoteEvent;
import dev.yanote.core.testmetadata.TestMetadata;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
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
    void shouldCapturePojoPayloadsAndPreserveListenerAttribution() throws Exception {
        Path eventsPath = tempDir.resolve("events.jsonl");
        YanoteKafkaRecordInterceptor interceptor = new YanoteKafkaRecordInterceptor(
                new YanoteKafkaEventRecorder(eventsPath, "kafka-contract-service")
        );
        ConsumerRecord<Object, Object> record = consumerRecord(
                new UserPayload("alice", "alice@example.com"),
                "run-1",
                "suite-a",
                "InboundMessage"
        );

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
        assertThat(event.payloadState()).isEqualTo(PayloadCaptureState.CAPTURED);
        assertThat(event.payloadReason()).isNull();
        assertThat(event.payload()).isNotNull();
        assertThat(event.payload().get("name").asText()).isEqualTo("alice");
        assertThat(event.payload().get("email").asText()).isEqualTo("alice@example.com");
        assertThat(event.error()).isFalse();
        assertThat(event.testRunId()).isEqualTo("run-1");
        assertThat(event.testSuite()).isEqualTo("suite-a");
    }

    @Test
    void shouldRetainSafeHeadersRedactSensitiveOnesAndOmitUnsupportedValues() throws Exception {
        Path eventsPath = tempDir.resolve("retained-headers-events.jsonl");
        YanoteKafkaEventRecorder recorder = new YanoteKafkaEventRecorder(eventsPath, "kafka-contract-service");
        ProducerRecord<Object, Object> record = new ProducerRecord<>(TOPIC, "payload");
        YanoteKafkaHeaders.setHeaders(record.headers(), "run-safe", "suite-safe", "OutboundMessage");
        record.headers().add(new RecordHeader("trace-id", " trace-123 ".getBytes(StandardCharsets.UTF_8)));
        record.headers().add(new RecordHeader("authorization", "Bearer super-secret-token".getBytes(StandardCharsets.UTF_8)));
        record.headers().add(new RecordHeader("binary-header", new byte[] {(byte) 0xC3, 0x28}));

        recorder.recordSend(record, false);

        List<KafkaEvent> events = readKafkaEvents(eventsPath);
        assertThat(events).hasSize(1);
        KafkaEvent event = events.get(0);
        assertThat(event.message()).isEqualTo("OutboundMessage");
        assertThat(event.testRunId()).isEqualTo("run-safe");
        assertThat(event.testSuite()).isEqualTo("suite-safe");
        assertThat(event.headers()).containsEntry(
                YanoteKafkaHeaders.MESSAGE_HINT,
                new KafkaEvent.HeaderEvidence(KafkaEvent.HeaderCaptureState.CAPTURED, "OutboundMessage", null)
        );
        assertThat(event.headers()).containsEntry(
                YanoteKafkaHeaders.TEST_RUN_ID,
                new KafkaEvent.HeaderEvidence(KafkaEvent.HeaderCaptureState.CAPTURED, "run-safe", null)
        );
        assertThat(event.headers()).containsEntry(
                YanoteKafkaHeaders.TEST_SUITE,
                new KafkaEvent.HeaderEvidence(KafkaEvent.HeaderCaptureState.CAPTURED, "suite-safe", null)
        );
        assertThat(event.headers()).containsEntry(
                "trace-id",
                new KafkaEvent.HeaderEvidence(KafkaEvent.HeaderCaptureState.CAPTURED, "trace-123", null)
        );
        assertThat(event.headers()).containsEntry(
                "authorization",
                new KafkaEvent.HeaderEvidence(
                        KafkaEvent.HeaderCaptureState.REDACTED,
                        null,
                        KafkaEvent.HeaderCaptureReason.SENSITIVE
                )
        );
        assertThat(event.headers()).containsEntry(
                "binary-header",
                new KafkaEvent.HeaderEvidence(
                        KafkaEvent.HeaderCaptureState.OMITTED,
                        null,
                        KafkaEvent.HeaderCaptureReason.UNSUPPORTED
                )
        );
    }

    @Test
    void shouldMarkUnsupportedPayloadOmissionsWithoutBreakingMetadataCapture() throws Exception {
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
        assertThat(event.payloadState()).isEqualTo(PayloadCaptureState.OMITTED);
        assertThat(event.payloadReason()).isEqualTo(PayloadCaptureReason.UNSUPPORTED);
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

    private record UserPayload(String name, String email) {
    }
}

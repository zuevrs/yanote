package dev.yanote.recorder.springamqp;

import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import org.springframework.amqp.core.Message;

final class YanoteAmqpListenerState {
    private static final ThreadLocal<Message> CURRENT_MESSAGE = new ThreadLocal<>();

    private YanoteAmqpListenerState() {
    }

    static void set(Message message) {
        CURRENT_MESSAGE.set(message);
        if (message == null) {
            TestMetadataContextHolder.clear();
            return;
        }
        TestMetadataContextHolder.set(
                YanoteAmqpHeaders.readTestRunId(message.getMessageProperties()),
                YanoteAmqpHeaders.readTestSuite(message.getMessageProperties())
        );
    }

    static Message currentMessage() {
        return CURRENT_MESSAGE.get();
    }

    static void clear() {
        CURRENT_MESSAGE.remove();
        TestMetadataContextHolder.clear();
    }
}

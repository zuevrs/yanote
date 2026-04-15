package dev.yanote.recorder.springactivemq;

import dev.yanote.core.testmetadata.TestMetadataContextHolder;
import jakarta.jms.Message;

final class YanoteJmsListenerState {
    private static final ThreadLocal<Message> CURRENT_MESSAGE = new ThreadLocal<>();

    private YanoteJmsListenerState() {
    }

    static void set(Message message) {
        CURRENT_MESSAGE.set(message);
        if (message == null) {
            TestMetadataContextHolder.clear();
            return;
        }
        TestMetadataContextHolder.set(
                YanoteJmsHeaders.readTestRunId(message),
                YanoteJmsHeaders.readTestSuite(message)
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

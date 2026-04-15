package dev.yanote.recorder.springactivemq;

import jakarta.jms.Message;

final class YanoteJmsSendContextHolder {
    private static final ThreadLocal<PendingSendContext> CONTEXT = new ThreadLocal<>();

    private YanoteJmsSendContextHolder() {
    }

    static void start(Object destinationHint) {
        CONTEXT.set(new PendingSendContext(destinationHint, null));
    }

    static void capture(Message message) {
        PendingSendContext current = CONTEXT.get();
        if (current == null) {
            return;
        }
        CONTEXT.set(new PendingSendContext(current.destinationHint(), message));
    }

    static PendingSendContext current() {
        return CONTEXT.get();
    }

    static void clear() {
        CONTEXT.remove();
    }

    record PendingSendContext(Object destinationHint, Message message) {
    }
}

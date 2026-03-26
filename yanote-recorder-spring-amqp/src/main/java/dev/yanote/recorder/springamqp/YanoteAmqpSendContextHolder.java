package dev.yanote.recorder.springamqp;

import org.springframework.amqp.core.Message;

final class YanoteAmqpSendContextHolder {
    private static final ThreadLocal<PendingSendContext> CONTEXT = new ThreadLocal<>();

    private YanoteAmqpSendContextHolder() {
    }

    static void start(String exchange, String routingKey) {
        CONTEXT.set(new PendingSendContext(exchange, routingKey, null));
    }

    static void capture(Message message) {
        PendingSendContext current = CONTEXT.get();
        if (current == null) {
            return;
        }
        CONTEXT.set(new PendingSendContext(current.exchange(), current.routingKey(), message));
    }

    static PendingSendContext current() {
        return CONTEXT.get();
    }

    static void clear() {
        CONTEXT.remove();
    }

    record PendingSendContext(String exchange, String routingKey, Message message) {
    }
}

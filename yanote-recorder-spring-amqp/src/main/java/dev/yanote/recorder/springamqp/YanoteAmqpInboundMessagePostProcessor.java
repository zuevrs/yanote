package dev.yanote.recorder.springamqp;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;

final class YanoteAmqpInboundMessagePostProcessor implements MessagePostProcessor {
    @Override
    public Message postProcessMessage(Message message) {
        YanoteAmqpListenerState.set(message);
        return message;
    }
}

package dev.yanote.recorder.springamqp;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.core.MessageProperties;

final class YanoteAmqpOutboundMessagePostProcessor implements MessagePostProcessor {
    @Override
    public Message postProcessMessage(Message message) {
        MessageProperties messageProperties = message.getMessageProperties();
        YanoteAmqpHeaders.applyContextIfAbsent(messageProperties);
        YanoteAmqpSendContextHolder.capture(message);
        return message;
    }
}

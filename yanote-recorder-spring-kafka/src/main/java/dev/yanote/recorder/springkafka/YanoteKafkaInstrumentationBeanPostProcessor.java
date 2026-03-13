package dev.yanote.recorder.springkafka;

import org.apache.kafka.clients.producer.ProducerInterceptor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.kafka.config.AbstractKafkaListenerContainerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CompositeRecordInterceptor;
import org.springframework.kafka.listener.RecordInterceptor;
import org.springframework.kafka.support.ProducerListener;
import org.springframework.util.ReflectionUtils;

class YanoteKafkaInstrumentationBeanPostProcessor implements BeanPostProcessor {
    private final YanoteKafkaProducerInterceptor producerInterceptor;
    private final YanoteKafkaProducerListener producerListener;
    private final YanoteKafkaRecordInterceptor recordInterceptor;

    YanoteKafkaInstrumentationBeanPostProcessor(
            YanoteKafkaProducerInterceptor producerInterceptor,
            YanoteKafkaProducerListener producerListener,
            YanoteKafkaRecordInterceptor recordInterceptor
    ) {
        this.producerInterceptor = producerInterceptor;
        this.producerListener = producerListener;
        this.recordInterceptor = recordInterceptor;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof KafkaTemplate<?, ?> kafkaTemplate) {
            instrumentKafkaTemplate(kafkaTemplate);
        }
        if (bean instanceof AbstractKafkaListenerContainerFactory<?, ?, ?> listenerContainerFactory) {
            instrumentListenerContainerFactory(listenerContainerFactory);
        }
        return bean;
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void instrumentKafkaTemplate(KafkaTemplate<?, ?> kafkaTemplate) {
        ProducerInterceptor existingProducerInterceptor = (ProducerInterceptor) readField(kafkaTemplate, "producerInterceptor");
        if (existingProducerInterceptor != producerInterceptor
                && !(existingProducerInterceptor instanceof ChainedProducerInterceptor)) {
            ProducerInterceptor compositeInterceptor = existingProducerInterceptor == null
                    ? producerInterceptor
                    : new ChainedProducerInterceptor(existingProducerInterceptor, producerInterceptor);
            ((KafkaTemplate) kafkaTemplate).setProducerInterceptor(compositeInterceptor);
        }

        ProducerListener existingProducerListener = (ProducerListener) readField(kafkaTemplate, "producerListener");
        if (existingProducerListener != producerListener
                && !(existingProducerListener instanceof ChainedProducerListener)) {
            ProducerListener compositeListener = existingProducerListener == null
                    ? producerListener
                    : new ChainedProducerListener(existingProducerListener, producerListener);
            ((KafkaTemplate) kafkaTemplate).setProducerListener(compositeListener);
        }
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void instrumentListenerContainerFactory(AbstractKafkaListenerContainerFactory<?, ?, ?> listenerContainerFactory) {
        RecordInterceptor existingRecordInterceptor = (RecordInterceptor) readField(listenerContainerFactory, "recordInterceptor");
        if (existingRecordInterceptor == recordInterceptor) {
            return;
        }
        if (existingRecordInterceptor == null) {
            ((AbstractKafkaListenerContainerFactory) listenerContainerFactory).setRecordInterceptor(recordInterceptor);
            return;
        }
        ((AbstractKafkaListenerContainerFactory) listenerContainerFactory)
                .setRecordInterceptor(new CompositeRecordInterceptor(existingRecordInterceptor, recordInterceptor));
    }

    private static Object readField(Object target, String name) {
        java.lang.reflect.Field field = ReflectionUtils.findField(target.getClass(), name);
        if (field == null) {
            return null;
        }
        ReflectionUtils.makeAccessible(field);
        return ReflectionUtils.getField(field, target);
    }

    private record ChainedProducerListener(
            ProducerListener<Object, Object> existing,
            ProducerListener<Object, Object> additional
    ) implements ProducerListener<Object, Object> {
        @Override
        public void onSuccess(ProducerRecord<Object, Object> producerRecord, RecordMetadata recordMetadata) {
            existing.onSuccess(producerRecord, recordMetadata);
            additional.onSuccess(producerRecord, recordMetadata);
        }

        @Override
        public void onError(ProducerRecord<Object, Object> producerRecord, RecordMetadata recordMetadata, Exception exception) {
            existing.onError(producerRecord, recordMetadata, exception);
            additional.onError(producerRecord, recordMetadata, exception);
        }
    }

    private record ChainedProducerInterceptor(
            ProducerInterceptor<Object, Object> existing,
            ProducerInterceptor<Object, Object> additional
    ) implements ProducerInterceptor<Object, Object> {
        @Override
        public ProducerRecord<Object, Object> onSend(ProducerRecord<Object, Object> record) {
            ProducerRecord<Object, Object> existingRecord = existing.onSend(record);
            return additional.onSend(existingRecord);
        }

        @Override
        public void onAcknowledgement(RecordMetadata metadata, Exception exception) {
            existing.onAcknowledgement(metadata, exception);
            additional.onAcknowledgement(metadata, exception);
        }

        @Override
        public void close() {
            existing.close();
            additional.close();
        }

        @Override
        public void configure(java.util.Map<String, ?> configs) {
            existing.configure(configs);
            additional.configure(configs);
        }
    }
}

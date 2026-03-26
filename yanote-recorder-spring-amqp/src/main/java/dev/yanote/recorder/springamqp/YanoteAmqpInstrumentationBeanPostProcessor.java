package dev.yanote.recorder.springamqp;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Collection;
import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.config.AbstractRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.AbstractMessageListenerContainer;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.util.ReflectionUtils;

class YanoteAmqpInstrumentationBeanPostProcessor implements BeanPostProcessor {
    private final YanoteAmqpEventRecorder recorder;
    private final YanoteAmqpOutboundMessagePostProcessor outboundMessagePostProcessor;
    private final YanoteAmqpInboundMessagePostProcessor inboundMessagePostProcessor;
    private final YanoteAmqpListenerAdvice listenerAdvice;

    YanoteAmqpInstrumentationBeanPostProcessor(
            YanoteAmqpEventRecorder recorder,
            YanoteAmqpOutboundMessagePostProcessor outboundMessagePostProcessor,
            YanoteAmqpInboundMessagePostProcessor inboundMessagePostProcessor,
            YanoteAmqpListenerAdvice listenerAdvice
    ) {
        this.recorder = recorder;
        this.outboundMessagePostProcessor = outboundMessagePostProcessor;
        this.inboundMessagePostProcessor = inboundMessagePostProcessor;
        this.listenerAdvice = listenerAdvice;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof RabbitTemplate rabbitTemplate) {
            instrumentRabbitTemplate(rabbitTemplate);
            return proxyRabbitTemplate(rabbitTemplate);
        }
        if (bean instanceof AbstractRabbitListenerContainerFactory<?> listenerContainerFactory) {
            return proxyListenerContainerFactory(listenerContainerFactory);
        }
        return bean;
    }

    private void instrumentRabbitTemplate(RabbitTemplate rabbitTemplate) {
        if (!containsIdentity(
                (Collection<?>) readField(rabbitTemplate, "beforePublishPostProcessors"),
                outboundMessagePostProcessor
        )) {
            rabbitTemplate.addBeforePublishPostProcessors(outboundMessagePostProcessor);
        }
    }

    private Object proxyRabbitTemplate(RabbitTemplate rabbitTemplate) {
        ProxyFactory proxyFactory = new ProxyFactory(rabbitTemplate);
        proxyFactory.setProxyTargetClass(true);
        proxyFactory.addAdvice(new RabbitTemplateSendAdvice(rabbitTemplate));
        return proxyFactory.getProxy();
    }

    private Object proxyListenerContainerFactory(AbstractRabbitListenerContainerFactory<?> listenerContainerFactory) {
        ProxyFactory proxyFactory = new ProxyFactory(listenerContainerFactory);
        proxyFactory.setProxyTargetClass(true);
        proxyFactory.addAdvice((MethodInterceptor) invocation -> {
            Object result = invocation.proceed();
            if ("createListenerContainer".equals(invocation.getMethod().getName())
                    && result instanceof AbstractMessageListenerContainer container) {
                instrumentListenerContainer(container);
            }
            return result;
        });
        return proxyFactory.getProxy();
    }

    private void instrumentListenerContainer(AbstractMessageListenerContainer container) {
        container.addAfterReceivePostProcessors(inboundMessagePostProcessor);
        org.aopalliance.aop.Advice[] existingAdvice = (org.aopalliance.aop.Advice[]) readField(container, "adviceChain");
        if (containsIdentity(existingAdvice, listenerAdvice)) {
            return;
        }
        if (existingAdvice == null) {
            existingAdvice = new org.aopalliance.aop.Advice[0];
        }
        org.aopalliance.aop.Advice[] composedAdvice = Arrays.copyOf(existingAdvice, existingAdvice.length + 1);
        composedAdvice[existingAdvice.length] = listenerAdvice;
        container.setAdviceChain(composedAdvice);
    }

    private static boolean containsIdentity(Collection<?> candidates, Object target) {
        if (candidates == null || candidates.isEmpty()) {
            return false;
        }
        for (Object candidate : candidates) {
            if (candidate == target) {
                return true;
            }
        }
        return false;
    }

    private static boolean containsIdentity(Object[] candidates, Object target) {
        if (candidates == null || candidates.length == 0) {
            return false;
        }
        for (Object candidate : candidates) {
            if (candidate == target) {
                return true;
            }
        }
        return false;
    }

    private static Object readField(Object target, String fieldName) {
        java.lang.reflect.Field field = ReflectionUtils.findField(target.getClass(), fieldName);
        if (field == null) {
            return null;
        }
        ReflectionUtils.makeAccessible(field);
        return ReflectionUtils.getField(field, target);
    }

    private final class RabbitTemplateSendAdvice implements MethodInterceptor {
        private final RabbitTemplate target;

        private RabbitTemplateSendAdvice(RabbitTemplate target) {
            this.target = target;
        }

        @Override
        public Object invoke(MethodInvocation invocation) throws Throwable {
            Method method = invocation.getMethod();
            if (!isSendMethod(method)) {
                return invocation.proceed();
            }

            SendMethodContext sendMethodContext = SendMethodContext.resolve(target, invocation.getArguments());
            YanoteAmqpSendContextHolder.start(sendMethodContext.exchange(), sendMethodContext.routingKey());
            if (sendMethodContext.message() != null) {
                YanoteAmqpSendContextHolder.capture(sendMethodContext.message());
            }
            try {
                Object result = invocation.proceed();
                YanoteAmqpSendContextHolder.PendingSendContext pending = YanoteAmqpSendContextHolder.current();
                if (pending != null && pending.message() != null) {
                    recorder.recordSend(pending.exchange(), pending.routingKey(), pending.message(), false);
                }
                return result;
            } catch (Throwable ex) {
                YanoteAmqpSendContextHolder.PendingSendContext pending = YanoteAmqpSendContextHolder.current();
                if (pending != null && pending.message() != null) {
                    recorder.recordSend(pending.exchange(), pending.routingKey(), pending.message(), true);
                }
                throw ex;
            } finally {
                YanoteAmqpSendContextHolder.clear();
            }
        }

        private boolean isSendMethod(Method method) {
            String methodName = method.getName();
            return methodName.startsWith("send")
                    || methodName.startsWith("convertAndSend")
                    || methodName.startsWith("sendAndReceive")
                    || methodName.startsWith("convertSendAndReceive");
        }
    }

    record SendMethodContext(String exchange, String routingKey, Message message) {
        static SendMethodContext resolve(RabbitTemplate rabbitTemplate, Object[] arguments) {
            String exchange = rabbitTemplate.getExchange();
            String routingKey = rabbitTemplate.getRoutingKey();
            Message message = findMessageArgument(arguments);
            if (arguments == null || arguments.length == 0) {
                return new SendMethodContext(exchange, routingKey, message);
            }
            if (arguments[0] instanceof String first) {
                if (arguments.length > 1 && arguments[1] instanceof String second) {
                    return new SendMethodContext(first, second, message);
                }
                return new SendMethodContext(exchange, first, message);
            }
            return new SendMethodContext(exchange, routingKey, message);
        }

        private static Message findMessageArgument(Object[] arguments) {
            if (arguments == null) {
                return null;
            }
            for (Object argument : arguments) {
                if (argument instanceof Message message) {
                    return message;
                }
            }
            return null;
        }
    }
}

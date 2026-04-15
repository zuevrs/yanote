package dev.yanote.recorder.springactivemq;

import jakarta.jms.Destination;
import jakarta.jms.Message;
import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;
import org.springframework.aop.Advisor;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.aop.support.DefaultPointcutAdvisor;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jms.config.AbstractJmsListenerContainerFactory;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.core.MessageCreator;
import org.springframework.jms.core.MessagePostProcessor;
import org.springframework.jms.listener.AbstractMessageListenerContainer;

class YanoteJmsInstrumentationBeanPostProcessor implements BeanPostProcessor {
    private final YanoteJmsEventRecorder recorder;
    private final YanoteJmsListenerAdvice listenerAdvice;

    YanoteJmsInstrumentationBeanPostProcessor(
            YanoteJmsEventRecorder recorder,
            YanoteJmsListenerAdvice listenerAdvice
    ) {
        this.recorder = recorder;
        this.listenerAdvice = listenerAdvice;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof JmsTemplate jmsTemplate) {
            return proxyJmsTemplate(jmsTemplate);
        }
        if (bean instanceof AbstractJmsListenerContainerFactory<?> listenerContainerFactory) {
            return proxyListenerContainerFactory(listenerContainerFactory);
        }
        return bean;
    }

    private Object proxyJmsTemplate(JmsTemplate jmsTemplate) {
        ProxyFactory proxyFactory = new ProxyFactory(jmsTemplate);
        proxyFactory.setProxyTargetClass(true);
        proxyFactory.addAdvice(new JmsTemplateSendAdvice(jmsTemplate));
        return proxyFactory.getProxy();
    }

    private Object proxyListenerContainerFactory(AbstractJmsListenerContainerFactory<?> listenerContainerFactory) {
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
        Object listener = container.getMessageListener();
        if (listener == null) {
            return;
        }
        if (listener instanceof org.springframework.aop.framework.Advised advised) {
            for (Advisor advisor : advised.getAdvisors()) {
                if (advisor.getAdvice() == listenerAdvice) {
                    return;
                }
            }
        }
        ProxyFactory proxyFactory = new ProxyFactory(listener);
        proxyFactory.setProxyTargetClass(true);
        proxyFactory.addAdvisor(new DefaultPointcutAdvisor((MethodInterceptor) invocation -> {
            Message message = findMessageArgument(invocation.getArguments());
            YanoteJmsListenerState.set(message);
            return listenerAdvice.invoke(invocation);
        }));
        container.setMessageListener(proxyFactory.getProxy());
    }

    private final class JmsTemplateSendAdvice implements MethodInterceptor {
        private final JmsTemplate target;

        private JmsTemplateSendAdvice(JmsTemplate target) {
            this.target = target;
        }

        @Override
        public Object invoke(MethodInvocation invocation) throws Throwable {
            String methodName = invocation.getMethod().getName();
            return switch (methodName) {
                case "send" -> invokeSend(invocation.getArguments());
                case "convertAndSend" -> invokeConvertAndSend(invocation.getArguments());
                default -> invocation.proceed();
            };
        }

        private Object invokeSend(Object[] arguments) throws Throwable {
            if (arguments == null || arguments.length == 0) {
                return null;
            }
            Object destinationHint = resolveDestinationHint(arguments, true);
            MessageCreator delegate = findMessageCreator(arguments);
            if (delegate == null) {
                throw new IllegalStateException("Expected Spring JMS send method to provide a MessageCreator argument.");
            }
            YanoteJmsSendContextHolder.start(destinationHint);
            try {
                MessageCreator wrapped = wrapMessageCreator(delegate);
                switch (arguments.length) {
                    case 1 -> target.send(wrapped);
                    case 2 -> {
                        if (arguments[0] instanceof Destination destination) {
                            target.send(destination, wrapped);
                        } else if (arguments[0] instanceof String destinationName) {
                            target.send(destinationName, wrapped);
                        } else {
                            throw unsupportedSendArguments(arguments);
                        }
                    }
                    default -> throw unsupportedSendArguments(arguments);
                }
                recordPendingSend(false);
                return null;
            } catch (Throwable ex) {
                recordPendingSend(true);
                throw ex;
            } finally {
                YanoteJmsSendContextHolder.clear();
            }
        }

        private Object invokeConvertAndSend(Object[] arguments) throws Throwable {
            if (arguments == null || arguments.length == 0) {
                return null;
            }
            Object destinationHint = resolveDestinationHint(arguments, false);
            MessagePostProcessor existingPostProcessor = findMessagePostProcessor(arguments);
            MessagePostProcessor wrappingPostProcessor = message -> {
                YanoteJmsHeaders.applyContextIfAbsent(message);
                Message processed = existingPostProcessor == null ? message : existingPostProcessor.postProcessMessage(message);
                if (processed != null) {
                    YanoteJmsSendContextHolder.capture(processed);
                }
                return processed;
            };
            YanoteJmsSendContextHolder.start(destinationHint);
            try {
                switch (arguments.length) {
                    case 1 -> target.convertAndSend(arguments[0], wrappingPostProcessor);
                    case 2 -> {
                        if (arguments[0] instanceof Destination destination) {
                            target.convertAndSend(destination, arguments[1], wrappingPostProcessor);
                        } else if (arguments[0] instanceof String destinationName) {
                            target.convertAndSend(destinationName, arguments[1], wrappingPostProcessor);
                        } else {
                            target.convertAndSend(arguments[0], wrappingPostProcessor);
                        }
                    }
                    case 3 -> {
                        if (arguments[0] instanceof Destination destination) {
                            target.convertAndSend(destination, arguments[1], wrappingPostProcessor);
                        } else if (arguments[0] instanceof String destinationName) {
                            target.convertAndSend(destinationName, arguments[1], wrappingPostProcessor);
                        } else {
                            throw unsupportedSendArguments(arguments);
                        }
                    }
                    default -> throw unsupportedSendArguments(arguments);
                }
                recordPendingSend(false);
                return null;
            } catch (Throwable ex) {
                recordPendingSend(true);
                throw ex;
            } finally {
                YanoteJmsSendContextHolder.clear();
            }
        }

        private MessageCreator wrapMessageCreator(MessageCreator delegate) {
            return session -> {
                Message message = delegate.createMessage(session);
                if (message != null) {
                    YanoteJmsHeaders.applyContextIfAbsent(message);
                    YanoteJmsSendContextHolder.capture(message);
                }
                return message;
            };
        }

        private void recordPendingSend(boolean error) {
            YanoteJmsSendContextHolder.PendingSendContext pending = YanoteJmsSendContextHolder.current();
            if (pending != null && pending.message() != null) {
                recorder.recordSend(pending.destinationHint(), pending.message(), error);
            }
        }

        private Object resolveDestinationHint(Object[] arguments, boolean messageCreatorBased) {
            if (arguments == null || arguments.length == 0) {
                return defaultDestinationHint();
            }
            Object first = arguments[0];
            if (first instanceof Destination || first instanceof String) {
                return first;
            }
            if (messageCreatorBased && first instanceof MessageCreator) {
                return defaultDestinationHint();
            }
            if (!messageCreatorBased && !(first instanceof Destination) && !(first instanceof String)) {
                return defaultDestinationHint();
            }
            return defaultDestinationHint();
        }

        private Object defaultDestinationHint() {
            return target.getDefaultDestination() != null ? target.getDefaultDestination() : target.getDefaultDestinationName();
        }

        private IllegalStateException unsupportedSendArguments(Object[] arguments) {
            return new IllegalStateException("Unsupported Spring JMS send signature for recorder instrumentation: " + java.util.Arrays.toString(arguments));
        }
    }

    private static MessageCreator findMessageCreator(Object[] arguments) {
        if (arguments == null) {
            return null;
        }
        for (Object argument : arguments) {
            if (argument instanceof MessageCreator creator) {
                return creator;
            }
        }
        return null;
    }

    private static MessagePostProcessor findMessagePostProcessor(Object[] arguments) {
        if (arguments == null) {
            return null;
        }
        for (Object argument : arguments) {
            if (argument instanceof MessagePostProcessor processor) {
                return processor;
            }
        }
        return null;
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

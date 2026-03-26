package dev.yanote.recorder.springamqp;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.concurrent.atomic.AtomicInteger;
import org.aopalliance.aop.Advice;
import org.aopalliance.intercept.MethodInterceptor;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerEndpoint;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.AbstractMessageListenerContainer;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.ReflectionUtils;
import dev.yanote.core.testmetadata.TestMetadataContextHolder;

class AmqpRecorderAutoConfigurationTest {

    @Test
    void shouldStayDisabledByDefault() {
        newContextRunner(TestAmqpConfiguration.class).run(context -> {
            assertThat(context).doesNotHaveBean(YanoteAmqpEventRecorder.class);
            assertThat(context).doesNotHaveBean(YanoteAmqpInstrumentationBeanPostProcessor.class);
        });
    }

    @Test
    void shouldFailLoudlyWhenSpringAmqpSeamsDrift() {
        assertMethod(RabbitTemplate.class, "addBeforePublishPostProcessors", MessagePostProcessor[].class);
        assertField(RabbitTemplate.class, "beforePublishPostProcessors", Collection.class);
        assertMethod(AbstractMessageListenerContainer.class, "addAfterReceivePostProcessors", MessagePostProcessor[].class);
        assertField(AbstractMessageListenerContainer.class, "adviceChain", Advice[].class);
        assertField(AbstractMessageListenerContainer.class, "afterReceivePostProcessors", Collection.class);
    }

    @Test
    void shouldAttachTemplateAndListenerHooksWhenEnabled() {
        newContextRunner(TestAmqpConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=auto-config-service"
                )
                .run(context -> {
                    RabbitTemplate rabbitTemplate = context.getBean(RabbitTemplate.class);
                    Collection<MessagePostProcessor> beforePublishPostProcessors =
                            (Collection<MessagePostProcessor>) ReflectionTestUtils.getField(
                                    rabbitTemplate,
                                    "beforePublishPostProcessors"
                            );
                    assertThat(beforePublishPostProcessors)
                            .isNotNull()
                            .anyMatch(YanoteAmqpOutboundMessagePostProcessor.class::isInstance);
                    assertThat(context).hasSingleBean(YanoteAmqpEventRecorder.class);

                    SimpleRabbitListenerContainerFactory listenerContainerFactory =
                            context.getBean(SimpleRabbitListenerContainerFactory.class);
                    AbstractMessageListenerContainer container = listenerContainerFactory.createListenerContainer(endpoint());
                    Advice[] adviceChain = (Advice[]) ReflectionTestUtils.getField(container, "adviceChain");
                    assertThat(adviceChain)
                            .isNotNull()
                            .anyMatch(YanoteAmqpListenerAdvice.class::isInstance);
                });
    }

    @Test
    void shouldComposeExistingRabbitHooksWithoutDroppingRecorderInstrumentation() {
        newContextRunner(ExistingHooksAmqpConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=auto-config-service"
                )
                .run(context -> {
                    ExistingHookProbe probe = context.getBean(ExistingHookProbe.class);
                    RabbitTemplate rabbitTemplate = context.getBean(RabbitTemplate.class);

                    Message message = message("payload", "orders.events", null);
                    TestMetadataContextHolder.set("run-chain", "suite-chain");
                    Collection<MessagePostProcessor> beforePublishPostProcessors =
                            (Collection<MessagePostProcessor>) ReflectionTestUtils.getField(
                                    rabbitTemplate,
                                    "beforePublishPostProcessors"
                            );
                    assertThat(beforePublishPostProcessors).isNotNull();
                    for (MessagePostProcessor processor : beforePublishPostProcessors) {
                        message = processor.postProcessMessage(message);
                    }

                    assertThat(probe.templatePostProcessorInvocations.get()).isEqualTo(1);
                    assertThat(YanoteAmqpHeaders.readTestRunId(message.getMessageProperties())).isEqualTo("run-chain");
                    assertThat(YanoteAmqpHeaders.readTestSuite(message.getMessageProperties())).isEqualTo("suite-chain");
                    assertThat(message.getMessageProperties().getHeaders()).containsEntry("existing.header", "present");

                    SimpleRabbitListenerContainerFactory listenerContainerFactory =
                            context.getBean(SimpleRabbitListenerContainerFactory.class);
                    AbstractMessageListenerContainer container = listenerContainerFactory.createListenerContainer(endpoint());
                    assertThat(probe.containerCustomizerInvocations.get()).isEqualTo(1);
                    Advice[] adviceChain = (Advice[]) ReflectionTestUtils.getField(container, "adviceChain");
                    assertThat(adviceChain).isNotNull().hasSize(2);
                    assertThat(adviceChain[0]).isSameAs(context.getBean("existingAdvice", Advice.class));
                    assertThat(adviceChain[1]).isInstanceOf(YanoteAmqpListenerAdvice.class);

                    Object afterReceivePostProcessors = ReflectionTestUtils.getField(container, "afterReceivePostProcessors");
                    assertThat(afterReceivePostProcessors)
                            .asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.collection(MessagePostProcessor.class))
                            .anyMatch(ExistingInboundPostProcessor.class::isInstance)
                            .anyMatch(YanoteAmqpInboundMessagePostProcessor.class::isInstance);
                });
    }

    @SafeVarargs
    private static ApplicationContextRunner newContextRunner(Class<?>... userConfigurations) {
        return new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(YanoteAmqpRecorderAutoConfiguration.class))
                .withUserConfiguration(userConfigurations);
    }

    private static void assertMethod(Class<?> owner, String methodName, Class<?>... parameterTypes) {
        try {
            java.lang.reflect.Method method = owner.getMethod(methodName, parameterTypes);
            assertThat(method)
                    .withFailMessage("Expected Spring AMQP seam %s#%s to remain available.", owner.getName(), methodName)
                    .isNotNull();
        } catch (NoSuchMethodException ex) {
            throw new AssertionError(
                    "Spring AMQP seam drifted: expected method " + owner.getName() + "#" + methodName,
                    ex
            );
        }
    }

    private static void assertField(Class<?> owner, String fieldName, Class<?> expectedType) {
        Field field = ReflectionUtils.findField(owner, fieldName);
        assertThat(field)
                .withFailMessage("Expected Spring AMQP seam field %s#%s to remain available.", owner.getName(), fieldName)
                .isNotNull();
        assertThat(field.getType())
                .withFailMessage(
                        "Expected Spring AMQP seam field %s#%s to be assignable to %s but was %s.",
                        owner.getName(),
                        fieldName,
                        expectedType.getName(),
                        field.getType().getName()
                )
                .isAssignableTo(expectedType);
    }

    private static SimpleRabbitListenerEndpoint endpoint() {
        SimpleRabbitListenerEndpoint endpoint = new SimpleRabbitListenerEndpoint();
        endpoint.setId("yanote-amqp-test-endpoint");
        endpoint.setQueueNames("orders.events");
        endpoint.setMessageListener(message -> {
            // no-op
        });
        return endpoint;
    }

    private static Message message(String payload, String routingKey, String consumerQueue) {
        MessageProperties properties = new MessageProperties();
        properties.setContentType(MessageProperties.CONTENT_TYPE_TEXT_PLAIN);
        properties.setReceivedRoutingKey(routingKey);
        properties.setConsumerQueue(consumerQueue);
        return new Message(payload.getBytes(StandardCharsets.UTF_8), properties);
    }

    @Configuration(proxyBeanMethods = false)
    static class TestAmqpConfiguration {
        @Bean
        ConnectionFactory connectionFactory() {
            return org.mockito.Mockito.mock(ConnectionFactory.class);
        }

        @Bean
        RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
            RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
            rabbitTemplate.setExchange("events.exchange");
            rabbitTemplate.setRoutingKey("orders.events");
            return rabbitTemplate;
        }

        @Bean
        SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory) {
            SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
            factory.setConnectionFactory(connectionFactory);
            return factory;
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class ExistingHooksAmqpConfiguration {
        @Bean
        ExistingHookProbe existingHookProbe() {
            return new ExistingHookProbe();
        }

        @Bean
        ConnectionFactory connectionFactory() {
            return org.mockito.Mockito.mock(ConnectionFactory.class);
        }

        @Bean
        ExistingBeforePublishPostProcessor existingBeforePublishPostProcessor(ExistingHookProbe probe) {
            return new ExistingBeforePublishPostProcessor(probe);
        }

        @Bean
        RabbitTemplate rabbitTemplate(
                ConnectionFactory connectionFactory,
                ExistingBeforePublishPostProcessor existingBeforePublishPostProcessor
        ) {
            RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
            rabbitTemplate.setExchange("events.exchange");
            rabbitTemplate.setRoutingKey("orders.events");
            rabbitTemplate.addBeforePublishPostProcessors(existingBeforePublishPostProcessor);
            return rabbitTemplate;
        }

        @Bean
        ExistingInboundPostProcessor existingInboundPostProcessor(ExistingHookProbe probe) {
            return new ExistingInboundPostProcessor(probe);
        }

        @Bean("existingAdvice")
        Advice existingAdvice(ExistingHookProbe probe) {
            return (MethodInterceptor) invocation -> {
                probe.listenerAdviceInvocations.incrementAndGet();
                return invocation.proceed();
            };
        }

        @Bean
        SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
                ConnectionFactory connectionFactory,
                ExistingInboundPostProcessor existingInboundPostProcessor,
                @Qualifier("existingAdvice") Advice existingAdvice,
                ExistingHookProbe probe
        ) {
            SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
            factory.setConnectionFactory(connectionFactory);
            factory.setContainerCustomizer(container -> {
                probe.containerCustomizerInvocations.incrementAndGet();
                container.addAfterReceivePostProcessors(existingInboundPostProcessor);
                container.setAdviceChain(existingAdvice);
            });
            return factory;
        }
    }

    static class ExistingHookProbe {
        private final AtomicInteger templatePostProcessorInvocations = new AtomicInteger();
        private final AtomicInteger containerCustomizerInvocations = new AtomicInteger();
        private final AtomicInteger listenerAdviceInvocations = new AtomicInteger();
    }

    static final class ExistingBeforePublishPostProcessor implements MessagePostProcessor {
        private final ExistingHookProbe probe;

        ExistingBeforePublishPostProcessor(ExistingHookProbe probe) {
            this.probe = probe;
        }

        @Override
        public Message postProcessMessage(Message message) {
            probe.templatePostProcessorInvocations.incrementAndGet();
            message.getMessageProperties().setHeader("existing.header", "present");
            return message;
        }
    }

    static final class ExistingInboundPostProcessor implements MessagePostProcessor {
        private final ExistingHookProbe probe;

        ExistingInboundPostProcessor(ExistingHookProbe probe) {
            this.probe = probe;
        }

        @Override
        public Message postProcessMessage(Message message) {
            probe.listenerAdviceInvocations.incrementAndGet();
            return message;
        }
    }
}

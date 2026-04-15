package dev.yanote.recorder.springactivemq;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.jms.ConnectionFactory;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.config.AbstractJmsListenerContainerFactory;
import org.springframework.jms.config.DefaultJmsListenerContainerFactory;
import org.springframework.jms.config.JmsListenerEndpoint;
import org.springframework.jms.config.SimpleJmsListenerEndpoint;
import org.springframework.jms.core.JmsTemplate;

class ActiveMqRecorderAutoConfigurationTest {

    @Test
    void shouldStayDisabledByDefault() {
        newContextRunner(TestJmsConfiguration.class).run(context -> {
            assertThat(context).doesNotHaveBean(YanoteJmsEventRecorder.class);
            assertThat(context).doesNotHaveBean(YanoteJmsInstrumentationBeanPostProcessor.class);
        });
    }

    @Test
    void shouldFailLoudlyWhenSpringJmsSeamsDrift() {
        assertMethod(JmsTemplate.class, "send", jakarta.jms.Destination.class, org.springframework.jms.core.MessageCreator.class);
        assertMethod(JmsTemplate.class, "convertAndSend", String.class, Object.class);
        assertMethod(AbstractJmsListenerContainerFactory.class, "createListenerContainer", JmsListenerEndpoint.class);
    }

    @Test
    void shouldAttachTemplateAndListenerHooksWhenEnabled() {
        newContextRunner(TestJmsConfiguration.class)
                .withPropertyValues(
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=auto-config-service"
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(YanoteJmsEventRecorder.class);
                    assertThat(context).hasSingleBean(YanoteJmsInstrumentationBeanPostProcessor.class);
                    assertThat(context).hasSingleBean(YanoteJmsListenerAdvice.class);

                    JmsTemplate jmsTemplate = context.getBean(JmsTemplate.class);
                    assertThat(AopUtils.isAopProxy(jmsTemplate)).isTrue();

                    DefaultJmsListenerContainerFactory listenerContainerFactory =
                            context.getBean(DefaultJmsListenerContainerFactory.class);
                    assertThat(AopUtils.isAopProxy(listenerContainerFactory)).isTrue();
                    assertThat(listenerContainerFactory.createListenerContainer(endpoint())).isNotNull();
                });
    }

    private static ApplicationContextRunner newContextRunner(Class<?>... userConfigurations) {
        return new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(YanoteActiveMqRecorderAutoConfiguration.class))
                .withUserConfiguration(userConfigurations);
    }

    private static void assertMethod(Class<?> owner, String methodName, Class<?>... parameterTypes) {
        try {
            Method method = owner.getMethod(methodName, parameterTypes);
            assertThat(method)
                    .withFailMessage("Expected Spring JMS seam %s#%s to remain available.", owner.getName(), methodName)
                    .isNotNull();
        } catch (NoSuchMethodException ex) {
            throw new AssertionError(
                    "Spring JMS seam drifted: expected method " + owner.getName() + "#" + methodName,
                    ex
            );
        }
    }

    private static SimpleJmsListenerEndpoint endpoint() {
        SimpleJmsListenerEndpoint endpoint = new SimpleJmsListenerEndpoint();
        endpoint.setId("yanote-jms-test-endpoint");
        endpoint.setDestination("orders.queue");
        endpoint.setMessageListener(message -> {
            // no-op
        });
        return endpoint;
    }

    @Configuration(proxyBeanMethods = false)
    static class TestJmsConfiguration {
        @Bean
        ConnectionFactory connectionFactory() {
            return org.mockito.Mockito.mock(ConnectionFactory.class);
        }

        @Bean
        JmsTemplate jmsTemplate(ConnectionFactory connectionFactory) {
            return new JmsTemplate(connectionFactory);
        }

        @Bean
        DefaultJmsListenerContainerFactory jmsListenerContainerFactory(ConnectionFactory connectionFactory) {
            DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
            factory.setConnectionFactory(connectionFactory);
            return factory;
        }
    }
}

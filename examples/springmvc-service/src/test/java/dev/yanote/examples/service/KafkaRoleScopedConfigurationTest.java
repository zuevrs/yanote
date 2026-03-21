package dev.yanote.examples.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

class KafkaRoleScopedConfigurationTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withPropertyValues("spring.autoconfigure.exclude=" + KafkaAutoConfiguration.class.getName())
            .withUserConfiguration(ExampleServiceApplication.class, TestKafkaConfiguration.class);

    @Test
    void producerOnlyRoleBootsWithoutListenerBeansOrRepublishPath() {
        contextRunner
                .withPropertyValues(
                        "server.port=18081",
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=producer-role-service",
                        "example.kafka.roles.producer.enabled=true",
                        "example.kafka.roles.listeners.enabled=false",
                        "example.kafka.roles.republish.enabled=false"
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(ExampleServiceApplication.UserCreatedPublisher.class);
                    assertThat(context).doesNotHaveBean(ExampleServiceApplication.UserRepublishedPublisher.class);
                    assertThat(context).doesNotHaveBean(ExampleServiceApplication.UserCreatedListener.class);
                    assertThat(context).doesNotHaveBean(ExampleServiceApplication.UserRepublishedListener.class);
                    assertThat(context).hasBean("userEventsTopic");
                    assertThat(context).doesNotHaveBean("userRepublishedTopic");

                    KafkaListenerEndpointRegistry registry = context.getBean(KafkaListenerEndpointRegistry.class);
                    assertThat(registry.getListenerContainer(ExampleServiceApplication.USER_CREATED_LISTENER_ID)).isNull();
                    assertThat(registry.getListenerContainer(ExampleServiceApplication.USER_REPUBLISHED_LISTENER_ID)).isNull();

                    assertThat(context.getEnvironment().getProperty("yanote.recorder.service-name"))
                            .isEqualTo("producer-role-service");
                    assertThat(context.getEnvironment().getProperty("yanote.recorder.events-path"))
                            .isEqualTo("/data/yanote/producer-role-service-18081.events.jsonl");
                    assertThat(context.getEnvironment().getProperty("spring.kafka.consumer.group-id"))
                            .isEqualTo("producer-role-service-group");
                });
    }

    @Test
    void consumerOnlyRoleBootsWithReceivePathOnlyAndDistinctRuntimeSurface() {
        contextRunner
                .withPropertyValues(
                        "server.port=18082",
                        "yanote.recorder.enabled=true",
                        "yanote.recorder.service-name=consumer-role-service",
                        "spring.kafka.consumer.group-id=consumer-role-group",
                        "example.kafka.roles.producer.enabled=false",
                        "example.kafka.roles.listeners.enabled=true",
                        "example.kafka.roles.listeners.user-created.enabled=true",
                        "example.kafka.roles.listeners.user-republished.enabled=false",
                        "example.kafka.roles.republish.enabled=false"
                )
                .run(context -> {
                    assertThat(context).doesNotHaveBean(ExampleServiceApplication.UserCreatedPublisher.class);
                    assertThat(context).doesNotHaveBean(ExampleServiceApplication.UserRepublishedPublisher.class);
                    assertThat(context).hasSingleBean(ExampleServiceApplication.UserCreatedListener.class);
                    assertThat(context).doesNotHaveBean(ExampleServiceApplication.UserRepublishedListener.class);
                    assertThat(context).hasBean("userEventsTopic");
                    assertThat(context).doesNotHaveBean("userRepublishedTopic");

                    KafkaListenerEndpointRegistry registry = context.getBean(KafkaListenerEndpointRegistry.class);
                    assertThat(registry.getListenerContainer(ExampleServiceApplication.USER_CREATED_LISTENER_ID)).isNotNull();
                    assertThat(registry.getListenerContainer(ExampleServiceApplication.USER_REPUBLISHED_LISTENER_ID)).isNull();

                    assertThat(context.getEnvironment().getProperty("yanote.recorder.service-name"))
                            .isEqualTo("consumer-role-service");
                    assertThat(context.getEnvironment().getProperty("yanote.recorder.events-path"))
                            .isEqualTo("/data/yanote/consumer-role-service-18082.events.jsonl");
                    assertThat(context.getEnvironment().getProperty("spring.kafka.consumer.group-id"))
                            .isEqualTo("consumer-role-group");
                });
    }

    @Configuration(proxyBeanMethods = false)
    static class TestKafkaConfiguration {
        @Bean
        ProducerFactory<String, Object> producerFactory() {
            return new DefaultKafkaProducerFactory<>(Map.of(
                    ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092",
                    ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                    ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class
            ));
        }

        @Bean
        KafkaTemplate<String, Object> kafkaTemplate(ProducerFactory<String, Object> producerFactory) {
            return new KafkaTemplate<>(producerFactory);
        }

        @Bean
        ConsumerFactory<String, Object> consumerFactory() {
            return new DefaultKafkaConsumerFactory<>(Map.of(
                    ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092",
                    ConsumerConfig.GROUP_ID_CONFIG, "yanote-example-config-test",
                    ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                    ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
                    ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class,
                    JsonDeserializer.TRUSTED_PACKAGES, "dev.yanote.examples.service"
            ));
        }

        @Bean
        ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory(
                ConsumerFactory<String, Object> consumerFactory
        ) {
            ConcurrentKafkaListenerContainerFactory<String, Object> factory =
                    new ConcurrentKafkaListenerContainerFactory<>();
            factory.setConsumerFactory(consumerFactory);
            factory.setAutoStartup(false);
            return factory;
        }
    }
}

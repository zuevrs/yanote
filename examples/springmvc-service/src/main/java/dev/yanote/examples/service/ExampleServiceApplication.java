package dev.yanote.examples.service;

import dev.yanote.recorder.springkafka.YanoteKafkaContextHolder;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableKafka
public class ExampleServiceApplication {
    static final String USER_EVENTS_TOPIC = "users.created";
    static final String USER_CREATED_MESSAGE = "UserCreated";
    static final String RUN_ID_HEADER = "X-Test-Run-Id";
    static final String SUITE_HEADER = "X-Test-Suite";

    public static void main(String[] args) {
        SpringApplication.run(ExampleServiceApplication.class, args);
    }

    @Bean
    @ConditionalOnProperty(name = "example.kafka.enabled", havingValue = "true")
    NewTopic userEventsTopic() {
        return TopicBuilder.name(USER_EVENTS_TOPIC).partitions(1).replicas(1).build();
    }

    @Bean
    @ConditionalOnProperty(name = "example.kafka.enabled", havingValue = "true")
    UserCreatedPublisher userCreatedPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        return new UserCreatedPublisher(kafkaTemplate);
    }

    @Bean
    @ConditionalOnProperty(name = "example.kafka.enabled", havingValue = "true")
    UserCreatedListener userCreatedListener() {
        return new UserCreatedListener();
    }

    @RestController
    @RequestMapping
    static class DemoController {
        private final ObjectProvider<UserCreatedPublisher> userCreatedPublisher;

        DemoController(ObjectProvider<UserCreatedPublisher> userCreatedPublisher) {
            this.userCreatedPublisher = userCreatedPublisher;
        }

        @GetMapping("/health")
        public String health() {
            return "ok";
        }

        @GetMapping("/users")
        public String[] users() {
            return new String[] {"alice", "bob"};
        }

        @GetMapping("/users/{id}")
        public String getUser(@PathVariable("id") String id) {
            return "user:" + id;
        }

        @PostMapping("/users")
        public String createUser(
                @RequestBody(required = false) String body,
                @RequestHeader(value = RUN_ID_HEADER, required = false) String runId,
                @RequestHeader(value = SUITE_HEADER, required = false) String suite
        ) {
            String normalizedBody = body == null ? "unknown" : body;
            UserCreatedPublisher publisher = userCreatedPublisher.getIfAvailable();
            if (publisher != null) {
                publisher.publish(normalizedBody, runId, suite);
            }
            return "created:" + normalizedBody;
        }

        @GetMapping("/admin/ping")
        public String adminPing() {
            return "pong";
        }
    }

    static class UserCreatedPublisher {
        private final KafkaTemplate<String, String> kafkaTemplate;

        UserCreatedPublisher(KafkaTemplate<String, String> kafkaTemplate) {
            this.kafkaTemplate = kafkaTemplate;
        }

        void publish(String payload, String runId, String suite) {
            YanoteKafkaContextHolder.set(runId, suite, USER_CREATED_MESSAGE);
            try {
                ProducerRecord<String, String> record = new ProducerRecord<>(USER_EVENTS_TOPIC, payload);
                kafkaTemplate.send(record).get(10, TimeUnit.SECONDS);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while publishing Kafka example event", ex);
            } catch (ExecutionException | TimeoutException ex) {
                throw new IllegalStateException("Failed to publish Kafka example event", ex);
            } finally {
                YanoteKafkaContextHolder.clear();
            }
        }
    }

    static class UserCreatedListener {
        @KafkaListener(topics = USER_EVENTS_TOPIC)
        void handle(String payload) {
            if (payload == null) {
                throw new IllegalArgumentException("payload must not be null");
            }
        }
    }
}

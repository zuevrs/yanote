package dev.yanote.examples.service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableKafka
public class ExampleServiceApplication {
    static final String USER_EVENTS_TOPIC = "users.created";
    static final String USER_REPUBLISHED_TOPIC = "users.created.republished";
    static final String USER_CREATED_MESSAGE = "UserCreated";
    static final String USER_REPUBLISHED_MESSAGE = "UserRepublished";
    static final String RUN_ID_HEADER = "X-Test-Run-Id";
    static final String SUITE_HEADER = "X-Test-Suite";
    static final String USER_CREATED_LISTENER_ID = "example-user-created-listener";
    static final String USER_REPUBLISHED_LISTENER_ID = "example-user-republished-listener";
    static final String CORRELATION_ID_HEADER = "correlation_id";
    static final String REPLY_TO_HEADER = "reply_to";

    private static final String YANOTE_MESSAGE_HEADER = "yanote.message";

    public static void main(String[] args) {
        SpringApplication.run(ExampleServiceApplication.class, args);
    }

    static String proofCorrelationId(String messageHint) {
        return messageHint + "-proof-correlation";
    }

    static String proofReplyAddress(String topic) {
        return topic;
    }

    @Bean
    @ConditionalOnExpression(
            "'${example.kafka.roles.producer.enabled:false}' == 'true'"
                    + " or '${example.kafka.roles.listeners.user-created.enabled:false}' == 'true'"
    )
    NewTopic userEventsTopic(
            @Value("${example.kafka.topics.user-created:" + USER_EVENTS_TOPIC + "}") String topic
    ) {
        return TopicBuilder.name(topic).partitions(1).replicas(1).build();
    }

    @Bean
    @ConditionalOnExpression(
            "'${example.kafka.roles.republish.enabled:false}' == 'true'"
                    + " or '${example.kafka.roles.listeners.user-republished.enabled:false}' == 'true'"
    )
    NewTopic userRepublishedTopic(
            @Value("${example.kafka.topics.user-republished:" + USER_REPUBLISHED_TOPIC + "}") String topic
    ) {
        return TopicBuilder.name(topic).partitions(1).replicas(1).build();
    }

    @Bean
    @ConditionalOnProperty(name = "example.kafka.roles.producer.enabled", havingValue = "true")
    UserCreatedPublisher userCreatedPublisher(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${example.kafka.topics.user-created:" + USER_EVENTS_TOPIC + "}") String topic
    ) {
        return new UserCreatedPublisher(new KafkaMessagePublisher(kafkaTemplate, topic, USER_CREATED_MESSAGE));
    }

    @Bean
    @ConditionalOnProperty(name = "example.kafka.roles.republish.enabled", havingValue = "true")
    UserRepublishedPublisher userRepublishedPublisher(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${example.kafka.topics.user-republished:" + USER_REPUBLISHED_TOPIC + "}") String topic
    ) {
        return new UserRepublishedPublisher(new KafkaMessagePublisher(kafkaTemplate, topic, USER_REPUBLISHED_MESSAGE));
    }

    @Bean
    @ConditionalOnProperty(name = "example.kafka.roles.listeners.user-created.enabled", havingValue = "true")
    UserCreatedListener userCreatedListener(ObjectProvider<UserRepublishedPublisher> republishedPublisher) {
        return new UserCreatedListener(republishedPublisher);
    }

    @Bean
    @ConditionalOnProperty(name = "example.kafka.roles.listeners.user-republished.enabled", havingValue = "true")
    UserRepublishedListener userRepublishedListener() {
        return new UserRepublishedListener();
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

        @PostMapping(
                path = "/users",
                consumes = MediaType.APPLICATION_JSON_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE
        )
        @ResponseStatus(HttpStatus.CREATED)
        public CreateUserResponse createUser(@RequestBody CreateUserRequest requestBody) {
            String normalizedName = requestBody.normalizedName();
            String normalizedEmail = requestBody.normalizedEmail();
            CreateUserRequest kafkaPayload = new CreateUserRequest(normalizedName, normalizedEmail);
            UserCreatedPublisher publisher = userCreatedPublisher.getIfAvailable();
            if (publisher != null) {
                publisher.publish(kafkaPayload);
            }
            return new CreateUserResponse(
                    "user-" + normalizedName.toLowerCase(Locale.ROOT),
                    normalizedName,
                    normalizedEmail,
                    true
            );
        }

        @GetMapping("/admin/ping")
        public String adminPing() {
            return "pong";
        }

        @GetMapping(path = "/request-evidence/users/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
        public RequestEvidenceProbeResponse requestEvidenceProbe(
                @PathVariable("userId") String userId,
                @RequestParam("expand") boolean expand,
                @RequestParam("tags") List<String> tags,
                @RequestParam(value = "meta", required = false) String meta,
                @RequestParam(value = "oversizedHint", required = false) String oversizedHint,
                @RequestHeader("X-Request-Flavor") String requestFlavor,
                @RequestHeader(value = "Authorization", required = false) String authorization,
                @CookieValue("clientMode") String clientMode,
                @CookieValue(value = "SESSION", required = false) String session
        ) {
            return new RequestEvidenceProbeResponse(
                    userId,
                    expand,
                    requestFlavor,
                    clientMode,
                    authorization != null && !authorization.isBlank(),
                    session != null && !session.isBlank(),
                    oversizedHint == null ? 0 : oversizedHint.length(),
                    List.copyOf(tags),
                    meta != null && !meta.isBlank()
            );
        }
    }

    static class UserCreatedPublisher {
        private final KafkaMessagePublisher publisher;

        UserCreatedPublisher(KafkaMessagePublisher publisher) {
            this.publisher = publisher;
        }

        void publish(CreateUserRequest payload) {
            publisher.publish(payload);
        }
    }

    record CreateUserRequest(String name, String email) {
        String normalizedName() {
            return name == null || name.isBlank() ? "unknown" : name.trim();
        }

        String normalizedEmail() {
            return email == null || email.isBlank() ? normalizedName() + "@example.com" : email.trim();
        }
    }

    record CreateUserResponse(String id, String name, String email, boolean created) {
    }

    record RequestEvidenceProbeResponse(
            String userId,
            boolean expand,
            String requestFlavor,
            String clientMode,
            boolean authorizationProvided,
            boolean sessionProvided,
            int oversizedHintLength,
            List<String> tags,
            boolean metaProvided
    ) {
    }

    static class UserRepublishedPublisher {
        private final KafkaMessagePublisher publisher;

        UserRepublishedPublisher(KafkaMessagePublisher publisher) {
            this.publisher = publisher;
        }

        void publish(CreateUserRequest payload) {
            publisher.publish(payload);
        }
    }

    static class UserCreatedListener {
        private final ObjectProvider<UserRepublishedPublisher> republishedPublisher;

        UserCreatedListener(ObjectProvider<UserRepublishedPublisher> republishedPublisher) {
            this.republishedPublisher = republishedPublisher;
        }

        @KafkaListener(
                id = USER_CREATED_LISTENER_ID,
                topics = "${example.kafka.topics.user-created:users.created}",
                autoStartup = "${example.kafka.roles.listeners.user-created.enabled:false}"
        )
        void handle(CreateUserRequest payload) {
            if (payload == null) {
                throw new IllegalArgumentException("payload must not be null");
            }
            UserRepublishedPublisher publisher = republishedPublisher.getIfAvailable();
            if (publisher != null) {
                publisher.publish(payload);
            }
        }
    }

    static class UserRepublishedListener {
        @KafkaListener(
                id = USER_REPUBLISHED_LISTENER_ID,
                topics = "${example.kafka.topics.user-republished:users.created.republished}",
                autoStartup = "${example.kafka.roles.listeners.user-republished.enabled:false}"
        )
        void handle(CreateUserRequest payload) {
            if (payload == null) {
                throw new IllegalArgumentException("payload must not be null");
            }
        }
    }

    static class KafkaMessagePublisher {
        private final KafkaTemplate<String, Object> kafkaTemplate;
        private final String topic;
        private final String messageHint;

        KafkaMessagePublisher(KafkaTemplate<String, Object> kafkaTemplate, String topic, String messageHint) {
            this.kafkaTemplate = kafkaTemplate;
            this.topic = topic;
            this.messageHint = messageHint;
        }

        void publish(Object payload) {
            try {
                ProducerRecord<String, Object> record = new ProducerRecord<>(topic, payload);
                record.headers().add(new RecordHeader(
                        YANOTE_MESSAGE_HEADER,
                        messageHint.getBytes(StandardCharsets.UTF_8)
                ));
                record.headers().add(new RecordHeader(
                        CORRELATION_ID_HEADER,
                        proofCorrelationId(messageHint).getBytes(StandardCharsets.UTF_8)
                ));
                record.headers().add(new RecordHeader(
                        REPLY_TO_HEADER,
                        proofReplyAddress(topic).getBytes(StandardCharsets.UTF_8)
                ));
                kafkaTemplate.send(record).get(10, TimeUnit.SECONDS);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while publishing Kafka example event", ex);
            } catch (ExecutionException | TimeoutException ex) {
                throw new IllegalStateException("Failed to publish Kafka example event", ex);
            }
        }
    }
}

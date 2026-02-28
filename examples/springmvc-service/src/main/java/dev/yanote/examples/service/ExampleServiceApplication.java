package dev.yanote.examples.service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class ExampleServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExampleServiceApplication.class, args);
    }

    @RestController
    @RequestMapping
    static class DemoController {

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
        public String createUser(@RequestBody(required = false) String body) {
            return "created:" + (body == null ? "unknown" : body);
        }

        @GetMapping("/admin/ping")
        public String adminPing() {
            return "pong";
        }
    }
}

package dev.yanote.examples.webflux;

import java.util.List;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@SpringBootApplication
public class WebfluxExampleServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(WebfluxExampleServiceApplication.class, args);
    }

    @RestController
    @RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    static class DemoController {
        @GetMapping("/health")
        Mono<Map<String, Object>> health() {
            return Mono.just(Map.of("status", "ok"));
        }

        @GetMapping("/request-evidence/users/{userId}")
        Mono<RequestEvidenceProbeResponse> requestEvidenceProbe(
                @PathVariable("userId") String userId,
                @RequestParam("expand") boolean expand,
                @RequestParam("tags") List<String> tags,
                @RequestHeader("X-Request-Flavor") String requestFlavor,
                @RequestHeader(value = "Authorization", required = false) String authorization,
                @CookieValue("clientMode") String clientMode,
                @CookieValue(value = "SESSION", required = false) String session
        ) {
            return Mono.just(new RequestEvidenceProbeResponse(
                    userId,
                    expand,
                    List.copyOf(tags),
                    requestFlavor,
                    clientMode,
                    authorization != null && !authorization.isBlank(),
                    session != null && !session.isBlank()
            ));
        }

        @PostMapping(value = "/payload-evidence/users/{userId}", consumes = MediaType.APPLICATION_JSON_VALUE)
        Mono<PayloadEvidenceProbeResponse> payloadEvidenceProbe(
                @PathVariable("userId") String userId,
                @RequestParam("expand") boolean expand,
                @RequestParam("tags") List<String> tags,
                @RequestHeader("X-Request-Flavor") String requestFlavor,
                @RequestHeader(value = "Authorization", required = false) String authorization,
                @CookieValue("clientMode") String clientMode,
                @CookieValue(value = "SESSION", required = false) String session,
                @RequestBody PayloadEvidenceProbeRequest requestBody
        ) {
            return Mono.just(new PayloadEvidenceProbeResponse(
                    userId,
                    expand,
                    List.copyOf(tags),
                    requestFlavor,
                    clientMode,
                    authorization != null && !authorization.isBlank(),
                    session != null && !session.isBlank(),
                    requestBody.name(),
                    requestBody.meta() != null && !requestBody.meta().isEmpty()
            ));
        }
    }

    record RequestEvidenceProbeResponse(
            String userId,
            boolean expand,
            List<String> tags,
            String requestFlavor,
            String clientMode,
            boolean authorizationProvided,
            boolean sessionProvided
    ) {
    }

    record PayloadEvidenceProbeRequest(String name, Map<String, Object> meta) {
    }

    record PayloadEvidenceProbeResponse(
            String userId,
            boolean expand,
            List<String> tags,
            String requestFlavor,
            String clientMode,
            boolean authorizationProvided,
            boolean sessionProvided,
            String name,
            boolean metaProvided
    ) {
    }
}

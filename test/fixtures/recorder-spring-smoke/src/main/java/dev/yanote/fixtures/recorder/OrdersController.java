package dev.yanote.fixtures.recorder;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
public class OrdersController {

    @GetMapping("/{orderId}")
    public Map<String, Object> showOrder(
            @PathVariable("orderId") String orderId,
            @RequestParam(name = "expand", defaultValue = "false") boolean expand
    ) {
        return Map.of(
                "orderId", orderId,
                "expand", expand,
                "status", "ok"
        );
    }
}

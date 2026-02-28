package dev.yanote.recorder.springmvc;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "yanote.recorder")
public class YanoteRecorderProperties {
    private boolean enabled = true;
    private String eventsPath = "events.jsonl";
    private String serviceName;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getEventsPath() {
        return eventsPath;
    }

    public void setEventsPath(String eventsPath) {
        this.eventsPath = eventsPath;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }
}

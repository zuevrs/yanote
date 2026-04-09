package dev.yanote.recorder.springwebflux;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Shared recorder property binding for the future reactive recorder path.
 */
@ConfigurationProperties(prefix = "yanote.recorder")
public class YanoteReactiveRecorderProperties {
    private boolean enabled = false;
    private String eventsPath = "events.jsonl";
    private String serviceName;

    /**
     * Creates a new reactive recorder property binding object.
     */
    public YanoteReactiveRecorderProperties() {
    }

    /**
     * Returns whether the reactive recorder path is explicitly enabled.
     *
     * @return {@code true} when the reactive recorder path is enabled
     */
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Sets whether the reactive recorder path is explicitly enabled.
     *
     * @param enabled whether the reactive recorder path is enabled
     */
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    /**
     * Returns the configured target path for future event output.
     *
     * @return configured events path
     */
    public String getEventsPath() {
        return eventsPath;
    }

    /**
     * Sets the configured target path for future event output.
     *
     * @param eventsPath configured events path
     */
    public void setEventsPath(String eventsPath) {
        this.eventsPath = eventsPath;
    }

    /**
     * Returns the configured service label for future events.
     *
     * @return configured service label
     */
    public String getServiceName() {
        return serviceName;
    }

    /**
     * Sets the configured service label for future events.
     *
     * @param serviceName configured service label
     */
    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }
}

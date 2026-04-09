package dev.yanote.recorder.springwebflux;

/**
 * Minimal internal marker bean proving that the reactive auto-configuration activated.
 */
public final class YanoteReactiveRecorderMarker {
    private final String eventsPath;
    private final String serviceName;

    /**
     * Creates the activation marker from bound recorder properties.
     *
     * @param eventsPath configured future events path
     * @param serviceName configured service label
     */
    public YanoteReactiveRecorderMarker(String eventsPath, String serviceName) {
        this.eventsPath = eventsPath;
        this.serviceName = serviceName;
    }

    /**
     * Returns the configured future events path.
     *
     * @return configured future events path
     */
    public String getEventsPath() {
        return eventsPath;
    }

    /**
     * Returns the configured service label.
     *
     * @return configured service label
     */
    public String getServiceName() {
        return serviceName;
    }
}

package dev.yanote.core.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Base event contract emitted by yanote instrumentation.
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
@JsonSubTypes({
    @JsonSubTypes.Type(value = HttpEvent.class, name = "http")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public sealed interface YanoteEvent permits HttpEvent {
}


package dev.yanote.core.openapi;

import io.swagger.parser.OpenAPIParser;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.parser.core.models.ParseOptions;
import java.util.List;

public final class OpenApiLoader {

    public OpenAPI load(String specPath) {
        ParseOptions parseOptions = new ParseOptions();
        parseOptions.setResolve(true);
        parseOptions.setResolveFully(true);
        parseOptions.setResolveCombinators(false);

        SwaggerParseResult result = new OpenAPIParser().readLocation(specPath, null, parseOptions);
        OpenAPI api = result.getOpenAPI();
        if (api == null) {
            List<String> messages = result.getMessages();
            throw new IllegalStateException("Unable to parse OpenAPI spec. " + messages);
        }
        return api;
    }
}


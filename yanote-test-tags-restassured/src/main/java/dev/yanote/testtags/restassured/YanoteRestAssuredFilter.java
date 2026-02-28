package dev.yanote.testtags.restassured;

import io.restassured.filter.Filter;
import io.restassured.filter.FilterContext;
import io.restassured.response.Response;
import io.restassured.specification.FilterableRequestSpecification;
import io.restassured.specification.FilterableResponseSpecification;

/**
 * RestAssured filter that adds yanote test headers to each request if missing.
 */
public final class YanoteRestAssuredFilter implements Filter {
    public static final String RUN_ID_HEADER = "X-Test-Run-Id";
    public static final String SUITE_HEADER = "X-Test-Suite";
    public static final String RUN_ID_ENV = "YANOTE_RUN_ID";
    public static final String SUITE_PROPERTY = "yanote.suite";

    private final String runId;
    private final String suite;

    public YanoteRestAssuredFilter(String runId, String suite) {
        this.runId = runId;
        this.suite = suite;
    }

    public static YanoteRestAssuredFilter fromEnv() {
        return new YanoteRestAssuredFilter(resolveRunIdFromEnv(), resolveSuiteFromSystemProperty());
    }

    public static String resolveRunIdFromEnv() {
        return System.getenv(RUN_ID_ENV);
    }

    public static String resolveSuiteFromSystemProperty() {
        return System.getProperty(SUITE_PROPERTY);
    }

    @Override
    public Response filter(FilterableRequestSpecification requestSpec,
                         FilterableResponseSpecification responseSpec,
                         FilterContext context) {
        if (runId != null && !requestSpec.getHeaders().hasHeaderWithName(RUN_ID_HEADER)) {
            requestSpec.header(RUN_ID_HEADER, runId);
        }
        if (suite != null && !requestSpec.getHeaders().hasHeaderWithName(SUITE_HEADER)) {
            requestSpec.header(SUITE_HEADER, suite);
        }
        return context.next(requestSpec, responseSpec);
    }
}

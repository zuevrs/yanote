import { fileURLToPath } from "node:url";

function resolveFixturePath(relativePath: string): string {
  return fileURLToPath(new URL(`../test/fixtures/${relativePath}`, import.meta.url));
}

export const HTTP_PAYLOAD_OPENAPI_FIXTURE_PATH = resolveFixturePath("openapi/http-payload.yaml");
export const HTTP_PAYLOAD_EVENTS_FIXTURE_PATH = resolveFixturePath("events/http-payload-valid.fixture.jsonl");
export const AMQP_ASYNCAPI_FIXTURE_PATH = resolveFixturePath("asyncapi/rabbitmq-amqp-basic.yaml");
export const AMQP_ASYNC_EVENTS_FIXTURE_PATH = resolveFixturePath("async-events/amqp-basic.fixture.jsonl");

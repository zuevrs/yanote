import { describe, expect, it } from 'vitest';
import { buildAsyncApiSemantics } from '../yanote-js/src/spec/asyncapi.ts';

describe('repro', () => {
  it('keeps binding support from duplicate semantic messages', () => {
    const bundle = buildAsyncApiSemantics({
      asyncapi: '3.0.0',
      servers: { kafkaLocal: { protocol: 'kafka' } },
      channels: {
        userLifecycle: {
          address: 'users.lifecycle',
          messages: {
            A: {
              name: 'UserLifecycleEvent',
              bindings: { kafka: { schemaLookupStrategy: 'TopicIdStrategy' } },
              payload: { type: 'object' }
            },
            B: {
              name: 'UserLifecycleEvent',
              bindings: { kafka: { schemaLookupStrategy: 'RecordNameStrategy' } },
              payload: { type: 'object' }
            }
          }
        }
      },
      operations: {
        sendUserLifecycle: {
          action: 'send',
          channel: { $ref: '#/channels/userLifecycle' },
          messages: [
            { $ref: '#/channels/userLifecycle/messages/A' },
            { $ref: '#/channels/userLifecycle/messages/B' }
          ]
        }
      }
    });
    expect(bundle.hasInvalid).toBe(false);
    expect(bundle.operationContractsByKey.get('kafka send users.lifecycle')?.bindingSupport).toEqual([
      { scope: 'message', messageName: 'UserLifecycleEvent', field: 'schemaLookupStrategy', status: 'deferred', source: 'message.bindings.kafka.schemaLookupStrategy' },
      { scope: 'message', messageName: 'UserLifecycleEvent', field: 'schemaLookupStrategy', status: 'deferred', source: 'message.bindings.kafka.schemaLookupStrategy' },
    ]);
  });
});

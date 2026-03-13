import { serializeOperationKey, type AsyncAction, type KafkaOperationKey } from "../model/operationKey.js";
import type { AsyncEvent } from "../model/asyncEvent.js";
import type { AsyncApiSemanticsBundle } from "../spec/asyncapi.js";

export type AsyncCoverageSummary = {
  total: number;
  covered: number;
  percent: number | null;
};

export type AsyncChannelCoverage = {
  channel: string;
  state: "COVERED" | "UNCOVERED";
  coveredActions: AsyncAction[];
  missingActions: AsyncAction[];
};

export type AsyncOperationCoverage = {
  operationKey: string;
  channel: string;
  action: AsyncAction;
  operation: {
    state: "COVERED" | "UNCOVERED";
  };
  messageContract: {
    name?: string;
    state: "COVERED" | "UNCOVERED" | "N/A";
  };
  suites: string[];
};

export type AsyncMessageCoverage = {
  operationKey: string;
  channel: string;
  action: AsyncAction;
  message: string;
  state: "COVERED" | "UNCOVERED";
  suites: string[];
};

export type AsyncCoverageDiagnostic = {
  kind: "unmatched" | "mismatched";
  message: string;
  channel: string;
  action: AsyncAction;
  observedMessage?: string;
  expectedMessage?: string;
};

export type AsyncCoverageResult = {
  channels: {
    summary: AsyncCoverageSummary;
    items: AsyncChannelCoverage[];
  };
  operations: {
    summary: AsyncCoverageSummary;
    items: AsyncOperationCoverage[];
  };
  messages: {
    summary: AsyncCoverageSummary;
    items: AsyncMessageCoverage[];
  };
  diagnostics: AsyncCoverageDiagnostic[];
};

type ChannelAccumulator = {
  expectedActions: AsyncAction[];
  observedOnKnownChannel: boolean;
  coveredActions: Set<AsyncAction>;
};

type OperationAccumulator = {
  operation: KafkaOperationKey;
  operationKey: string;
  expectedMessage?: string;
  covered: boolean;
  suites: Set<string>;
};

type MessageAccumulator = {
  operationKey: string;
  channel: string;
  action: AsyncAction;
  message: string;
  covered: boolean;
  suites: Set<string>;
};

export function computeAsyncCoverage(bundle: AsyncApiSemanticsBundle, events: AsyncEvent[]): AsyncCoverageResult {
  const operations = bundle.operations.filter((operation): operation is KafkaOperationKey => operation.kind === "kafka");
  const channels = new Map<string, ChannelAccumulator>();
  const operationsByMatchKey = new Map<string, OperationAccumulator>();
  const operationOrder: OperationAccumulator[] = [];
  const messageByOperationKey = new Map<string, MessageAccumulator>();

  for (const operation of operations) {
    const operationKey = serializeOperationKey(operation);
    const contract = bundle.operationContractsByKey.get(operationKey);

    if (!channels.has(operation.channel)) {
      channels.set(operation.channel, {
        expectedActions: [],
        observedOnKnownChannel: false,
        coveredActions: new Set<AsyncAction>()
      });
    }
    channels.get(operation.channel)?.expectedActions.push(operation.action);

    const accumulator: OperationAccumulator = {
      operation,
      operationKey,
      expectedMessage: contract?.message?.name,
      covered: false,
      suites: new Set<string>()
    };

    operationsByMatchKey.set(matchKey(operation.action, operation.channel), accumulator);
    operationOrder.push(accumulator);

    if (contract?.message?.name) {
      messageByOperationKey.set(operationKey, {
        operationKey,
        channel: operation.channel,
        action: operation.action,
        message: contract.message.name,
        covered: false,
        suites: new Set<string>()
      });
    }
  }

  const diagnostics: AsyncCoverageDiagnostic[] = [];
  const seenDiagnostics = new Set<string>();

  for (const event of events) {
    const channel = channels.get(event.channel);
    if (channel) {
      channel.observedOnKnownChannel = true;
    }

    const matchedOperation = operationsByMatchKey.get(matchKey(event.action, event.channel));
    if (!matchedOperation) {
      appendDiagnostic(
        diagnostics,
        seenDiagnostics,
        {
          kind: "unmatched",
          channel: event.channel,
          action: event.action,
          observedMessage: event.message,
          message: "No canonical async operation matched the observed kafka evidence"
        }
      );
      continue;
    }

    matchedOperation.covered = true;
    matchedOperation.suites.add(event.testSuite);
    channels.get(event.channel)?.coveredActions.add(event.action);

    if (!matchedOperation.expectedMessage) {
      continue;
    }

    const messageAccumulator = messageByOperationKey.get(matchedOperation.operationKey);
    if (event.message === matchedOperation.expectedMessage) {
      messageAccumulator?.suites.add(event.testSuite);
      if (messageAccumulator) {
        messageAccumulator.covered = true;
      }
      continue;
    }

    appendDiagnostic(
      diagnostics,
      seenDiagnostics,
      {
        kind: "mismatched",
        channel: event.channel,
        action: event.action,
        observedMessage: event.message,
        expectedMessage: matchedOperation.expectedMessage,
        message: "Observed async message contract did not match the canonical AsyncAPI message contract"
      }
    );
  }

  const channelItems = Array.from(channels.entries()).map(([channel, entry]) => ({
    channel,
    state: entry.observedOnKnownChannel ? "COVERED" : "UNCOVERED",
    coveredActions: Array.from(entry.coveredActions),
    missingActions: entry.expectedActions.filter((action) => !entry.coveredActions.has(action))
  }));

  const operationItems = operationOrder.map((entry) => ({
    operationKey: entry.operationKey,
    channel: entry.operation.channel,
    action: entry.operation.action,
    operation: {
      state: entry.covered ? "COVERED" : "UNCOVERED"
    },
    messageContract: entry.expectedMessage
      ? {
          name: entry.expectedMessage,
          state: messageByOperationKey.get(entry.operationKey)?.covered ? "COVERED" : "UNCOVERED"
        }
      : {
          state: "N/A"
        },
    suites: Array.from(entry.suites).sort((left, right) => left.localeCompare(right))
  }));

  const messageItems = operationOrder.flatMap((entry) => {
    const messageAccumulator = messageByOperationKey.get(entry.operationKey);
    if (!messageAccumulator) return [];

    return [
      {
        operationKey: messageAccumulator.operationKey,
        channel: messageAccumulator.channel,
        action: messageAccumulator.action,
        message: messageAccumulator.message,
        state: messageAccumulator.covered ? "COVERED" : "UNCOVERED",
        suites: Array.from(messageAccumulator.suites).sort((left, right) => left.localeCompare(right))
      }
    ];
  });

  return {
    channels: {
      summary: summarizeCoverage(
        channelItems.filter((entry) => entry.state === "COVERED").length,
        channelItems.length
      ),
      items: channelItems
    },
    operations: {
      summary: summarizeCoverage(
        operationItems.filter((entry) => entry.operation.state === "COVERED").length,
        operationItems.length
      ),
      items: operationItems
    },
    messages: {
      summary: summarizeCoverage(
        messageItems.filter((entry) => entry.state === "COVERED").length,
        messageItems.length
      ),
      items: messageItems
    },
    diagnostics
  };
}

function appendDiagnostic(
  diagnostics: AsyncCoverageDiagnostic[],
  seenDiagnostics: Set<string>,
  diagnostic: AsyncCoverageDiagnostic
): void {
  const key = [
    diagnostic.kind,
    diagnostic.channel,
    diagnostic.action,
    diagnostic.observedMessage ?? "",
    diagnostic.expectedMessage ?? ""
  ].join("\u0000");

  if (seenDiagnostics.has(key)) {
    return;
  }

  seenDiagnostics.add(key);
  diagnostics.push(diagnostic);
}

function matchKey(action: AsyncAction, channel: string): string {
  return `${action}\u0000${channel}`;
}

function summarizeCoverage(covered: number, total: number): AsyncCoverageSummary {
  return {
    total,
    covered,
    percent: total === 0 ? null : roundPercent((covered / total) * 100)
  };
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

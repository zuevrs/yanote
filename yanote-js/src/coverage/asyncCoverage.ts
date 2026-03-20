import { serializeOperationKey, type AsyncAction, type KafkaOperationKey } from "../model/operationKey.js";
import type { AsyncEvent } from "../model/asyncEvent.js";
import type { AsyncApiSemanticsBundle } from "../spec/asyncapi.js";
import {
  computeAsyncSchemaConformance,
  type AsyncSchemaConformanceDiagnostic,
  type AsyncSchemaConformanceDiagnosticKind,
  type AsyncSchemaValidationKind
} from "./asyncSchemaConformance.js";

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

export type AsyncRoutingCoverageDiagnosticKind = "unmatched" | "mismatched";
export type AsyncCoverageDiagnosticKind = AsyncRoutingCoverageDiagnosticKind | AsyncSchemaConformanceDiagnosticKind;

export type AsyncRoutingCoverageDiagnostic =
  | {
      kind: "unmatched";
      message: string;
      channel: string;
      action: AsyncAction;
      observedMessage?: string;
    }
  | {
      kind: "mismatched";
      message: string;
      channel: string;
      action: AsyncAction;
      observedMessage?: string;
      expectedMessage?: string;
    };

export type AsyncSchemaCoverageDiagnostic = {
  kind: AsyncSchemaConformanceDiagnosticKind;
  validationKind: AsyncSchemaValidationKind;
  operationKey: string;
  channel: string;
  action: AsyncAction;
  messageName?: string;
  schemaId?: string;
  pointer?: string;
  reason: string;
  message: string;
};

export type AsyncCoverageDiagnostic = AsyncRoutingCoverageDiagnostic | AsyncSchemaCoverageDiagnostic;

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
  const schemaConformance = computeAsyncSchemaConformance(bundle, events);
  const matchedOperationKeys = new Set(schemaConformance.matchedOperationKeys);
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

  const routingDiagnostics: AsyncRoutingCoverageDiagnostic[] = [];
  const seenRoutingDiagnostics = new Set<string>();

  for (const event of events) {
    const channel = channels.get(event.channel);
    if (channel) {
      channel.observedOnKnownChannel = true;
    }

    const matchedOperation = operationsByMatchKey.get(matchKey(event.action, event.channel));
    if (!matchedOperation) {
      appendRoutingDiagnostic(routingDiagnostics, seenRoutingDiagnostics, {
        kind: "unmatched",
        channel: event.channel,
        action: event.action,
        observedMessage: event.message,
        message: "No canonical async operation matched the observed kafka evidence"
      });
      continue;
    }

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

    appendRoutingDiagnostic(routingDiagnostics, seenRoutingDiagnostics, {
      kind: "mismatched",
      channel: event.channel,
      action: event.action,
      observedMessage: event.message,
      expectedMessage: matchedOperation.expectedMessage,
      message: "Observed async message contract did not match the canonical AsyncAPI message contract"
    });
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
      state: matchedOperationKeys.has(entry.operationKey) ? "COVERED" : "UNCOVERED"
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
    diagnostics: [
      ...routingDiagnostics,
      ...schemaConformance.diagnostics.filter(isPublicSchemaDiagnostic).map(toPublicSchemaDiagnostic)
    ].sort(compareAsyncCoverageDiagnostics)
  };
}

export function compareAsyncCoverageDiagnostics(left: AsyncCoverageDiagnostic, right: AsyncCoverageDiagnostic): number {
  const kind = diagnosticKindRank(left.kind) - diagnosticKindRank(right.kind);
  if (kind !== 0) {
    return kind;
  }

  const leftOperationKey = "operationKey" in left ? left.operationKey : "";
  const rightOperationKey = "operationKey" in right ? right.operationKey : "";
  if (leftOperationKey !== rightOperationKey) {
    return leftOperationKey.localeCompare(rightOperationKey);
  }

  if (left.channel !== right.channel) {
    return left.channel.localeCompare(right.channel);
  }

  const action = compareAsyncAction(left.action, right.action);
  if (action !== 0) {
    return action;
  }

  const leftValidationKind = "validationKind" in left ? validationKindRank(left.validationKind) : -1;
  const rightValidationKind = "validationKind" in right ? validationKindRank(right.validationKind) : -1;
  if (leftValidationKind !== rightValidationKind) {
    return leftValidationKind - rightValidationKind;
  }

  const leftObserved = "observedMessage" in left ? left.observedMessage ?? "" : "";
  const rightObserved = "observedMessage" in right ? right.observedMessage ?? "" : "";
  if (leftObserved !== rightObserved) {
    return leftObserved.localeCompare(rightObserved);
  }

  const leftExpected = "expectedMessage" in left ? left.expectedMessage ?? "" : "";
  const rightExpected = "expectedMessage" in right ? right.expectedMessage ?? "" : "";
  if (leftExpected !== rightExpected) {
    return leftExpected.localeCompare(rightExpected);
  }

  const leftMessageName = "messageName" in left ? left.messageName ?? "" : "";
  const rightMessageName = "messageName" in right ? right.messageName ?? "" : "";
  if (leftMessageName !== rightMessageName) {
    return leftMessageName.localeCompare(rightMessageName);
  }

  const leftSchemaId = "schemaId" in left ? left.schemaId ?? "" : "";
  const rightSchemaId = "schemaId" in right ? right.schemaId ?? "" : "";
  if (leftSchemaId !== rightSchemaId) {
    return leftSchemaId.localeCompare(rightSchemaId);
  }

  const leftPointer = "pointer" in left ? left.pointer ?? "" : "";
  const rightPointer = "pointer" in right ? right.pointer ?? "" : "";
  if (leftPointer !== rightPointer) {
    return leftPointer.localeCompare(rightPointer);
  }

  const leftReason = "reason" in left ? left.reason : "";
  const rightReason = "reason" in right ? right.reason : "";
  if (leftReason !== rightReason) {
    return leftReason.localeCompare(rightReason);
  }

  return left.message.localeCompare(right.message);
}

function appendRoutingDiagnostic(
  diagnostics: AsyncRoutingCoverageDiagnostic[],
  seenDiagnostics: Set<string>,
  diagnostic: AsyncRoutingCoverageDiagnostic
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

function toPublicSchemaDiagnostic(diagnostic: AsyncSchemaConformanceDiagnostic): AsyncSchemaCoverageDiagnostic {
  return { ...diagnostic };
}

function isPublicSchemaDiagnostic(diagnostic: AsyncSchemaConformanceDiagnostic): boolean {
  return isRetainedPublicSchemaId(diagnostic.schemaId);
}

function isRetainedPublicSchemaId(schemaId: string | undefined): schemaId is string {
  return typeof schemaId === "string" && schemaId.length > 0 && !schemaId.startsWith("<anonymous-schema-");
}

function diagnosticKindRank(kind: AsyncCoverageDiagnosticKind): number {
  switch (kind) {
    case "unsupported-content-type":
      return 0;
    case "unsupported-schema-format":
      return 1;
    case "missing-payload":
      return 2;
    case "invalid-payload":
      return 3;
    case "unverifiable-headers":
      return 4;
    case "mismatched":
      return 5;
    case "unmatched":
      return 6;
  }
}

function validationKindRank(kind: AsyncSchemaValidationKind): number {
  switch (kind) {
    case "contentType":
      return 0;
    case "schemaFormat":
      return 1;
    case "payload":
      return 2;
    case "headers":
      return 3;
  }
}

function compareAsyncAction(left: AsyncAction, right: AsyncAction): number {
  return asyncActionRank(left) - asyncActionRank(right);
}

function asyncActionRank(value: AsyncAction): number {
  return value === "send" ? 0 : 1;
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

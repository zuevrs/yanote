export type OperationKey =
  | {
      kind: "http";
      method: string;
      route: string;
    }
  | {
      kind: "asyncapi";
      action: "send" | "receive";
      channel: string;
    }
  | {
      kind: string;
      [k: string]: unknown;
    };

export function serializeOperationKey(key: OperationKey): string {
  if (key.kind === "http") {
    return `http ${key.method} ${key.route}`;
  }
  if (key.kind === "asyncapi") {
    return `asyncapi ${key.action} ${key.channel}`;
  }
  return JSON.stringify(key);
}


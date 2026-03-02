import { Parser, fromFile } from "@asyncapi/parser";
import type { OperationKey } from "../model/operationKey.js";

export async function loadAsyncApiOperations(specPath: string): Promise<OperationKey[]> {
  const parser = new Parser();
  const { document, diagnostics } = await fromFile(parser, specPath).parse();

  if (!document) {
    const message = diagnostics?.map((d: any) => d.message).filter(Boolean).join("; ") || "Invalid AsyncAPI document";
    throw new Error(message);
  }

  const json = document.json() as any;
  const version = typeof json?.asyncapi === "string" ? json.asyncapi : "";

  if (version.startsWith("3")) {
    return extractV3(json);
  }
  return extractV2(json);
}

function extractV2(doc: any): OperationKey[] {
  const channels = doc?.channels ?? {};
  const ops: OperationKey[] = [];

  for (const [channelName, channel] of Object.entries<any>(channels)) {
    if (!channel || typeof channel !== "object") continue;
    if (channel.publish) {
      ops.push({ kind: "asyncapi", action: "send", channel: String(channelName) });
    }
    if (channel.subscribe) {
      ops.push({ kind: "asyncapi", action: "receive", channel: String(channelName) });
    }
  }

  return dedupe(ops);
}

function extractV3(doc: any): OperationKey[] {
  const channels = doc?.channels ?? {};
  const operations = doc?.operations ?? {};

  const ops: OperationKey[] = [];

  for (const [_opId, op] of Object.entries<any>(operations)) {
    if (!op || typeof op !== "object") continue;
    const action = op.action === "send" || op.action === "receive" ? op.action : null;
    if (!action) continue;

    const channel = resolveV3ChannelNameOrAddress(op.channel, channels);
    if (!channel) continue;
    ops.push({ kind: "asyncapi", action, channel });
  }

  return dedupe(ops);
}

function resolveV3ChannelNameOrAddress(channelRefOrObj: any, channels: any): string | null {
  if (!channelRefOrObj) return null;

  if (typeof channelRefOrObj === "string") {
    return channelRefOrObj;
  }

  if (typeof channelRefOrObj === "object" && typeof channelRefOrObj.address === "string") {
    return channelRefOrObj.address;
  }

  if (typeof channelRefOrObj === "object" && typeof channelRefOrObj.$ref === "string") {
    const ref = channelRefOrObj.$ref as string;
    const marker = "#/channels/";
    const idx = ref.indexOf(marker);
    if (idx >= 0) {
      const name = ref.slice(idx + marker.length);
      const ch = channels?.[name];
      const address = typeof ch?.address === "string" ? ch.address : null;
      return address ?? name;
    }
  }

  return null;
}

function dedupe(items: OperationKey[]): OperationKey[] {
  const seen = new Set<string>();
  const out: OperationKey[] = [];
  for (const it of items) {
    const k = `${it.kind} ${(it as any).action ?? ""} ${(it as any).channel ?? ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}


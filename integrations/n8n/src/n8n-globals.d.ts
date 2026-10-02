/**
 * The globals n8n's Code node provides, typed for the talent workflows.
 * `$("Node name")` only accepts names listed in NodeOutputs, and returns that
 * node's output type - build.mts also checks each name exists in the workflow.
 */
interface N8nBinary {
  mimeType: string;
  fileName?: string;
  fileSize?: string;
  data: string;
}

interface N8nItem<J> {
  json: J;
  binary?: Record<string, N8nBinary>;
}

interface N8nNodeRef<J> {
  first(): N8nItem<J>;
  all(): N8nItem<J>[];
  /** The item paired with the one being processed (per-item mode). */
  item: N8nItem<J>;
  isExecuted: boolean;
}

interface NodeOutputs {
  "Webhook": { body: unknown };
  "Validate submission": import("./types").ValidatedSubmission;
  "Claim voice notes": import("./types").ClaimedVoiceNote;
  "Sarvam: create job": { job_id: string };
  "Settings": import("./types").DeliverSettings;
  "Claim submission": import("./types").ClaimedSubmission;
  "Compose note": import("./types").ComposedNote;
  "Chatwoot: contact": { id: number; source_id: string };
  "Chatwoot: create conversation": { id: number };
  "Files to fetch": import("./types").FileToAttach;
}

declare function $<K extends keyof NodeOutputs>(name: K): N8nNodeRef<NodeOutputs[K]>;

/** Input of the current Code node. Each node narrows it with a cast. */
declare const $input: {
  first(): N8nItem<unknown>;
  all(): N8nItem<unknown>[];
  /** The item being processed ("Run once for each item" mode). */
  item: N8nItem<unknown>;
};

/** Current item's JSON in "Run once for each item" mode. */
declare const $json: unknown;

/** `this` inside a Code node. */
interface CodeContext {
  helpers: {
    getBinaryDataBuffer(itemIndex: number, propertyName: string): Promise<Buffer>;
  };
}

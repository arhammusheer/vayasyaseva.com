/**
 * Twenty CRM's REST API (crm.vayasyaseva.com), reached in the cluster at
 * http://twenty.growth.svc.cluster.local with the workspace API key. The
 * record shapes are integrations/twenty/setup.mts. Verified live (Twenty
 * v2.43.0): POST /rest/<plural> answers { data: { create<Singular> } }, GET
 * filters as `filter=field[eq]:"value"`, a unique field answers 400 on a
 * duplicate, and DELETE removes the record for good (404 once gone).
 */
import { config } from "./config.ts";

export type Fetch = typeof fetch;

export interface TwentyRecord {
  id: string;
  [field: string]: unknown;
}

export interface Twenty {
  find(plural: string, filter: string): Promise<TwentyRecord[]>;
  create(plural: string, singular: string, body: Record<string, unknown>): Promise<TwentyRecord>;
  update(plural: string, id: string, body: Record<string, unknown>): Promise<void>;
  /** True when it was removed, false when it was already gone. */
  remove(plural: string, id: string): Promise<boolean>;
}

/** `field[eq]:"value"`, quoting the value as Twenty's filter parser expects. */
export const eq = (field: string, value: string) => `${field}[eq]:${JSON.stringify(value)}`;

export function twentyClient(baseUrl: string, apiKey: string, fetchImpl: Fetch = fetch): Twenty {
  const base = baseUrl.replace(/\/$/, "");
  async function call(method: string, path: string, body?: unknown): Promise<{ status: number; json: unknown }> {
    const res = await fetchImpl(`${base}/rest${path}`, {
      method,
      headers: { authorization: `Bearer ${apiKey}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}
    if (!res.ok && !(method === "DELETE" && res.status === 404)) {
      // Twenty's messages name the field or constraint, not the values.
      const messages = (json as { messages?: string[] } | null)?.messages?.join("; ") ?? text.slice(0, 200);
      throw new Error(`Twenty ${method} ${path.split("?")[0]}: HTTP ${res.status} ${messages}`);
    }
    return { status: res.status, json };
  }
  return {
    async find(plural, filter) {
      const { json } = await call("GET", `/${plural}?limit=60&filter=${encodeURIComponent(filter)}`);
      return ((json as { data: Record<string, TwentyRecord[]> }).data[plural] ?? []) as TwentyRecord[];
    },
    async create(plural, singular, body) {
      const { json } = await call("POST", `/${plural}`, body);
      const created = (json as { data: Record<string, TwentyRecord> }).data[`create${singular}`];
      if (!created?.id) throw new Error(`Twenty POST /${plural}: no record in the answer`);
      return created;
    },
    async update(plural, id, body) {
      await call("PATCH", `/${plural}/${id}`, body);
    },
    async remove(plural, id) {
      const { status } = await call("DELETE", `/${plural}/${id}`);
      return status !== 404;
    },
  };
}

/** The client from the workspace variables (f/talent/twenty_*). */
export async function twentyFromConfig(): Promise<Twenty> {
  return twentyClient(await config("twenty_base_url"), await config("twenty_api_key"));
}

// --- Files (Twenty's direct upload, on /metadata) -------------------------------

/** What createFileUpload answers: where to PUT the bytes, and the file to complete. */
export interface UploadTarget {
  fileId: string;
  uploadUrl: string;
  contentType: string;
  expiresAt: string | null;
}

/**
 * Twenty's three-step upload (createFileUpload, PUT, completeFileUpload), as
 * its own front end and apps do it (twenty-server file-upload.resolver.ts and
 * file-upload-target.service.ts): the server reserves a pending file in the
 * FilesField folder for one FILES field, answers an upload URL, and the
 * completion moves it into place. A completed file is then given to a record
 * through that field ({ fileId, label }).
 */
export interface TwentyFiles {
  /** The id of the attachment object's `file` field (FILES), looked up once per client. */
  attachmentFileFieldId(): Promise<string>;
  createFileUpload(filename: string, size: number, fieldMetadataId: string): Promise<UploadTarget>;
  /** PUTs exactly the blob (its size is the declared size). */
  put(uploadUrl: string, data: Blob): Promise<void>;
  /** Idempotent for a file that is uploaded and not yet attached. */
  completeFileUpload(fileId: string): Promise<void>;
}

/** A GraphQL error Twenty answered (as opposed to HTTP or network failure): the request reached it and was refused. */
export class TwentyGraphqlError extends Error {
  readonly codes: string[];
  constructor(message: string, codes: string[]) {
    super(message);
    this.codes = codes;
  }
}

/** Twenty's file upload API path (twenty-shared ApiPath.FileUpload). */
const FILE_UPLOAD_PATH = "/file-upload/";

/**
 * The upload URL is built from Twenty's SERVER_URL (https://crm.vayasyaseva.com),
 * which is behind Cloudflare Access; Windmill reaches Twenty in the cluster.
 * So a Twenty upload URL keeps its path and query on the in-cluster base. A
 * presigned bucket URL (STORAGE_S3_PRESIGNED_URL_ENABLED, off by default) is
 * signed for its host and is left alone.
 */
export function inClusterUploadUrl(uploadUrl: string, baseUrl: string): string {
  const url = new URL(uploadUrl);
  if (!url.pathname.startsWith(FILE_UPLOAD_PATH)) return uploadUrl;
  return `${baseUrl.replace(/\/$/, "")}${url.pathname}${url.search}`;
}

const isPermissionError = (messages: string[], codes: string[]) =>
  codes.includes("FORBIDDEN") || codes.includes("PERMISSION_DENIED") || messages.some((m) => /permission/i.test(m));

export function twentyFilesClient(baseUrl: string, apiKey: string, fetchImpl: Fetch = fetch): TwentyFiles {
  const base = baseUrl.replace(/\/$/, "");
  let fieldId: Promise<string> | null = null;

  async function gql<T>(operation: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetchImpl(`${base}/metadata`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    let json: { data?: T; errors?: { message: string; extensions?: { code?: string } }[] } | null = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}
    const errors = json?.errors ?? [];
    if (errors.length) {
      const messages = errors.map((e) => e.message);
      const codes = errors.map((e) => e.extensions?.code ?? "").filter(Boolean);
      if (isPermissionError(messages, codes)) {
        throw new TwentyGraphqlError(
          `Twenty ${operation}: refused for permissions; the API key's role needs the Upload files permission (UPLOAD_FILE). ${messages.join("; ").slice(0, 200)}`,
          codes,
        );
      }
      // HTTP 429 stays in the message so the dispatcher stops the run (Twenty's throttler can also answer it as a GraphQL error).
      const limited = !res.ok ? res.status === 429 : messages.some((m) => /too many requests|rate limit|limit reached/i.test(m));
      const status = limited ? "HTTP 429 " : res.ok ? "" : `HTTP ${res.status} `;
      throw new TwentyGraphqlError(`Twenty ${operation}: ${status}${messages.join("; ").slice(0, 300)}`, codes);
    }
    if (!res.ok) throw new Error(`Twenty ${operation}: HTTP ${res.status} ${text.slice(0, 200)}`);
    if (!json?.data) throw new Error(`Twenty ${operation}: no data in the answer`);
    return json.data;
  }

  return {
    attachmentFileFieldId() {
      // The same metadata query as integrations/twenty/lib.mts loadObjects.
      fieldId ??= gql<{ objects: { edges: { node: { nameSingular: string; fields: { edges: { node: { id: string; name: string; type: string } }[] } } }[] } }>(
        "objects",
        `{ objects(paging:{first:500}) { edges { node { id nameSingular fields(paging:{first:500}) { edges { node { id name type } } } } } } }`,
      )
        .then((data) => {
          const attachment = data.objects.edges.map((e) => e.node).find((o) => o.nameSingular === "attachment");
          const field = attachment?.fields.edges.map((e) => e.node).find((f) => f.name === "file" && f.type === "FILES");
          if (!field) throw new Error("Twenty has no attachment.file (FILES) field");
          return field.id;
        })
        .catch((err) => {
          fieldId = null;
          throw err;
        });
      return fieldId;
    },
    async createFileUpload(filename, size, fieldMetadataId) {
      const data = await gql<{ createFileUpload: UploadTarget }>(
        "createFileUpload",
        `mutation CreateFileUpload($filename: String!, $size: Float!, $fileFolder: FileFolder!, $fieldMetadataId: String) {
  createFileUpload(filename: $filename, size: $size, fileFolder: $fileFolder, fieldMetadataId: $fieldMetadataId) { fileId uploadUrl contentType expiresAt }
}`,
        { filename, size, fileFolder: "FilesField", fieldMetadataId },
      );
      const target = data.createFileUpload;
      if (!target?.fileId || !target.uploadUrl) throw new Error("Twenty createFileUpload: no upload target in the answer");
      return target;
    },
    async put(uploadUrl, data) {
      const res = await fetchImpl(inClusterUploadUrl(uploadUrl, base), {
        method: "PUT",
        // Twenty declares every direct upload application/octet-stream; the length is the blob's.
        headers: { "content-type": "application/octet-stream" },
        body: data,
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`Twenty PUT /file-upload: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      await res.body?.cancel().catch(() => {});
    },
    async completeFileUpload(fileId) {
      await gql<{ completeFileUpload: { id: string } }>(
        "completeFileUpload",
        `mutation CompleteFileUpload($fileId: String!) { completeFileUpload(fileId: $fileId) { id } }`,
        { fileId },
      );
    },
  };
}

/** The files client from the workspace variables (f/talent/twenty_*). */
export async function twentyFilesFromConfig(): Promise<TwentyFiles> {
  return twentyFilesClient(await config("twenty_base_url"), await config("twenty_api_key"));
}

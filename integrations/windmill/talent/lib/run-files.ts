/**
 * The files delivery (18 Oct 2026): an application's photos and documents,
 * copied from R2 (vayasya-talent-intake, kept 90 days) into Twenty as
 * attachments on its Application. One submission per dispatcher run; it
 * waits until the CRM step has made the application (CLAIM_DELIVERY).
 *
 *   1. One GET of the application's attachments, indexed by label.
 *   2. Each pending file: its label already in Twenty → recorded, done;
 *      a saved Twenty file id → completeFileUpload and attach; otherwise
 *      download from R2 (gone → missing), createFileUpload (the file id is
 *      saved at once), PUT the bytes, complete, attach.
 *   3. Done when nothing is pending. A failure retries the delivery with
 *      backoff (each file keeps its progress); Twenty's 429 stops the run.
 *
 * Labels are neutral, VS-J-XXXXXX-<n>.<ext> (n counts from 1): never the
 * applicant's own file name, which can carry personal data. Voice notes
 * (kind audio, before 16 Oct 2026) are not copied: skipped.
 */
import { eq, TwentyGraphqlError, type Twenty, type TwentyFiles, type TwentyRecord } from "./twenty.ts";
import { CLEAR_FILE_ID, FILE_ERROR, FILES_FOR, FILES_SUBMISSION, SAVE_FILE_ID, SETTLE_FILE } from "./sql.ts";
import type { Query } from "./db.ts";

export interface FilesDeps {
  query: Query;
  crm: Twenty;
  files: TwentyFiles;
  /** The R2 object, or null when it is gone (downloadIfExists in r2.ts). */
  download: (key: string) => Promise<Blob | null>;
}

export interface FileRow {
  id: string;
  position: number;
  kind: "audio" | "image" | "document";
  r2_key: string;
  mime: string;
  size_bytes: number;
  twenty_file_id: string | null;
  twenty_attachment_id: string | null;
  crm_file_status: "pending" | "done" | "missing" | "skipped";
}

export interface FilesResult {
  /** Nothing left pending. */
  done: boolean;
  attached: number;
  matched: number;
  missing: number;
  skipped: number;
  /** Why the delivery is not done (the dispatcher retries). */
  error?: string;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/** The extension: the R2 key's (the site names it from the type), else the type's, else bin. */
export function fileExtension(file: Pick<FileRow, "r2_key" | "mime">): string {
  const fromKey = file.r2_key.split("/").pop()?.match(/\.([a-z0-9]{1,8})$/i)?.[1];
  return (fromKey ?? EXTENSIONS[file.mime.split(";")[0].trim()] ?? "bin").toLowerCase();
}

/** VS-J-7K2M9Q-1.jpg: the reference and the file's place (from 1). */
export const fileLabel = (ref: string, file: Pick<FileRow, "position" | "r2_key" | "mime">) =>
  `${ref}-${file.position + 1}.${fileExtension(file)}`;

/** Twenty's attachment fileCategory. */
export function fileCategory(file: Pick<FileRow, "kind" | "mime">): "IMAGE" | "TEXT_DOCUMENT" | "OTHER" {
  if (file.kind === "image" || file.mime.startsWith("image/")) return "IMAGE";
  if (EXTENSIONS[file.mime.split(";")[0].trim()]) return "TEXT_DOCUMENT";
  return "OTHER";
}

const message = (err: unknown) => (err instanceof Error ? err.message : "unknown error").slice(0, 500);

/** Labels already on the application, with the attachment and file each is. */
function byLabel(records: TwentyRecord[]): Map<string, { attachmentId: string; fileId: string | null }> {
  const index = new Map<string, { attachmentId: string; fileId: string | null }>();
  for (const r of records) {
    const files = Array.isArray(r.file) ? (r.file as { fileId?: string; label?: string }[]) : [];
    for (const f of files) if (f?.label) index.set(f.label, { attachmentId: r.id, fileId: f.fileId ?? null });
    if (typeof r.name === "string" && !index.has(r.name)) index.set(r.name, { attachmentId: r.id, fileId: files[0]?.fileId ?? null });
  }
  return index;
}

/**
 * A completion Twenty refused (the file was reserved but its bytes never
 * arrived): start that file again. Rate limits and permissions are not that.
 */
const restartable = (err: unknown) =>
  err instanceof TwentyGraphqlError && !/HTTP 429|permission/i.test(err.message);

export async function runFiles(deps: FilesDeps, submissionId: string): Promise<FilesResult> {
  const result: FilesResult = { done: false, attached: 0, matched: 0, missing: 0, skipped: 0 };
  const [sub] = await deps.query<{ id: string; ref: string; application_id: string | null }>(FILES_SUBMISSION, [submissionId]);
  if (!sub) return { ...result, done: true, error: "No submission" };
  const rows = await deps.query<FileRow>(FILES_FOR, [submissionId]);

  // Voice notes stay in R2 to expire.
  for (const f of rows.filter((r) => r.crm_file_status === "pending" && r.kind === "audio")) {
    await deps.query(SETTLE_FILE, [f.id, "skipped", null, null, "Voice note: not copied"]);
    result.skipped++;
  }
  const pending = rows.filter((r) => r.crm_file_status === "pending" && r.kind !== "audio");
  if (!pending.length) return { ...result, done: true };
  if (!sub.application_id) return { ...result, error: "Waiting for the Twenty application" };
  const applicationId = sub.application_id;

  const existing = byLabel(await deps.crm.find("attachments", eq("targetApplicationId", applicationId)));
  let fieldId: string | null = null;

  for (const f of pending) {
    const label = fileLabel(sub.ref, f);
    try {
      const found = existing.get(label);
      if (found) {
        await deps.query(SETTLE_FILE, [f.id, "done", found.attachmentId, found.fileId, null]);
        result.matched++;
        continue;
      }
      let fileId = f.twenty_file_id;
      if (fileId) {
        try {
          await deps.files.completeFileUpload(fileId);
        } catch (err) {
          if (!restartable(err)) throw err;
          await deps.query(CLEAR_FILE_ID, [f.id]);
          fileId = null;
        }
      }
      if (!fileId) {
        const data = await deps.download(f.r2_key);
        if (!data) {
          await deps.query(SETTLE_FILE, [f.id, "missing", null, null, "Not in R2 (expired or erased)"]);
          result.missing++;
          continue;
        }
        fieldId ??= await deps.files.attachmentFileFieldId();
        const target = await deps.files.createFileUpload(label, data.size, fieldId);
        fileId = target.fileId;
        await deps.query(SAVE_FILE_ID, [f.id, fileId]);
        await deps.files.put(target.uploadUrl, data);
        await deps.files.completeFileUpload(fileId);
      }
      const attachment = await deps.crm.create("attachments", "Attachment", {
        name: label,
        file: [{ fileId, label }],
        fileCategory: fileCategory(f),
        targetApplicationId: applicationId,
      });
      await deps.query(SETTLE_FILE, [f.id, "done", attachment.id, fileId, null]);
      existing.set(label, { attachmentId: attachment.id, fileId });
      result.attached++;
    } catch (err) {
      await deps.query(FILE_ERROR, [f.id, message(err)]);
      throw err;
    }
  }
  return { ...result, done: true };
}

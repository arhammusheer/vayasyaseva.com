"use client";

import { useState } from "react";
import { FileText, ImageIcon, X } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { jobsCopy } from "@/content/pages/jobs";
import type { Locale } from "@/lib/i18n";
import { ATTACHMENT_MIME, INTAKE_LIMITS, type AttachmentKind } from "@/lib/talent-intake/rules";
import type { JobsStartResponse } from "@/lib/talent-intake/contract";

/**
 * Photos and documents on the jobs forms (/jobs, the role pages and
 * /jobs/apply): picking, checking, and the direct upload to R2 after
 * /api/jobs/start hands out the upload URLs.
 */

export const MAX_FILES = INTAKE_LIMITS.maxAttachments - 1; // one slot is the voice note
const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,.pdf,.doc,.docx,application/msword";

export interface PickedFile {
  file: File;
  kind: AttachmentKind;
  mime: string;
}

function classify(file: File): PickedFile | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type || EXTENSION_TYPES[ext] || "";
  for (const kind of ["image", "document"] as const) {
    if (ATTACHMENT_MIME[kind].test(mime)) return { file, kind, mime };
  }
  return null;
}

/** What /api/jobs/start is told about each file, in upload order. */
export function declareFiles(files: PickedFile[]) {
  return files.map((f) => ({ kind: f.kind, mime: f.mime, size: f.file.size, name: f.file.name.slice(0, 200) }));
}

/** PUT with progress (fetch can't report upload progress), three attempts. */
async function upload(url: string, headers: Record<string, string>, body: Blob, onProgress: (p: number) => void) {
  for (let attempt = 1; ; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("network"));
        xhr.send(body);
      });
      return;
    } catch (error) {
      if (attempt >= 3) throw error;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

/** Uploads each body to its URL from /api/jobs/start, one after another. */
export async function uploadAll(
  uploads: JobsStartResponse["uploads"],
  bodies: Blob[],
  kinds: string[],
  locale: Locale,
  onProgress: (n: number, total: number, percent: number) => void,
) {
  for (const [i, target] of uploads.entries()) {
    try {
      await upload(target.url, target.headers, bodies[i], (percent) => onProgress(i + 1, uploads.length, percent));
    } catch (error) {
      const reason = error instanceof Error ? error.message.replace(/\s+/g, "_").slice(0, 20) : "unknown";
      trackAnalyticsEvent("upload_error", { locale, kind: kinds[i] ?? "unknown", size_mb: Math.ceil(bodies[i].size / 1048576), reason });
      throw error;
    }
  }
}

/** The picked files and the message for any that were turned away. */
export function useJobFiles(locale: Locale, onAdd?: () => void) {
  const t = jobsCopy[locale].form;
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  function add(list: FileList | null) {
    onAdd?.();
    setError(null);
    if (!list) return;
    const next = [...files];
    const problems: string[] = [];
    for (const file of Array.from(list)) {
      const picked = classify(file);
      const reject = !picked ? "wrong_type" : file.size > INTAKE_LIMITS.maxBytes[picked.kind] ? "too_large" : next.length >= MAX_FILES ? "too_many" : null;
      if (reject) trackAnalyticsEvent("file_rejected", { locale, reason: reject });
      else trackAnalyticsEvent("file_added", { locale, kind: picked!.kind });
      if (!picked) problems.push(`${file.name} ${t.files.wrongType}`);
      else if (file.size > INTAKE_LIMITS.maxBytes[picked.kind]) problems.push(`${file.name} ${t.files.tooLarge}`);
      else if (next.length >= MAX_FILES) problems.push(t.files.tooMany);
      else next.push(picked);
    }
    setFiles(next);
    if (problems.length) setError([...new Set(problems)].join(" "));
  }

  return {
    files,
    error,
    add,
    remove: (index: number) => setFiles(files.filter((_, j) => j !== index)),
    clear: () => setFiles([]),
  };
}

/** Take a photo / Choose files, then the list of what was picked. */
export function JobFilePicker({
  locale,
  picker,
  disabled,
}: {
  locale: Locale;
  picker: ReturnType<typeof useJobFiles>;
  disabled: boolean;
}) {
  const t = jobsCopy[locale].form;
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-3">
        <label className="jobs-file-button">
          <ImageIcon size={18} aria-hidden="true" /> {t.files.camera}
          <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" disabled={disabled} onChange={(e) => { picker.add(e.target.files); e.target.value = ""; }} />
        </label>
        <label className="jobs-file-button">
          <FileText size={18} aria-hidden="true" /> {t.files.choose}
          <input type="file" accept={FILE_ACCEPT} multiple className="sr-only" disabled={disabled} onChange={(e) => { picker.add(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      {picker.files.length > 0 && (
        <ul className="jobs-file-list">
          {picker.files.map((f, i) => (
            <li key={`${f.file.name}-${i}`}>
              <span className="truncate">
                {f.kind === "image" ? t.labels.photo : t.labels.document} · {f.file.name}
              </span>
              <button type="button" aria-label={`${t.files.remove} ${f.file.name}`} onClick={() => picker.remove(i)} disabled={disabled}>
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {picker.error && <p className="jobs-error">{picker.error}</p>}
    </>
  );
}

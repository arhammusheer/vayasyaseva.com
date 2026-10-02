/**
 * Transcribe · "Clean audio type" (once per voice note). Browsers label
 * recordings with codec parameters ("audio/webm;codecs=opus"), the R2 object
 * keeps that label, and Sarvam rejects anything but a bare MIME type
 * ("Invalid file type: audio/webm; codecs=opus"). Strip the parameters before
 * the file is sent.
 */
export default async function main(): Promise<N8nItem<unknown>> {
  const item = $input.item;
  const file = item.binary?.file;
  if (file) file.mimeType = baseMime(file.mimeType);
  return item;
}

export function baseMime(mime: string) {
  return mime.split(";")[0].trim().toLowerCase();
}

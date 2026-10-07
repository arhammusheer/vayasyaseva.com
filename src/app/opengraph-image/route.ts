import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { shareImageUrl } from "@/lib/share-images";

export const dynamic = "force-static";

/** Keep previously shared image URLs working without overriding page metadata. */
export async function GET() {
  const image = await readFile(join(process.cwd(), "public", shareImageUrl("/en-in").slice(1)));
  return new Response(new Uint8Array(image), { headers: { "content-type": "image/png" } });
}

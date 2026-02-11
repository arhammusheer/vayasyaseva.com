import { NextResponse } from "next/server";
import { aiAccessPolicy } from "@/content/ai-access-policy";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return new NextResponse(aiAccessPolicy.trim(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

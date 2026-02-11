import { NextResponse } from "next/server";
import openApiV1 from "@/openapi/v1.json";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return NextResponse.json(openApiV1, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

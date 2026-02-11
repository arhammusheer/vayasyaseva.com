import { NextResponse } from "next/server";
import { agentCard } from "@/lib/agent-card";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return NextResponse.json(agentCard, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

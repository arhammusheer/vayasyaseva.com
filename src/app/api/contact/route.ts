import { NextRequest, NextResponse } from "next/server";
import { contactContract, contactSchema } from "@/lib/contact-contract";

// Simple in-memory rate limiting
const submissions = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastSubmission = submissions.get(ip);
  if (lastSubmission && now - lastSubmission < RATE_LIMIT_WINDOW) {
    return true;
  }
  // Clean old entries
  for (const [key, time] of submissions) {
    if (now - time > RATE_LIMIT_WINDOW) {
      submissions.delete(key);
    }
  }
  submissions.set(ip, now);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: contactContract.responses.rateLimitError },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: contactContract.responses.validationError, details: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;

    // Log structured submission (replace with email/webhook in production)
    // In production, connect to:
    //   - Email service (Resend, SendGrid, AWS SES)
    //   - CRM webhook (HubSpot, Zoho)
    //   - Database (Supabase, PlanetScale)
    console.info("[CONTACT SUBMISSION]", {
      timestamp: new Date().toISOString(),
      name: data.name,
      company: data.company,
      email: data.email,
      industry: data.industry,
      headcount: data.headcount,
    });

    return NextResponse.json({
      success: true,
      message: contactContract.responses.successMessage,
    });
  } catch {
    return NextResponse.json(
      { error: contactContract.responses.unknownError },
      { status: 500 }
    );
  }
}

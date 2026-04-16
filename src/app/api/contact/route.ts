import { after, NextRequest, NextResponse } from "next/server";
import { contactContract, contactSchema } from "@/lib/contact-contract";
import {
  canSendContactAutoReply,
  sendContactAutoReply,
  sendInternalContactEmail,
} from "@/lib/msg91";

const RATE_LIMIT_WINDOW_MS = 60_000;
const DUPLICATE_WINDOW_MS = 5 * 60_000;
const MIN_FORM_COMPLETION_MS = 1_500;

const ipSubmissions = new Map<string, number>();
const duplicateSubmissions = new Map<string, number>();

export const runtime = "nodejs";

function cleanExpiredEntries(now: number) {
  for (const [key, timestamp] of ipSubmissions) {
    if (now - timestamp >= RATE_LIMIT_WINDOW_MS) {
      ipSubmissions.delete(key);
    }
  }

  for (const [key, timestamp] of duplicateSubmissions) {
    if (now - timestamp >= DUPLICATE_WINDOW_MS) {
      duplicateSubmissions.delete(key);
    }
  }
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  if (forwardedIp) {
    return forwardedIp;
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function normalizeDuplicateKey(ip: string, email: string, phone: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.replace(/\D/g, "");
  return `${ip}:${normalizedEmail}:${normalizedPhone}`;
}

function getAbuseReason(request: NextRequest, now: number) {
  const honeypot = request.headers.get("x-contact-form-honeypot");

  if (honeypot && honeypot.trim().length > 0) {
    return "honeypot";
  }

  const startedAt = request.headers.get("x-contact-form-started-at");

  if (!startedAt) {
    return null;
  }

  const parsedStartedAt = Number.parseInt(startedAt, 10);

  if (!Number.isFinite(parsedStartedAt)) {
    return "invalid-started-at";
  }

  if (parsedStartedAt > now + 5_000) {
    return "future-started-at";
  }

  if (now - parsedStartedAt < MIN_FORM_COMPLETION_MS) {
    return "completed-too-fast";
  }

  return null;
}

function reserveSubmission(ip: string, duplicateKey: string, now: number) {
  cleanExpiredEntries(now);

  const lastIpSubmission = ipSubmissions.get(ip);
  if (lastIpSubmission && now - lastIpSubmission < RATE_LIMIT_WINDOW_MS) {
    return true;
  }

  const lastDuplicateSubmission = duplicateSubmissions.get(duplicateKey);
  if (
    lastDuplicateSubmission &&
    now - lastDuplicateSubmission < DUPLICATE_WINDOW_MS
  ) {
    return true;
  }

  ipSubmissions.set(ip, now);
  duplicateSubmissions.set(duplicateKey, now);

  return false;
}

function rollbackReservation(ip: string, duplicateKey: string, now: number) {
  const ipTimestamp = ipSubmissions.get(ip);
  if (ipTimestamp === now) {
    ipSubmissions.delete(ip);
  }

  const duplicateTimestamp = duplicateSubmissions.get(duplicateKey);
  if (duplicateTimestamp === now) {
    duplicateSubmissions.delete(duplicateKey);
  }
}

export async function POST(request: NextRequest) {
  let duplicateKey: string | null = null;
  let ip = "unknown";
  let now = Date.now();

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: contactContract.responses.validationError },
        { status: 400 }
      );
    }

    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: contactContract.responses.validationError, details: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;
    ip = getClientIp(request);
    now = Date.now();
    duplicateKey = normalizeDuplicateKey(ip, data.email ?? "", data.phone ?? "");

    const abuseReason = getAbuseReason(request, now);
    if (abuseReason) {
      console.warn("[CONTACT SUBMISSION BLOCKED]", {
        ip,
        reason: abuseReason,
      });
      return NextResponse.json(
        { error: contactContract.responses.rateLimitError },
        { status: 429 }
      );
    }

    if (reserveSubmission(ip, duplicateKey, now)) {
      console.warn("[CONTACT SUBMISSION BLOCKED]", {
        duplicateKey,
        ip,
        reason: "rate-limit-or-duplicate",
      });
      return NextResponse.json(
        { error: contactContract.responses.rateLimitError },
        { status: 429 }
      );
    }

    const internalDelivery = await sendInternalContactEmail(data);

    console.info("[CONTACT SUBMISSION DELIVERED]", {
      timestamp: new Date().toISOString(),
      duplicateKey,
      ip,
      name: data.name,
      company: data.company,
      email: data.email,
      industry: data.industry,
      headcount: data.headcount,
      messageId: internalDelivery.messageId,
      threadId: internalDelivery.threadId,
      uniqueId: internalDelivery.uniqueId,
    });

    if (canSendContactAutoReply(data)) {
      after(async () => {
        try {
          const autoReply = await sendContactAutoReply(data);
          console.info("[CONTACT AUTOREPLY DELIVERED]", {
            email: data.email,
            messageId: autoReply.messageId,
            threadId: autoReply.threadId,
            uniqueId: autoReply.uniqueId,
          });
        } catch (error) {
          console.error("[CONTACT AUTOREPLY FAILED]", {
            email: data.email,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: contactContract.responses.successMessage,
    });
  } catch (error) {
    if (duplicateKey) {
      rollbackReservation(ip, duplicateKey, now);
    }

    console.error("[CONTACT SUBMISSION FAILED]", {
      ip,
      duplicateKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: contactContract.responses.unknownError },
      { status: 500 }
    );
  }
}

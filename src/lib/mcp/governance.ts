import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 60;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipRateLimits = new Map<string, RateLimitEntry>();

function readIntegerEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return value;
}

function getRateLimitWindowMs() {
  return readIntegerEnv("MCP_RATE_LIMIT_WINDOW_MS", DEFAULT_RATE_LIMIT_WINDOW_MS);
}

function getRateLimitMaxRequests() {
  return readIntegerEnv("MCP_RATE_LIMIT_MAX_REQUESTS", DEFAULT_RATE_LIMIT_MAX_REQUESTS);
}

export function shouldAuditLog() {
  return process.env.MCP_AUDIT_LOGGING_ENABLED !== "false";
}

export function getBearerToken() {
  const token = process.env.MCP_BEARER_TOKEN?.trim();
  return token ? token : null;
}

export function getAuthMode(): "public" | "bearer" {
  return getBearerToken() ? "bearer" : "public";
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function safeTokenMatch(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export function isAuthorized(request: NextRequest): boolean {
  const expectedToken = getBearerToken();
  if (!expectedToken) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const providedToken = authHeader.slice("Bearer ".length).trim();
  if (!providedToken) {
    return false;
  }

  return safeTokenMatch(providedToken, expectedToken);
}

function cleanupExpiredRateLimits(now: number) {
  for (const [ip, entry] of ipRateLimits.entries()) {
    if (entry.resetAt <= now) {
      ipRateLimits.delete(ip);
    }
  }
}

export function applyRateLimit(ip: string) {
  const windowMs = getRateLimitWindowMs();
  const limit = getRateLimitMaxRequests();
  const now = Date.now();
  cleanupExpiredRateLimits(now);

  const existing = ipRateLimits.get(ip);
  if (!existing || existing.resetAt <= now) {
    const nextEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    ipRateLimits.set(ip, nextEntry);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - nextEntry.count),
      resetAt: nextEntry.resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function logMcpAudit(event: Record<string, unknown>) {
  if (!shouldAuditLog()) {
    return;
  }
  console.info("[MCP_AUDIT]", JSON.stringify(event));
}

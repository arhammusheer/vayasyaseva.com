import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createVayasyaMcpServer } from "@/lib/mcp/server";
import {
  applyRateLimit,
  getAuthMode,
  getClientIp,
  hashIp,
  isAuthorized,
  logMcpAudit,
} from "@/lib/mcp/governance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function attachHeaders(response: Response, headersToSet: Record<string, string>): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(headersToSet)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleMcpRequest(request: NextRequest) {
  const requestId = randomUUID();
  const startTime = Date.now();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const authMode = getAuthMode();
  const protocolVersion = request.headers.get("mcp-protocol-version") ?? "none";

  const authHeaders = {
    "X-MCP-Request-Id": requestId,
    "X-MCP-Auth-Mode": authMode,
  };

  if (!isAuthorized(request)) {
    const unauthorized = NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Unauthorized: valid bearer token is required for MCP access.",
        },
        id: null,
      },
      {
        status: 401,
        headers: {
          ...authHeaders,
          "WWW-Authenticate": 'Bearer realm="vayasya-mcp"',
        },
      }
    );

    logMcpAudit({
      timestamp: new Date().toISOString(),
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      ipHash,
      protocolVersion,
      authMode,
      authorized: false,
      status: 401,
      durationMs: Date.now() - startTime,
    });

    return unauthorized;
  }

  const rate = applyRateLimit(ip);
  const rateHeaders = {
    "X-RateLimit-Limit": String(rate.limit),
    "X-RateLimit-Remaining": String(rate.remaining),
    "X-RateLimit-Reset": String(Math.floor(rate.resetAt / 1000)),
    ...authHeaders,
  };

  if (!rate.allowed) {
    const limited = NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32029,
          message: "Rate limit exceeded for MCP requests.",
        },
        id: null,
      },
      {
        status: 429,
        headers: {
          ...rateHeaders,
          "Retry-After": String(rate.retryAfterSeconds),
        },
      }
    );

    logMcpAudit({
      timestamp: new Date().toISOString(),
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      ipHash,
      protocolVersion,
      authMode,
      authorized: true,
      status: 429,
      durationMs: Date.now() - startTime,
      rateLimit: {
        limit: rate.limit,
        remaining: rate.remaining,
        resetAt: rate.resetAt,
      },
    });

    return limited;
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createVayasyaMcpServer();

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const finalized = attachHeaders(response, rateHeaders);

    logMcpAudit({
      timestamp: new Date().toISOString(),
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      ipHash,
      protocolVersion,
      authMode,
      authorized: true,
      status: finalized.status,
      durationMs: Date.now() - startTime,
      rateLimit: {
        limit: rate.limit,
        remaining: rate.remaining,
        resetAt: rate.resetAt,
      },
    });

    return finalized;
  } catch (error) {
    console.error("MCP request handling failed:", error);

    const failed = NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal MCP server error.",
        },
        id: null,
      },
      { status: 500, headers: rateHeaders }
    );

    logMcpAudit({
      timestamp: new Date().toISOString(),
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      ipHash,
      protocolVersion,
      authMode,
      authorized: true,
      status: 500,
      durationMs: Date.now() - startTime,
      rateLimit: {
        limit: rate.limit,
        remaining: rate.remaining,
        resetAt: rate.resetAt,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return failed;
  } finally {
    await Promise.allSettled([transport.close(), server.close()]);
  }
}

export async function POST(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function GET(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleMcpRequest(request);
}

import { siteConfig } from "@/content/site";
import type { ContactFormData } from "@/lib/contact-contract";

const MSG91_SEND_URL = "https://control.msg91.com/api/v5/email/send";
const MSG91_TEMPLATE_VERSIONS_URL =
  "https://control.msg91.com/api/v5/email/template-versions";
const DEFAULT_RESPONSE_WINDOW = "2 business days (IST, Mon-Sat)";
const TEMPLATE_VERSION_PAGE_SIZE = 100;
const TEMPLATE_VERSION_MAX_PAGES = 10;
const TEMPLATE_IDENTIFIER_CACHE_TTL_MS = 5 * 60_000;

const resolvedTemplateIdentifierCache = new Map<
  string,
  { expiresAt: number; value: string }
>();

type Msg91TemplateVariables = Record<string, string>;
type StructuredLogLevel = "info" | "warn" | "error";
type EmailDeliveryType =
  | "contact_internal_notification"
  | "contact_autoreply";

interface Msg91Address {
  email: string;
  name?: string;
}

interface Msg91Recipient {
  to: Msg91Address[];
  cc?: Msg91Address[];
  bcc?: Msg91Address[];
  variables: Msg91TemplateVariables;
}

interface Msg91SendPayload {
  from: {
    name: string;
    email: string;
  };
  domain: string;
  reply_to: Array<{
    email: string;
  }>;
  recipients: Msg91Recipient[];
  template_id: string;
}

interface Msg91SendResponse {
  data?: {
    thread_id?: number;
    unique_id?: string;
    message_id?: string;
  };
  errors?: unknown;
  hasError?: boolean;
  status?: string;
}

interface Msg91TemplateVersion {
  id?: number;
  template_id?: number;
  slug?: string;
  is_active?: boolean;
  updated_at?: string;
  created_at?: string;
}

export interface Msg91SendResult {
  threadId?: number;
  uniqueId?: string;
  messageId?: string;
}

export interface ContactEmailOptions {
  caseId: string;
}

interface Msg91Config {
  authKey: string;
  domain: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
}

interface SendTemplateContext {
  caseId: string;
  deliveryType: EmailDeliveryType;
  registeredTemplateIdentifier: string;
  templateIdentifier: string;
}

class Msg91RequestError extends Error {
  metadata?: Record<string, unknown>;

  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message);
    this.name = "Msg91RequestError";
    this.metadata = metadata;
  }
}

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function getConsoleMethod(level: StructuredLogLevel) {
  switch (level) {
    case "error":
      return console.error;
    case "warn":
      return console.warn;
    default:
      return console.info;
  }
}

function maskEmailAddress(value: string) {
  const [localPart, domain] = value.split("@");

  if (!localPart || !domain) {
    return value;
  }

  const prefix = localPart.slice(0, 1);
  return `${prefix}***@${domain}`;
}

function getEmailDomain(value: string) {
  const [, domain] = value.split("@");
  return domain?.toLowerCase() ?? "unknown";
}

function getRecipientAddresses(recipient: Msg91Recipient) {
  return [...recipient.to, ...(recipient.cc ?? []), ...(recipient.bcc ?? [])];
}

function getRecipientEmails(payload: Msg91SendPayload) {
  return payload.recipients.flatMap((recipient) =>
    getRecipientAddresses(recipient).map((contact) => contact.email)
  );
}

function getRecipientEmailsByType(
  payload: Msg91SendPayload,
  key: "to" | "cc" | "bcc"
) {
  return payload.recipients.flatMap((recipient) => {
    const contacts = recipient[key];
    return Array.isArray(contacts)
      ? contacts.map((contact) => contact.email)
      : [];
  });
}

function getTemplateVariableCount(payload: Msg91SendPayload) {
  return payload.recipients.reduce(
    (count, recipient) => count + Object.keys(recipient.variables).length,
    0
  );
}

function getErrorMetadata(error: unknown) {
  if (error instanceof Msg91RequestError) {
    return {
      message: error.message,
      type: error.name,
      stack_trace: error.stack,
      ...error.metadata,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.name,
      stack_trace: error.stack,
    };
  }

  return {
    message: "Unknown error",
    type: typeof error,
  };
}

function logEmailEvent(
  level: StructuredLogLevel,
  options: {
    action: string;
    message: string;
    outcome: "success" | "failure" | "unknown";
    operationId: string;
    payload: Msg91SendPayload;
    context: SendTemplateContext;
    response?: Msg91SendResult;
    error?: unknown;
    providerStatus?: string;
    templateResolutionSource?: "direct" | "resolved_from_numeric_id" | "cache";
  }
) {
  const recipientEmails = getRecipientEmails(options.payload);
  const toEmails = getRecipientEmailsByType(options.payload, "to");
  const ccEmails = getRecipientEmailsByType(options.payload, "cc");
  const bccEmails = getRecipientEmailsByType(options.payload, "bcc");
  const record = {
    "@timestamp": new Date().toISOString(),
    message: options.message,
    log: {
      level,
      logger: "msg91-mailer",
    },
    service: {
      name: "vayasyaseva-web",
      component: "msg91-mailer",
    },
    event: {
      category: ["email"],
      action: options.action,
      outcome: options.outcome,
    },
    trace: {
      id: options.operationId,
    },
    labels: {
      case_id: options.context.caseId,
      provider: "msg91",
      delivery_type: options.context.deliveryType,
      template_resolution_source:
        options.templateResolutionSource ?? "direct",
    },
    email: {
      from: options.payload.from.email,
      reply_to: options.payload.reply_to.map((entry) => entry.email),
      recipient_count: recipientEmails.length,
      recipient_domains: [...new Set(recipientEmails.map(getEmailDomain))],
      recipients_masked: recipientEmails.map(maskEmailAddress),
      to_masked: toEmails.map(maskEmailAddress),
      cc_masked: ccEmails.map(maskEmailAddress),
      bcc_masked: bccEmails.map(maskEmailAddress),
    },
    msg91: {
      domain: options.payload.domain,
      template_identifier: options.context.templateIdentifier,
      registered_template_identifier:
        options.context.registeredTemplateIdentifier,
      template_variable_count: getTemplateVariableCount(options.payload),
      provider_status: options.providerStatus,
      message_id: options.response?.messageId,
      thread_id: options.response?.threadId,
      unique_id: options.response?.uniqueId,
    },
    error: options.error ? getErrorMetadata(options.error) : undefined,
  };

  getConsoleMethod(level)(JSON.stringify(record));
}

function isNumericTemplateIdentifier(value: string) {
  return /^\d+$/.test(value);
}

function getRequiredMsg91Config() {
  const config = {
    authKey: getEnv("MSG91_AUTH_KEY"),
    domain: getEnv("MSG91_DOMAIN"),
    fromEmail: getEnv("MSG91_FROM_EMAIL"),
    fromName: getEnv("MSG91_FROM_NAME"),
    replyToEmail:
      getEnv("MSG91_REPLY_TO_EMAIL") ??
      getEnv("CONTACT_INTERNAL_RECIPIENT_EMAIL") ??
      siteConfig.email,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required MSG91 configuration: ${missing.join(", ")}`
    );
  }

  return config as Msg91Config;
}

function getSharedInboxEmail(fallbackEmail = siteConfig.email) {
  return getEnv("CONTACT_INTERNAL_RECIPIENT_EMAIL") ?? fallbackEmail;
}

function withFallback(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function requireField(value: string | undefined, fieldName: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`Missing required contact field: ${fieldName}`);
  }

  return trimmed;
}

export function createContactCaseId(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const token = crypto.randomUUID().split("-")[0].toUpperCase();
  return `REQ-${stamp}-${token}`;
}

function buildCommonVariables(
  data: ContactFormData,
  caseId: string
): Msg91TemplateVariables {
  const name = requireField(data.name, "name");
  const phone = requireField(data.phone, "phone");

  return {
    case_id: caseId,
    company: withFallback(data.company, "Not provided"),
    details: requireField(data.details, "details"),
    email: withFallback(data.email, "Not provided"),
    headcount: withFallback(data.headcount, "Not provided"),
    industry: withFallback(data.industry, "Not provided"),
    location: withFallback(data.location, "Not provided"),
    name,
    phone,
    response_window: DEFAULT_RESPONSE_WINDOW,
    role: withFallback(data.role, "Not provided"),
    shift_requirement: withFallback(data.shiftRequirement, "Not specified"),
    submitted_at: new Date().toISOString(),
    target_start_date: withFallback(data.targetStartDate, "Not specified"),
  };
}

async function msg91Request(
  config: Msg91Config,
  url: string,
  init: RequestInit
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      authkey: config.authKey,
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Msg91RequestError(
      `MSG91 request failed with status ${response.status}`,
      {
        response_body: payload,
        response_status: response.status,
        request_method: init.method ?? "GET",
        request_url: url,
      }
    );
  }

  return payload;
}

function extractTemplateVersions(payload: unknown): Msg91TemplateVersion[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidates = [
    (payload as { data?: { data?: unknown } }).data?.data,
    (payload as { data?: unknown }).data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as Msg91TemplateVersion[];
    }
  }

  return [];
}

function sortVersionsNewestFirst(versions: Msg91TemplateVersion[]) {
  return [...versions].sort((left, right) => {
    const leftTime =
      Date.parse(left.updated_at ?? left.created_at ?? "") || 0;
    const rightTime =
      Date.parse(right.updated_at ?? right.created_at ?? "") || 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return Number(right.id ?? 0) - Number(left.id ?? 0);
  });
}

async function resolveRegisteredTemplateIdentifier(
  config: Msg91Config,
  templateIdentifier: string
): Promise<{
  registeredTemplateIdentifier: string;
  resolutionSource: "direct" | "resolved_from_numeric_id" | "cache";
}> {
  if (!isNumericTemplateIdentifier(templateIdentifier)) {
    return {
      registeredTemplateIdentifier: templateIdentifier,
      resolutionSource: "direct",
    };
  }

  const cached = resolvedTemplateIdentifierCache.get(templateIdentifier);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return {
      registeredTemplateIdentifier: cached.value,
      resolutionSource: "cache",
    };
  }

  const templateId = Number.parseInt(templateIdentifier, 10);

  for (let page = 1; page <= TEMPLATE_VERSION_MAX_PAGES; page += 1) {
    const url = new URL(MSG91_TEMPLATE_VERSIONS_URL);
    url.searchParams.set("per_page", String(TEMPLATE_VERSION_PAGE_SIZE));
    url.searchParams.set("page", String(page));

    const payload = await msg91Request(config, url.toString(), {
      method: "GET",
    });
    const versions = extractTemplateVersions(payload);
    const matchingVersions = versions.filter(
      (version) => version.template_id === templateId
    );

    if (matchingVersions.length > 0) {
      const sortedVersions = sortVersionsNewestFirst(matchingVersions);
      const activeVersion =
        sortedVersions.find((version) => version.is_active) ?? sortedVersions[0];

      if (!activeVersion?.slug) {
        throw new Error(
          `MSG91 template ${templateIdentifier} does not have a registered active slug`
        );
      }

      resolvedTemplateIdentifierCache.set(templateIdentifier, {
        expiresAt: now + TEMPLATE_IDENTIFIER_CACHE_TTL_MS,
        value: activeVersion.slug,
      });

      return {
        registeredTemplateIdentifier: activeVersion.slug,
        resolutionSource: "resolved_from_numeric_id",
      };
    }

    if (versions.length < TEMPLATE_VERSION_PAGE_SIZE) {
      break;
    }
  }

  throw new Error(
    `MSG91 template ${templateIdentifier} could not be resolved to an active registered slug`
  );
}

export function canSendContactAutoReply(data: ContactFormData) {
  return Boolean(data.email?.trim());
}

async function sendTemplateEmail(
  config: Msg91Config,
  payload: Msg91SendPayload,
  context: SendTemplateContext,
  templateResolutionSource?: "direct" | "resolved_from_numeric_id" | "cache"
): Promise<Msg91SendResult> {
  const operationId = crypto.randomUUID();

  logEmailEvent("info", {
    action: "send",
    message: "MSG91 email send started",
    outcome: "unknown",
    operationId,
    payload,
    context,
    templateResolutionSource,
  });

  try {
    const result = (await msg91Request(config, MSG91_SEND_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })) as Msg91SendResponse;

    if (result?.hasError) {
      throw new Msg91RequestError("MSG91 send failed", {
        provider_status: result.status,
        response_errors: result.errors,
      });
    }

    const sendResult = {
      messageId: result?.data?.message_id,
      threadId: result?.data?.thread_id,
      uniqueId: result?.data?.unique_id,
    };

    logEmailEvent("info", {
      action: "send",
      message: "MSG91 email send succeeded",
      outcome: "success",
      operationId,
      payload,
      context,
      response: sendResult,
      providerStatus: result?.status,
      templateResolutionSource,
    });

    return sendResult;
  } catch (error) {
    logEmailEvent("error", {
      action: "send",
      message: "MSG91 email send failed",
      outcome: "failure",
      operationId,
      payload,
      context,
      error,
      templateResolutionSource,
    });

    throw error;
  }
}

export async function sendInternalContactEmail(
  data: ContactFormData,
  options: ContactEmailOptions
): Promise<Msg91SendResult> {
  const config = getRequiredMsg91Config();
  const templateId = getEnv("MSG91_INTERNAL_TEMPLATE_ID");

  if (!templateId) {
    throw new Error("Missing required MSG91 configuration: MSG91_INTERNAL_TEMPLATE_ID");
  }

  const sharedInboxEmail = getSharedInboxEmail(config.replyToEmail);
  const variables = buildCommonVariables(data, options.caseId);
  const resolvedTemplate = await resolveRegisteredTemplateIdentifier(
    config,
    templateId
  );

  return sendTemplateEmail(config, {
    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    domain: config.domain,
    recipients: [
      {
        to: [
          {
            email: sharedInboxEmail,
            name: `${siteConfig.companyName} Shared Inbox`,
          },
        ],
        variables,
      },
    ],
    reply_to: [{ email: sharedInboxEmail }],
    template_id: resolvedTemplate.registeredTemplateIdentifier,
  }, {
    caseId: options.caseId,
    deliveryType: "contact_internal_notification",
    registeredTemplateIdentifier: resolvedTemplate.registeredTemplateIdentifier,
    templateIdentifier: templateId,
  }, resolvedTemplate.resolutionSource);
}

export async function sendContactAutoReply(
  data: ContactFormData,
  options: ContactEmailOptions
): Promise<Msg91SendResult> {
  const config = getRequiredMsg91Config();
  const templateId = getEnv("MSG91_AUTOREPLY_TEMPLATE_ID");
  const name = requireField(data.name, "name");
  const email = requireField(data.email, "email");

  if (!templateId) {
    throw new Error("Missing required MSG91 configuration: MSG91_AUTOREPLY_TEMPLATE_ID");
  }

  const sharedInboxEmail = getSharedInboxEmail(config.replyToEmail);
  const variables = {
    ...buildCommonVariables(data, options.caseId),
    response_window: DEFAULT_RESPONSE_WINDOW,
  };
  const resolvedTemplate = await resolveRegisteredTemplateIdentifier(
    config,
    templateId
  );

  return sendTemplateEmail(config, {
    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    domain: config.domain,
    recipients: [
      {
        to: [
          {
            email,
            name,
          },
        ],
        bcc: [
          {
            email: sharedInboxEmail,
            name: `${siteConfig.companyName} Shared Inbox`,
          },
        ],
        variables,
      },
    ],
    reply_to: [{ email: sharedInboxEmail }],
    template_id: resolvedTemplate.registeredTemplateIdentifier,
  }, {
    caseId: options.caseId,
    deliveryType: "contact_autoreply",
    registeredTemplateIdentifier: resolvedTemplate.registeredTemplateIdentifier,
    templateIdentifier: templateId,
  }, resolvedTemplate.resolutionSource);
}

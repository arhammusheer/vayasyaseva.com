import { siteConfig } from "@/content/site";
import type { ContactFormData } from "@/lib/contact-contract";

const MSG91_SEND_URL = "https://control.msg91.com/api/v5/email/send";
const DEFAULT_RESPONSE_WINDOW = "2 business days (IST, Mon-Sat)";

type Msg91TemplateVariables = Record<string, string>;

interface Msg91Recipient {
  to: Array<{
    email: string;
    name?: string;
  }>;
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

export interface Msg91SendResult {
  threadId?: number;
  uniqueId?: string;
  messageId?: string;
}

interface Msg91Config {
  authKey: string;
  domain: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
}

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function getRequiredMsg91Config() {
  const config = {
    authKey: getEnv("MSG91_AUTH_KEY"),
    domain: getEnv("MSG91_DOMAIN"),
    fromEmail: getEnv("MSG91_FROM_EMAIL"),
    fromName: getEnv("MSG91_FROM_NAME"),
    replyToEmail: getEnv("MSG91_REPLY_TO_EMAIL") ?? siteConfig.email,
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

function buildCommonVariables(data: ContactFormData): Msg91TemplateVariables {
  const name = requireField(data.name, "name");
  const phone = requireField(data.phone, "phone");

  return {
    company: withFallback(data.company, "Not provided"),
    details: requireField(data.details, "details"),
    email: withFallback(data.email, "Not provided"),
    headcount: withFallback(data.headcount, "Not provided"),
    industry: withFallback(data.industry, "Not provided"),
    location: withFallback(data.location, "Not provided"),
    name,
    phone,
    role: withFallback(data.role, "Not provided"),
    shift_requirement: withFallback(data.shiftRequirement, "Not specified"),
    submitted_at: new Date().toISOString(),
    support_email: siteConfig.email,
    support_phone: siteConfig.phone,
    target_start_date: withFallback(data.targetStartDate, "Not specified"),
  };
}

export function canSendContactAutoReply(data: ContactFormData) {
  return Boolean(data.email?.trim());
}

async function sendTemplateEmail(
  config: Msg91Config,
  payload: Msg91SendPayload
): Promise<Msg91SendResult> {
  const response = await fetch(MSG91_SEND_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      authkey: config.authKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let result: Msg91SendResponse | null = null;

  try {
    result = (await response.json()) as Msg91SendResponse;
  } catch {
    result = null;
  }

  if (!response.ok || result?.hasError) {
    const statusSuffix = result?.status ? ` (${result.status})` : "";
    throw new Error(
      `MSG91 send failed with status ${response.status}${statusSuffix}`
    );
  }

  return {
    messageId: result?.data?.message_id,
    threadId: result?.data?.thread_id,
    uniqueId: result?.data?.unique_id,
  };
}

export async function sendInternalContactEmail(
  data: ContactFormData
): Promise<Msg91SendResult> {
  const config = getRequiredMsg91Config();
  const templateId = getEnv("MSG91_INTERNAL_TEMPLATE_ID");

  if (!templateId) {
    throw new Error("Missing required MSG91 configuration: MSG91_INTERNAL_TEMPLATE_ID");
  }

  const recipientEmail = getEnv("CONTACT_INTERNAL_RECIPIENT_EMAIL") ?? siteConfig.email;
  const variables = buildCommonVariables(data);

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
            email: recipientEmail,
            name: `${siteConfig.companyName} Operations`,
          },
        ],
        variables,
      },
    ],
    reply_to: [{ email: config.replyToEmail }],
    template_id: templateId,
  });
}

export async function sendContactAutoReply(
  data: ContactFormData
): Promise<Msg91SendResult> {
  const config = getRequiredMsg91Config();
  const templateId = getEnv("MSG91_AUTOREPLY_TEMPLATE_ID");
  const name = requireField(data.name, "name");
  const email = requireField(data.email, "email");

  if (!templateId) {
    throw new Error("Missing required MSG91 configuration: MSG91_AUTOREPLY_TEMPLATE_ID");
  }

  const variables = {
    name,
    response_window: DEFAULT_RESPONSE_WINDOW,
    support_email: siteConfig.email,
    support_phone: siteConfig.phone,
  };

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
        variables,
      },
    ],
    reply_to: [{ email: config.replyToEmail }],
    template_id: templateId,
  });
}

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY?.trim();

if (!MSG91_AUTH_KEY) {
  console.error("Missing MSG91_AUTH_KEY. Set it in your environment before running this script.");
  process.exit(1);
}

const MSG91_TEMPLATES_URL = "https://control.msg91.com/api/v5/email/templates";
const TEMPLATE_SEARCH_STATUSES = [2, 1, 5];
const TEMPLATE_PAGE_SIZE = 100;

const templateDefinitions = [
  {
    key: "MSG91_INTERNAL_TEMPLATE_ID",
    name: "Vayasya Contact Internal Notification",
    slug: "vayasya-contact-internal-v1",
    subject: "New requirement inquiry from {{name}}",
    body: `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h1 style="font-size: 20px; margin-bottom: 16px;">New contact inquiry received</h1>
    <p><strong>Name:</strong> {{name}}</p>
    <p><strong>Phone:</strong> {{phone}}</p>
    <p><strong>Requirement details:</strong> {{details}}</p>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
    <p><strong>Company:</strong> {{company}}</p>
    <p><strong>Role:</strong> {{role}}</p>
    <p><strong>Email:</strong> {{email}}</p>
    <p><strong>Location:</strong> {{location}}</p>
    <p><strong>Industry:</strong> {{industry}}</p>
    <p><strong>Approx. headcount:</strong> {{headcount}}</p>
    <p><strong>Shift requirement:</strong> {{shift_requirement}}</p>
    <p><strong>Target start date:</strong> {{target_start_date}}</p>
    <p><strong>Submitted at:</strong> {{submitted_at}}</p>
  </body>
</html>`,
  },
  {
    key: "MSG91_AUTOREPLY_TEMPLATE_ID",
    name: "Vayasya Contact Acknowledgement",
    slug: "vayasya-contact-autoreply-v1",
    subject: "We received your requirement | Vayasya Seva",
    body: `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h1 style="font-size: 20px; margin-bottom: 16px;">Thank you, {{name}}</h1>
    <p>We received your requirement inquiry and our operations team will review it shortly.</p>
    <p>Target response window: <strong>{{response_window}}</strong></p>
    <p>If you need to add context in the meantime, reply to <a href="mailto:{{support_email}}">{{support_email}}</a> or call <a href="tel:{{support_phone}}">{{support_phone}}</a>.</p>
    <p>Regards,<br />Vayasya Seva Operations</p>
  </body>
</html>`,
  },
];

function getHeaders() {
  return {
    accept: "application/json",
    authkey: MSG91_AUTH_KEY,
    "content-type": "application/json",
  };
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object"
        ? JSON.stringify(payload)
        : `HTTP ${response.status}`;
    throw new Error(`MSG91 request failed: ${message}`);
  }

  return payload;
}

function extractTemplates(payload) {
  const candidates = [
    payload?.data?.data,
    payload?.data?.templates,
    payload?.data,
    payload?.templates,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function resolveTemplateIdentifier(template) {
  if (template?.slug) {
    return String(template.slug);
  }

  if (Array.isArray(template?.versions)) {
    const versionWithSlug = template.versions.find((version) => version?.slug);
    if (versionWithSlug?.slug) {
      return String(versionWithSlug.slug);
    }
  }

  if (template?.id) {
    return String(template.id);
  }

  throw new Error("Unable to resolve MSG91 template identifier.");
}

function getStatusLabel(statusId) {
  switch (statusId) {
    case 1:
      return "pending";
    case 2:
      return "verified";
    case 5:
      return "rejected";
    default:
      return `status-${statusId ?? "unknown"}`;
  }
}

async function findExistingTemplate(definition) {
  for (const statusId of TEMPLATE_SEARCH_STATUSES) {
    for (let page = 1; page <= 10; page += 1) {
      const url = new URL(MSG91_TEMPLATES_URL);
      url.searchParams.set("with", "versions");
      url.searchParams.set("per_page", String(TEMPLATE_PAGE_SIZE));
      url.searchParams.set("page", String(page));
      url.searchParams.set("status_id", String(statusId));
      url.searchParams.set("keyword", definition.name);
      url.searchParams.set("search_in", "name");

      const payload = await apiRequest(url);
      const templates = extractTemplates(payload);

      const match = templates.find((template) => {
        const name = template?.name?.trim();
        const slug = template?.slug?.trim();
        const versions = Array.isArray(template?.versions) ? template.versions : [];
        return (
          name === definition.name ||
          slug === definition.slug ||
          versions.some((version) => version?.slug?.trim() === definition.slug)
        );
      });

      if (match) {
        return match;
      }

      if (templates.length < TEMPLATE_PAGE_SIZE) {
        break;
      }
    }
  }

  return null;
}

async function createTemplate(definition) {
  const payload = await apiRequest(MSG91_TEMPLATES_URL, {
    method: "POST",
    body: JSON.stringify({
      body: definition.body,
      name: definition.name,
      slug: definition.slug,
      subject: definition.subject,
    }),
  });

  return payload?.data ?? payload;
}

async function ensureTemplate(definition) {
  const existing = await findExistingTemplate(definition);

  if (existing) {
    const identifier = resolveTemplateIdentifier(existing);
    console.log(
      `Reusing existing template: ${definition.name} (${identifier}, ${getStatusLabel(
        existing?.status_id
      )})`
    );
    return {
      id: existing?.id,
      identifier,
      status: getStatusLabel(existing?.status_id),
    };
  }

  const created = await createTemplate(definition);
  const identifier = resolveTemplateIdentifier(created);

  console.log(`Created template: ${definition.name} (${identifier})`);

  return {
    id: created?.id,
    identifier,
    status: getStatusLabel(created?.versions?.[0]?.status_id ?? created?.status_id ?? 1),
  };
}

async function main() {
  console.log("Ensuring MSG91 contact form templates exist...");

  const resolvedTemplates = [];

  for (const definition of templateDefinitions) {
    const resolved = await ensureTemplate(definition);
    resolvedTemplates.push({
      ...resolved,
      key: definition.key,
      name: definition.name,
    });
  }

  console.log("\nTemplate identifiers for Vercel:");
  for (const template of resolvedTemplates) {
    console.log(`${template.key}=${template.identifier}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY?.trim();

if (!MSG91_AUTH_KEY) {
  console.error("Missing MSG91_AUTH_KEY. Set it in your environment before running this script.");
  process.exit(1);
}

const MSG91_TEMPLATES_URL = "https://control.msg91.com/api/v5/email/templates";
const MSG91_TEMPLATE_VERSIONS_URL = "https://control.msg91.com/api/v5/email/template-versions";
const TEMPLATE_SEARCH_STATUSES = [2, 1, 5];
const TEMPLATE_PAGE_SIZE = 100;
const BRAND = {
  companyName: "Vayasya Seva",
  legalName: "Vayasya Seva Private Limited",
  supportEmail: "help@vayasyaseva.com",
  supportPhone: "+91 72920 14101",
  supportAddress: "Haridwar, Uttarakhand",
  websiteUrl: "https://www.vayasyaseva.com",
};
const FONT_FAMILY_BODY = "'Hind', Arial, Helvetica, sans-serif";
const FONT_FAMILY_DISPLAY = "'Anek Devanagari', 'Hind', Arial, Helvetica, sans-serif";
const EMAIL_COLORS = {
  accent: "#8F6818",
  accentSurface: "#FBF6E7",
  background: "#F4F4F2",
  border: "#DED9CC",
  muted: "#4B5563",
  panel: "#F6F6F3",
  subtle: "#6B7280",
  text: "#18181B",
  white: "#FFFFFF",
};
const BRAND_DESCRIPTOR = "Compliance-first industrial services";
const EMAIL_FONT_HEAD = `
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style type="text/css">
      @import url("https://fonts.googleapis.com/css2?family=Anek+Devanagari:wght@600;700&family=Hind:wght@400;500;600;700&display=swap");

      .vayasya-body,
      .vayasya-body td,
      .vayasya-body p,
      .vayasya-body a,
      .vayasya-body span {
        font-family: ${FONT_FAMILY_BODY} !important;
      }

      .vayasya-heading,
      .vayasya-heading span {
        font-family: ${FONT_FAMILY_DISPLAY} !important;
      }
    </style>
  </head>`;

function renderMatrix(items, options = {}) {
  const tone = options.tone === "warm" ? EMAIL_COLORS.accentSurface : EMAIL_COLORS.panel;
  const labelColor = options.tone === "warm" ? EMAIL_COLORS.accent : EMAIL_COLORS.subtle;
  const rows = [];

  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid ${EMAIL_COLORS.border}; background-color: ${tone};">
      ${rows
        .map(
          (row, rowIndex) => `
            <tr>
              ${row
                .map(
                  (item, columnIndex) => `
                    <td valign="top" width="50%" style="padding: 14px 16px; ${rowIndex > 0 ? `border-top: 1px solid ${EMAIL_COLORS.border};` : ""} ${
                      columnIndex === 1 ? `border-left: 1px solid ${EMAIL_COLORS.border};` : ""
                    }">
                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${labelColor};">
                        ${item.label}
                      </p>
                      <p style="margin: 0; font-size: 15px; line-height: 1.55; color: ${EMAIL_COLORS.text};">
                        ${item.value}
                      </p>
                    </td>`
                )
                .join("")}
              ${
                row.length === 1
                  ? `<td width="50%" style="padding: 14px 16px; ${rowIndex > 0 ? `border-top: 1px solid ${EMAIL_COLORS.border};` : ""} border-left: 1px solid ${EMAIL_COLORS.border};">&nbsp;</td>`
                  : ""
              }
            </tr>`
        )
        .join("")}
    </table>`;
}

function renderDefinitionTable(rows, options = {}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: ${options.marginBottom ?? 20}px; border-top: 1px solid ${EMAIL_COLORS.border};">
      ${rows
        .map(
          (row) => `
            <tr>
              <td valign="top" width="38%" style="padding: 12px 0; font-size: 13px; color: ${EMAIL_COLORS.subtle}; border-top: 1px solid ${EMAIL_COLORS.border};">
                ${row.label}
              </td>
              <td valign="top" style="padding: 12px 0; font-size: 14px; line-height: 1.55; color: ${EMAIL_COLORS.text}; border-top: 1px solid ${EMAIL_COLORS.border};">
                ${row.value}
              </td>
            </tr>`
        )
        .join("")}
    </table>`;
}

function renderSection(label, content, options = {}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: ${options.marginBottom ?? 20}px;">
      <tr>
        <td style="padding: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${EMAIL_COLORS.accent};">
          ${label}
        </td>
      </tr>
      <tr>
        <td style="padding: 18px; border: 1px solid ${EMAIL_COLORS.border}; background-color: ${options.tone === "warm" ? EMAIL_COLORS.accentSurface : EMAIL_COLORS.white}; font-size: 15px; line-height: 1.65; color: ${EMAIL_COLORS.text}; ${options.preserveWhitespace ? "white-space: pre-wrap;" : ""}">
          ${content}
        </td>
      </tr>
    </table>`;
}

function renderEmailShell({ title, lead, referenceBlock, summaryBlock, sections, closingNote }) {
  return `<!doctype html>
<html>
${EMAIL_FONT_HEAD}
  <body class="vayasya-body" style="margin: 0; padding: 24px; background-color: ${EMAIL_COLORS.background}; font-family: ${FONT_FAMILY_BODY}; color: ${EMAIL_COLORS.text}; line-height: 1.6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; border: 1px solid ${EMAIL_COLORS.border}; background-color: ${EMAIL_COLORS.white}; border-collapse: collapse;">
            <tr>
              <td>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="width: 18px; background-color: ${EMAIL_COLORS.accent}; font-size: 0; line-height: 0;">&nbsp;</td>
                    <td style="padding: 24px 28px 22px; border-bottom: 1px solid ${EMAIL_COLORS.border};">
                      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: ${EMAIL_COLORS.accent};">
                        ${BRAND.companyName}
                      </p>
                      <p style="margin: 0 0 14px; font-size: 13px; color: ${EMAIL_COLORS.subtle};">
                        ${BRAND_DESCRIPTOR}
                      </p>
                      <h1 class="vayasya-heading" style="margin: 0 0 10px; font-size: 28px; line-height: 1.28; color: ${EMAIL_COLORS.text}; font-family: ${FONT_FAMILY_DISPLAY};">
                        ${title}
                      </h1>
                      <p style="margin: 0; max-width: 520px; font-size: 15px; line-height: 1.65; color: ${EMAIL_COLORS.muted};">
                        ${lead}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 28px 12px;">
                ${referenceBlock}
                ${summaryBlock}
                ${sections.join("")}
                <p style="margin: 0; font-size: 15px; line-height: 1.65; color: ${EMAIL_COLORS.muted};">
                  ${closingNote}
                </p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; border-collapse: collapse;">
            <tr>
              <td style="padding: 16px 8px 0; font-size: 12px; line-height: 1.7; color: ${EMAIL_COLORS.subtle}; text-align: center;">
                ${BRAND.legalName} &nbsp;&middot;&nbsp; ${BRAND.supportAddress}<br />
                <a href="${BRAND.websiteUrl}" style="color: ${EMAIL_COLORS.accent}; text-decoration: none;">${BRAND.websiteUrl}</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${BRAND.supportEmail}" style="color: ${EMAIL_COLORS.accent}; text-decoration: none;">${BRAND.supportEmail}</a>
                &nbsp;&middot;&nbsp;
                <a href="tel:${BRAND.supportPhone}" style="color: ${EMAIL_COLORS.accent}; text-decoration: none;">${BRAND.supportPhone}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const templateDefinitions = [
  {
    key: "MSG91_INTERNAL_TEMPLATE_ID",
    name: "Vayasya Contact Internal Notification",
    slug: "vayasya-contact-internal",
    subject: "Vayasya Seva | Requirement intake [{{case_id}}] | {{name}}",
    body: renderEmailShell({
      title: "Requirement intake recorded",
      lead:
        "A new requirement was submitted through the Vayasya Seva contact channel and now needs review in the shared inbox.",
      referenceBlock: renderMatrix(
        [
          { label: "Case ID", value: "{{case_id}}" },
          { label: "Submitted from", value: `<a href="${BRAND.websiteUrl}" style="color: ${EMAIL_COLORS.accent}; text-decoration: none;">${BRAND.websiteUrl}</a>` },
        ],
        { tone: "neutral" }
      ),
      summaryBlock: renderMatrix(
        [
          { label: "Current status", value: "New intake recorded" },
          { label: "Required action", value: `Review scope and continue client communication from ${BRAND.supportEmail}` },
          { label: "Owner", value: BRAND.supportEmail },
          { label: "Next checkpoint", value: "{{response_window}}" },
        ],
        { tone: "warm" }
      ),
      sections: [
        renderSection(
          "Primary contact",
          renderDefinitionTable(
            [
              { label: "Name", value: "{{name}}" },
              { label: "Phone", value: "{{phone}}" },
              { label: "Email", value: "{{email}}" },
            ],
            { marginBottom: 0 }
          ),
          { tone: "warm" }
        ),
        renderSection("Requirement details", "{{details}}", {
          preserveWhitespace: true,
        }),
        renderSection(
          "Scope and site context",
          renderDefinitionTable(
            [
              { label: "Company", value: "{{company}}" },
              { label: "Role", value: "{{role}}" },
              { label: "Location", value: "{{location}}" },
              { label: "Industry", value: "{{industry}}" },
              { label: "Approx. headcount", value: "{{headcount}}" },
              { label: "Shift requirement", value: "{{shift_requirement}}" },
              { label: "Target start date", value: "{{target_start_date}}" },
              { label: "Submitted at", value: "{{submitted_at}}" },
            ],
            { marginBottom: 0 }
          ),
          { marginBottom: 24 }
        ),
      ],
      closingNote:
        "Use the case ID in the subject line for follow-up. Keep scope, owner, and timing explicit in the first reply.",
    }),
  },
  {
    key: "MSG91_AUTOREPLY_TEMPLATE_ID",
    name: "Vayasya Contact Acknowledgement",
    slug: "vayasya-contact-autoreply",
    subject: "Vayasya Seva | Requirement received [{{case_id}}]",
    body: renderEmailShell({
      title: "Requirement received",
      lead:
        "This requirement has been recorded and this thread is the right place to add or correct site, scope, or timing details before the next update.",
      referenceBlock: renderMatrix(
        [
          { label: "Case ID", value: "{{case_id}}" },
          { label: "Reply route", value: `Reply to ${BRAND.supportEmail}` },
        ],
        { tone: "neutral" }
      ),
      summaryBlock: renderMatrix(
        [
          { label: "Current status", value: "Received and logged" },
          { label: "Required action", value: "None unless you need to correct or add requirement details" },
          { label: "Owner", value: "Vayasya Seva operations" },
          { label: "Next checkpoint", value: "{{response_window}}" },
        ],
        { tone: "warm" }
      ),
      sections: [
        renderSection("Submission summary", "{{details}}", {
          preserveWhitespace: true,
        }),
        renderSection(
          "Recorded details",
          renderDefinitionTable(
            [
              { label: "Name", value: "{{name}}" },
              { label: "Phone", value: "{{phone}}" },
              { label: "Email", value: "{{email}}" },
              { label: "Company", value: "{{company}}" },
              { label: "Location", value: "{{location}}" },
            ],
            { marginBottom: 0 }
          ),
          { marginBottom: 24 }
        ),
      ],
      closingNote:
        `For updates, reply on this email thread and keep the case ID in the subject line. Vayasya Seva operations will respond from ${BRAND.supportEmail}.`,
    }),
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

function resolveTemplateEnvIdentifier(template) {
  if (template?.id) {
    return String(template.id);
  }

  throw new Error("Unable to resolve MSG91 template env identifier.");
}

function resolveTemplateDisplayIdentifier(template) {
  if (template?.slug) {
    return String(template.slug);
  }

  if (Array.isArray(template?.versions)) {
    const versionWithSlug = template.versions.find((version) => version?.slug);
    if (versionWithSlug?.slug) {
      return String(versionWithSlug.slug);
    }
  }

  return resolveTemplateEnvIdentifier(template);
}

function getStatusLabel(statusId) {
  return `status-${statusId ?? "unknown"}`;
}

function getTemplateVersions(template) {
  return Array.isArray(template?.versions) ? template.versions : [];
}

function sortVersionsNewestFirst(versions) {
  return [...versions].sort((left, right) => {
    const leftTime = Date.parse(left?.updated_at ?? left?.created_at ?? "") || 0;
    const rightTime = Date.parse(right?.updated_at ?? right?.created_at ?? "") || 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return Number(right?.id ?? 0) - Number(left?.id ?? 0);
  });
}

function getLatestVersion(template) {
  return sortVersionsNewestFirst(getTemplateVersions(template))[0] ?? null;
}

function getLatestDraftVersion(template) {
  return (
    sortVersionsNewestFirst(
      getTemplateVersions(template).filter((version) => Boolean(version?.is_draft))
    )[0] ?? null
  );
}

function describeVersion(version) {
  if (!version) {
    return "status-unknown";
  }

  const flags = [getStatusLabel(version.status_id)];

  if (version.is_draft) {
    flags.push("draft");
  }

  if (version.is_active) {
    flags.push("active");
  }

  return flags.join(", ");
}

function templateDefinitionMatchesVersion(definition, version) {
  return (
    version?.subject === definition.subject &&
    version?.body === definition.body
  );
}

function logActivationReminder(templateName, version) {
  if (!version || version.is_active) {
    return;
  }

  console.log(
    `Latest version for ${templateName} is not active yet. Review it in MSG91 and mark it active after approval if you want sends to use this version.`
  );
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

async function createTemplateVersion(templateId, definition) {
  const payload = await apiRequest(MSG91_TEMPLATE_VERSIONS_URL, {
    method: "POST",
    body: JSON.stringify({
      body: definition.body,
      subject: definition.subject,
      template_id: templateId,
    }),
  });

  return payload?.data ?? payload;
}

async function updateTemplateVersion(versionId, definition) {
  const payload = await apiRequest(`${MSG91_TEMPLATE_VERSIONS_URL}/${versionId}`, {
    method: "PUT",
    body: JSON.stringify({
      body: definition.body,
      subject: definition.subject,
    }),
  });

  return payload?.data ?? payload;
}

async function ensureTemplate(definition) {
  const existing = await findExistingTemplate(definition);

  if (existing) {
    const templateIdentifier = resolveTemplateDisplayIdentifier(existing);
    const envIdentifier = resolveTemplateEnvIdentifier(existing);
    const latestDraftVersion = getLatestDraftVersion(existing);
    const latestVersion = latestDraftVersion ?? getLatestVersion(existing);

    if (latestVersion && templateDefinitionMatchesVersion(definition, latestVersion)) {
      console.log(
        `Template already up to date: ${definition.name} (${templateIdentifier}, ${describeVersion(
          latestVersion
        )})`
      );

      return {
        id: existing?.id,
        identifier: envIdentifier,
        status: describeVersion(latestVersion),
      };
    }

    if (latestDraftVersion) {
      const updatedVersion = await updateTemplateVersion(latestDraftVersion.id, definition);

      console.log(
        `Updated draft template version: ${definition.name} (${templateIdentifier}, version ${updatedVersion?.id}, ${describeVersion(
          updatedVersion
        )})`
      );
      logActivationReminder(definition.name, updatedVersion);

      return {
        id: existing?.id,
        identifier: envIdentifier,
        status: describeVersion(updatedVersion),
      };
    }

    const createdVersion = await createTemplateVersion(existing.id, definition);

    const identifier = resolveTemplateEnvIdentifier(existing);
    const displayIdentifier = resolveTemplateDisplayIdentifier(existing);
    console.log(
      `Created new template version: ${definition.name} (${displayIdentifier}, version ${createdVersion?.id}, ${describeVersion(
        createdVersion
      )})`
    );
    logActivationReminder(definition.name, createdVersion);

    return {
      id: existing?.id,
        identifier,
      status: describeVersion(createdVersion),
    };
  }

  const created = await createTemplate(definition);
  const identifier = resolveTemplateEnvIdentifier(created);
  const displayIdentifier = resolveTemplateDisplayIdentifier(created);
  const createdVersion = getLatestVersion(created);

  console.log(`Created template: ${definition.name} (${displayIdentifier})`);

  return {
    id: created?.id,
    identifier,
    status: describeVersion(createdVersion),
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

  console.log(
    "\nTemplate identifiers for Vercel (numeric template IDs; runtime resolves the active MSG91 registered slug):"
  );
  for (const template of resolvedTemplates) {
    console.log(`${template.key}=${template.identifier}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

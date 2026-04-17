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

const templateDefinitions = [
  {
    key: "MSG91_INTERNAL_TEMPLATE_ID",
    name: "Vayasya Contact Internal Notification",
    slug: "vayasya-contact-internal",
    subject: "Vayasya Seva | Requirement intake [{{case_id}}] | {{name}}",
    body: `<!doctype html>
<html>
${EMAIL_FONT_HEAD}
  <body class="vayasya-body" style="margin: 0; padding: 24px; background-color: #F8FAFC; font-family: ${FONT_FAMILY_BODY}; color: #1E293B; line-height: 1.6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; border: 1px solid #E2E8F0; background-color: #FFFFFF; border-collapse: collapse;">
            <tr>
              <td style="height: 6px; background-color: #8F6818; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding: 24px 28px 20px; border-bottom: 1px solid #E2E8F0;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #8F6818;">
                  ${BRAND.companyName}
                </p>
                <h1 class="vayasya-heading" style="margin: 0; font-size: 24px; line-height: 1.3; color: #0F172A; font-family: ${FONT_FAMILY_DISPLAY};">
                  Requirement intake received
                </h1>
                <p style="margin: 10px 0 0; font-size: 14px; color: #475569;">
                  Submitted from <a href="${BRAND.websiteUrl}" style="color: #8F6818; text-decoration: none;">${BRAND.websiteUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 16px 18px; background-color: #F8FAFC; border: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748B;">
                        Case ID
                      </p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0F172A;">{{case_id}}</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 16px 18px; background-color: #FFF9E8; border: 1px solid #FDF1CF;">
                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8F6818;">
                        Primary contact
                      </p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0F172A;">{{name}}</p>
                      <p style="margin: 4px 0 0; font-size: 14px; color: #475569;">
                        {{phone}} &nbsp;&middot;&nbsp; {{email}}
                      </p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8F6818;">
                      Requirement details
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 18px; border: 1px solid #E2E8F0; background-color: #FFFFFF; font-size: 15px; color: #1E293B; white-space: pre-wrap;">
                      {{details}}
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border-top: 1px solid #E2E8F0;">
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B;">Company</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B;">{{company}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Role</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{role}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Location</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{location}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Industry</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{industry}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Approx. headcount</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{headcount}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Shift requirement</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{shift_requirement}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Target start date</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{target_start_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Submitted at</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{submitted_at}}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; border-collapse: collapse;">
            <tr>
              <td style="padding: 16px 8px 0; font-size: 12px; line-height: 1.7; color: #64748B; text-align: center;">
                ${BRAND.legalName} &nbsp;&middot;&nbsp; ${BRAND.supportAddress}<br />
                <a href="mailto:${BRAND.supportEmail}" style="color: #8F6818; text-decoration: none;">${BRAND.supportEmail}</a>
                &nbsp;&middot;&nbsp;
                <a href="tel:${BRAND.supportPhone}" style="color: #8F6818; text-decoration: none;">${BRAND.supportPhone}</a>
                &nbsp;&middot;&nbsp;
                <a href="${BRAND.websiteUrl}" style="color: #8F6818; text-decoration: none;">${BRAND.websiteUrl}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },
  {
    key: "MSG91_AUTOREPLY_TEMPLATE_ID",
    name: "Vayasya Contact Acknowledgement",
    slug: "vayasya-contact-autoreply",
    subject: "Vayasya Seva | Requirement received [{{case_id}}]",
    body: `<!doctype html>
<html>
${EMAIL_FONT_HEAD}
  <body class="vayasya-body" style="margin: 0; padding: 24px; background-color: #F8FAFC; font-family: ${FONT_FAMILY_BODY}; color: #1E293B; line-height: 1.6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; border: 1px solid #E2E8F0; background-color: #FFFFFF; border-collapse: collapse;">
            <tr>
              <td style="height: 6px; background-color: #8F6818; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding: 24px 28px 20px; border-bottom: 1px solid #E2E8F0;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #8F6818;">
                  ${BRAND.companyName}
                </p>
                <h1 class="vayasya-heading" style="margin: 0; font-size: 24px; line-height: 1.3; color: #0F172A; font-family: ${FONT_FAMILY_DISPLAY};">
                  Thank you, {{name}}
                </h1>
                <p style="margin: 10px 0 0; font-size: 14px; color: #475569;">
                  Your requirement inquiry has been received by Vayasya Seva Operations.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 16px 18px; background-color: #F8FAFC; border: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748B;">
                        Case ID
                      </p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0F172A;">{{case_id}}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0 0 16px; font-size: 15px; color: #1E293B;">
                  Our team will review the request and respond through the details you shared.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8F6818;">
                      Submission summary
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 18px; border: 1px solid #E2E8F0; background-color: #FFFFFF; font-size: 15px; color: #1E293B; white-space: pre-wrap;">
                      {{details}}
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border-top: 1px solid #E2E8F0; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B;">Phone</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B;">{{phone}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Email</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{email}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Company</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{company}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; width: 38%; font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0;">Location</td>
                    <td style="padding: 12px 0; font-size: 14px; color: #1E293B; border-top: 1px solid #E2E8F0;">{{location}}</td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 16px 18px; background-color: #FFF9E8; border: 1px solid #FDF1CF;">
                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8F6818;">
                        Response window
                      </p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0F172A;">{{response_window}}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0 0 16px; font-size: 15px; color: #1E293B;">
                  If you need to add context before we respond, reply to
                  <a href="mailto:${BRAND.supportEmail}" style="color: #8F6818; text-decoration: none;">${BRAND.supportEmail}</a>
                  or call
                  <a href="tel:${BRAND.supportPhone}" style="color: #8F6818; text-decoration: none;">${BRAND.supportPhone}</a>.
                </p>
                <p style="margin: 0 0 16px; font-size: 15px; color: #1E293B;">
                  Please keep the case ID in the subject line when replying so the conversation stays grouped correctly.
                </p>
                <p style="margin: 0; font-size: 15px; color: #1E293B;">
                  Regards,<br />
                  <strong>Vayasya Seva Operations</strong>
                </p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; border-collapse: collapse;">
            <tr>
              <td style="padding: 16px 8px 0; font-size: 12px; line-height: 1.7; color: #64748B; text-align: center;">
                ${BRAND.legalName} &nbsp;&middot;&nbsp; ${BRAND.supportAddress}<br />
                <a href="${BRAND.websiteUrl}" style="color: #8F6818; text-decoration: none;">${BRAND.websiteUrl}</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${BRAND.supportEmail}" style="color: #8F6818; text-decoration: none;">${BRAND.supportEmail}</a>
                &nbsp;&middot;&nbsp;
                <a href="tel:${BRAND.supportPhone}" style="color: #8F6818; text-decoration: none;">${BRAND.supportPhone}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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

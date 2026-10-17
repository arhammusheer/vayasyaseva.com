// Generated from integrations/windmill/leads/scripts/intake.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import { timingSafeEqual } from "node:crypto";

// integrations/windmill/talent/lib/config.ts
const { VARIABLES, variablePath, setConfigForTests, config } = (() => {
  const VARIABLES = {
      talent_pg_url: { secret: true },
      fast2sms_api_key: { secret: true },
      intake_webhook_secret: { secret: true },
      r2_read_key_id: { secret: true },
      r2_read_secret: { secret: true },
      r2_erase_key_id: { secret: true },
      r2_erase_secret: { secret: true },
      chatwoot_admin_token: { secret: true },
      chatwoot_inbox_identifier: { secret: true },
      chatwoot_base_url: { secret: false },
      chatwoot_account_id: { secret: false },
      r2_endpoint: { secret: false },
      r2_bucket: { secret: false },
      twenty_base_url: { secret: false },
      twenty_api_key: { secret: true },
      lead_webhook_secret: { secret: true },
      fast2sms_dlr_secret: { secret: true },
  };
  const variablePath = (name) => `f/talent/${name}`;
  let override = null;
  function setConfigForTests(values) {
      override = values;
  }
  async function config(name) {
      if (override) {
          const value = override[name];
          if (value === undefined)
              throw new Error(`test config has no ${name}`);
          return value;
      }
      const value = await wmill.getVariable(variablePath(name));
      if (!value)
          throw new Error(`variable ${variablePath(name)} is empty`);
      return value;
  }
  return { VARIABLES, variablePath, setConfigForTests, config };
})();

// integrations/windmill/talent/lib/response.ts
const { respond, accepted, forbidden, invalid, failed } = (() => {
  function respond(status, body) {
      return { wm_status_code: status, result: body };
  }
  const accepted = (ref) => respond(202, { ok: true, ref });
  const forbidden = () => respond(403, { ok: false, error: "Forbidden" });
  const invalid = (errors) => respond(400, { ok: false, error: `Invalid submission: ${errors.join(", ")}` });
  const failed = () => respond(500, { ok: false, error: "Internal error" });
  return { respond, accepted, forbidden, invalid, failed };
})();

// integrations/windmill/talent/lib/twenty.ts
const { eq, twentyClient, twentyFromConfig } = (() => {
  const eq = (field, value) => `${field}[eq]:${JSON.stringify(value)}`;
  function twentyClient(baseUrl, apiKey, fetchImpl = fetch) {
      const base = baseUrl.replace(/\/$/, "");
      async function call(method, path, body) {
          const res = await fetchImpl(`${base}/rest${path}`, {
              method,
              headers: { authorization: `Bearer ${apiKey}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
              body: body === undefined ? undefined : JSON.stringify(body),
              signal: AbortSignal.timeout(30_000),
          });
          const text = await res.text();
          let json = null;
          try {
              json = text ? JSON.parse(text) : null;
          }
          catch { }
          if (!res.ok && !(method === "DELETE" && res.status === 404)) {
              const messages = json?.messages?.join("; ") ?? text.slice(0, 200);
              throw new Error(`Twenty ${method} ${path.split("?")[0]}: HTTP ${res.status} ${messages}`);
          }
          return { status: res.status, json };
      }
      return {
          async find(plural, filter) {
              const { json } = await call("GET", `/${plural}?limit=60&filter=${encodeURIComponent(filter)}`);
              return (json.data[plural] ?? []);
          },
          async create(plural, singular, body) {
              const { json } = await call("POST", `/${plural}`, body);
              const created = json.data[`create${singular}`];
              if (!created?.id)
                  throw new Error(`Twenty POST /${plural}: no record in the answer`);
              return created;
          },
          async update(plural, id, body) {
              await call("PATCH", `/${plural}/${id}`, body);
          },
          async remove(plural, id) {
              const { status } = await call("DELETE", `/${plural}/${id}`);
              return status !== 404;
          },
      };
  }
  async function twentyFromConfig() {
      return twentyClient(await config("twenty_base_url"), await config("twenty_api_key"));
  }
  return { eq, twentyClient, twentyFromConfig };
})();

// integrations/windmill/talent/lib/crm.ts
const { optionValue, clusterValue, roleValue, languageValue, sourceValue, phoneDigits, workRoles, clusters, personFields, ANSWER_OPTIONS, screeningFields, phoneValue, applicationFields, ACK_TEMPLATE, ackText, deliveryStatus, ackSyncState, ackKey, ackFields, upsertPerson, ensureApplication, upsertAcknowledgement, erasePerson } = (() => {
  const CLUSTER_VALUES = new Set(["HARIDWAR", "UTTARAKHAND", "DELHI_NCR", "BENGALURU", "JALANDHAR", "SAHARANPUR", "OTHER", "PUNJAB"]);
  const ROLE_VALUES = new Set([
      "FACTORY_HELPER", "PACKING", "MACHINE_OPERATOR", "WAREHOUSE", "FORKLIFT_OPERATOR", "DATA_ENTRY_OPERATOR",
      "HOUSEKEEPING", "ITI_TRADES", "ELECTRICIAN", "WELDER", "FITTER", "ANY",
  ]);
  const optionValue = (slug) => slug.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  function clusterValue(slug) {
      if (!slug)
          return null;
      const v = optionValue(slug);
      return CLUSTER_VALUES.has(v) ? v : null;
  }
  function roleValue(slug) {
      if (!slug)
          return null;
      const v = optionValue(slug);
      return ROLE_VALUES.has(v) ? v : null;
  }
  const unique = (values) => [...new Set(values.filter((v) => Boolean(v)))];
  function languageValue(locale) {
      switch (locale) {
          case "en":
          case "en-IN":
              return "EN";
          case "hi":
          case "hi-IN":
              return "HI";
          case "hinglish":
          case "hi-Latn-IN":
              return "HI_LATN";
          case "pa-IN":
              return "PA";
          case "kn-IN":
              return "KN";
          default:
              return null;
      }
  }
  function sourceValue(c) {
      if (c.channel === "agent")
          return "AGENT";
      if (c.source === "web" || c.source.startsWith("web_"))
          return "WEBSITE";
      if (c.source === "whatsapp")
          return "WHATSAPP";
      if (c.source === "phone")
          return "PHONE";
      return "OTHER";
  }
  function phoneDigits(phone) {
      const digits = phone.replace(/\D/g, "");
      return digits.length > 10 ? digits.slice(-10) : digits;
  }
  const iso = (value) => (value ? new Date(value).toISOString() : null);
  function workRoles(c) {
      const work = Array.isArray(c.answers?.work) ? c.answers.work : [];
      return unique([...(c.person_roles ?? []), c.role, ...work].map(roleValue));
  }
  function clusters(c) {
      return unique([...(c.person_clusters ?? []), c.cluster].map(clusterValue));
  }
  function personFields(c, existing) {
      const has = (field) => existing && existing[field] !== null && existing[field] !== undefined && existing[field] !== "";
      const existingList = (field) => (Array.isArray(existing?.[field]) ? existing[field] : []);
      const name = c.person_name ?? c.applicant_name;
      const lastContact = [c.last_contact_at, c.last_confirmed_at].filter(Boolean).map((d) => new Date(d).getTime());
      const fields = {
          clusters: unique([...existingList("clusters"), ...clusters(c)]),
          workRoles: unique([...existingList("workRoles"), ...workRoles(c)]),
          lastAppliedAt: iso(c.last_applied_at ?? c.created_at),
          lastContactAt: lastContact.length ? new Date(Math.max(...lastContact)).toISOString() : iso(c.created_at),
          consentVersion: c.consent_version,
          consentedAt: iso(c.consented_at),
      };
      const language = languageValue(c.person_locale ?? c.locale);
      if (language)
          fields.language = language;
      if (c.home_area)
          fields.homeArea = c.home_area;
      if (!has("personType"))
          fields.personType = "WORKER";
      if (c.person_status === "do-not-contact")
          fields.workerStatus = "DO_NOT_CONTACT";
      else if (!has("workerStatus"))
          fields.workerStatus = "NEW";
      const currentName = existing?.name;
      if (name && !currentName?.firstName && !currentName?.lastName)
          fields.name = { firstName: name, lastName: "" };
      if (!existing) {
          fields.phones = phoneValue(c.phone);
          if (!fields.name)
              fields.name = { firstName: `Applicant ${c.ref}`, lastName: "" };
      }
      return fields;
  }
  const ANSWER_OPTIONS = {
      experience: {
          fresher: ["FRESHER", "Fresher"],
          "under-1": ["UNDER_1_YEAR", "Under 1 year"],
          "1-3": ["YEARS_1_TO_3", "1 to 3 years"],
          "3-plus": ["YEARS_3_PLUS", "3+ years"],
      },
      education: {
          "below-10th": ["BELOW_CLASS_10", "Below 10th"],
          "10th": ["CLASS_10", "10th pass"],
          "12th": ["CLASS_12", "12th pass"],
          "iti-diploma": ["ITI_DIPLOMA", "ITI / diploma"],
          graduate: ["GRADUATE", "Graduate"],
      },
      start: { now: ["NOW", "Immediately"], week: ["WITHIN_WEEK", "Within a week"], month: ["WITHIN_MONTH", "Within a month"] },
      shift: { day: ["DAY", "Day"], night: ["NIGHT", "Night"], rotating: ["ROTATING", "Rotating / any"] },
      area: {
          "sidcul-bahadrabad": ["SIDCUL_BAHADRABAD", "SIDCUL / Bahadrabad"],
          "haridwar-jwalapur": ["HARIDWAR_JWALAPUR", "Haridwar city / Jwalapur"],
          "roorkee-bhagwanpur": ["ROORKEE_BHAGWANPUR", "Roorkee / Bhagwanpur"],
          laksar: ["LAKSAR", "Laksar"],
          outside: ["OUTSIDE_HARIDWAR", "Outside Haridwar"],
          "bengaluru:north": ["BENGALURU_NORTH", "Bengaluru North / Peenya"],
          "bengaluru:south": ["BENGALURU_SOUTH", "Bengaluru South / Electronic City"],
          "bengaluru:east": ["BENGALURU_EAST", "Bengaluru East / Whitefield"],
          "bengaluru:west": ["BENGALURU_WEST", "Bengaluru West / Kengeri"],
          "bengaluru:outside": ["OUTSIDE_BENGALURU", "Outside Bengaluru"],
          "jalandhar:kapurthala": ["KAPURTHALA", "Kapurthala"],
          "jalandhar:city": ["JALANDHAR_CITY", "Jalandhar city"],
          "jalandhar:phagwara-goraya": ["PHAGWARA_GORAYA", "Phagwara / Goraya"],
          "jalandhar:outside": ["OUTSIDE_JALANDHAR", "Outside Jalandhar and Kapurthala"],
          "uttarakhand:haridwar": ["UK_HARIDWAR_ROORKEE", "Haridwar / Roorkee (Uttarakhand form)"],
          "uttarakhand:dehradun-selaqui": ["DEHRADUN_SELAQUI", "Dehradun / Selaqui"],
          "uttarakhand:udham-singh-nagar": ["UDHAM_SINGH_NAGAR", "Rudrapur / Kashipur / Sitarganj"],
          "uttarakhand:other": ["ELSEWHERE_UTTARAKHAND", "Elsewhere in Uttarakhand"],
          "uttarakhand:outside": ["OUTSIDE_UTTARAKHAND", "Outside Uttarakhand"],
          "punjab:jalandhar-kapurthala": ["PB_JALANDHAR_KAPURTHALA", "Jalandhar / Kapurthala (Punjab form)"],
          "punjab:ludhiana": ["LUDHIANA", "Ludhiana"],
          "punjab:mohali": ["MOHALI_KHARAR", "Mohali / Kharar"],
          "punjab:amritsar": ["AMRITSAR", "Amritsar"],
          "punjab:other": ["ELSEWHERE_PUNJAB", "Elsewhere in Punjab"],
          "punjab:outside": ["OUTSIDE_PUNJAB", "Outside Punjab"],
          "market:haridwar": ["MARKET_HARIDWAR", "Haridwar / Roorkee (market)"],
          "market:uttarakhand": ["MARKET_UTTARAKHAND", "Elsewhere in Uttarakhand (market)"],
          "market:jalandhar": ["MARKET_JALANDHAR", "Jalandhar / Kapurthala (market)"],
          "market:punjab": ["MARKET_PUNJAB", "Elsewhere in Punjab (market)"],
          "market:bengaluru": ["MARKET_BENGALURU", "Bengaluru (market)"],
          "market:other": ["MARKET_OTHER", "Somewhere else"],
          "haridwar:rest-of-uttarakhand": ["HW_REST_OF_UTTARAKHAND", "Elsewhere in Uttarakhand (Haridwar form)"],
          "jalandhar:rest-of-punjab": ["JL_REST_OF_PUNJAB", "Elsewhere in Punjab (Jalandhar form)"],
      },
  };
  const SKILL_LABELS = {
      iti: { "iti-pass": "ITI passed", "iti-pursuing": "ITI studying / apprentice", "no-iti": "Experience, no ITI" },
      trade: { electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Other trade" },
      machines: {
          "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
          "other-machine": "Other machines",
      },
      forklift: { "licence-experience": "Forklift licence and experience", "experience-only": "Forklift experience, no licence", "want-to-learn": "Wants to learn forklift" },
      computer: { typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP" },
  };
  const answerList = (answers, question) => {
      const v = answers?.[question];
      return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  };
  function answerOption(answers, question) {
      const options = ANSWER_OPTIONS[question];
      const id = answerList(answers, question).find((a) => Object.hasOwn(options, a));
      return id ? options[id][0] : null;
  }
  function screeningFields(answers) {
      const shifts = ANSWER_OPTIONS.shift;
      const skills = Object.entries(SKILL_LABELS).flatMap(([q, labels]) => answerList(answers, q).map((a) => labels[a]).filter(Boolean));
      return {
          experience: answerOption(answers, "experience"),
          education: answerOption(answers, "education"),
          canStart: answerOption(answers, "start"),
          area: answerOption(answers, "area"),
          shifts: unique(answerList(answers, "shift").map((a) => shifts[a]?.[0] ?? null)),
          workWanted: unique(answerList(answers, "work").map(roleValue)),
          skills: skills.join(" · "),
      };
  }
  const phoneValue = (phone) => ({ primaryPhoneNumber: phoneDigits(phone), primaryPhoneCountryCode: "IN", primaryPhoneCallingCode: "+91" });
  function applicationFields(c, personId) {
      return {
          ...screeningFields(c.answers),
          phone: phoneValue(c.phone),
          name: c.ref,
          status: "NEW",
          source: sourceValue(c),
          jobRole: roleValue(c.role),
          cluster: clusterValue(c.cluster),
          message: c.text ?? "",
          answers: c.answers ?? null,
          submittedAt: iso(c.created_at),
          consentVersion: c.consent_version,
          pagePath: c.page_path ?? "",
          talentSubmissionId: c.id,
          personId,
      };
  }
  const ACK_TEMPLATE = "Job application received (DLT 1677100000000394062)";
  const ackText = (ref) => `Vayasya Seva received your job application. Ref ${ref}. We will contact you on this number about work.`;
  function deliveryStatus(ackStatus, delivery = null) {
      if (ackStatus === "accepted" && delivery === "delivered")
          return "DELIVERED";
      if (ackStatus === "accepted" && delivery === "failed")
          return "FAILED";
      switch (ackStatus) {
          case "accepted":
              return "SENT";
          case "failed":
              return "FAILED";
          case "unknown":
              return "UNKNOWN";
          default:
              return "QUEUED";
      }
  }
  const ackSyncState = (c) => c.ack_status && c.delivery_status ? `${c.ack_status}:${c.delivery_status}` : c.ack_status;
  const ackKey = (submissionId) => `sms-ack:${submissionId}`;
  function ackFields(c, personId, applicationId) {
      return {
          name: `SMS · application received · ${c.ref}`,
          channel: "SMS",
          direction: "OUTBOUND",
          deliveryStatus: deliveryStatus(c.ack_status, c.delivery_status),
          template: ACK_TEMPLATE,
          body: ackText(c.ref),
          provider: "Fast2SMS",
          providerId: c.request_id ?? "",
          statusAt: iso(c.delivered_at ?? c.accepted_at ?? c.ack_updated_at),
          error: c.delivery_status === "failed" ? (c.delivery_detail ?? "") : (c.ack_error ?? ""),
          externalKey: ackKey(c.id),
          personId,
          applicationId,
      };
  }
  async function upsertPerson(crm, c) {
      const [existing] = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(c.phone)));
      const fields = personFields(c, existing ?? null);
      if (existing) {
          await crm.update("people", existing.id, fields);
          return existing.id;
      }
      return (await crm.create("people", "Person", fields)).id;
  }
  async function ensureApplication(crm, c, personId) {
      const [existing] = await crm.find("applications", eq("talentSubmissionId", c.id));
      if (existing)
          return existing.id;
      return (await crm.create("applications", "Application", applicationFields(c, personId))).id;
  }
  async function upsertAcknowledgement(crm, c, personId, applicationId) {
      const fields = ackFields(c, personId, applicationId);
      const [existing] = await crm.find("communications", eq("externalKey", ackKey(c.id)));
      if (existing)
          await crm.update("communications", existing.id, fields);
      else
          await crm.create("communications", "Communication", fields);
  }
  async function erasePerson(crm, phone) {
      const people = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(phone)));
      for (const person of people) {
          for (const comm of await crm.find("communications", eq("personId", person.id)))
              await crm.remove("communications", comm.id);
          for (const app of await crm.find("applications", eq("personId", person.id))) {
              for (const comm of await crm.find("communications", eq("applicationId", app.id)))
                  await crm.remove("communications", comm.id);
              await crm.remove("applications", app.id);
          }
          await crm.remove("people", person.id);
      }
      return people.length;
  }
  return { optionValue, clusterValue, roleValue, languageValue, sourceValue, phoneDigits, workRoles, clusters, personFields, ANSWER_OPTIONS, screeningFields, phoneValue, applicationFields, ACK_TEMPLATE, ackText, deliveryStatus, ackSyncState, ackKey, ackFields, upsertPerson, ensureApplication, upsertAcknowledgement, erasePerson };
})();

// integrations/windmill/leads/lib/lead.ts
const { validateLead, serviceValues, crewSize, opportunityName, recordLead } = (() => {
  const CASE_ID = /^(REQ|AGT)-\d{8}-[0-9A-F]{8}$/;
  const CLUSTERS = new Set(["HARIDWAR", "UTTARAKHAND", "DELHI_NCR", "BENGALURU", "JALANDHAR", "SAHARANPUR", "OTHER", "PUNJAB"]);
  const str = (v, max) => {
      if (typeof v !== "string")
          return null;
      const t = v.trim();
      return t ? t.slice(0, max) : null;
  };
  function validateLead(body) {
      const b = (body && typeof body === "object" ? body : {});
      const errors = [];
      const caseId = str(b.caseId, 40);
      if (!caseId || !CASE_ID.test(caseId))
          errors.push("caseId");
      const name = str(b.name, 120);
      if (!name)
          errors.push("name");
      const phone = str(b.phone, 30);
      if (!phone || phoneDigits(phone).length < 10)
          errors.push("phone");
      const enquiry = str(b.enquiry, 8000);
      if (!enquiry)
          errors.push("enquiry");
      const receivedAt = str(b.receivedAt, 40);
      if (!receivedAt || Number.isNaN(Date.parse(receivedAt)))
          errors.push("receivedAt");
      const email = str(b.email, 200);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          errors.push("email");
      if (errors.length)
          return { ok: false, errors };
      const services = Array.isArray(b.services) ? b.services.filter((s) => typeof s === "string").slice(0, 20).map((s) => s.slice(0, 40)) : [];
      return {
          ok: true,
          lead: {
              caseId: caseId,
              receivedAt: new Date(receivedAt).toISOString(),
              channel: b.channel === "agent" ? "agent" : "web",
              name: name,
              company: str(b.company, 160),
              jobTitle: str(b.jobTitle, 120),
              phone: phone,
              email,
              services,
              headcount: str(b.headcount, 40),
              headcountBand: str(b.headcountBand, 20),
              site: str(b.site, 300),
              cluster: str(b.cluster, 40),
              startWindow: str(b.startWindow, 40),
              targetStartDate: str(b.targetStartDate, 40),
              requestType: str(b.requestType, 40),
              enquiry: enquiry,
              sourcePath: str(b.sourcePath, 300),
          },
      };
  }
  function serviceValues(roles) {
      const out = new Set();
      for (const role of roles) {
          if (["loading-unloading", "warehouse", "forklift"].includes(role))
              out.add("LOADING_UNLOADING");
          else if (["housekeeping", "gardening"].includes(role))
              out.add("HOUSEKEEPING");
          else if (["factory-helpers", "packing", "machine-operators", "iti-trades", "maintenance", "fabrication-civil", "data-entry"].includes(role))
              out.add("FACTORY_LABOUR");
          else
              out.add("OTHER");
      }
      return [...out];
  }
  function crewSize(lead) {
      const stated = lead.headcount?.match(/\d+/)?.[0];
      if (stated)
          return Number(stated);
      const low = lead.headcountBand?.match(/^\d+/)?.[0];
      return low ? Number(low) : null;
  }
  function opportunityName(lead) {
      const who = lead.company ?? lead.name;
      const size = lead.headcount ?? lead.headcountBand;
      const what = lead.requestType === "compliance-help" ? "compliance help" : lead.requestType === "site-assessment" ? "site assessment" : "crew";
      return `${who} · ${size ? `${size} ` : ""}${what}`.slice(0, 200);
  }
  const isoDate = (v) => (v && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v)) ? v.slice(0, 10) : null);
  async function recordLead(crm, lead) {
      const [existing] = await crm.find("opportunities", eq("caseId", lead.caseId));
      if (existing)
          return { opportunityId: existing.id, created: false };
      let companyId = null;
      if (lead.company) {
          const [company] = await crm.find("companies", eq("name", lead.company));
          companyId = company?.id ?? (await crm.create("companies", "Company", { name: lead.company })).id;
      }
      const [byPhone] = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(lead.phone)));
      const [byEmail] = byPhone || !lead.email ? [] : await crm.find("people", eq("emails.primaryEmail", lead.email));
      const contact = byPhone ?? byEmail;
      let personId;
      if (contact) {
          personId = contact.id;
          const patch = {};
          if (!contact.personType)
              patch.personType = "CLIENT_CONTACT";
          if (companyId && !contact.companyId)
              patch.companyId = companyId;
          if (lead.jobTitle && !contact.jobTitle)
              patch.jobTitle = lead.jobTitle;
          if (Object.keys(patch).length)
              await crm.update("people", personId, patch);
      }
      else {
          personId = (await crm.create("people", "Person", {
              name: { firstName: lead.name, lastName: "" },
              phones: { primaryPhoneNumber: phoneDigits(lead.phone), primaryPhoneCountryCode: "IN", primaryPhoneCallingCode: "+91" },
              ...(lead.email ? { emails: { primaryEmail: lead.email, additionalEmails: [] } } : {}),
              ...(lead.jobTitle ? { jobTitle: lead.jobTitle } : {}),
              personType: "CLIENT_CONTACT",
              ...(companyId ? { companyId } : {}),
          })).id;
      }
      const cluster = lead.cluster ? optionValue(lead.cluster) : null;
      const opportunity = await crm.create("opportunities", "Opportunity", {
          name: opportunityName(lead),
          stage: "NEW",
          leadSource: lead.channel === "agent" ? "OTHER" : "WEBSITE_FORM",
          caseId: lead.caseId,
          crewSize: crewSize(lead),
          services: serviceValues(lead.services),
          siteLocation: lead.site ?? "",
          cluster: cluster && CLUSTERS.has(cluster) ? cluster : null,
          startDate: isoDate(lead.targetStartDate),
          enquiry: lead.enquiry,
          pointOfContactId: personId,
          ...(companyId ? { companyId } : {}),
      });
      await crm.create("communications", "Communication", {
          name: `Website enquiry ${lead.caseId}`,
          channel: "EMAIL",
          direction: "INBOUND",
          deliveryStatus: "DELIVERED",
          body: lead.enquiry,
          provider: lead.channel === "agent" ? "AI agent (/api/agent/contact)" : "Website form (/api/contact)",
          statusAt: lead.receivedAt,
          externalKey: `lead:${lead.caseId}`,
          personId,
          opportunityId: opportunity.id,
      });
      return { opportunityId: opportunity.id, created: true };
  }
  return { validateLead, serviceValues, crewSize, opportunityName, recordLead };
})();

export const SECRET_HEADER = "x-vspl-lead-secret";
export function secretMatches(given, expected) {
    if (!given || !expected)
        return false;
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}
export async function preprocessor(event) {
    const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    const authorized = secretMatches(headers[SECRET_HEADER], await config("lead_webhook_secret"));
    return { authorized, body: authorized ? (event.body ?? null) : null };
}
export async function main(authorized, body) {
    if (!authorized)
        return respond(403, { ok: false, error: "Forbidden" });
    const checked = validateLead(body);
    if (!checked.ok)
        return respond(400, { ok: false, error: `Invalid lead: ${checked.errors.join(", ")}` });
    try {
        const crm = await twentyFromConfig();
        const result = await recordLead(crm, checked.lead);
        return respond(202, { ok: true, caseId: checked.lead.caseId, created: result.created });
    }
    catch (err) {
        console.error("lead intake failed:", checked.lead.caseId, err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
        return respond(500, { ok: false, error: "Internal error" });
    }
}


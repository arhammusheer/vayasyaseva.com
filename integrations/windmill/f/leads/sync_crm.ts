// Generated from integrations/windmill/leads/scripts/sync_crm.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

import { Ajv2020 } from "ajv/dist/2020.js";

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
    leads_pg_url: { secret: true },
    submission_signing_secret: { secret: true },
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

// integrations/windmill/talent/lib/db.ts
const { withTalentDb, withDatabase, queryWith } = (() => {
const passThroughJson = (oid) => ({
    to: oid,
    from: [oid],
    serialize: (value) => (typeof value === "string" ? value : JSON.stringify(value)),
    parse: (value) => JSON.parse(value),
});
async function withTalentDb(fn) {
    return withDatabase("talent_pg_url", fn);
}
async function withDatabase(url, fn) {
    const sql = postgres(await config(url), {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
        prepare: false,
        types: { json: passThroughJson(114), jsonb: passThroughJson(3802) },
        onnotice: () => { },
    });
    try {
        return await fn(queryWith(sql));
    }
    finally {
        await sql.end({ timeout: 5 });
    }
}
const queryWith = (sql) => async (text, params = []) => (await sql.unsafe(text, params));
  return { withTalentDb, withDatabase, queryWith };
})();

// integrations/windmill/talent/lib/twenty.ts
const { eq, twentyClient, twentyFromConfig, TwentyGraphqlError, inClusterUploadUrl, twentyFilesClient, twentyFilesFromConfig } = (() => {
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
class TwentyGraphqlError extends Error {
    codes;
    constructor(message, codes) {
        super(message);
        this.codes = codes;
    }
}
const FILE_UPLOAD_PATH = "/file-upload/";
function inClusterUploadUrl(uploadUrl, baseUrl) {
    const url = new URL(uploadUrl);
    if (!url.pathname.startsWith(FILE_UPLOAD_PATH))
        return uploadUrl;
    return `${baseUrl.replace(/\/$/, "")}${url.pathname}${url.search}`;
}
const isPermissionError = (messages, codes) => codes.includes("FORBIDDEN") || codes.includes("PERMISSION_DENIED") || messages.some((m) => /permission/i.test(m));
function twentyFilesClient(baseUrl, apiKey, fetchImpl = fetch) {
    const base = baseUrl.replace(/\/$/, "");
    let fieldId = null;
    async function gql(operation, query, variables = {}) {
        const res = await fetchImpl(`${base}/metadata`, {
            method: "POST",
            headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(30_000),
        });
        const text = await res.text();
        let json = null;
        try {
            json = text ? JSON.parse(text) : null;
        }
        catch { }
        const errors = json?.errors ?? [];
        if (errors.length) {
            const messages = errors.map((e) => e.message);
            const codes = errors.map((e) => e.extensions?.code ?? "").filter(Boolean);
            if (isPermissionError(messages, codes)) {
                throw new TwentyGraphqlError(`Twenty ${operation}: refused for permissions; the API key's role needs the Upload files permission (UPLOAD_FILE). ${messages.join("; ").slice(0, 200)}`, codes);
            }
            const limited = !res.ok ? res.status === 429 : messages.some((m) => /too many requests|rate limit|limit reached/i.test(m));
            const status = limited ? "HTTP 429 " : res.ok ? "" : `HTTP ${res.status} `;
            throw new TwentyGraphqlError(`Twenty ${operation}: ${status}${messages.join("; ").slice(0, 300)}`, codes);
        }
        if (!res.ok)
            throw new Error(`Twenty ${operation}: HTTP ${res.status} ${text.slice(0, 200)}`);
        if (!json?.data)
            throw new Error(`Twenty ${operation}: no data in the answer`);
        return json.data;
    }
    return {
        attachmentFileFieldId() {
            fieldId ??= gql("objects", `{ objects(paging:{first:500}) { edges { node { id nameSingular fields(paging:{first:500}) { edges { node { id name type } } } } } } }`)
                .then((data) => {
                const attachment = data.objects.edges.map((e) => e.node).find((o) => o.nameSingular === "attachment");
                const field = attachment?.fields.edges.map((e) => e.node).find((f) => f.name === "file" && f.type === "FILES");
                if (!field)
                    throw new Error("Twenty has no attachment.file (FILES) field");
                return field.id;
            })
                .catch((err) => {
                fieldId = null;
                throw err;
            });
            return fieldId;
        },
        async createFileUpload(filename, size, fieldMetadataId) {
            const data = await gql("createFileUpload", `mutation CreateFileUpload($filename: String!, $size: Float!, $fileFolder: FileFolder!, $fieldMetadataId: String) {
  createFileUpload(filename: $filename, size: $size, fileFolder: $fileFolder, fieldMetadataId: $fieldMetadataId) { fileId uploadUrl contentType expiresAt }
}`, { filename, size, fileFolder: "FilesField", fieldMetadataId });
            const target = data.createFileUpload;
            if (!target?.fileId || !target.uploadUrl)
                throw new Error("Twenty createFileUpload: no upload target in the answer");
            return target;
        },
        async put(uploadUrl, data) {
            const res = await fetchImpl(inClusterUploadUrl(uploadUrl, base), {
                method: "PUT",
                headers: { "content-type": "application/octet-stream" },
                body: data,
                signal: AbortSignal.timeout(120_000),
            });
            if (!res.ok)
                throw new Error(`Twenty PUT /file-upload: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
            await res.body?.cancel().catch(() => { });
        },
        async completeFileUpload(fileId) {
            await gql("completeFileUpload", `mutation CompleteFileUpload($fileId: String!) { completeFileUpload(fileId: $fileId) { id } }`, { fileId });
        },
    };
}
async function twentyFilesFromConfig() {
    return twentyFilesClient(await config("twenty_base_url"), await config("twenty_api_key"));
}
  return { eq, twentyClient, twentyFromConfig, TwentyGraphqlError, inClusterUploadUrl, twentyFilesClient, twentyFilesFromConfig };
})();

// integrations/windmill/talent/lib/crm.ts
const { optionValue, clusterValue, roleValue, languageValue, sourceValue, phoneDigits, workRoles, clusters, personFields, ANSWER_OPTIONS, screeningFields, phoneValue, applicationFields, ACK_TEMPLATE, ackText, deliveryStatus, ackSyncState, smsWasSent, whatsAppWasSent, WA_ACK_TEMPLATE, waAckText, whatsAppDeliveryStatus, waAckKey, waAckFields, ackKey, ackFields, upsertPerson, ensureApplication, upsertAcknowledgement, removeAttachments, erasePerson } = (() => {
const CLUSTER_VALUES = new Set(["HARIDWAR", "UTTARAKHAND", "DELHI_NCR", "BENGALURU", "JALANDHAR", "SAHARANPUR", "OTHER", "PUNJAB", "DEHRADUN"]);
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
        "dehradun:selaqui-sahaspur": ["DD_SELAQUI_SAHASPUR", "Selaqui / Sahaspur"],
        "dehradun:city": ["DEHRADUN_CITY", "Dehradun city"],
        "dehradun:rishikesh-doiwala": ["RISHIKESH_DOIWALA", "Rishikesh / Doiwala"],
        "dehradun:vikasnagar": ["VIKASNAGAR_HERBERTPUR", "Vikasnagar / Herbertpur"],
        "dehradun:outside": ["OUTSIDE_DEHRADUN", "Outside Dehradun"],
        "market:dehradun": ["MARKET_DEHRADUN", "Dehradun / Selaqui (market)"],
        "dehradun:rest-of-uttarakhand": ["DD_REST_OF_UTTARAKHAND", "Elsewhere in Uttarakhand (Dehradun form)"],
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
const ackSyncState = (c) => [c.ack_status, c.delivery_status, c.wa_status, c.wa_delivery].filter(Boolean).join(":") || null;
const smsWasSent = (c) => !!c.ack_status && c.ack_status !== "pending" && c.ack_status !== "skipped";
const whatsAppWasSent = (c) => !!c.wa_status && c.wa_status !== "skipped";
const WA_ACK_TEMPLATE = "vspl_application_received (WhatsApp, Utility)";
const waAckText = (ref) => `Vayasya Seva received your job application.\nReference: ${ref}\n\nIf the work fits, our team will contact you.\nReply here if you have a question. You can send a voice note too.\n\nThis number takes messages only, not calls.`;
function whatsAppDeliveryStatus(waStatus, delivery) {
    if (waStatus === "accepted" && delivery === "read")
        return "READ";
    if (waStatus === "accepted" && delivery === "delivered")
        return "DELIVERED";
    if (waStatus === "accepted" && delivery === "failed")
        return "FAILED";
    if (waStatus === "accepted")
        return "SENT";
    if (waStatus === "failed")
        return "FAILED";
    if (waStatus === "unknown")
        return "UNKNOWN";
    return "QUEUED";
}
const waAckKey = (submissionId) => `wa-ack:${submissionId}`;
function waAckFields(c, personId, applicationId) {
    return {
        name: `WhatsApp · application received · ${c.ref}`,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        deliveryStatus: whatsAppDeliveryStatus(c.wa_status, c.wa_delivery),
        template: WA_ACK_TEMPLATE,
        body: waAckText(c.ref),
        provider: "Fast2SMS",
        providerId: c.wa_request_id ?? "",
        statusAt: iso(c.wa_delivered_at ?? c.wa_sent_at ?? c.wa_updated_at),
        error: c.wa_delivery === "failed" || c.wa_delivery === "pending" ? (c.wa_detail ?? "") : (c.wa_error ?? ""),
        externalKey: waAckKey(c.id),
        personId,
        applicationId,
    };
}
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
    const people = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(c.phone)));
    const existing = people.find((p) => p.personType !== "CLIENT_CONTACT") ?? people[0];
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
    const records = [];
    if (whatsAppWasSent(c))
        records.push([waAckKey(c.id), waAckFields(c, personId, applicationId)]);
    if (smsWasSent(c))
        records.push([ackKey(c.id), ackFields(c, personId, applicationId)]);
    for (const [key, fields] of records) {
        const [existing] = await crm.find("communications", eq("externalKey", key));
        if (existing)
            await crm.update("communications", existing.id, fields);
        else
            await crm.create("communications", "Communication", fields);
    }
}
const WORKER_FIELDS_CLEARED = {
    personType: "CLIENT_CONTACT",
    workerStatus: null,
    clusters: [],
    workRoles: [],
    homeArea: "",
    language: null,
    consentVersion: "",
    consentedAt: null,
    lastAppliedAt: null,
    lastContactAt: null,
};
const CLIENT_NAME_CLEARED = { firstName: "Client contact", lastName: "" };
async function attachmentsOf(crm, field, id) {
    const live = await crm.find("attachments", eq(field, id));
    const trashed = await crm.find("attachments", `and(${eq(field, id)},deletedAt[is]:NOT_NULL)`);
    return [...new Map([...live, ...trashed].map((r) => [r.id, r])).values()];
}
async function removeAttachments(crm, field, id) {
    let removed = 0;
    for (const a of await attachmentsOf(crm, field, id))
        if (await crm.remove("attachments", a.id))
            removed++;
    return removed;
}
async function erasePerson(crm, phone) {
    const people = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(phone)));
    let files = 0;
    for (const person of people) {
        for (const app of await crm.find("applications", eq("personId", person.id))) {
            files += await removeAttachments(crm, "targetApplicationId", app.id);
            for (const comm of await crm.find("communications", eq("applicationId", app.id)))
                await crm.remove("communications", comm.id);
            await crm.remove("applications", app.id);
        }
        const clientContact = person.personType === "CLIENT_CONTACT" || (await crm.find("opportunities", eq("pointOfContactId", person.id))).length > 0;
        for (const comm of await crm.find("communications", eq("personId", person.id))) {
            if (!clientContact || !comm.opportunityId)
                await crm.remove("communications", comm.id);
        }
        if (clientContact) {
            const name = person.name;
            const fromApplication = person.personType !== "CLIENT_CONTACT" || /^Applicant VS-J-/.test(name?.firstName ?? "");
            await crm.update("people", person.id, fromApplication ? { ...WORKER_FIELDS_CLEARED, name: CLIENT_NAME_CLEARED } : WORKER_FIELDS_CLEARED);
        }
        else {
            files += await removeAttachments(crm, "targetPersonId", person.id);
            await crm.remove("people", person.id);
        }
    }
    return { people: people.length, files };
}
  return { optionValue, clusterValue, roleValue, languageValue, sourceValue, phoneDigits, workRoles, clusters, personFields, ANSWER_OPTIONS, screeningFields, phoneValue, applicationFields, ACK_TEMPLATE, ackText, deliveryStatus, ackSyncState, smsWasSent, whatsAppWasSent, WA_ACK_TEMPLATE, waAckText, whatsAppDeliveryStatus, waAckKey, waAckFields, ackKey, ackFields, upsertPerson, ensureApplication, upsertAcknowledgement, removeAttachments, erasePerson };
})();

// integrations/windmill/contracts/validate.ts
const { check, SCHEMAS } = (() => {
const jobApplicationSchema = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://www.vayasyaseva.com/contracts/job_application.v1.canonical.schema.json","type":"object","properties":{"ref":{"type":"string","pattern":"^VS-J-[A-Z0-9]{6}$"},"source":{"anyOf":[{"type":"string","const":"web"},{"type":"string","const":"whatsapp"},{"type":"string","enum":["web_en","web_hi","web_hinglish"]}]},"locale":{"anyOf":[{"type":"string","enum":["en-IN","hi-IN","hi-Latn-IN","pa-IN","kn-IN"]},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"pageCluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"pagePath":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^\\/([a-z0-9]+(-[a-z0-9]+)*(\\/[a-z0-9]+(-[a-z0-9]+)*)*)?$"},{"type":"null"}]},"role":{"anyOf":[{"type":"string","enum":["factory-helper","packing","machine-operator","warehouse","forklift-operator","data-entry-operator","housekeeping","iti-trades","electrician","welder","fitter"]},{"type":"null"}]},"hub":{"anyOf":[{"type":"string","enum":["freshers","10th-pass","12th-pass"]},{"type":"null"}]},"channel":{"type":"string","enum":["web","agent","whatsapp"]},"agentName":{"anyOf":[{"type":"string","maxLength":100},{"type":"null"}]},"phone":{"type":"string","pattern":"^\\+91[6-9]\\d{9}$"},"adult":{"type":"boolean","const":true},"consent":{"type":"object","properties":{"version":{"type":"string","minLength":1,"maxLength":40},"at":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"}},"required":["version","at"],"additionalProperties":false},"text":{"anyOf":[{"type":"string","maxLength":4000},{"type":"null"}]},"attachments":{"maxItems":8,"type":"array","items":{"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"image"},"key":{"type":"string","minLength":1,"maxLength":300},"mime":{"type":"string","pattern":"^image\\/(jpeg|png|webp)$"},"size":{"type":"integer","minimum":1,"maximum":10485760},"name":{"anyOf":[{"type":"string","maxLength":200},{"type":"null"}]}},"required":["kind","key","mime","size","name"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"document"},"key":{"type":"string","minLength":1,"maxLength":300},"mime":{"type":"string","pattern":"^application\\/(pdf|msword|vnd\\.openxmlformats-officedocument\\.wordprocessingml\\.document)$"},"size":{"type":"integer","minimum":1,"maximum":20971520},"name":{"anyOf":[{"type":"string","maxLength":200},{"type":"null"}]}},"required":["kind","key","mime","size","name"],"additionalProperties":false}]}},"form":{"anyOf":[{"type":"string","enum":["long","quick"]},{"type":"null"}]},"applicantName":{"anyOf":[{"type":"string","minLength":1,"maxLength":80},{"type":"null"}]},"answers":{"anyOf":[{"type":"object","properties":{"work":{"minItems":1,"type":"array","items":{"type":"string","enum":["factory-helper","packing","warehouse","machine-operator","iti-trades","housekeeping","data-entry-operator","forklift-operator","any"]},"uniqueItems":true},"trade":{"minItems":1,"type":"array","items":{"type":"string","enum":["electrician","welder","fitter","machinist","other-trade"]},"uniqueItems":true},"iti":{"minItems":1,"type":"array","items":{"type":"string","enum":["iti-pass","iti-pursuing","no-iti"]},"uniqueItems":true},"machines":{"minItems":1,"type":"array","items":{"type":"string","enum":["packing-machine","moulding","press","cnc-vmc","other-machine"]},"uniqueItems":true},"forklift":{"minItems":1,"type":"array","items":{"type":"string","enum":["licence-experience","experience-only","want-to-learn"]},"uniqueItems":true},"computer":{"minItems":1,"type":"array","items":{"type":"string","enum":["typing","excel","tally","sap-erp"]},"uniqueItems":true},"experience":{"minItems":1,"type":"array","items":{"type":"string","enum":["fresher","under-1","1-3","3-plus"]},"uniqueItems":true},"education":{"minItems":1,"type":"array","items":{"type":"string","enum":["below-10th","10th","12th","iti-diploma","graduate"]},"uniqueItems":true},"shift":{"minItems":1,"type":"array","items":{"type":"string","enum":["day","night","rotating"]},"uniqueItems":true},"start":{"minItems":1,"type":"array","items":{"type":"string","enum":["now","week","month"]},"uniqueItems":true},"area":{"minItems":1,"type":"array","items":{"type":"string","enum":["sidcul-bahadrabad","haridwar-jwalapur","roorkee-bhagwanpur","laksar","outside","bengaluru:north","bengaluru:south","bengaluru:east","bengaluru:west","bengaluru:outside","jalandhar:kapurthala","jalandhar:city","jalandhar:phagwara-goraya","jalandhar:outside","uttarakhand:haridwar","uttarakhand:dehradun-selaqui","uttarakhand:udham-singh-nagar","uttarakhand:other","uttarakhand:outside","punjab:jalandhar-kapurthala","punjab:ludhiana","punjab:mohali","punjab:amritsar","punjab:other","punjab:outside","dehradun:selaqui-sahaspur","dehradun:city","dehradun:rishikesh-doiwala","dehradun:vikasnagar","dehradun:outside","market:haridwar","market:uttarakhand","market:jalandhar","market:punjab","market:bengaluru","market:other","market:dehradun","haridwar:rest-of-uttarakhand","jalandhar:rest-of-punjab","dehradun:rest-of-uttarakhand"]},"uniqueItems":true}},"additionalProperties":false,"minProperties":1},{"type":"null"}]}},"required":["ref","source","locale","cluster","pageCluster","pagePath","role","hub","channel","agentName","phone","adult","consent","text","attachments","form","applicantName","answers"],"additionalProperties":false,"title":"job_application.v1 (canonical)","description":"A job application as the website forwards it to Windmill f/talent/intake.","allOf":[{"anyOf":[{"properties":{"text":{"type":"string","minLength":1}},"required":["text"]},{"properties":{"attachments":{"minItems":1}},"required":["attachments"]},{"properties":{"answers":{"type":"object"}},"required":["answers"]}]},{"if":{"properties":{"source":{"const":"web"}},"required":["source"]},"then":{"properties":{"locale":{"type":"string"}}}},{"if":{"properties":{"source":{"const":"whatsapp"}},"required":["source"]},"then":{"properties":{"channel":{"const":"whatsapp"},"locale":{"type":"string"}}}}]};
const businessEnquirySchema = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://www.vayasyaseva.com/contracts/business_enquiry.v1.canonical.schema.json","type":"object","properties":{"caseId":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"receivedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"channel":{"type":"string","enum":["web","agent"]},"name":{"type":"string","minLength":1,"maxLength":120},"company":{"anyOf":[{"type":"string","minLength":1,"maxLength":160},{"type":"null"}]},"jobTitle":{"anyOf":[{"type":"string","minLength":1,"maxLength":120},{"type":"null"}]},"phone":{"type":"string","maxLength":30,"pattern":"^\\D*(?:\\d\\D*){10,}$"},"email":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"},{"type":"null"}]},"services":{"maxItems":20,"type":"array","items":{"type":"string","minLength":1,"maxLength":40}},"headcount":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"headcountBand":{"anyOf":[{"type":"string","minLength":1,"maxLength":20},{"type":"null"}]},"site":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"startWindow":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"targetStartDate":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"requestType":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"enquiry":{"type":"string","minLength":1,"maxLength":8000},"sourcePath":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]}},"required":["caseId","receivedAt","channel","name","company","jobTitle","phone","email","services","headcount","headcountBand","site","cluster","startWindow","targetStartDate","requestType","enquiry","sourcePath"],"additionalProperties":false,"title":"business_enquiry.v1 (canonical)","description":"A business enquiry as the website forwards it to Windmill f/leads/intake."};
const envelopeSchema = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://www.vayasyaseva.com/contracts/envelope.v1.canonical.schema.json","oneOf":[{"type":"object","properties":{"v":{"type":"number","const":1},"sentAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"idempotencyKey":{"anyOf":[{"type":"string","pattern":"^[A-Za-z0-9_.:-]{8,128}$"},{"type":"null"}]},"type":{"type":"string","const":"job_application.v1"},"id":{"type":"string","pattern":"^VS-J-[A-Z0-9]{6}$"},"payload":{"type":"object","properties":{"ref":{"type":"string","pattern":"^VS-J-[A-Z0-9]{6}$"},"source":{"anyOf":[{"type":"string","const":"web"},{"type":"string","const":"whatsapp"},{"type":"string","enum":["web_en","web_hi","web_hinglish"]}]},"locale":{"anyOf":[{"type":"string","enum":["en-IN","hi-IN","hi-Latn-IN","pa-IN","kn-IN"]},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"pageCluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"pagePath":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^\\/([a-z0-9]+(-[a-z0-9]+)*(\\/[a-z0-9]+(-[a-z0-9]+)*)*)?$"},{"type":"null"}]},"role":{"anyOf":[{"type":"string","enum":["factory-helper","packing","machine-operator","warehouse","forklift-operator","data-entry-operator","housekeeping","iti-trades","electrician","welder","fitter"]},{"type":"null"}]},"hub":{"anyOf":[{"type":"string","enum":["freshers","10th-pass","12th-pass"]},{"type":"null"}]},"channel":{"type":"string","enum":["web","agent","whatsapp"]},"agentName":{"anyOf":[{"type":"string","maxLength":100},{"type":"null"}]},"phone":{"type":"string","pattern":"^\\+91[6-9]\\d{9}$"},"adult":{"type":"boolean","const":true},"consent":{"type":"object","properties":{"version":{"type":"string","minLength":1,"maxLength":40},"at":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"}},"required":["version","at"],"additionalProperties":false},"text":{"anyOf":[{"type":"string","maxLength":4000},{"type":"null"}]},"attachments":{"maxItems":8,"type":"array","items":{"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"image"},"key":{"type":"string","minLength":1,"maxLength":300},"mime":{"type":"string","pattern":"^image\\/(jpeg|png|webp)$"},"size":{"type":"integer","minimum":1,"maximum":10485760},"name":{"anyOf":[{"type":"string","maxLength":200},{"type":"null"}]}},"required":["kind","key","mime","size","name"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"document"},"key":{"type":"string","minLength":1,"maxLength":300},"mime":{"type":"string","pattern":"^application\\/(pdf|msword|vnd\\.openxmlformats-officedocument\\.wordprocessingml\\.document)$"},"size":{"type":"integer","minimum":1,"maximum":20971520},"name":{"anyOf":[{"type":"string","maxLength":200},{"type":"null"}]}},"required":["kind","key","mime","size","name"],"additionalProperties":false}]}},"form":{"anyOf":[{"type":"string","enum":["long","quick"]},{"type":"null"}]},"applicantName":{"anyOf":[{"type":"string","minLength":1,"maxLength":80},{"type":"null"}]},"answers":{"anyOf":[{"type":"object","properties":{"work":{"minItems":1,"type":"array","items":{"type":"string","enum":["factory-helper","packing","warehouse","machine-operator","iti-trades","housekeeping","data-entry-operator","forklift-operator","any"]},"uniqueItems":true},"trade":{"minItems":1,"type":"array","items":{"type":"string","enum":["electrician","welder","fitter","machinist","other-trade"]},"uniqueItems":true},"iti":{"minItems":1,"type":"array","items":{"type":"string","enum":["iti-pass","iti-pursuing","no-iti"]},"uniqueItems":true},"machines":{"minItems":1,"type":"array","items":{"type":"string","enum":["packing-machine","moulding","press","cnc-vmc","other-machine"]},"uniqueItems":true},"forklift":{"minItems":1,"type":"array","items":{"type":"string","enum":["licence-experience","experience-only","want-to-learn"]},"uniqueItems":true},"computer":{"minItems":1,"type":"array","items":{"type":"string","enum":["typing","excel","tally","sap-erp"]},"uniqueItems":true},"experience":{"minItems":1,"type":"array","items":{"type":"string","enum":["fresher","under-1","1-3","3-plus"]},"uniqueItems":true},"education":{"minItems":1,"type":"array","items":{"type":"string","enum":["below-10th","10th","12th","iti-diploma","graduate"]},"uniqueItems":true},"shift":{"minItems":1,"type":"array","items":{"type":"string","enum":["day","night","rotating"]},"uniqueItems":true},"start":{"minItems":1,"type":"array","items":{"type":"string","enum":["now","week","month"]},"uniqueItems":true},"area":{"minItems":1,"type":"array","items":{"type":"string","enum":["sidcul-bahadrabad","haridwar-jwalapur","roorkee-bhagwanpur","laksar","outside","bengaluru:north","bengaluru:south","bengaluru:east","bengaluru:west","bengaluru:outside","jalandhar:kapurthala","jalandhar:city","jalandhar:phagwara-goraya","jalandhar:outside","uttarakhand:haridwar","uttarakhand:dehradun-selaqui","uttarakhand:udham-singh-nagar","uttarakhand:other","uttarakhand:outside","punjab:jalandhar-kapurthala","punjab:ludhiana","punjab:mohali","punjab:amritsar","punjab:other","punjab:outside","dehradun:selaqui-sahaspur","dehradun:city","dehradun:rishikesh-doiwala","dehradun:vikasnagar","dehradun:outside","market:haridwar","market:uttarakhand","market:jalandhar","market:punjab","market:bengaluru","market:other","market:dehradun","haridwar:rest-of-uttarakhand","jalandhar:rest-of-punjab","dehradun:rest-of-uttarakhand"]},"uniqueItems":true}},"additionalProperties":false,"minProperties":1},{"type":"null"}]}},"required":["ref","source","locale","cluster","pageCluster","pagePath","role","hub","channel","agentName","phone","adult","consent","text","attachments","form","applicantName","answers"],"additionalProperties":false,"title":"job_application.v1 (canonical)","description":"A job application as the website forwards it to Windmill f/talent/intake.","allOf":[{"anyOf":[{"properties":{"text":{"type":"string","minLength":1}},"required":["text"]},{"properties":{"attachments":{"minItems":1}},"required":["attachments"]},{"properties":{"answers":{"type":"object"}},"required":["answers"]}]},{"if":{"properties":{"source":{"const":"web"}},"required":["source"]},"then":{"properties":{"locale":{"type":"string"}}}},{"if":{"properties":{"source":{"const":"whatsapp"}},"required":["source"]},"then":{"properties":{"channel":{"const":"whatsapp"},"locale":{"type":"string"}}}}]}},"required":["v","sentAt","idempotencyKey","type","id","payload"],"additionalProperties":false},{"type":"object","properties":{"v":{"type":"number","const":1},"sentAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"idempotencyKey":{"anyOf":[{"type":"string","pattern":"^[A-Za-z0-9_.:-]{8,128}$"},{"type":"null"}]},"type":{"type":"string","const":"business_enquiry.v1"},"id":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"payload":{"type":"object","properties":{"caseId":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"receivedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"channel":{"type":"string","enum":["web","agent"]},"name":{"type":"string","minLength":1,"maxLength":120},"company":{"anyOf":[{"type":"string","minLength":1,"maxLength":160},{"type":"null"}]},"jobTitle":{"anyOf":[{"type":"string","minLength":1,"maxLength":120},{"type":"null"}]},"phone":{"type":"string","maxLength":30,"pattern":"^\\D*(?:\\d\\D*){10,}$"},"email":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"},{"type":"null"}]},"services":{"maxItems":20,"type":"array","items":{"type":"string","minLength":1,"maxLength":40}},"headcount":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"headcountBand":{"anyOf":[{"type":"string","minLength":1,"maxLength":20},{"type":"null"}]},"site":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"startWindow":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"targetStartDate":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"requestType":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"enquiry":{"type":"string","minLength":1,"maxLength":8000},"sourcePath":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]}},"required":["caseId","receivedAt","channel","name","company","jobTitle","phone","email","services","headcount","headcountBand","site","cluster","startWindow","targetStartDate","requestType","enquiry","sourcePath"],"additionalProperties":false,"title":"business_enquiry.v1 (canonical)","description":"A business enquiry as the website forwards it to Windmill f/leads/intake."}},"required":["v","sentAt","idempotencyKey","type","id","payload"],"additionalProperties":false},{"type":"object","properties":{"v":{"type":"number","const":1},"sentAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"idempotencyKey":{"anyOf":[{"type":"string","pattern":"^[A-Za-z0-9_.:-]{8,128}$"},{"type":"null"}]},"type":{"type":"string","const":"compliance_help.v1"},"id":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"payload":{"type":"object","properties":{"caseId":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"receivedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"channel":{"type":"string","enum":["web","agent"]},"name":{"type":"string","minLength":1,"maxLength":120},"company":{"anyOf":[{"type":"string","minLength":1,"maxLength":160},{"type":"null"}]},"jobTitle":{"anyOf":[{"type":"string","minLength":1,"maxLength":120},{"type":"null"}]},"phone":{"type":"string","maxLength":30,"pattern":"^\\D*(?:\\d\\D*){10,}$"},"email":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"},{"type":"null"}]},"services":{"maxItems":20,"type":"array","items":{"type":"string","minLength":1,"maxLength":40}},"headcount":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"headcountBand":{"anyOf":[{"type":"string","minLength":1,"maxLength":20},{"type":"null"}]},"site":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"startWindow":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"targetStartDate":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"requestType":{"type":"string","const":"compliance-help"},"enquiry":{"type":"string","minLength":1,"maxLength":8000},"sourcePath":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]}},"required":["caseId","receivedAt","channel","name","company","jobTitle","phone","email","services","headcount","headcountBand","site","cluster","startWindow","targetStartDate","requestType","enquiry","sourcePath"],"additionalProperties":false,"title":"compliance_help.v1 (canonical)","description":"A compliance help request: a lead with requestType compliance-help."}},"required":["v","sentAt","idempotencyKey","type","id","payload"],"additionalProperties":false}],"title":"envelope.v1","description":"One submission, as the site delivers it to Windmill webhook/vspl-submission."};
let ajv;
const compiled = new Map();
function validator(schema) {
    ajv ??= new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
    let validate = compiled.get(schema);
    if (!validate) {
        validate = ajv.compile(schema);
        compiled.set(schema, validate);
    }
    return validate;
}
function fieldsOf(validate) {
    const names = new Set();
    for (const e of validate.errors ?? []) {
        const top = e.instancePath.split("/")[1];
        if (top)
            names.add(top);
        else if (e.keyword === "required" || e.keyword === "additionalProperties") {
            const p = e.params;
            names.add(p.missingProperty ?? p.additionalProperty ?? "payload");
        }
        else
            names.add("payload");
    }
    return names.size ? [...names].sort() : ["payload"];
}
function check(schema, body) {
    const validate = validator(schema);
    return validate(body) ? { ok: true, value: body } : { ok: false, errors: fieldsOf(validate) };
}
const SCHEMAS = {
    "job_application.v1": jobApplicationSchema,
    "business_enquiry.v1": businessEnquirySchema,
    "envelope.v1": envelopeSchema,
};
  return { check, SCHEMAS };
})();

// integrations/windmill/leads/lib/lead.ts
const { checkLead, serviceValues, crewSize, opportunityName, recordLead } = (() => {
function checkLead(body) {
    const checked = check(SCHEMAS["business_enquiry.v1"], body);
    return checked.ok ? { ok: true, lead: { ...checked.value, receivedAt: new Date(checked.value.receivedAt).toISOString() } } : checked;
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
    if (existing) {
        const personId = typeof existing.pointOfContactId === "string" ? existing.pointOfContactId : null;
        if (personId)
            await recordEnquiry(crm, lead, personId, existing.id);
        return { opportunityId: existing.id, created: false };
    }
    let companyId = null;
    if (lead.company) {
        const [company] = await crm.find("companies", eq("name", lead.company));
        companyId = company?.id ?? (await crm.create("companies", "Company", { name: lead.company })).id;
    }
    const notWorker = (people) => people.find((p) => p.personType !== "WORKER");
    const byPhone = notWorker(await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(lead.phone))));
    const byEmail = byPhone || !lead.email ? undefined : notWorker(await crm.find("people", eq("emails.primaryEmail", lead.email)));
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
    const opportunity = await crm.create("opportunities", "Opportunity", {
        name: opportunityName(lead),
        stage: "NEW",
        leadSource: lead.channel === "agent" ? "OTHER" : "WEBSITE_FORM",
        caseId: lead.caseId,
        crewSize: crewSize(lead),
        services: serviceValues(lead.services),
        siteLocation: lead.site ?? "",
        cluster: lead.cluster ? optionValue(lead.cluster) : null,
        startDate: isoDate(lead.targetStartDate),
        enquiry: lead.enquiry,
        pointOfContactId: personId,
        ...(companyId ? { companyId } : {}),
    });
    await recordEnquiry(crm, lead, personId, opportunity.id);
    return { opportunityId: opportunity.id, created: true };
}
async function recordEnquiry(crm, lead, personId, opportunityId) {
    const externalKey = `lead:${lead.caseId}`;
    if ((await crm.find("communications", eq("externalKey", externalKey))).length)
        return;
    await crm.create("communications", "Communication", {
        name: `Website enquiry ${lead.caseId}`,
        channel: "EMAIL",
        direction: "INBOUND",
        deliveryStatus: "DELIVERED",
        body: lead.enquiry,
        provider: lead.channel === "agent" ? "AI agent (/api/agent/contact)" : "Website form (/api/contact)",
        statusAt: lead.receivedAt,
        externalKey,
        personId,
        opportunityId,
    });
}
  return { checkLead, serviceValues, crewSize, opportunityName, recordLead };
})();

// packages/contracts/src/rules.ts
const { REF_PATTERN, INTAKE_SOURCES, WEB_SOURCE, WHATSAPP_SOURCE, isSubmissionSource, INTAKE_LOCALES, isIntakeLocale, LEGACY_SOURCE_LOCALES, INTAKE_CLUSTERS, isIntakeCluster, PAGE_PATH_PATTERN, MAX_PAGE_PATH_LENGTH, isPagePath, INTAKE_CHANNELS, AGENT_LANGUAGE_SOURCES, MAX_AGENT_NAME_LENGTH, JOB_ROLES, JOB_ROLE_SLUGS, isJobRole, JOB_HUBS, JOB_HUB_SLUGS, isJobHub, INTAKE_FORMS, INTAKE_FORM_KEYS, MAX_APPLICANT_NAME_LENGTH, QUICK_ANSWERS, AREA_CLUSTERS, submissionCluster, QUICK_QUESTIONS, cleanQuickAnswers, ATTACHMENT_KINDS, ATTACHMENT_MIME, INTAKE_LIMITS, attachmentKeyPrefix, isAttachmentKeyFor, normaliseIndianMobile } = (() => {
const REF_PATTERN = /^VS-J-[A-Z0-9]{6}$/;
const INTAKE_SOURCES = {
    web_en: "en",
    web_hi: "hi",
    web_hinglish: "hinglish",
};
const WEB_SOURCE = "web";
const WHATSAPP_SOURCE = "whatsapp";
function isSubmissionSource(value) {
    return value === WEB_SOURCE || (typeof value === "string" && Object.hasOwn(INTAKE_SOURCES, value));
}
const INTAKE_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN", "kn-IN"];
function isIntakeLocale(value) {
    return typeof value === "string" && INTAKE_LOCALES.includes(value);
}
const LEGACY_SOURCE_LOCALES = { web_en: "en-IN", web_hi: "hi-IN", web_hinglish: "hi-Latn-IN" };
const INTAKE_CLUSTERS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other", "punjab", "dehradun"];
function isIntakeCluster(value) {
    return typeof value === "string" && INTAKE_CLUSTERS.includes(value);
}
const PAGE_PATH_PATTERN = /^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/;
const MAX_PAGE_PATH_LENGTH = 200;
function isPagePath(value) {
    return typeof value === "string" && value.length <= MAX_PAGE_PATH_LENGTH && PAGE_PATH_PATTERN.test(value);
}
const INTAKE_CHANNELS = ["web", "agent", "whatsapp"];
const AGENT_LANGUAGE_SOURCES = { en: "web_en", hi: "web_hi", hinglish: "web_hinglish" };
const MAX_AGENT_NAME_LENGTH = 100;
const JOB_ROLES = {
    "factory-helper": "Factory helper",
    packing: "Packing",
    "machine-operator": "Machine operator",
    warehouse: "Warehouse: loading, picking, packing",
    "forklift-operator": "Forklift operator",
    "data-entry-operator": "Data entry operator",
    housekeeping: "Housekeeping",
    "iti-trades": "ITI trades: welder, fitter, electrician",
    electrician: "Electrician",
    welder: "Welder",
    fitter: "Fitter",
};
const JOB_ROLE_SLUGS = Object.keys(JOB_ROLES);
function isJobRole(value) {
    return typeof value === "string" && Object.hasOwn(JOB_ROLES, value);
}
const JOB_HUBS = {
    freshers: "Freshers page",
    "10th-pass": "10th pass page",
    "12th-pass": "12th pass page",
};
const JOB_HUB_SLUGS = Object.keys(JOB_HUBS);
function isJobHub(value) {
    return typeof value === "string" && Object.hasOwn(JOB_HUBS, value);
}
const INTAKE_FORMS = {
    long: "Long form (/jobs and role pages)",
    quick: "Quick apply (/jobs/apply)",
};
const INTAKE_FORM_KEYS = Object.keys(INTAKE_FORMS);
const MAX_APPLICANT_NAME_LENGTH = 80;
const QUICK_ANSWERS = {
    work: {
        "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
        "iti-trades": "ITI trade", housekeeping: "Housekeeping", "data-entry-operator": "Data entry", "forklift-operator": "Forklift operator",
        any: "Any work",
    },
    trade: { electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Other trade" },
    iti: { "iti-pass": "ITI passed", "iti-pursuing": "Studying / apprentice", "no-iti": "Experience, no ITI" },
    machines: {
        "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
        "other-machine": "Other machines",
    },
    forklift: { "licence-experience": "Licence and experience", "experience-only": "Experience, no licence", "want-to-learn": "Wants to learn" },
    computer: { typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP" },
    experience: { fresher: "Fresher", "under-1": "Under 1 year", "1-3": "1 to 3 years", "3-plus": "3+ years" },
    education: { "below-10th": "Below 10th", "10th": "10th pass", "12th": "12th pass", "iti-diploma": "ITI / diploma", graduate: "Graduate" },
    shift: { day: "Day", night: "Night", rotating: "Rotating / any" },
    start: { now: "Immediately", week: "Within a week", month: "Within a month" },
    area: {
        "sidcul-bahadrabad": "SIDCUL / Bahadrabad", "haridwar-jwalapur": "Haridwar city / Jwalapur", "roorkee-bhagwanpur": "Roorkee / Bhagwanpur",
        laksar: "Laksar", outside: "Outside Haridwar",
        "bengaluru:north": "Bengaluru North / Peenya", "bengaluru:south": "Bengaluru South / Electronic City", "bengaluru:east": "Bengaluru East / Whitefield",
        "bengaluru:west": "Bengaluru West / Kengeri", "bengaluru:outside": "Outside Bengaluru",
        "jalandhar:kapurthala": "Kapurthala", "jalandhar:city": "Jalandhar city", "jalandhar:phagwara-goraya": "Phagwara / Goraya",
        "jalandhar:outside": "Outside Jalandhar and Kapurthala",
        "uttarakhand:haridwar": "Haridwar / Roorkee", "uttarakhand:dehradun-selaqui": "Dehradun / Selaqui",
        "uttarakhand:udham-singh-nagar": "Rudrapur / Kashipur / Sitarganj", "uttarakhand:other": "Elsewhere in Uttarakhand",
        "uttarakhand:outside": "Outside Uttarakhand",
        "punjab:jalandhar-kapurthala": "Jalandhar / Kapurthala", "punjab:ludhiana": "Ludhiana", "punjab:mohali": "Mohali / Kharar",
        "punjab:amritsar": "Amritsar", "punjab:other": "Elsewhere in Punjab", "punjab:outside": "Outside Punjab",
        "dehradun:selaqui-sahaspur": "Selaqui / Sahaspur", "dehradun:city": "Dehradun city", "dehradun:rishikesh-doiwala": "Rishikesh / Doiwala",
        "dehradun:vikasnagar": "Vikasnagar / Herbertpur", "dehradun:outside": "Outside Dehradun",
        "market:haridwar": "Haridwar / Roorkee", "market:uttarakhand": "Elsewhere in Uttarakhand", "market:jalandhar": "Jalandhar / Kapurthala",
        "market:punjab": "Elsewhere in Punjab", "market:bengaluru": "Bengaluru", "market:other": "Somewhere else",
        "market:dehradun": "Dehradun / Selaqui",
        "haridwar:rest-of-uttarakhand": "Elsewhere in Uttarakhand (Haridwar form)", "jalandhar:rest-of-punjab": "Elsewhere in Punjab (Jalandhar form)",
        "dehradun:rest-of-uttarakhand": "Elsewhere in Uttarakhand (Dehradun form)",
    },
};
const AREA_CLUSTERS = {
    "sidcul-bahadrabad": "haridwar",
    "haridwar-jwalapur": "haridwar",
    "roorkee-bhagwanpur": "haridwar",
    laksar: "haridwar",
    outside: null,
    "bengaluru:north": "bengaluru",
    "bengaluru:south": "bengaluru",
    "bengaluru:east": "bengaluru",
    "bengaluru:west": "bengaluru",
    "bengaluru:outside": null,
    "jalandhar:kapurthala": "jalandhar",
    "jalandhar:city": "jalandhar",
    "jalandhar:phagwara-goraya": "jalandhar",
    "jalandhar:outside": null,
    "uttarakhand:haridwar": "haridwar",
    "uttarakhand:dehradun-selaqui": "dehradun",
    "uttarakhand:udham-singh-nagar": "uttarakhand",
    "uttarakhand:other": "uttarakhand",
    "uttarakhand:outside": null,
    "punjab:jalandhar-kapurthala": "jalandhar",
    "punjab:ludhiana": "punjab",
    "punjab:mohali": "punjab",
    "punjab:amritsar": "punjab",
    "punjab:other": "punjab",
    "punjab:outside": null,
    "dehradun:selaqui-sahaspur": "dehradun",
    "dehradun:city": "dehradun",
    "dehradun:rishikesh-doiwala": "dehradun",
    "dehradun:vikasnagar": "dehradun",
    "dehradun:outside": null,
    "market:haridwar": "haridwar",
    "market:uttarakhand": "uttarakhand",
    "market:jalandhar": "jalandhar",
    "market:punjab": "punjab",
    "market:bengaluru": "bengaluru",
    "market:other": null,
    "market:dehradun": "dehradun",
    "haridwar:rest-of-uttarakhand": "uttarakhand",
    "jalandhar:rest-of-punjab": "punjab",
    "dehradun:rest-of-uttarakhand": "uttarakhand",
};
function submissionCluster(pageCluster, answers) {
    const area = answers?.area?.[0];
    const fromArea = area && Object.hasOwn(AREA_CLUSTERS, area) ? AREA_CLUSTERS[area] : null;
    return fromArea ?? pageCluster ?? "other";
}
const QUICK_QUESTIONS = {
    work: "Work", trade: "ITI trade", iti: "ITI", machines: "Machines", forklift: "Forklift", computer: "Computer skills",
    experience: "Experience", education: "Education", shift: "Shifts", start: "Can start", area: "Area",
};
function cleanQuickAnswers(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const out = {};
    for (const [question, options] of Object.entries(QUICK_ANSWERS)) {
        const values = raw[question];
        if (!Array.isArray(values))
            continue;
        const kept = [...new Set(values.filter((v) => typeof v === "string" && Object.hasOwn(options, v)))];
        if (kept.length)
            out[question] = kept;
    }
    return Object.keys(out).length ? out : null;
}
const ATTACHMENT_KINDS = ["image", "document"];
const ATTACHMENT_MIME = {
    image: /^image\/(jpeg|png|webp)$/,
    document: /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
};
const INTAKE_LIMITS = {
    maxAttachments: 8,
    maxTextLength: 4000,
    maxFileNameLength: 200,
    maxBytes: { image: 10 * 1024 * 1024, document: 20 * 1024 * 1024 },
};
function attachmentKeyPrefix(ref, at) {
    const month = String(at.getUTCMonth() + 1).padStart(2, "0");
    return `intake/${at.getUTCFullYear()}/${month}/${ref}/`;
}
function isAttachmentKeyFor(key, ref) {
    return key.startsWith("intake/") && key.includes(`/${ref}/`);
}
function normaliseIndianMobile(input) {
    const digits = input.replace(/\D/g, "");
    if (/^[6-9]\d{9}$/.test(digits))
        return `+91${digits}`;
    if (/^91[6-9]\d{9}$/.test(digits))
        return `+${digits}`;
    if (/^0[6-9]\d{9}$/.test(digits))
        return `+91${digits.slice(1)}`;
    return null;
}
  return { REF_PATTERN, INTAKE_SOURCES, WEB_SOURCE, WHATSAPP_SOURCE, isSubmissionSource, INTAKE_LOCALES, isIntakeLocale, LEGACY_SOURCE_LOCALES, INTAKE_CLUSTERS, isIntakeCluster, PAGE_PATH_PATTERN, MAX_PAGE_PATH_LENGTH, isPagePath, INTAKE_CHANNELS, AGENT_LANGUAGE_SOURCES, MAX_AGENT_NAME_LENGTH, JOB_ROLES, JOB_ROLE_SLUGS, isJobRole, JOB_HUBS, JOB_HUB_SLUGS, isJobHub, INTAKE_FORMS, INTAKE_FORM_KEYS, MAX_APPLICANT_NAME_LENGTH, QUICK_ANSWERS, AREA_CLUSTERS, submissionCluster, QUICK_QUESTIONS, cleanQuickAnswers, ATTACHMENT_KINDS, ATTACHMENT_MIME, INTAKE_LIMITS, attachmentKeyPrefix, isAttachmentKeyFor, normaliseIndianMobile };
})();

// integrations/windmill/talent/lib/notify-application.ts
const { TWENTY_APP_URL, CLUSTER_LABELS, roleLabel, areaLabel, clusterLabel, applicationEvent } = (() => {
const TWENTY_APP_URL = "https://crm.vayasyaseva.com";
const CLUSTER_LABELS = {
    haridwar: "Haridwar",
    uttarakhand: "Uttarakhand",
    "delhi-ncr": "Delhi NCR",
    bengaluru: "Bengaluru",
    jalandhar: "Jalandhar",
    saharanpur: "Saharanpur",
    punjab: "Punjab",
    dehradun: "Dehradun",
    other: "other area",
};
const LANGUAGE_LABELS = {
    en: "English",
    "en-IN": "English",
    hi: "Hindi",
    "hi-IN": "Hindi",
    hinglish: "Hinglish",
    "hi-Latn-IN": "Hinglish",
    "pa-IN": "Punjabi",
    "kn-IN": "Kannada",
};
const has = (table, key) => typeof key === "string" && Object.hasOwn(table, key);
const firstAnswer = (c, question) => {
    const value = c.answers?.[question];
    return Array.isArray(value) && typeof value[0] === "string" ? value[0] : null;
};
function roleLabel(c) {
    if (has(JOB_ROLES, c.role))
        return JOB_ROLES[c.role];
    const work = firstAnswer(c, "work");
    if (has(QUICK_ANSWERS.work, work))
        return QUICK_ANSWERS.work[work];
    return "any work";
}
function areaLabel(c) {
    const area = firstAnswer(c, "area");
    return has(QUICK_ANSWERS.area, area) ? QUICK_ANSWERS.area[area] : null;
}
const clusterLabel = (cluster) => (cluster && has(CLUSTER_LABELS, cluster) ? CLUSTER_LABELS[cluster] : "no area");
function formLabel(c) {
    if (c.channel === "agent")
        return "AI agent";
    if (c.channel === "whatsapp")
        return "WhatsApp chat";
    if (c.answers && Object.keys(c.answers).length)
        return "quick form";
    if (c.source === "web" || c.source.startsWith("web_"))
        return "website form";
    return c.source;
}
function applicationEvent(c, personId) {
    const role = roleLabel(c);
    const cluster = clusterLabel(c.cluster);
    const area = areaLabel(c);
    const language = LANGUAGE_LABELS[c.person_locale ?? c.locale] ?? LANGUAGE_LABELS[c.locale] ?? c.locale;
    const name = (c.applicant_name ?? c.person_name ?? "").trim();
    return {
        source: "talent",
        type: "application.received",
        severity: "info",
        dedupeKey: `application:${c.ref}`,
        title: `New job application: ${role}, ${cluster}`,
        summary: [c.ref, role, area, cluster, formLabel(c), language].filter(Boolean).join(" · "),
        link: { label: "View in Twenty", url: `${TWENTY_APP_URL}/object/person/${encodeURIComponent(personId)}` },
        pii: { ...(name ? { name } : {}), phone: c.phone },
    };
}
  return { TWENTY_APP_URL, CLUSTER_LABELS, roleLabel, areaLabel, clusterLabel, applicationEvent };
})();

// integrations/windmill/leads/lib/lead-notify.ts
const { WINDMILL_APP_URL, isQualified, crewSummary, leadReceivedEvent, leadForwardFailedEvent } = (() => {
const WINDMILL_APP_URL = "https://windmill.vayasyaseva.com";
function isQualified(lead) {
    const header = lead.enquiry.split(/\n\s*\n/)[0] ?? "";
    return /^Flags: (?:.*; )?qualified\b/m.test(header);
}
const SERVICE_WORDS = {
    "loading-unloading": "loaders",
    warehouse: "warehouse staff",
    forklift: "forklift operators",
    housekeeping: "housekeeping",
    gardening: "gardeners",
    "factory-helpers": "factory helpers",
    packing: "packers",
    "machine-operators": "machine operators",
    "iti-trades": "ITI trades",
    maintenance: "maintenance staff",
    "fabrication-civil": "fabrication and civil",
    "data-entry": "data entry",
};
function crewSummary(lead) {
    if (lead.requestType === "compliance-help")
        return `compliance help${lead.cluster ? `, ${clusterLabel(lead.cluster)}` : ""}`;
    const size = /^[\d+\s-]{1,12}$/.test(lead.headcountBand ?? "") ? lead.headcountBand : /^\d{1,5}$/.test(lead.headcount?.trim() ?? "") ? lead.headcount.trim() : null;
    const first = lead.services[0];
    const what = first ? (SERVICE_WORDS[first] ?? "workers") + (lead.services.length > 1 ? ` +${lead.services.length - 1}` : "") : "workers";
    const kind = lead.requestType === "site-assessment" ? "site assessment: " : "";
    return `${kind}${size ? `${size} ` : ""}${what}${lead.cluster ? `, ${clusterLabel(lead.cluster)}` : ""}`;
}
const requestWord = (lead) => (lead.requestType === "compliance-help" ? "compliance help request" : "crew request");
function leadReceivedEvent(lead, opportunityId) {
    const qualified = isQualified(lead);
    const from = lead.channel === "agent" ? "AI agent" : (lead.sourcePath ?? "/contact");
    return {
        source: "leads",
        type: "lead.received",
        severity: qualified ? "notice" : "info",
        dedupeKey: `lead:${lead.caseId}`,
        title: `New ${requestWord(lead)}${qualified ? " (qualified)" : ""}: ${crewSummary(lead)}`,
        summary: `${lead.caseId} · from ${from}`,
        link: { label: "View in Twenty", url: `${TWENTY_APP_URL}/object/opportunity/${encodeURIComponent(opportunityId)}` },
        pii: { name: lead.name, ...(lead.company ? { company: lead.company } : {}), phone: lead.phone },
    };
}
const errorKind = (error) => error?.match(/HTTP \d{3}/)?.[0] ?? (error ? "an error" : "no answer");
function leadForwardFailedEvent(caseId, attempts, error) {
    return {
        source: "leads",
        type: "lead.forward_failed",
        severity: "warning",
        dedupeKey: `lead-dead:${caseId}`,
        title: `Lead not filed in Twenty: ${caseId}`,
        summary: `${caseId} stopped after ${attempts} attempts (last: ${errorKind(error)}). It is safe in the lead inbox; fix the cause, then reset its delivery (OPERATIONS.md, lead inbox).`,
        link: { label: "Windmill runs", url: `${WINDMILL_APP_URL}/runs/f/leads/sync_crm?workspace=vspl` },
    };
}
  return { WINDMILL_APP_URL, isQualified, crewSummary, leadReceivedEvent, leadForwardFailedEvent };
})();

// integrations/windmill/leads/lib/sql.ts
const { LEADS_SAVE, LEADS_SYNC_LOCK, LEADS_RECOVER_STUCK, LEADS_CLAIM, LEADS_FINISH, LEADS_SYNC_UNLOCK, LEADS_ERASURE_RECOVER, LEADS_ERASURE_CLAIM, LEADS_ERASURE_DONE, LEADS_ERASURE_FAIL } = (() => {
const LEADS_SAVE = `
WITH l AS (
  INSERT INTO leads (case_id, type, channel, payload, idempotency_key, received_at)
  VALUES ($1, $2, $3, $4::jsonb, $5, $6::timestamptz)
  ON CONFLICT (case_id) DO NOTHING
  RETURNING id
), d AS (
  INSERT INTO deliveries (lead_id, target) SELECT id, 'crm' FROM l RETURNING 1
)
SELECT (SELECT id FROM l) AS lead_id, (SELECT count(*) FROM d) AS deliveries;`;
const LEADS_SYNC_LOCK = `SELECT pg_try_advisory_lock(hashtext('leads:sync_crm')) AS locked;`;
const LEADS_RECOVER_STUCK = `
UPDATE deliveries
SET status = CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
    last_error = coalesce(last_error, 'Interrupted; picked up again'), next_attempt_at = now(), updated_at = now()
WHERE status = 'running' AND updated_at < now() - interval '15 minutes'
RETURNING lead_id;`;
const LEADS_CLAIM = `
WITH c AS (
  SELECT lead_id FROM deliveries
  WHERE target = 'crm' AND status = 'pending' AND next_attempt_at <= now() AND ($1::uuid IS NULL OR lead_id = $1::uuid)
  ORDER BY next_attempt_at, created_at LIMIT 1 FOR UPDATE SKIP LOCKED
), claimed AS (
  UPDATE deliveries d SET status = 'running', attempts = d.attempts + 1, updated_at = now()
  FROM c WHERE d.lead_id = c.lead_id AND d.target = 'crm'
  RETURNING d.lead_id, d.attempts
)
SELECT claimed.lead_id, claimed.attempts, l.case_id, l.payload
FROM claimed JOIN leads l ON l.id = claimed.lead_id;`;
const LEADS_FINISH = `
UPDATE deliveries
SET status = CASE WHEN $2 = 'retry' THEN (CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END) ELSE $2 END,
    next_attempt_at = CASE WHEN $2 = 'retry' THEN now() + make_interval(secs => $4::int) ELSE next_attempt_at END,
    last_error = $3, result = coalesce($5::jsonb, result),
    done_at = CASE WHEN $2 = 'done' THEN now() ELSE done_at END, updated_at = now()
WHERE lead_id = $1::uuid AND target = 'crm' AND status = 'running'
RETURNING status;`;
const LEADS_SYNC_UNLOCK = `SELECT pg_advisory_unlock(hashtext('leads:sync_crm')) AS unlocked;`;
const LEADS_ERASURE_RECOVER = `
UPDATE erasure_requests
SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
    last_error = coalesce(last_error, 'Interrupted; picked up again'), updated_at = now()
WHERE status = 'running' AND updated_at < now() - interval '1 hour'
RETURNING id;`;
const LEADS_ERASURE_CLAIM = `
WITH claimed AS (
  UPDATE erasure_requests e
  SET status = 'running', attempts = e.attempts + 1, last_error = NULL, updated_at = now()
  WHERE e.id = (
    SELECT id FROM erasure_requests WHERE status = 'pending'
    ORDER BY requested_at LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING e.id, e.case_id, e.phone
)
SELECT c.id, c.case_id, c.phone,
  coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', l.id, 'caseId', l.case_id, 'company', l.payload->>'company', 'phone', l.payload->>'phone', 'opportunityId', d.result->>'opportunityId'))
    FROM leads l LEFT JOIN deliveries d ON d.lead_id = l.id AND d.target = 'crm'
    WHERE l.case_id = c.case_id
       OR (c.phone IS NOT NULL AND right(regexp_replace(l.payload->>'phone', '\\D', '', 'g'), 10) = right(regexp_replace(c.phone, '\\D', '', 'g'), 10))
  ), '[]'::jsonb) AS leads
FROM claimed c;`;
const LEADS_ERASURE_DONE = `
WITH gone AS (
  DELETE FROM leads WHERE id = ANY($2::uuid[]) RETURNING id
)
UPDATE erasure_requests
SET status = 'done', processed_at = now(), updated_at = now(), case_id = NULL, phone = NULL,
    removed_leads = (SELECT count(*) FROM gone), removed_opportunities = $3::int, removed_people = $4::int,
    removed_companies = $5::int, removed_crm_files = $6::int
WHERE id = $1::uuid AND status = 'running'
RETURNING id, removed_leads;`;
const LEADS_ERASURE_FAIL = `
UPDATE erasure_requests
SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END, last_error = $2, updated_at = now()
WHERE id = $1::uuid AND status = 'running';`;
  return { LEADS_SAVE, LEADS_SYNC_LOCK, LEADS_RECOVER_STUCK, LEADS_CLAIM, LEADS_FINISH, LEADS_SYNC_UNLOCK, LEADS_ERASURE_RECOVER, LEADS_ERASURE_CLAIM, LEADS_ERASURE_DONE, LEADS_ERASURE_FAIL };
})();

// integrations/windmill/leads/lib/run-leads.ts
const { saveLead, LEADS_BATCH, leadBackoffSeconds, runLeadsSync } = (() => {
async function saveLead(query, lead, idempotencyKey = null) {
    const type = lead.requestType === "compliance-help" ? "compliance_help.v1" : "business_enquiry.v1";
    const [row] = await query(LEADS_SAVE, [
        lead.caseId,
        type,
        lead.channel,
        JSON.stringify(lead),
        idempotencyKey,
        lead.receivedAt,
    ]);
    return { leadId: row?.lead_id ?? null, created: Boolean(row?.lead_id) };
}
const LEADS_BATCH = 5;
const leadBackoffSeconds = (attempts) => Math.min(60 * 2 ** Math.max(0, attempts - 1), 3600);
async function runLeadsSync(deps, options = {}) {
    const log = deps.log ?? ((m) => console.error(m));
    const result = { recovered: 0, done: 0, retried: 0, dead: 0 };
    const [lock] = await deps.query(LEADS_SYNC_LOCK);
    if (!lock?.locked)
        return { ...result, skipped: "another sync is running" };
    result.recovered = (await deps.query(LEADS_RECOVER_STUCK)).length;
    const batch = options.leadId ? 1 : (options.batch ?? LEADS_BATCH);
    for (let n = 0; n < batch; n++) {
        const [claim] = await deps.query(LEADS_CLAIM, [options.leadId ?? null]);
        if (!claim)
            break;
        let outcome = "done";
        let error = null;
        let written = null;
        try {
            written = await recordLead(deps.crm, claim.payload);
        }
        catch (err) {
            outcome = "retry";
            error = (err instanceof Error ? err.message : "unknown error").slice(0, 500);
        }
        const [finished] = await deps.query(LEADS_FINISH, [
            claim.lead_id,
            outcome,
            error,
            leadBackoffSeconds(claim.attempts),
            written === null ? null : JSON.stringify(written),
        ]);
        if (finished?.status === "done")
            result.done++;
        else if (finished?.status === "dead")
            result.dead++;
        else
            result.retried++;
        if (deps.notify && written)
            await deps.notify(leadReceivedEvent(claim.payload, written.opportunityId));
        if (deps.notify && finished?.status === "dead")
            await deps.notify(leadForwardFailedEvent(claim.case_id, claim.attempts, error));
        if (error && /HTTP 429/.test(error)) {
            result.rateLimited = true;
            break;
        }
        if (error)
            log(`lead ${claim.case_id} not in Twenty yet: ${error}`);
    }
    return result;
}
  return { saveLead, LEADS_BATCH, leadBackoffSeconds, runLeadsSync };
})();

// integrations/windmill/notify/lib/config.ts
const { NOTIFY_VARIABLES, notifyVariablePath, setNotifyConfigForTests, notifyConfig, OWNER_PLACEHOLDER } = (() => {
const NOTIFY_VARIABLES = {
    notify_pg_url: { secret: true },
    ingest_secret: { secret: true },
    alertmanager_secret: { secret: true },
    ntfy_token: { secret: true },
    ntfy_base_url: { secret: false },
    resend_api_key: { secret: true },
    email_from: { secret: false },
    email_to: { secret: true },
    policy: { secret: false },
};
const notifyVariablePath = (name) => `f/notify/${name}`;
let notifyOverride = null;
function setNotifyConfigForTests(values) {
    notifyOverride = values;
}
async function notifyConfig(name) {
    if (notifyOverride) {
        const value = notifyOverride[name];
        if (value === undefined)
            throw new Error(`test config has no ${name}`);
        return value;
    }
    const value = await wmill.getVariable(notifyVariablePath(name));
    if (!value)
        throw new Error(`variable ${notifyVariablePath(name)} is empty`);
    return value;
}
const OWNER_PLACEHOLDER = "set-by-owner";
  return { NOTIFY_VARIABLES, notifyVariablePath, setNotifyConfigForTests, notifyConfig, OWNER_PLACEHOLDER };
})();

// integrations/windmill/notify/lib/db.ts
const { withNotifyDb, NOTIFY_INSERT_EVENT, NOTIFY_KEY_STATUSES, NOTIFY_CLAIM_UNROUTED, NOTIFY_ENSURE_KEY, NOTIFY_LOCK_KEY, NOTIFY_SAVE_KEY, NOTIFY_MARK_ROUTED, NOTIFY_ADD_DELIVERY, NOTIFY_CLAIM_SWEEP, NOTIFY_CLAIM_DIGEST, NOTIFY_MARK_DIGESTED, NOTIFY_RECOVER_STUCK, NOTIFY_CLAIM_DELIVERIES, NOTIFY_FINISH_DELIVERY, NOTIFY_RELEASE_PII, NOTIFY_CLEAR_PII_BEFORE, NOTIFY_PURGE_BEFORE, toStoredEvent, insertEventWith, pgNotifyStore, notifySchemaStatements } = (() => {
async function withNotifyDb(fn) {
    const sql = postgres(await notifyConfig("notify_pg_url"), {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
        prepare: false,
        onnotice: () => { },
    });
    try {
        return await fn(sql);
    }
    finally {
        await sql.end({ timeout: 5 });
    }
}
const NOTIFY_INSERT_EVENT = `
INSERT INTO notify_events (v, source, type, severity, dedupe_key, status, occurred_at, title, summary, body, link, pii, received_at)
VALUES (1, $1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10::jsonb, $11::jsonb, $12::timestamptz)
RETURNING id::text AS id;`;
const NOTIFY_KEY_STATUSES = `
WITH k AS (
  SELECT dedupe_key, status FROM notify_keys WHERE left(dedupe_key, length($1)) = $1 AND status IS NOT NULL
), p AS (
  SELECT DISTINCT ON (dedupe_key) dedupe_key, status FROM notify_events
  WHERE routed_at IS NULL AND status IS NOT NULL AND left(dedupe_key, length($1)) = $1
  ORDER BY dedupe_key, id DESC
)
SELECT dedupe_key, coalesce(p.status, k.status) AS status FROM k FULL JOIN p USING (dedupe_key);`;
const EVENT_COLUMNS = `e.id::text AS id, e.source, e.type, e.severity, e.dedupe_key, e.status, e.occurred_at, e.received_at, e.title, e.summary, e.body, e.link, e.pii`;
const NOTIFY_CLAIM_UNROUTED = `
SELECT ${EVENT_COLUMNS} FROM notify_events e
WHERE e.routed_at IS NULL
ORDER BY e.id
LIMIT $1
FOR UPDATE SKIP LOCKED;`;
const NOTIFY_ENSURE_KEY = `INSERT INTO notify_keys (dedupe_key) VALUES ($1) ON CONFLICT (dedupe_key) DO NOTHING RETURNING 1 AS created;`;
const NOTIFY_LOCK_KEY = `SELECT status, firing_pushed, firing_emailed, last_push_at, pending_count, seen_count FROM notify_keys WHERE dedupe_key = $1 FOR UPDATE;`;
const NOTIFY_SAVE_KEY = `
UPDATE notify_keys SET status = $2, firing_pushed = $3, firing_emailed = $4, last_push_at = $5::timestamptz,
  pending_count = $6, seen_count = $7, last_event_id = coalesce($8::bigint, last_event_id), updated_at = $9::timestamptz
WHERE dedupe_key = $1;`;
const NOTIFY_MARK_ROUTED = `
UPDATE notify_events SET routed_at = $6::timestamptz, rule = $2, duplicate = $3, digest = $4,
  pii = CASE WHEN $5 THEN pii ELSE NULL END
WHERE id = $1::bigint;`;
const NOTIFY_ADD_DELIVERY = `
INSERT INTO notify_deliveries (event_id, channel, kind, count, next_attempt_at, created_at, updated_at)
VALUES ($1::bigint, $2, $3, $4, $5::timestamptz, $5::timestamptz, $5::timestamptz);`;
const NOTIFY_CLAIM_SWEEP = `
SELECT k.dedupe_key, k.status AS key_status, k.firing_pushed, k.firing_emailed, k.last_push_at, k.pending_count, k.seen_count, ${EVENT_COLUMNS}
FROM notify_keys k JOIN notify_events e ON e.id = k.last_event_id
WHERE k.last_push_at IS NOT NULL AND (
  (k.status = 'firing' AND k.firing_pushed AND k.last_push_at <= $1::timestamptz - make_interval(mins => $2::int))
  OR (k.pending_count > 0 AND k.last_push_at <= $1::timestamptz - make_interval(mins => $3::int))
)
ORDER BY k.last_push_at
LIMIT $4
FOR UPDATE OF k SKIP LOCKED;`;
const NOTIFY_CLAIM_DIGEST = `
SELECT ${EVENT_COLUMNS} FROM notify_events e
WHERE e.digest AND e.digested_at IS NULL AND e.routed_at IS NOT NULL
ORDER BY e.id
LIMIT $1
FOR UPDATE SKIP LOCKED;`;
const NOTIFY_MARK_DIGESTED = `UPDATE notify_events SET digested_at = $2::timestamptz WHERE id = ANY($1::bigint[]);`;
const NOTIFY_RECOVER_STUCK = `
UPDATE notify_deliveries
SET status = CASE WHEN attempts >= $2 THEN 'failed' ELSE 'pending' END, last_error = 'interrupted', updated_at = $1::timestamptz
WHERE status = 'sending' AND updated_at <= $1::timestamptz - interval '10 minutes'
RETURNING id;`;
const NOTIFY_CLAIM_DELIVERIES = `
WITH due AS (
  SELECT id FROM notify_deliveries
  WHERE status = 'pending' AND next_attempt_at <= $1::timestamptz AND attempts < $3
  ORDER BY next_attempt_at, id
  LIMIT $2
  FOR UPDATE SKIP LOCKED
), claimed AS (
  UPDATE notify_deliveries d SET status = 'sending', attempts = d.attempts + 1, updated_at = $1::timestamptz
  FROM due WHERE d.id = due.id
  RETURNING d.id, d.event_id, d.channel, d.kind, d.count, d.attempts
)
SELECT c.id::text AS delivery_id, c.channel, c.kind, c.count, c.attempts, ${EVENT_COLUMNS}
FROM claimed c JOIN notify_events e ON e.id = c.event_id
ORDER BY c.id;`;
const NOTIFY_FINISH_DELIVERY = `
UPDATE notify_deliveries SET status = $2, last_error = $3, next_attempt_at = coalesce($4::timestamptz, next_attempt_at),
  sent_at = CASE WHEN $2 = 'sent' THEN $5::timestamptz ELSE sent_at END, updated_at = $5::timestamptz
WHERE id = $1::bigint;`;
const NOTIFY_RELEASE_PII = `
UPDATE notify_events SET pii = NULL
WHERE id = $1::bigint AND pii IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM notify_deliveries d WHERE d.event_id = $1::bigint AND d.channel = 'push' AND d.status IN ('pending', 'sending')
);`;
const NOTIFY_CLEAR_PII_BEFORE = `UPDATE notify_events SET pii = NULL WHERE pii IS NOT NULL AND received_at < $1::timestamptz RETURNING id;`;
const NOTIFY_PURGE_BEFORE = `DELETE FROM notify_events WHERE received_at < $1::timestamptz RETURNING id;`;
const iso = (v) => (v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : new Date(String(v)).toISOString());
function toStoredEvent(r) {
    return {
        v: 1,
        id: String(r.id),
        source: r.source,
        type: String(r.type),
        severity: r.severity,
        dedupeKey: String(r.dedupe_key),
        ...(r.status ? { status: r.status } : {}),
        occurredAt: iso(r.occurred_at),
        receivedAt: iso(r.received_at),
        title: String(r.title),
        summary: String(r.summary),
        ...(r.body ? { body: String(r.body) } : {}),
        ...(r.link ? { link: r.link } : {}),
        ...(r.pii ? { pii: r.pii } : {}),
    };
}
const toState = (r, statusColumn = "status") => ({
    status: r[statusColumn] ?? null,
    firingPushed: Boolean(r.firing_pushed),
    firingEmailed: Boolean(r.firing_emailed),
    lastPushAt: iso(r.last_push_at),
    pendingCount: Number(r.pending_count ?? 0),
    seenCount: Number(r.seen_count ?? 0),
});
const execOn = (sql) => async (text, params = []) => (await sql.unsafe(text, params));
function insertEventWith(exec) {
    return async (e, now) => {
        const rows = await exec(NOTIFY_INSERT_EVENT, [
            e.source, e.type, e.severity, e.dedupeKey, e.status ?? null, e.occurredAt, e.title, e.summary, e.body ?? null, e.link ?? null, e.pii ?? null, now,
        ]);
        return String(rows[0].id);
    };
}
function txOn(exec) {
    const addDelivery = async (eventId, channel, kind, count, now) => {
        await exec(NOTIFY_ADD_DELIVERY, [eventId, channel, kind, count, now]);
    };
    return {
        claimUnrouted: async (limit) => (await exec(NOTIFY_CLAIM_UNROUTED, [limit])).map(toStoredEvent),
        async lockKey(key) {
            const created = (await exec(NOTIFY_ENSURE_KEY, [key])).length > 0;
            const rows = await exec(NOTIFY_LOCK_KEY, [key]);
            return created || rows.length === 0 ? null : toState(rows[0]);
        },
        async saveKey(key, s, lastEventId, now) {
            await exec(NOTIFY_SAVE_KEY, [key, s.status, s.firingPushed, s.firingEmailed, s.lastPushAt, s.pendingCount, s.seenCount, lastEventId, now]);
        },
        async markRouted(id, o, now) {
            await exec(NOTIFY_MARK_ROUTED, [id, o.rule, o.duplicate, o.digest, o.keepPii, now]);
        },
        addDelivery,
        claimSweepKeys: async (now, reminderMinutes, collapseMinutes, limit) => (await exec(NOTIFY_CLAIM_SWEEP, [now, Math.round(reminderMinutes), Math.round(collapseMinutes), limit])).map((r) => ({
            key: String(r.dedupe_key),
            state: toState(r, "key_status"),
            event: toStoredEvent(r),
        })),
        claimDigest: async (limit) => (await exec(NOTIFY_CLAIM_DIGEST, [limit])).map(toStoredEvent),
        async markDigested(ids, now) {
            await exec(NOTIFY_MARK_DIGESTED, [ids, now]);
        },
    };
}
function pgNotifyStore(sql) {
    const exec = execOn(sql);
    const tx = txOn(exec);
    return {
        transaction: async (fn) => (await sql.begin((t) => fn(txOn(execOn(t))))),
        insertEvent: insertEventWith(exec),
        keyStatuses: async (prefix) => Object.fromEntries((await exec(NOTIFY_KEY_STATUSES, [prefix])).map((r) => [String(r.dedupe_key), r.status])),
        recoverStuck: async (now, maxAttempts) => (await exec(NOTIFY_RECOVER_STUCK, [now, maxAttempts])).length,
        claimDeliveries: async (now, limit, maxAttempts) => (await exec(NOTIFY_CLAIM_DELIVERIES, [now, limit, maxAttempts])).map((r) => ({
            id: String(r.delivery_id),
            channel: r.channel,
            kind: r.kind,
            count: Number(r.count),
            attempts: Number(r.attempts),
            event: toStoredEvent(r),
        })),
        async finishDelivery(id, o, now) {
            await exec(NOTIFY_FINISH_DELIVERY, [id, o.status, o.status === "sent" ? null : o.error, o.status === "pending" ? o.retryAt : null, now]);
        },
        addDelivery: tx.addDelivery,
        async releasePii(eventId) {
            await exec(NOTIFY_RELEASE_PII, [eventId]);
        },
        clearPiiBefore: async (before) => (await exec(NOTIFY_CLEAR_PII_BEFORE, [before])).length,
        purgeBefore: async (before) => (await exec(NOTIFY_PURGE_BEFORE, [before])).length,
    };
}
const notifySchemaStatements = (schema) => schema.replace(/^--.*\n/gm, "");
  return { withNotifyDb, NOTIFY_INSERT_EVENT, NOTIFY_KEY_STATUSES, NOTIFY_CLAIM_UNROUTED, NOTIFY_ENSURE_KEY, NOTIFY_LOCK_KEY, NOTIFY_SAVE_KEY, NOTIFY_MARK_ROUTED, NOTIFY_ADD_DELIVERY, NOTIFY_CLAIM_SWEEP, NOTIFY_CLAIM_DIGEST, NOTIFY_MARK_DIGESTED, NOTIFY_RECOVER_STUCK, NOTIFY_CLAIM_DELIVERIES, NOTIFY_FINISH_DELIVERY, NOTIFY_RELEASE_PII, NOTIFY_CLEAR_PII_BEFORE, NOTIFY_PURGE_BEFORE, toStoredEvent, insertEventWith, pgNotifyStore, notifySchemaStatements };
})();

// integrations/windmill/talent/lib/mask.ts
const { maskIds, maskDeep } = (() => {
function maskIds(value) {
    return value
        .replace(/\b([2-9]\d{3})[ -]?(\d{4})[ -]?(\d{4})\b/g, (_m, _a, _b, last) => `XXXX XXXX ${last}`)
        .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN removed]");
}
function maskDeep(value) {
    if (typeof value === "string")
        return maskIds(value);
    if (Array.isArray(value))
        return value.map(maskDeep);
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskDeep(v)]));
    }
    return value;
}
  return { maskIds, maskDeep };
})();

// integrations/windmill/notify/lib/event.ts
const { EVENT_SOURCES, SEVERITIES, STATUSES, TITLE_MAX, SUMMARY_MAX, BODY_MAX, scrubText, validateEvent, maskPhone, telUrl } = (() => {
const EVENT_SOURCES = ["talent", "leads", "seo-watch", "compliance", "platform", "alertmanager", "github", "website"];
const SEVERITIES = ["info", "notice", "warning", "critical"];
const STATUSES = ["firing", "resolved"];
const TITLE_MAX = 80;
const SUMMARY_MAX = 500;
const BODY_MAX = 20_000;
const PII_MAX = 200;
const PHONE_LIKE = /(?<![\w/=-])\+?\d(?:[\s.-]?\d){9,14}(?![\w/-])/g;
const EMAIL_LIKE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
function scrubText(value) {
    return maskIds(value).replace(EMAIL_LIKE, "[email removed]").replace(PHONE_LIKE, "[phone removed]");
}
const clip = (value, max) => (value.length <= max ? value : `${value.slice(0, max - 1)}…`);
const oneLine = (value) => value.replace(/\s+/g, " ").trim();
const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v) => (typeof v === "string" ? v : undefined);
function validateEvent(input, now = new Date()) {
    if (!isRecord(input))
        return { ok: false, errors: ["event must be an object"] };
    const errors = [];
    if (input.v !== 1)
        errors.push("v must be 1");
    const source = str(input.source);
    if (!source || !EVENT_SOURCES.includes(source))
        errors.push(`source must be one of ${EVENT_SOURCES.join(", ")}`);
    const type = str(input.type);
    if (!type || !/^[a-z][a-z0-9_]*(\.[a-zA-Z0-9_-]+)+$/.test(type) || type.length > 100)
        errors.push("type must be dotted, e.g. lead.received");
    const severity = str(input.severity);
    if (!severity || !SEVERITIES.includes(severity))
        errors.push(`severity must be one of ${SEVERITIES.join(", ")}`);
    const dedupeKey = str(input.dedupeKey);
    if (!dedupeKey || dedupeKey.length > 200)
        errors.push("dedupeKey is required (≤ 200 characters)");
    const status = input.status === undefined || input.status === null ? undefined : str(input.status);
    if (status !== undefined && !STATUSES.includes(status))
        errors.push("status must be firing or resolved");
    const occurred = str(input.occurredAt);
    const occurredAt = occurred && !Number.isNaN(Date.parse(occurred)) ? new Date(occurred) : null;
    if (occurred !== undefined && !occurredAt)
        errors.push("occurredAt must be an ISO 8601 time");
    const title = str(input.title);
    if (!title?.trim())
        errors.push("title is required");
    const summary = str(input.summary);
    if (summary === undefined)
        errors.push("summary is required");
    if (input.body !== undefined && input.body !== null && typeof input.body !== "string")
        errors.push("body must be text");
    let link;
    if (input.link !== undefined && input.link !== null) {
        const l = isRecord(input.link) ? input.link : {};
        const url = str(l.url);
        if (!url || !/^https?:\/\//.test(url) || url.length > 2000)
            errors.push("link.url must be an http(s) URL");
        else
            link = { label: clip(oneLine(scrubText(str(l.label) ?? "Open")), 40), url };
    }
    let pii;
    if (input.pii !== undefined && input.pii !== null) {
        if (!isRecord(input.pii))
            errors.push("pii must be an object");
        else {
            pii = {};
            for (const key of ["name", "phone", "email", "company"]) {
                const value = input.pii[key];
                if (value === undefined || value === null || value === "")
                    continue;
                if (typeof value !== "string")
                    errors.push(`pii.${key} must be text`);
                else if (key === "phone") {
                    const phone = value.replace(/[^\d+]/g, "");
                    if (!/^\+?\d{6,15}$/.test(phone))
                        errors.push("pii.phone must be a phone number");
                    else
                        pii.phone = phone;
                }
                else
                    pii[key] = clip(oneLine(maskIds(value)), PII_MAX);
            }
            if (Object.keys(pii).length === 0)
                pii = undefined;
        }
    }
    if (errors.length)
        return { ok: false, errors };
    return {
        ok: true,
        event: {
            v: 1,
            source: source,
            type: type,
            severity: severity,
            dedupeKey: dedupeKey,
            ...(status ? { status: status } : {}),
            occurredAt: (occurredAt ?? now).toISOString(),
            title: clip(oneLine(scrubText(title)), TITLE_MAX),
            summary: clip(scrubText(summary).trim(), SUMMARY_MAX),
            ...(typeof input.body === "string" && input.body.trim() ? { body: clip(maskIds(input.body), BODY_MAX) } : {}),
            ...(link ? { link } : {}),
            ...(pii ? { pii } : {}),
        },
    };
}
function maskPhone(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4)
        return "XXXX";
    const last = digits.slice(-4);
    if (digits.length === 12 && digits.startsWith("91"))
        return `+91 XXXXXX${last}`;
    return `${"X".repeat(Math.max(2, digits.length - 4))}${last}`;
}
function telUrl(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6)
        return null;
    if (digits.length === 10 && /^[6-9]/.test(digits))
        return `tel:+91${digits}`;
    if (digits.length === 12 && /^91[6-9]/.test(digits))
        return `tel:+${digits}`;
    return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}
  return { EVENT_SOURCES, SEVERITIES, STATUSES, TITLE_MAX, SUMMARY_MAX, BODY_MAX, scrubText, validateEvent, maskPhone, telUrl };
})();

// integrations/windmill/notify/lib/emit.ts
const { InvalidEventError, emit, tryEmit } = (() => {
class InvalidEventError extends Error {
    errors;
    constructor(errors) {
        super(`invalid notification event: ${errors.join("; ")}`);
        this.name = "InvalidEventError";
        this.errors = errors;
    }
}
async function emit(input, options = {}) {
    const now = options.now ?? new Date();
    const checked = validateEvent({ v: 1, ...input }, now);
    if (!checked.ok)
        throw new InvalidEventError(checked.errors);
    if (options.store)
        return options.store.insertEvent(checked.event, now);
    return withNotifyDb((sql) => pgNotifyStore(sql).insertEvent(checked.event, now));
}
async function tryEmit(input, options = {}) {
    try {
        await emit(input, options);
        return true;
    }
    catch (err) {
        console.error("notify: emit failed:", err instanceof InvalidEventError ? err.message : err instanceof Error ? err.name : "unknown error");
        return false;
    }
}
  return { InvalidEventError, emit, tryEmit };
})();

export async function main(lead_id) {
    const crm = await twentyFromConfig();
    return withDatabase("leads_pg_url", (query) => runLeadsSync({ query, crm, notify: tryEmit }, { leadId: lead_id || null }));
}


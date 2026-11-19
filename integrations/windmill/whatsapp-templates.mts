/**
 * The WhatsApp templates, as submitted to Meta through Fast2SMS (Utility):
 *   - the acknowledgement (talent/lib/whatsapp-ack.ts), the reference as the
 *     only variable. Wording approved by the owner on 20 Oct 2026 (English);
 *     the other languages follow it and are drafts pending native review.
 *   - the crew messages (talent/lib/crew-templates.ts): offer, confirmed,
 *     reminder, not needed, with quick-reply buttons on the offer and the
 *     reminder. Drafted 19 Nov 2026.
 *
 *   node integrations/windmill/whatsapp-templates.mts                       each template's status and Fast2SMS message id
 *   node integrations/windmill/whatsapp-templates.mts --create              submits the ones not there yet
 *   node integrations/windmill/whatsapp-templates.mts --create --only=crew  only the crew messages
 *
 * Once a template is approved, put its message id in WA_TEMPLATES
 * (whatsapp-ack.ts) or CREW_TEMPLATES (crew-templates.ts) and deploy.
 * Reads the Fast2SMS key from the cluster (growth/windmill-talent, as deploy.mts) and never prints it.
 */
import { execFileSync } from "node:child_process";
import { CREW_TEMPLATE_TEXT } from "./talent/lib/crew-templates.ts";

export const WABA_ID = "1402225688528309";
const API = "https://www.fast2sms.com/dev";

export interface Template {
  locale: string;
  name: string;
  language: string;
  text: string;
  /** Quick-reply buttons. */
  buttons?: readonly string[];
  /** One example per variable, for Meta's review. */
  example?: string[];
  group: "ack" | "crew";
}

export const ACK_TEMPLATES: Omit<Template, "group">[] = [
  {
    locale: "en-IN",
    name: "vspl_application_received",
    language: "en",
    text: "Vayasya Seva received your job application.\nReference: {{1}}\n\nIf the work fits, our team will contact you.\nReply here if you have a question. You can send a voice note too.\n\nThis number takes messages only, not calls.",
  },
  {
    locale: "hi-IN",
    name: "vspl_application_received",
    language: "hi",
    text: "Vayasya Seva को आपका नौकरी का आवेदन मिल गया है।\nरेफ़रेंस: {{1}}\n\nकाम आपके लायक हुआ, तो हमारी टीम आपसे संपर्क करेगी।\nकोई सवाल हो तो यहीं जवाब दें। आप वॉइस नोट भी भेज सकते हैं।\n\nइस नंबर पर सिर्फ़ मैसेज आते हैं, कॉल नहीं।",
  },
  {
    locale: "hi-Latn-IN",
    name: "vspl_application_received_hinglish",
    language: "hi",
    text: "Vayasya Seva ko aapka job application mil gaya hai.\nReference: {{1}}\n\nKaam aapke laayak hua, to hamari team aapse contact karegi.\nKoi sawaal ho to yahin reply karein. Aap voice note bhi bhej sakte hain.\n\nIs number par sirf messages aate hain, call nahi.",
  },
  {
    locale: "pa-IN",
    name: "vspl_application_received",
    language: "pa",
    text: "Vayasya Seva ਨੂੰ ਤੁਹਾਡੀ ਨੌਕਰੀ ਦੀ ਅਰਜ਼ੀ ਮਿਲ ਗਈ ਹੈ।\nਰੈਫ਼ਰੈਂਸ: {{1}}\n\nਕੰਮ ਤੁਹਾਡੇ ਲਾਇਕ ਹੋਇਆ ਤਾਂ ਸਾਡੀ ਟੀਮ ਤੁਹਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੇਗੀ।\nਕੋਈ ਸਵਾਲ ਹੋਵੇ ਤਾਂ ਇੱਥੇ ਹੀ ਜਵਾਬ ਦਿਓ। ਤੁਸੀਂ ਵੌਇਸ ਨੋਟ ਵੀ ਭੇਜ ਸਕਦੇ ਹੋ।\n\nਇਸ ਨੰਬਰ 'ਤੇ ਸਿਰਫ਼ ਮੈਸੇਜ ਆਉਂਦੇ ਹਨ, ਕਾਲ ਨਹੀਂ।",
  },
  {
    locale: "kn-IN",
    name: "vspl_application_received",
    language: "kn",
    text: "Vayasya Seva ಗೆ ನಿಮ್ಮ ಉದ್ಯೋಗ ಅರ್ಜಿ ತಲುಪಿದೆ.\nರೆಫರೆನ್ಸ್: {{1}}\n\nಕೆಲಸ ಸರಿಹೊಂದಿದರೆ, ನಮ್ಮ ತಂಡ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.\nಏನಾದರೂ ಪ್ರಶ್ನೆ ಇದ್ದರೆ ಇಲ್ಲೇ ಉತ್ತರಿಸಿ. ನೀವು ವಾಯ್ಸ್ ನೋಟ್ ಕೂಡ ಕಳುಹಿಸಬಹುದು.\n\nಈ ನಂಬರ್ ಸಂದೇಶಗಳನ್ನು ಮಾತ್ರ ಸ್ವೀಕರಿಸುತ್ತದೆ, ಕರೆಗಳನ್ನು ಅಲ್ಲ.",
  },
];

/** Every template this script knows: the acknowledgement's, then the crew messages'. */
export const TEMPLATES: Template[] = [
  ...ACK_TEMPLATES.map((t) => ({ ...t, example: ["VS-J-ABC234"], group: "ack" as const })),
  ...CREW_TEMPLATE_TEXT.map((t) => ({
    locale: t.locale,
    name: t.name,
    language: t.language,
    text: t.text,
    buttons: t.buttons,
    example: t.example,
    group: "crew" as const,
  })),
];

/** The Meta template body Fast2SMS takes: the text with its examples, and the quick-reply buttons. */
export function templateComponents(t: Template): Record<string, unknown>[] {
  const components: Record<string, unknown>[] = [
    { type: "BODY", text: t.text, ...(t.example?.length ? { example: { body_text: [t.example] } } : {}) },
  ];
  if (t.buttons?.length) components.push({ type: "BUTTONS", buttons: t.buttons.map((text) => ({ type: "QUICK_REPLY", text })) });
  return components;
}

interface Listed {
  message_id: number;
  template_name: string;
  language: string;
  status: string;
  category: string;
}

function apiKey(): string {
  const b64 = execFileSync("kubectl", ["-n", "growth", "get", "secret", "windmill-talent", "-o", "jsonpath={.data.FAST2SMS_API_KEY}"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (!b64) throw new Error("growth/windmill-talent has no FAST2SMS_API_KEY");
  return Buffer.from(b64, "base64").toString("utf8");
}

async function listed(key: string): Promise<Listed[]> {
  const res = await fetch(`${API}/dlt_manager/whatsapp?type=template`, { headers: { authorization: key } });
  const body = (await res.json()) as { data?: { templates?: Listed[] }[] };
  return (body.data ?? []).flatMap((n) => n.templates ?? []);
}

async function create(key: string, t: Template) {
  const res = await fetch(`${API}/whatsapp/v26.0/${WABA_ID}/message_templates`, {
    method: "POST",
    headers: { authorization: key, "content-type": "application/json" },
    body: JSON.stringify({
      name: t.name,
      language: t.language,
      category: "UTILITY",
      components: templateComponents(t),
    }),
  });
  const text = await res.text();
  console.log(`${t.locale} ${t.name}/${t.language}: HTTP ${res.status} ${text.slice(0, 300)}`);
}

if (import.meta.main) {
  const key = apiKey();
  const have = await listed(key);
  const find = (t: Template) => have.find((h) => h.template_name === t.name && h.language === t.language);
  const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  const chosen = TEMPLATES.filter((t) => !only || t.group === only);
  if (process.argv.includes("--create")) {
    for (const t of chosen) if (!find(t)) await create(key, t);
  } else {
    for (const t of chosen) {
      const h = find(t);
      console.log(`${t.locale.padEnd(11)} ${t.name}/${t.language}: ${h ? `${h.status} ${h.category}, message id ${h.message_id}` : "not submitted"}`);
    }
  }
}

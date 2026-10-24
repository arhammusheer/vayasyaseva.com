/**
 * The WhatsApp acknowledgement templates (talent/lib/whatsapp-ack.ts), as
 * submitted to Meta through Fast2SMS: Utility category, the reference as the
 * only variable. Wording approved by the owner on 20 Oct 2026 (English); the
 * other languages follow it and are drafts pending native review, like the site.
 *
 *   node integrations/windmill/whatsapp-templates.mts            each template's status and Fast2SMS message id
 *   node integrations/windmill/whatsapp-templates.mts --create   submits the ones not there yet
 *
 * Once a template is approved, put its message id in WA_TEMPLATES
 * (talent/lib/whatsapp-ack.ts) and deploy: that language then gets WhatsApp first.
 * Reads the Fast2SMS key from the cluster (growth/windmill-talent, as deploy.mts) and never prints it.
 */
import { execFileSync } from "node:child_process";

export const WABA_ID = "1402225688528309";
const API = "https://www.fast2sms.com/dev";

export const TEMPLATES: { locale: string; name: string; language: string; text: string }[] = [
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

async function create(key: string, t: (typeof TEMPLATES)[number]) {
  const res = await fetch(`${API}/whatsapp/v26.0/${WABA_ID}/message_templates`, {
    method: "POST",
    headers: { authorization: key, "content-type": "application/json" },
    body: JSON.stringify({
      name: t.name,
      language: t.language,
      category: "UTILITY",
      components: [{ type: "BODY", text: t.text, example: { body_text: [["VS-J-ABC234"]] } }],
    }),
  });
  const text = await res.text();
  console.log(`${t.locale} ${t.name}/${t.language}: HTTP ${res.status} ${text.slice(0, 300)}`);
}

if (import.meta.main) {
  const key = apiKey();
  const have = await listed(key);
  const find = (t: (typeof TEMPLATES)[number]) => have.find((h) => h.template_name === t.name && h.language === t.language);
  if (process.argv.includes("--create")) {
    for (const t of TEMPLATES) if (!find(t)) await create(key, t);
  } else {
    for (const t of TEMPLATES) {
      const h = find(t);
      console.log(`${t.locale.padEnd(11)} ${t.name}/${t.language}: ${h ? `${h.status} ${h.category}, message id ${h.message_id}` : "not submitted"}`);
    }
  }
}

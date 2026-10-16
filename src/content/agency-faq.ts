import type { FaqItem } from "./types";
import type { Locale } from "@/lib/i18n";

/**
 * The standard agency FAQ for buyer pages (docs/brand-rules.md, PLAN §5.1).
 * en-IN is word for word from brand-rules; keep the two identical. The Hindi
 * and Hinglish versions are drafts for native review. Each counts as two or
 * three agency terms toward the page's limit of three.
 */
export const AGENCY_FAQ: Record<Locale, FaqItem> = {
  "en-IN": {
    question: "Are you a manpower agency or a staffing company?",
    answer:
      "We’re a manpower contractor. An agency sends you candidates to hire. We supply the workers, keep them on our payroll, supervise them on site, replace absentees and handle wages, EPF and ESIC. You get a working crew and one invoice.",
    category: "commercial",
  },
  "hi-IN": {
    question: "क्या आप मैनपावर एजेंसी या स्टाफ़िंग कंपनी हैं?",
    answer:
      "हम मैनपावर ठेकेदार हैं। एजेंसी आपको भर्ती के लिए उम्मीदवार भेजती है। हम कामगार देते हैं, उन्हें अपने पेरोल पर रखते हैं, साइट पर उनकी देखरेख करते हैं, ग़ैरहाज़िर कामगार की जगह दूसरा भेजते हैं, और मज़दूरी, EPF और ESIC संभालते हैं। आपको काम करती टीम और एक इनवॉइस मिलता है।",
    category: "commercial",
  },
  "hi-Latn-IN": {
    question: "Kya aap manpower agency ya staffing company hain?",
    answer:
      "Hum manpower contractor hain. Agency aapko bharti ke liye candidates bhejti hai. Hum workers dete hain, unhe apne payroll par rakhte hain, site par unki dekhrekh karte hain, absent worker ki jagah doosra bhejte hain, aur wages, EPF aur ESIC sambhalte hain. Aapko kaam karti team aur ek invoice milta hai.",
    category: "commercial",
  },
};

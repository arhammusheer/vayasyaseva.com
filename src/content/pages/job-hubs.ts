import type { FaqItem } from "../types";
import type { CopyIn, Locale } from "@/lib/i18n";
import type { JobHub, JobRole } from "@/lib/talent-intake/rules";

/**
 * Hub pages under /jobs/<slug> for who is searching (freshers, 10th or 12th
 * pass): the form, then the role pages that take you, each with a one-line
 * note for this qualification. The notes are the page; there is no FAQ.
 * Listed in the sitemap and linked from /jobs and the jobs footer.
 *
 * Same claims discipline as job-roles.ts: no pay figures, no promised
 * call-back times, no guarantee of work, no employer names. hi-IN and
 * hi-Latn-IN are drafts pending native review.
 */
export interface JobHubCopy {
  slug: JobHub;
  /** Short name for breadcrumbs. */
  name: string;
  metaTitle: string;
  description: string;
  heading: string;
  lede: string;
  roles: { role: JobRole; note: string }[];
}

/** Heading of the role rows. */
export const jobHubLabels: Record<Locale, { rolesHeading: string }> = {
  "en-IN": { rolesHeading: "Where you can start." },
  "hi-IN": { rolesHeading: "आप कहाँ से शुरू कर सकते हैं।" },
  "hi-Latn-IN": { rolesHeading: "Aap kahan se shuru kar sakte hain." },
  "pa-IN": { rolesHeading: "ਤੁਸੀਂ ਕਿੱਥੋਂ ਸ਼ੁਰੂ ਕਰ ਸਕਦੇ ਹੋ।" },
};

/** The age question, asked once on the jobs side: each market hub's FAQ. */
export const AGE_FAQ: Record<Locale, FaqItem> = {
  "en-IN": {
    question: "Is there an age limit?",
    answer:
      "You must be 18 or older to apply. Some sites set their own upper limit for physical work.",
    category: "operations",
  },
  "hi-IN": {
    question: "क्या उम्र की कोई सीमा है?",
    answer:
      "अप्लाई करने के लिए आपकी उम्र 18 साल या ज़्यादा होनी चाहिए। मेहनत वाले काम के लिए कुछ साइटें अपनी ऊपरी सीमा रखती हैं।",
    category: "operations",
  },
  "hi-Latn-IN": {
    question: "Kya umar ki koi seema hai?",
    answer:
      "Apply karne ke liye aapki umar 18 saal ya zyada honi chahiye. Mehnat wale kaam ke liye kuch sites apni upar ki seema rakhti hain.",
    category: "operations",
  },
  "pa-IN": {
    question: "ਕੀ ਉਮਰ ਦੀ ਕੋਈ ਹੱਦ ਹੈ?",
    answer: "ਅਪਲਾਈ ਕਰਨ ਲਈ ਤੁਹਾਡੀ ਉਮਰ 18 ਸਾਲ ਜਾਂ ਵੱਧ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ। ਸਰੀਰਕ ਕੰਮ ਲਈ ਕੁਝ ਸਾਈਟਾਂ ਆਪਣੀ ਵੱਧ ਤੋਂ ਵੱਧ ਉਮਰ ਤੈਅ ਕਰਦੀਆਂ ਹਨ।",
    category: "operations",
  },
};

export const jobHubs: CopyIn<JobHubCopy[]> = {
  "en-IN": [
    {
      slug: "freshers",
      name: "Fresher jobs",
      metaTitle: "Jobs for Freshers: Factory, Packing, Warehouse",
      description: "Fresher jobs: helper, packing, warehouse and housekeeping work, no experience needed. In Bengaluru, Haridwar, Punjab and Uttarakhand. No fee.",
      heading: "Jobs for freshers.",
      lede: "No experience yet? Many factory and warehouse jobs are open to freshers.",
      roles: [
        { role: "factory-helper", note: "Line work and moving material. The most common first job in a factory." },
        { role: "packing", note: "Packing, labelling and checks, taught on the line." },
        { role: "warehouse", note: "Loading, picking and packing, for people fit for physical work." },
        { role: "housekeeping", note: "Factories, offices, canteens and campuses." },
        { role: "data-entry-operator", note: "For freshers who can use a computer and type." },
        { role: "iti-trades", note: "For ITI freshers: helper and trainee roles in your trade." },
      ],
    },
    {
      slug: "10th-pass",
      name: "10th pass jobs",
      metaTitle: "10th Pass Jobs: Helper, Packing, Warehouse",
      description: "10th pass jobs: factory helper, packing, warehouse and housekeeping work. In Bengaluru, Haridwar, Punjab and Uttarakhand. No fee. Apply online.",
      heading: "10th pass jobs.",
      lede: "Factory and warehouse work for people who have passed 10th.",
      roles: [
        { role: "factory-helper", note: "Work on the factory line and moving material." },
        { role: "packing", note: "Packing, labelling and checks at pharma and FMCG plants." },
        { role: "warehouse", note: "Loading, unloading, picking and dispatch." },
        { role: "housekeeping", note: "Factories, offices, canteens and campuses." },
        { role: "forklift-operator", note: "If you have forklift experience and a driving licence." },
        { role: "iti-trades", note: "If you did an ITI after 10th: welder, fitter, electrician." },
      ],
    },
    {
      slug: "12th-pass",
      name: "12th pass jobs",
      metaTitle: "12th Pass Jobs: Data Entry, Operator, Packing",
      description: "12th pass jobs: data entry, trainee machine operator, packing and warehouse work. In Bengaluru, Haridwar, Punjab and Uttarakhand. No fee. Full 8-hour shifts.",
      heading: "12th pass jobs.",
      lede: "Factory, warehouse and computer work for people who have passed 12th.",
      roles: [
        { role: "data-entry-operator", note: "Entries in ERP or SAP for stores, dispatch and production." },
        { role: "machine-operator", note: "Trainee operator roles on packing and production machines." },
        { role: "packing", note: "Packing, labelling and checks at pharma and FMCG plants." },
        { role: "factory-helper", note: "Work on the factory line and moving material." },
        { role: "warehouse", note: "Loading, picking, packing and dispatch." },
      ],
    },
  ],
  "hi-IN": [
    {
      slug: "freshers",
      name: "फ़्रेशर की नौकरी",
      metaTitle: "फ़्रेशर के लिए नौकरी: फ़ैक्टरी, पैकिंग, वेयरहाउस",
      description: "फ़्रेशर के लिए नौकरी: फ़ैक्टरी हेल्पर, पैकिंग, वेयरहाउस और हाउसकीपिंग का काम, बिना अनुभव के। बेंगलुरु, हरिद्वार, पंजाब और उत्तराखंड में। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "फ़्रेशर के लिए नौकरी।",
      lede: "अभी अनुभव नहीं है? फ़ैक्टरी और वेयरहाउस की कई नौकरियाँ फ़्रेशर के लिए हैं।",
      roles: [
        { role: "factory-helper", note: "लाइन का काम और माल उठाना-रखना। फ़ैक्टरी में सबसे आम पहली नौकरी।" },
        { role: "packing", note: "पैकिंग, लेबलिंग और चेकिंग, लाइन पर सिखाई जाती है।" },
        { role: "warehouse", note: "लोडिंग, पिकिंग और पैकिंग, मेहनत का काम कर सकने वालों के लिए।" },
        { role: "housekeeping", note: "फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस।" },
        { role: "data-entry-operator", note: "उन फ़्रेशर के लिए जो कंप्यूटर चला सकें और टाइप कर सकें।" },
        { role: "iti-trades", note: "ITI फ़्रेशर के लिए: अपने ट्रेड में हेल्पर और ट्रेनी का काम।" },
      ],
    },
    {
      slug: "10th-pass",
      name: "10वीं पास नौकरी",
      metaTitle: "10वीं पास नौकरी: हेल्पर, पैकिंग, वेयरहाउस",
      description: "10वीं पास के लिए नौकरी: फ़ैक्टरी हेल्पर, पैकिंग, वेयरहाउस और हाउसकीपिंग का काम। बेंगलुरु, हरिद्वार, पंजाब और उत्तराखंड में। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "10वीं पास नौकरी।",
      lede: "10वीं पास लोगों के लिए फ़ैक्टरी और वेयरहाउस का काम।",
      roles: [
        { role: "factory-helper", note: "शॉपफ़्लोर पर लाइन का काम और माल उठाना-रखना।" },
        { role: "packing", note: "फ़ार्मा और FMCG प्लांट में पैकिंग, लेबलिंग और चेकिंग।" },
        { role: "warehouse", note: "लोडिंग, अनलोडिंग, पिकिंग और डिस्पैच।" },
        { role: "housekeeping", note: "फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस।" },
        { role: "forklift-operator", note: "अगर फ़ोर्कलिफ़्ट का अनुभव और ड्राइविंग लाइसेंस है।" },
        { role: "iti-trades", note: "10वीं के बाद ITI किया है तो: वेल्डर, फ़िटर, इलेक्ट्रीशियन।" },
      ],
    },
    {
      slug: "12th-pass",
      name: "12वीं पास नौकरी",
      metaTitle: "12वीं पास नौकरी: डेटा एंट्री, ऑपरेटर, पैकिंग",
      description: "12वीं पास के लिए नौकरी: डेटा एंट्री, ट्रेनी मशीन ऑपरेटर, पैकिंग और वेयरहाउस का काम। बेंगलुरु, हरिद्वार, पंजाब और उत्तराखंड में। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "12वीं पास नौकरी।",
      lede: "12वीं पास लोगों के लिए फ़ैक्टरी, वेयरहाउस और कंप्यूटर का काम।",
      roles: [
        { role: "data-entry-operator", note: "स्टोर, डिस्पैच और प्रोडक्शन के लिए ERP या SAP में एंट्री।" },
        { role: "machine-operator", note: "पैकिंग और प्रोडक्शन मशीनों पर ट्रेनी ऑपरेटर का काम।" },
        { role: "packing", note: "फ़ार्मा और FMCG प्लांट में पैकिंग, लेबलिंग और चेकिंग।" },
        { role: "factory-helper", note: "शॉपफ़्लोर पर लाइन का काम और माल उठाना-रखना।" },
        { role: "warehouse", note: "लोडिंग, पिकिंग, पैकिंग और डिस्पैच।" },
      ],
    },
  ],
  "hi-Latn-IN": [
    {
      slug: "freshers",
      name: "Fresher job",
      metaTitle: "Fresher Job: Factory, Packing, Warehouse",
      description: "Fresher job Bengaluru, Haridwar, Punjab aur Uttarakhand mein. Koi fee nahi. Factory helper, packing, warehouse, housekeeping, bina experience.",
      heading: "Fresher ke liye naukri.",
      lede: "Abhi experience nahi hai? Factory aur warehouse ki kai naukriyan fresher ke liye hain.",
      roles: [
        { role: "factory-helper", note: "Line ka kaam aur maal uthana-rakhna. Factory mein sabse aam pehli naukri." },
        { role: "packing", note: "Packing, labelling aur checking, line par sikhayi jaati hai." },
        { role: "warehouse", note: "Loading, picking aur packing, mehnat ka kaam kar sakne walon ke liye." },
        { role: "housekeeping", note: "Factory, office, canteen aur campus." },
        { role: "data-entry-operator", note: "Un fresher ke liye jo computer chala sakein aur type kar sakein." },
        { role: "iti-trades", note: "ITI fresher ke liye: apne trade mein helper aur trainee ka kaam." },
      ],
    },
    {
      slug: "10th-pass",
      name: "10th pass job",
      metaTitle: "10th Pass Job: Helper, Packing, Warehouse",
      description: "10th pass job Bengaluru, Haridwar, Punjab aur Uttarakhand mein. Koi fee nahi. Factory helper, packing, warehouse aur housekeeping ka kaam. Apply karein.",
      heading: "10th pass naukri.",
      lede: "10th pass logon ke liye factory aur warehouse ka kaam.",
      roles: [
        { role: "factory-helper", note: "Shopfloor par line ka kaam aur maal uthana-rakhna." },
        { role: "packing", note: "Pharma aur FMCG plants mein packing, labelling aur checking." },
        { role: "warehouse", note: "Loading, unloading, picking aur dispatch." },
        { role: "housekeeping", note: "Factory, office, canteen aur campus." },
        { role: "forklift-operator", note: "Agar forklift ka experience aur driving licence hai." },
        { role: "iti-trades", note: "10th ke baad ITI kiya hai to: welder, fitter, electrician." },
      ],
    },
    {
      slug: "12th-pass",
      name: "12th pass job",
      metaTitle: "12th Pass Job: Data Entry, Operator, Packing",
      description: "12th pass job Bengaluru, Haridwar, Punjab aur Uttarakhand mein. Koi fee nahi. Poori 8 ghante ki shift. Data entry, trainee machine operator, packing, warehouse.",
      heading: "12th pass naukri.",
      lede: "12th pass logon ke liye factory, warehouse aur computer ka kaam.",
      roles: [
        { role: "data-entry-operator", note: "Store, dispatch aur production ke liye ERP ya SAP mein entry." },
        { role: "machine-operator", note: "Packing aur production machines par trainee operator ka kaam." },
        { role: "packing", note: "Pharma aur FMCG plants mein packing, labelling aur checking." },
        { role: "factory-helper", note: "Shopfloor par line ka kaam aur maal uthana-rakhna." },
        { role: "warehouse", note: "Loading, picking, packing aur dispatch." },
      ],
    },
  ],
};

export function getJobHub(slug: string, locale: Locale) {
  return jobHubs[locale]?.find((h) => h.slug === slug);
}

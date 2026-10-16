import type { Locale } from "@/lib/i18n";

/**
 * /jobs/fees-and-fraud (PLAN §8.4): the one home for no-fee and fraud
 * detail. Every other jobs page carries one no-fee line (the form's footer)
 * that links here. We charge no fee, how to report a fee demand, and the
 * two facts that tell our messages apart. Jobs layout, so no business
 * phone; reports go by email to the address the privacy notice already
 * gives job seekers. Sentences stay short for a class-10 reader. hi-IN and
 * hi-Latn-IN are drafts pending native review, like the other jobs pages.
 */
export interface FeesAndFraudCopy {
  title: string;
  description: string;
  breadcrumb: string;
  /** The share image's label only: the page itself has no eyebrow. */
  eyebrow: string;
  heading: string;
  lede: string;
  report: string;
  /** The one line under the report button. */
  note: string;
  checkHeading: string;
  checks: { title: string; text: string }[];
  /** Mailto subject and the lines the email starts with. */
  mail: { subject: string; body: string[] };
}

/**
 * Where fee-demand reports go. Deliberately its own constant: today it is
 * the same inbox as siteConfig.email and the privacy notice §10 (job seekers
 * already use it), but the owner may pick a dedicated report address
 * (PLAN §8.4). Change all three together until then.
 */
export const FRAUD_REPORT_EMAIL = "help@vayasyaseva.com";

export const feesAndFraudCopy: Record<Locale, FeesAndFraudCopy> = {
  "en-IN": {
    title: "No Fee to Apply: Job Fraud Warning",
    description:
      "There is no fee to apply for work with Vayasya Seva in SIDCUL Haridwar. See how our SMS looks, and how to report anyone who asks you for money in our name.",
    breadcrumb: "No fee",
    eyebrow: "JOBS · NO FEE",
    heading: "There is no fee to apply.",
    lede: "If anyone asks you for money in our name, don't pay. Tell us.",
    report: "Report a fee demand",
    note: "Note the number and what they asked for.",
    checkHeading: "How to know it is us.",
    checks: [
      {
        title: "Our SMS comes from VAYSPL",
        text: "It carries your reference number, which starts with VS-J-.",
      },
      {
        title: "We only take applications on vayasyaseva.com",
        text: "Don't send money or documents to anyone else.",
      },
    ],
    mail: {
      subject: "Fee demand in Vayasya Seva's name",
      body: ["Number that called or messaged me:", "Name they used:", "What they asked for:", "Date:", "My reference (if I applied): VS-J-"],
    },
  },
  "hi-IN": {
    title: "आवेदन की कोई फ़ीस नहीं: नौकरी के धोखे से बचें",
    description:
      "सिडकुल हरिद्वार में Vayasya Seva के काम के लिए आवेदन की कोई फ़ीस नहीं है। देखिए हमारा SMS कैसा दिखता है, और हमारे नाम पर पैसे माँगने वालों की शिकायत कैसे करें।",
    breadcrumb: "कोई फ़ीस नहीं",
    eyebrow: "नौकरी · कोई फ़ीस नहीं",
    heading: "आवेदन की कोई फ़ीस नहीं है।",
    lede: "अगर कोई हमारे नाम पर पैसे माँगे, तो मत दीजिए। हमें बताइए।",
    report: "पैसे माँगने की शिकायत करें",
    note: "किस नंबर से फ़ोन आया और क्या माँगा, लिख लीजिए।",
    checkHeading: "कैसे जानें कि यह हम हैं।",
    checks: [
      {
        title: "हमारा SMS VAYSPL से आता है",
        text: "इसमें आपका रेफ़रेंस नंबर होता है, जो VS-J- से शुरू होता है।",
      },
      {
        title: "आवेदन सिर्फ़ vayasyaseva.com पर लेते हैं",
        text: "किसी और को पैसे या कागज़ न भेजें।",
      },
    ],
    mail: {
      subject: "Fee demand in Vayasya Seva's name",
      body: ["किस नंबर से फ़ोन या मैसेज आया:", "उसने क्या नाम बताया:", "उसने क्या माँगा:", "तारीख़:", "मेरा रेफ़रेंस (अगर आवेदन किया है): VS-J-"],
    },
  },
  "hi-Latn-IN": {
    title: "Koi Fee Nahi: Job Fraud Se Bachein",
    description:
      "Vayasya Seva mein kaam ke liye apply karne ki koi fee nahi hai. Hamara SMS kaisa dikhta hai, aur hamare naam par paise maangne walon ki shikayat kaise karein.",
    breadcrumb: "Koi fee nahi",
    eyebrow: "JOBS · KOI FEE NAHI",
    heading: "Apply karne ki koi fee nahi hai.",
    lede: "Agar koi hamare naam par paise maange, to mat dijiye. Humein bataiye.",
    report: "Paise maangne ki shikayat karein",
    note: "Kis number se phone aaya aur kya maanga, likh lijiye.",
    checkHeading: "Kaise jaanein ki yeh hum hain.",
    checks: [
      {
        title: "Hamara SMS VAYSPL se aata hai",
        text: "Ismein aapka reference number hota hai, jo VS-J- se shuru hota hai.",
      },
      {
        title: "Application sirf vayasyaseva.com par lete hain",
        text: "Kisi aur ko paise ya documents na bhejein.",
      },
    ],
    mail: {
      subject: "Fee demand in Vayasya Seva's name",
      body: ["Kis number se phone ya message aaya:", "Usne kya naam bataya:", "Usne kya maanga:", "Tareekh:", "Mera reference (agar apply kiya hai): VS-J-"],
    },
  },
};

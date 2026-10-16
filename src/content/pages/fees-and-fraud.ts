import type { Locale } from "@/lib/i18n";

/**
 * /jobs/fees-and-fraud (PLAN §8.4): we charge no fee, how our SMS looks,
 * and how to report someone who asks for money in our name. Jobs layout, so
 * no business phone; reports go by email to the address the privacy notice
 * already gives job seekers. Sentences stay short for a class-10 reader.
 * hi-IN and hi-Latn-IN are drafts pending native review, like the other
 * jobs pages.
 */
export interface FeesAndFraudCopy {
  title: string;
  description: string;
  breadcrumb: string;
  eyebrow: string;
  heading: string;
  lede: string;
  report: string;
  apply: string;
  checkEyebrow: string;
  checkHeading: string;
  checks: { title: string; text: string }[];
  reportEyebrow: string;
  reportHeading: string;
  steps: { title: string; text: string }[];
  /** Mailto subject and the lines the email starts with. */
  mail: { subject: string; body: string[] };
  closer: string;
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
    breadcrumb: "Fees and fraud",
    eyebrow: "JOBS · NO FEE",
    heading: "There is no fee to apply.",
    lede: "If anyone asks you for money in our name, don't pay. Here is how to check it is us, and how to tell us.",
    report: "Report a fee demand",
    apply: "Apply on our website",
    checkEyebrow: "HOW TO CHECK",
    checkHeading: "How to know it is us.",
    checks: [
      {
        title: "We charge no fee",
        text: "Not to apply, and not to get work. Anyone asking for money is not from us.",
      },
      {
        title: "Our SMS comes from VAYSPL",
        text: "It may show as VM-VAYSPL or similar. It has your reference number. The reference starts with VS-J-.",
      },
      {
        title: "You apply on this website",
        text: "Our form is on vayasyaseva.com. Don't send money or documents to anyone else.",
      },
      {
        title: "We call the number you gave",
        text: "Our team calls the mobile number you applied with. We tell you the site and the shift before you join.",
      },
    ],
    reportEyebrow: "SOMEONE ASKED FOR MONEY?",
    reportHeading: "Don't pay. Tell us.",
    steps: [
      { title: "Don't pay anything", text: "Not for a form, a joining letter or a job offer." },
      { title: "Note the details", text: "The number that called you, the name they used and what they asked for. Take a screenshot if you can." },
      { title: "Email us", text: "Write \"Fee demand\" in the subject. Add your reference number if you applied." },
    ],
    mail: {
      subject: "Fee demand in Vayasya Seva's name",
      body: ["Number that called or messaged me:", "Name they used:", "What they asked for:", "Date:", "My reference (if I applied): VS-J-"],
    },
    closer: "Looking for work? Apply on our website.",
  },
  "hi-IN": {
    title: "आवेदन की कोई फ़ीस नहीं: नौकरी के धोखे से बचें",
    description:
      "सिडकुल हरिद्वार में Vayasya Seva के काम के लिए आवेदन की कोई फ़ीस नहीं है। देखिए हमारा SMS कैसा दिखता है, और हमारे नाम पर पैसे माँगने वालों की शिकायत कैसे करें।",
    breadcrumb: "फ़ीस और धोखा",
    eyebrow: "नौकरी · कोई फ़ीस नहीं",
    heading: "आवेदन की कोई फ़ीस नहीं है।",
    lede: "अगर कोई हमारे नाम पर पैसे माँगे, तो मत दीजिए। यहाँ देखिए कि हमें कैसे पहचानें और हमें कैसे बताएँ।",
    report: "पैसे माँगने की शिकायत करें",
    apply: "हमारी वेबसाइट पर आवेदन करें",
    checkEyebrow: "कैसे पहचानें",
    checkHeading: "कैसे जानें कि यह हम हैं।",
    checks: [
      {
        title: "हम कोई फ़ीस नहीं लेते",
        text: "न आवेदन के लिए, न काम दिलाने के लिए। पैसे माँगने वाला हमारी तरफ़ से नहीं है।",
      },
      {
        title: "हमारा SMS VAYSPL से आता है",
        text: "यह VM-VAYSPL जैसा दिख सकता है। इसमें आपका रेफ़रेंस नंबर होता है। रेफ़रेंस VS-J- से शुरू होता है।",
      },
      {
        title: "आवेदन इसी वेबसाइट पर होता है",
        text: "हमारा फ़ॉर्म vayasyaseva.com पर है। किसी और को पैसे या कागज़ न भेजें।",
      },
      {
        title: "हम आपके दिए नंबर पर फ़ोन करते हैं",
        text: "हमारी टीम उसी मोबाइल नंबर पर फ़ोन करती है जिससे आपने आवेदन किया। जॉइन करने से पहले हम साइट और शिफ्ट बताते हैं।",
      },
    ],
    reportEyebrow: "किसी ने पैसे माँगे?",
    reportHeading: "पैसे मत दीजिए। हमें बताइए।",
    steps: [
      { title: "कोई पैसा न दें", text: "न फ़ॉर्म के लिए, न जॉइनिंग लेटर के लिए, न नौकरी पक्की करने के लिए।" },
      { title: "जानकारी लिख लें", text: "किस नंबर से फ़ोन आया, उसने क्या नाम बताया और क्या माँगा। हो सके तो स्क्रीनशॉट ले लें।" },
      { title: "हमें ईमेल करें", text: "विषय में \"Fee demand\" लिखें। अगर आवेदन किया है, तो अपना रेफ़रेंस नंबर भी लिखें।" },
    ],
    mail: {
      subject: "Fee demand in Vayasya Seva's name",
      body: ["किस नंबर से फ़ोन या मैसेज आया:", "उसने क्या नाम बताया:", "उसने क्या माँगा:", "तारीख़:", "मेरा रेफ़रेंस (अगर आवेदन किया है): VS-J-"],
    },
    closer: "काम चाहिए? हमारी वेबसाइट पर आवेदन करें।",
  },
  "hi-Latn-IN": {
    title: "Koi Fee Nahi: Job Fraud Se Bachein",
    description:
      "Vayasya Seva mein kaam ke liye apply karne ki koi fee nahi hai. Hamara SMS kaisa dikhta hai, aur hamare naam par paise maangne walon ki shikayat kaise karein.",
    breadcrumb: "Fee aur fraud",
    eyebrow: "JOBS · KOI FEE NAHI",
    heading: "Apply karne ki koi fee nahi hai.",
    lede: "Agar koi hamare naam par paise maange, to mat dijiye. Yahan dekhiye ki humein kaise pehchanein aur humein kaise batayein.",
    report: "Paise maangne ki shikayat karein",
    apply: "Hamari website par apply karein",
    checkEyebrow: "Kaise pehchanein",
    checkHeading: "Kaise jaanein ki yeh hum hain.",
    checks: [
      {
        title: "Hum koi fee nahi lete",
        text: "Na apply karne ke liye, na kaam dilane ke liye. Paise maangne wala hamari taraf se nahi hai.",
      },
      {
        title: "Hamara SMS VAYSPL se aata hai",
        text: "Yeh VM-VAYSPL jaisa dikh sakta hai. Ismein aapka reference number hota hai. Reference VS-J- se shuru hota hai.",
      },
      {
        title: "Apply isi website par hota hai",
        text: "Hamara form vayasyaseva.com par hai. Kisi aur ko paise ya documents na bhejein.",
      },
      {
        title: "Hum aapke diye number par phone karte hain",
        text: "Hamari team usi mobile number par phone karti hai jisse aapne apply kiya. Join karne se pehle hum site aur shift batate hain.",
      },
    ],
    reportEyebrow: "Kisi ne paise maange?",
    reportHeading: "Paise mat dijiye. Humein bataiye.",
    steps: [
      { title: "Koi paisa na dein", text: "Na form ke liye, na joining letter ke liye, na naukri pakki karne ke liye." },
      { title: "Jaankari likh lein", text: "Kis number se phone aaya, usne kya naam bataya aur kya maanga. Ho sake to screenshot le lein." },
      { title: "Humein email karein", text: "Subject mein \"Fee demand\" likhein. Agar apply kiya hai, to apna reference number bhi likhein." },
    ],
    mail: {
      subject: "Fee demand in Vayasya Seva's name",
      body: ["Kis number se phone ya message aaya:", "Usne kya naam bataya:", "Usne kya maanga:", "Tareekh:", "Mera reference (agar apply kiya hai): VS-J-"],
    },
    closer: "Kaam chahiye? Hamari website par apply karein.",
  },
};

import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";
import type { ClusterId } from "@/content/registry/identifiers";
import { AGE_FAQ } from "./job-hubs";

/**
 * Jobs hubs for one cluster, under /jobs/<cluster> (PLAN §5.3). Only
 * Haridwar today; a cluster gets one only once it is in
 * src/content/registry/clusters.ts and its page is in pages.ts.
 *
 * Job-page voice (PLAN §6.2): sentences of 12 words or fewer, one idea each,
 * words a class-10 reader knows. Claims discipline as on the role pages: no
 * pay figures, no promised call-back times, no guarantee of work, no
 * employer names, no part-time. Places are named only where the repo already
 * says we have work (src/content/pages/jobs.ts, "Where is the work?").
 * hi-IN and hi-Latn-IN are drafts pending native review.
 */
export interface JobClusterCopy {
  slug: Extract<ClusterId, "haridwar">;
  /** Short name for breadcrumbs. */
  name: string;
  /** How other jobs pages link here. */
  linkLabel: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  heading: string;
  lede: string;
  where: {
    eyebrow: string;
    heading: string;
    intro: string;
    places: { name: string; text: string }[];
    outside: string;
  };
  roles: { eyebrow: string; heading: string; intro: string };
  hubs: { heading: string; text: string };
  after: { eyebrow: string; heading: string; steps: { title: string; text: string }[] };
  faqEyebrow: string;
  faqTitle: string;
  /** The button after the FAQ that scrolls back to the form. */
  applyAgain: string;
  /** This page's own questions; the shared fee and part-time ones follow. */
  faqs: FaqItem[];
}

export const jobClusters: Record<Locale, JobClusterCopy[]> = {
  "en-IN": [
    {
      slug: "haridwar",
      name: "Haridwar",
      linkLabel: "Jobs in Haridwar",
      metaTitle: "Haridwar Jobs: SIDCUL Factory and Warehouse Work",
      description:
        "Factory and warehouse jobs in SIDCUL Haridwar and Roorkee. No fee. Full 8-hour shifts. Apply online, a few short questions.",
      eyebrow: "JOBS · HARIDWAR",
      heading: "Factory and warehouse jobs in Haridwar.",
      lede: "Work in SIDCUL and across Haridwar. No fee to apply. Answer a few questions. We call you when there is suitable work.",
      where: {
        eyebrow: "WHERE THE WORK IS",
        heading: "SIDCUL first. Then around it.",
        intro: "Choose your area in the form. We look for a site you can reach. You know the site before you join.",
        places: [
          { name: "SIDCUL Haridwar", text: "The big factory area near Ranipur and BHEL. Most of our work is here." },
          { name: "Bahadrabad", text: "On the Haridwar–Roorkee road, close to SIDCUL. Some of our work is here." },
          { name: "Bhagwanpur", text: "An industrial area near Roorkee. Some of our work is here." },
          { name: "Roorkee", text: "A city in Haridwar district. Some of our work is around it." },
        ],
        outside: "Live outside Haridwar? You can still apply. Choose “Outside Haridwar” in the form.",
      },
      roles: {
        eyebrow: "WORK WE HIRE FOR",
        heading: "Pick the work you know.",
        intro: "Each page says what the work is, who it suits and what to send.",
      },
      hubs: {
        heading: "New to work?",
        text: "Freshers, 10th pass and 12th pass can apply too.",
      },
      after: {
        eyebrow: "AFTER YOU APPLY",
        heading: "What happens next.",
        steps: [
          { title: "You get an SMS.", text: "It has your reference number. It comes from VAYSPL." },
          { title: "Our team reads your form.", text: "If there is suitable work, we call you. We may not be able to call everyone." },
          { title: "We tell you the details.", text: "The site, the shift and the work. Then you decide." },
          { title: "You join. We pay you.", text: "You work at a client's factory or warehouse. We pay your wages, with EPF and ESIC where they apply." },
        ],
      },
      faqEyebrow: "QUESTIONS",
      faqTitle: "Before you apply.",
      applyAgain: "Apply now",
      faqs: [
        {
          question: "Is this a placement agency?",
          answer:
            "No. We are a labour contractor. You are our employee. You work at a client's factory or warehouse. We pay your wages, with EPF and ESIC where they apply. There is no fee.",
          category: "operations",
        },
        {
          question: "Do I need to live near SIDCUL?",
          answer:
            "No. Choose your area in the form. We try to find a site you can reach. On the call, tell us how you will travel.",
          category: "operations",
        },
        {
          question: "What documents do I need?",
          answer:
            "Your 10th or 12th marksheet. Your ITI certificate, if you have one. The ID the site asks for at joining. We tell you what to bring before you join. Don't send Aadhaar or bank papers in the form.",
          category: "operations",
        },
        AGE_FAQ["en-IN"],
      ],
    },
  ],
  "hi-IN": [
    {
      slug: "haridwar",
      name: "हरिद्वार",
      linkLabel: "हरिद्वार में नौकरी",
      metaTitle: "हरिद्वार में नौकरी: सिडकुल फ़ैक्टरी, वेयरहाउस का काम",
      description:
        "सिडकुल हरिद्वार और रुड़की में फ़ैक्टरी, वेयरहाउस की नौकरी। कोई फ़ीस नहीं। पूरी 8 घंटे की शिफ्ट। कुछ आसान सवाल, ऑनलाइन आवेदन।",
      eyebrow: "नौकरी · हरिद्वार",
      heading: "हरिद्वार में फ़ैक्टरी और वेयरहाउस की नौकरी।",
      lede: "सिडकुल और पूरे हरिद्वार में काम। आवेदन की कोई फ़ीस नहीं। कुछ सवालों के जवाब दीजिए। सही काम होने पर हम आपको कॉल करेंगे।",
      where: {
        eyebrow: "काम कहाँ है",
        heading: "पहले सिडकुल। फिर आसपास।",
        intro: "फ़ॉर्म में अपना इलाका चुनिए। हम ऐसी साइट देखते हैं जहाँ आप पहुँच सकें। जॉइन से पहले आपको साइट पता होती है।",
        places: [
          { name: "सिडकुल हरिद्वार", text: "रानीपुर और BHEL के पास का बड़ा फ़ैक्टरी इलाका। हमारा ज़्यादातर काम यहीं है।" },
          { name: "बहादराबाद", text: "हरिद्वार–रुड़की रोड पर, सिडकुल के पास। हमारा कुछ काम यहाँ है।" },
          { name: "भगवानपुर", text: "रुड़की के पास का औद्योगिक क्षेत्र। हमारा कुछ काम यहाँ है।" },
          { name: "रुड़की", text: "हरिद्वार ज़िले का शहर। इसके आसपास भी हमारा कुछ काम है।" },
        ],
        outside: "हरिद्वार से बाहर रहते हैं? फिर भी आवेदन कर सकते हैं। फ़ॉर्म में “हरिद्वार से बाहर” चुनिए।",
      },
      roles: {
        eyebrow: "हम किस काम के लिए रखते हैं",
        heading: "जो काम आता है, वो चुनिए।",
        intro: "हर पेज पर लिखा है: काम क्या है, किसके लिए है और क्या भेजें।",
      },
      hubs: {
        heading: "पहली नौकरी है?",
        text: "फ़्रेशर, 10वीं पास और 12वीं पास भी आवेदन कर सकते हैं।",
      },
      after: {
        eyebrow: "आवेदन के बाद",
        heading: "आगे क्या होगा।",
        steps: [
          { title: "आपको SMS मिलेगा।", text: "उसमें आपका रेफ़रेंस नंबर होगा। SMS VAYSPL से आता है।" },
          { title: "हमारी टीम आपका फ़ॉर्म पढ़ती है।", text: "सही काम होने पर हम कॉल करते हैं। हर किसी को कॉल करना मुमकिन नहीं होता।" },
          { title: "हम पूरी बात बताते हैं।", text: "साइट, शिफ्ट और काम। फिर फ़ैसला आपका।" },
          { title: "आप जॉइन करते हैं। वेतन हम देते हैं।", text: "आप किसी क्लाइंट की फ़ैक्टरी या वेयरहाउस में काम करते हैं। वेतन हम देते हैं, लागू होने पर EPF और ESIC के साथ।" },
        ],
      },
      faqEyebrow: "सवाल",
      faqTitle: "आवेदन से पहले।",
      applyAgain: "आवेदन करें",
      faqs: [
        {
          question: "क्या यह प्लेसमेंट एजेंसी है?",
          answer:
            "नहीं। हम लेबर ठेकेदार (labour contractor) हैं। आप हमारे कर्मचारी होते हैं। आप क्लाइंट की फ़ैक्टरी या वेयरहाउस में काम करते हैं। वेतन हम देते हैं, लागू होने पर EPF और ESIC के साथ। कोई फ़ीस नहीं है।",
          category: "operations",
        },
        {
          question: "क्या मुझे सिडकुल के पास रहना होगा?",
          answer:
            "नहीं। फ़ॉर्म में अपना इलाका चुनिए। हम ऐसी साइट ढूँढने की कोशिश करते हैं जहाँ आप पहुँच सकें। कॉल पर बताइए कि आप कैसे आएँगे-जाएँगे।",
          category: "operations",
        },
        {
          question: "कौन-से कागज़ चाहिए?",
          answer:
            "10वीं या 12वीं की मार्कशीट। ITI सर्टिफ़िकेट, अगर है। जॉइनिंग पर साइट जो ID माँगे। क्या लाना है, जॉइन से पहले हम बताते हैं। फ़ॉर्म में आधार या बैंक के कागज़ न भेजें।",
          category: "operations",
        },
        AGE_FAQ["hi-IN"],
      ],
    },
  ],
  "hi-Latn-IN": [
    {
      slug: "haridwar",
      name: "Haridwar",
      linkLabel: "Haridwar mein job",
      metaTitle: "Haridwar Job: SIDCUL Factory aur Warehouse ka Kaam",
      description:
        "SIDCUL Haridwar aur Roorkee mein factory, warehouse job. Koi fee nahi. Poori 8 ghante ki shift. Kuch aasaan sawaal, online apply.",
      eyebrow: "JOBS · HARIDWAR",
      heading: "Haridwar mein factory aur warehouse ki job.",
      lede: "SIDCUL aur poore Haridwar mein kaam. Apply karne ki koi fee nahi. Kuch sawaalon ke jawab dijiye. Sahi kaam hone par hum aapko call karenge.",
      where: {
        eyebrow: "KAAM KAHAN HAI",
        heading: "Pehle SIDCUL. Phir aas-paas.",
        intro: "Form mein apna area chuniye. Hum aisi site dekhte hain jahan aap pahunch sakein. Join se pehle aapko site pata hoti hai.",
        places: [
          { name: "SIDCUL Haridwar", text: "Ranipur aur BHEL ke paas ka bada factory area. Hamara zyadatar kaam yahin hai." },
          { name: "Bahadrabad", text: "Haridwar–Roorkee road par, SIDCUL ke paas. Hamara kuch kaam yahan hai." },
          { name: "Bhagwanpur", text: "Roorkee ke paas ka industrial area. Hamara kuch kaam yahan hai." },
          { name: "Roorkee", text: "Haridwar district ka shehar. Iske aas-paas bhi hamara kuch kaam hai." },
        ],
        outside: "Haridwar se bahar rehte hain? Phir bhi apply kar sakte hain. Form mein “Haridwar se bahar” chuniye.",
      },
      roles: {
        eyebrow: "HUM KIS KAAM KE LIYE RAKHTE HAIN",
        heading: "Jo kaam aata hai, woh chuniye.",
        intro: "Har page par likha hai: kaam kya hai, kiske liye hai aur kya bhejein.",
      },
      hubs: {
        heading: "Pehli job hai?",
        text: "Fresher, 10th pass aur 12th pass bhi apply kar sakte hain.",
      },
      after: {
        eyebrow: "APPLY KE BAAD",
        heading: "Aage kya hoga.",
        steps: [
          { title: "Aapko SMS milega.", text: "Usmein aapka reference number hoga. SMS VAYSPL se aata hai." },
          { title: "Hamari team aapka form padhti hai.", text: "Sahi kaam hone par hum call karte hain. Har kisi ko call karna mumkin nahi hota." },
          { title: "Hum poori baat batate hain.", text: "Site, shift aur kaam. Phir faisla aapka." },
          { title: "Aap join karte hain. Salary hum dete hain.", text: "Aap kisi client ki factory ya warehouse mein kaam karte hain. Salary hum dete hain, applicable EPF aur ESIC ke saath." },
        ],
      },
      faqEyebrow: "SAWAAL",
      faqTitle: "Apply karne se pehle.",
      applyAgain: "Apply karein",
      faqs: [
        {
          question: "Kya yeh placement agency hai?",
          answer:
            "Nahi. Hum labour contractor (labour thekedar) hain. Aap hamare employee hote hain. Aap client ki factory ya warehouse mein kaam karte hain. Salary hum dete hain, applicable EPF aur ESIC ke saath. Koi fee nahi hai.",
          category: "operations",
        },
        {
          question: "Kya mujhe SIDCUL ke paas rehna hoga?",
          answer:
            "Nahi. Form mein apna area chuniye. Hum aisi site dhoondhne ki koshish karte hain jahan aap pahunch sakein. Call par bataiye ki aap kaise aayenge-jaayenge.",
          category: "operations",
        },
        {
          question: "Kaun-se documents chahiye?",
          answer:
            "10th ya 12th ki marksheet. ITI certificate, agar hai. Joining par site jo ID maange. Kya lana hai, join se pehle hum batate hain. Form mein Aadhaar ya bank ke kaagaz na bhejein.",
          category: "operations",
        },
        AGE_FAQ["hi-Latn-IN"],
      ],
    },
  ],
};

export function getJobCluster(slug: string, locale: Locale) {
  return jobClusters[locale].find((c) => c.slug === slug);
}

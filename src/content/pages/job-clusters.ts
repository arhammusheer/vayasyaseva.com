import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";
import type { ClusterId } from "@/content/registry/identifiers";
import { AGE_FAQ } from "./job-hubs";

/**
 * Jobs hubs for one cluster, under /jobs/<cluster> (PLAN §5.3): Haridwar,
 * and Bengaluru as a worker list (no openings named, no estates, no
 * "vacancy" in the title, PLAN §5.3 "hubs where no roles are open now"). A
 * cluster gets one only once it is in src/content/registry/clusters.ts and
 * its page is in pages.ts.
 *
 * The page is a landing for "haridwar job vacancy" and the one form page
 * every Apply link opens: the lede names the areas, then the form, what
 * happens after you apply and three questions (role links live on /jobs). "Who pays me?" is the only payroll line on the jobs
 * side. Job-page voice (PLAN §6.2): short sentences, words a class-10 reader
 * knows. Claims discipline: no pay figures, no promised call, no guarantee
 * of work, no employer names, no part-time. hi-IN and hi-Latn-IN are drafts
 * pending native review.
 */
export interface JobClusterCopy {
  slug: Extract<ClusterId, "haridwar" | "bengaluru">;
  /** Short name for breadcrumbs. */
  name: string;
  /** How other jobs pages link here. */
  linkLabel: string;
  metaTitle: string;
  description: string;
  /** The share image's label only: the page itself has no eyebrow. */
  eyebrow: string;
  heading: string;
  /** Where the work is: the area names. */
  lede: string;
  /** What happens after you apply, as a three-step strip. */
  after: { label: string; steps: [string, string, string] };
  faqTitle: string;
  faqs: FaqItem[];
}

export const jobClusters: Record<Locale, JobClusterCopy[]> = {
  "en-IN": [
    {
      slug: "haridwar",
      name: "Haridwar",
      linkLabel: "Jobs in Haridwar",
      metaTitle: "Haridwar Job Vacancy: SIDCUL Factory and Warehouse Jobs",
      description:
        "Haridwar job vacancy in SIDCUL and Roorkee. No fee. Full 8-hour shifts. Factory, packing, warehouse and housekeeping work. Apply online, a few short questions.",
      eyebrow: "JOBS · HARIDWAR",
      heading: "Factory and warehouse jobs in Haridwar.",
      lede: "Work in SIDCUL, Bahadrabad, Bhagwanpur and Roorkee.",
      after: { label: "After you apply", steps: ["SMS from VAYSPL", "We call if the work fits", "You decide"] },
      faqTitle: "Questions.",
      faqs: [
        {
          question: "What documents do I need?",
          answer:
            "Your 10th or 12th marksheet. Your ITI certificate, if you have one. The ID the site asks for at joining. We tell you what to bring before you join. Don't send Aadhaar or bank papers in the form.",
          category: "operations",
        },
        AGE_FAQ["en-IN"],
        {
          question: "Who pays me?",
          answer: "We do, with EPF and ESIC where they apply.",
          category: "operations",
        },
      ],
    },
    {
      slug: "bengaluru",
      name: "Bengaluru",
      linkLabel: "Jobs in Bengaluru",
      metaTitle: "Factory Jobs in Bengaluru (Bangalore): Join Our List",
      description:
        "Factory, warehouse and housekeeping work in Bengaluru (Bangalore). Join our worker list: no fee, full 8-hour shifts. We call when a site needs your work.",
      eyebrow: "JOBS · BENGALURU",
      heading: "Factory and warehouse work in Bengaluru.",
      lede: "We're building a list of workers in Bengaluru. When a site there needs people, we call you.",
      after: { label: "After you apply", steps: ["SMS from VAYSPL", "We call when a site needs you", "You decide"] },
      faqTitle: "Questions.",
      faqs: [
        {
          question: "Are there openings now?",
          answer: "Not every week. You join our list, and we call when a site in Bengaluru needs your kind of work.",
          category: "operations",
        },
        {
          question: "What documents do I need?",
          answer:
            "Your 10th or 12th marksheet. Your ITI certificate, if you have one. The ID the site asks for at joining. We tell you what to bring before you join. Don't send Aadhaar or bank papers in the form.",
          category: "operations",
        },
        AGE_FAQ["en-IN"],
        {
          question: "Who pays me?",
          answer: "We do, with EPF and ESIC where they apply.",
          category: "operations",
        },
      ],
    },
  ],
  "hi-IN": [
    {
      slug: "haridwar",
      name: "हरिद्वार",
      linkLabel: "हरिद्वार में नौकरी",
      metaTitle: "हरिद्वार जॉब वैकेंसी: सिडकुल फ़ैक्टरी और वेयरहाउस का काम",
      description:
        "सिडकुल हरिद्वार और रुड़की में फ़ैक्टरी, वेयरहाउस की वैकेंसी। कोई फ़ीस नहीं। पूरी 8 घंटे की शिफ्ट। कुछ आसान सवाल, ऑनलाइन आवेदन।",
      eyebrow: "नौकरी · हरिद्वार",
      heading: "हरिद्वार में फ़ैक्टरी और वेयरहाउस की नौकरी।",
      lede: "सिडकुल, बहादराबाद, भगवानपुर और रुड़की में काम।",
      after: { label: "आवेदन के बाद", steps: ["VAYSPL से SMS", "काम लायक हुआ तो हम कॉल करते हैं", "फ़ैसला आपका"] },
      faqTitle: "सवाल।",
      faqs: [
        {
          question: "कौन-से कागज़ चाहिए?",
          answer:
            "10वीं या 12वीं की मार्कशीट। ITI सर्टिफ़िकेट, अगर है। जॉइनिंग पर साइट जो ID माँगे। क्या लाना है, जॉइन से पहले हम बताते हैं। फ़ॉर्म में आधार या बैंक के कागज़ न भेजें।",
          category: "operations",
        },
        AGE_FAQ["hi-IN"],
        {
          question: "वेतन कौन देता है?",
          answer: "हम देते हैं, लागू होने पर EPF और ESIC के साथ।",
          category: "operations",
        },
      ],
    },
    {
      slug: "bengaluru",
      name: "बेंगलुरु",
      linkLabel: "बेंगलुरु में नौकरी",
      metaTitle: "बेंगलुरु (बैंगलोर) में फ़ैक्टरी का काम: हमारी लिस्ट में जुड़ें",
      description:
        "बेंगलुरु (बैंगलोर) में फ़ैक्टरी, वेयरहाउस और हाउसकीपिंग का काम। हमारी वर्कर लिस्ट में जुड़ें: कोई फ़ीस नहीं, पूरी 8 घंटे की शिफ्ट। साइट पर ज़रूरत होने पर हम कॉल करते हैं।",
      eyebrow: "नौकरी · बेंगलुरु",
      heading: "बेंगलुरु में फ़ैक्टरी और वेयरहाउस का काम।",
      lede: "हम बेंगलुरु में वर्करों की लिस्ट बना रहे हैं। वहाँ किसी साइट को लोग चाहिए होंगे तो हम आपको कॉल करेंगे।",
      after: { label: "आवेदन के बाद", steps: ["VAYSPL से SMS", "साइट को ज़रूरत होने पर हम कॉल करते हैं", "फ़ैसला आपका"] },
      faqTitle: "सवाल।",
      faqs: [
        {
          question: "क्या अभी जगह खाली है?",
          answer: "हर हफ़्ते नहीं। आप हमारी लिस्ट में जुड़ते हैं, और बेंगलुरु की किसी साइट को आपके जैसे काम की ज़रूरत होने पर हम कॉल करते हैं।",
          category: "operations",
        },
        {
          question: "कौन-से कागज़ चाहिए?",
          answer:
            "10वीं या 12वीं की मार्कशीट। ITI सर्टिफ़िकेट, अगर है। जॉइनिंग पर साइट जो ID माँगे। क्या लाना है, जॉइन से पहले हम बताते हैं। फ़ॉर्म में आधार या बैंक के कागज़ न भेजें।",
          category: "operations",
        },
        AGE_FAQ["hi-IN"],
        {
          question: "वेतन कौन देता है?",
          answer: "हम देते हैं, लागू होने पर EPF और ESIC के साथ।",
          category: "operations",
        },
      ],
    },
  ],
  "hi-Latn-IN": [
    {
      slug: "haridwar",
      name: "Haridwar",
      linkLabel: "Haridwar mein job",
      metaTitle: "Haridwar Job Vacancy: SIDCUL Factory, Warehouse ka Kaam",
      description:
        "Haridwar job vacancy SIDCUL aur Roorkee mein. Koi fee nahi. Poori 8 ghante ki shift. Factory, packing, warehouse aur housekeeping. Online apply karein.",
      eyebrow: "Jobs · Haridwar",
      heading: "Haridwar mein factory aur warehouse ki job.",
      lede: "SIDCUL, Bahadrabad, Bhagwanpur aur Roorkee mein kaam.",
      after: { label: "Apply ke baad", steps: ["VAYSPL se SMS", "Kaam laayak hua to hum call karte hain", "Faisla aapka"] },
      faqTitle: "Sawaal.",
      faqs: [
        {
          question: "Kaun-se documents chahiye?",
          answer:
            "10th ya 12th ki marksheet. ITI certificate, agar hai. Joining par site jo ID maange. Kya lana hai, join se pehle hum batate hain. Form mein Aadhaar ya bank ke kaagaz na bhejein.",
          category: "operations",
        },
        AGE_FAQ["hi-Latn-IN"],
        {
          question: "Salary kaun deta hai?",
          answer: "Hum dete hain, laagu hone par EPF aur ESIC ke saath.",
          category: "operations",
        },
      ],
    },
    {
      slug: "bengaluru",
      name: "Bengaluru",
      linkLabel: "Bengaluru mein job",
      metaTitle: "Bengaluru (Bangalore) Factory Job: List mein Judein",
      description:
        "Bengaluru (Bangalore) mein factory, warehouse, housekeeping ka kaam. Worker list mein judein: koi fee nahi, 8 ghante ki shift. Zaroorat par hum call karenge.",
      eyebrow: "Jobs · Bengaluru",
      heading: "Bengaluru mein factory aur warehouse ka kaam.",
      lede: "Hum Bengaluru mein workers ki list bana rahe hain. Wahan kisi site ko log chahiye honge to hum aapko call karenge.",
      after: { label: "Apply ke baad", steps: ["VAYSPL se SMS", "Site ko zaroorat hone par hum call karte hain", "Faisla aapka"] },
      faqTitle: "Sawaal.",
      faqs: [
        {
          question: "Kya abhi jagah khaali hai?",
          answer: "Har hafte nahi. Aap hamari list mein judte hain, aur Bengaluru ki kisi site ko aapke jaise kaam ki zaroorat hone par hum call karte hain.",
          category: "operations",
        },
        {
          question: "Kaun-se documents chahiye?",
          answer:
            "10th ya 12th ki marksheet. ITI certificate, agar hai. Joining par site jo ID maange. Kya lana hai, join se pehle hum batate hain. Form mein Aadhaar ya bank ke kaagaz na bhejein.",
          category: "operations",
        },
        AGE_FAQ["hi-Latn-IN"],
        {
          question: "Salary kaun deta hai?",
          answer: "Hum dete hain, laagu hone par EPF aur ESIC ke saath.",
          category: "operations",
        },
      ],
    },
  ],
};

export function getJobCluster(slug: string, locale: Locale) {
  return jobClusters[locale].find((c) => c.slug === slug);
}

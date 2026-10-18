import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";
import type { ClusterId } from "@/content/registry/identifiers";
import { AGE_FAQ } from "./job-hubs";

/**
 * Jobs hubs for one market, under /jobs/<cluster> (PLAN §5.3): Haridwar and
 * Jalandhar–Kapurthala with open work; Bengaluru, Dehradun, Uttarakhand
 * (outside Haridwar and Dehradun) and Punjab (outside Jalandhar–Kapurthala) as worker lists (no openings named, no estates, no
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
  slug: Extract<ClusterId, "haridwar" | "bengaluru" | "jalandhar" | "uttarakhand" | "punjab" | "dehradun">;
  /** Short name for breadcrumbs. */
  name: string;
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
    {
      // Open work: the lede's "now" is the Kapurthala packing requirement of
      // October 2026. Change it to plain area names once that is filled.
      slug: "jalandhar",
      name: "Jalandhar–Kapurthala",
      metaTitle: "Jalandhar Job Vacancy: Kapurthala Packing, Factory Jobs",
      description:
        "Job vacancy in Jalandhar, Kapurthala and Phagwara. No fee. Full 8-hour shifts. Packing, factory and warehouse work. Apply online, a few short questions.",
      eyebrow: "JOBS · JALANDHAR–KAPURTHALA",
      heading: "Packing and factory jobs in Kapurthala and Jalandhar.",
      lede: "Packing work in Kapurthala now. Factory and warehouse work across Jalandhar and Phagwara.",
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
      slug: "uttarakhand",
      name: "Uttarakhand",
      // Outside Haridwar and Dehradun since 18 Oct 2026: titled for the rest
      // of the state's searches (Haldwani, Rudrapur, Kashipur job).
      metaTitle: "Rudrapur, Kashipur, Haldwani Jobs: Join Our Worker List",
      description:
        "Factory and warehouse work in Rudrapur, Kashipur, Sitarganj, Haldwani and across Uttarakhand. Join our worker list: no fee, full 8-hour shifts.",
      eyebrow: "JOBS · UTTARAKHAND",
      heading: "Factory and warehouse work in Rudrapur, Kashipur and across Uttarakhand.",
      lede: "We're building a list of workers across Uttarakhand. When a site near you needs people, we call you.",
      after: { label: "After you apply", steps: ["SMS from VAYSPL", "We call when a site needs you", "You decide"] },
      faqTitle: "Questions.",
      faqs: [
        { question: "Are there openings now?", answer: "Not every week. You join our list, and we call when a site near you needs your kind of work.", category: "operations" },
        { question: "What documents do I need?", answer: "Your 10th or 12th marksheet. Your ITI certificate, if you have one. The ID the site asks for at joining. We tell you what to bring before you join. Don't send Aadhaar or bank papers in the form.", category: "operations" },
        AGE_FAQ["en-IN"],
        { question: "Who pays me?", answer: "We do, with EPF and ESIC where they apply.", category: "operations" },
      ],
    },
    {
      // A worker list: no open requirement in Dehradun yet, so no "vacancy"
      // in the title (PLAN §5.3). "dehradun job" ~12,100 a month locally.
      slug: "dehradun",
      name: "Dehradun",
      metaTitle: "Jobs in Dehradun: Selaqui Factory and Warehouse Work",
      description:
        "Factory, packing and warehouse work in Dehradun, Selaqui and Rishikesh. Join our worker list: no fee, full 8-hour shifts. We call when a site needs you.",
      eyebrow: "JOBS · DEHRADUN",
      heading: "Factory and warehouse work in Dehradun.",
      lede: "We're building a list of workers in Dehradun, Selaqui, Vikasnagar and Rishikesh. When a site there needs people, we call you.",
      after: { label: "After you apply", steps: ["SMS from VAYSPL", "We call when a site needs you", "You decide"] },
      faqTitle: "Questions.",
      faqs: [
        { question: "Are there openings now?", answer: "Not every week. You join our list, and we call when a site in Dehradun or Selaqui needs your kind of work.", category: "operations" },
        { question: "What documents do I need?", answer: "Your 10th or 12th marksheet. Your ITI certificate, if you have one. The ID the site asks for at joining. We tell you what to bring before you join. Don't send Aadhaar or bank papers in the form.", category: "operations" },
        AGE_FAQ["en-IN"],
        { question: "Who pays me?", answer: "We do, with EPF and ESIC where they apply.", category: "operations" },
      ],
    },
    {
      // Worker list. The Kapurthala line in the first answer is the October
      // 2026 packing requirement: drop it once that is filled.
      slug: "punjab",
      name: "Punjab",
      metaTitle: "Factory Jobs in Punjab: Join Our Worker List",
      description:
        "Factory, packing and warehouse work across Punjab. Join our worker list: no fee, full 8-hour shifts. We call when a site near you needs your work.",
      eyebrow: "JOBS · PUNJAB",
      heading: "Factory and packing work across Punjab.",
      lede: "We're building a list of workers across Punjab. When a site near you needs people, we call you.",
      after: { label: "After you apply", steps: ["SMS from VAYSPL", "We call when a site needs you", "You decide"] },
      faqTitle: "Questions.",
      faqs: [
        { question: "Are there openings now?", answer: "In Kapurthala, yes: packing work. Elsewhere, not every week. You join our list, and we call when a site near you needs your kind of work.", category: "operations" },
        { question: "What documents do I need?", answer: "Your 10th or 12th marksheet. Your ITI certificate, if you have one. The ID the site asks for at joining. We tell you what to bring before you join. Don't send Aadhaar or bank papers in the form.", category: "operations" },
        AGE_FAQ["en-IN"],
        { question: "Who pays me?", answer: "We do, with EPF and ESIC where they apply.", category: "operations" },
      ],
    },
  ],
  "hi-IN": [
    {
      slug: "haridwar",
      name: "हरिद्वार",
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
    {
      slug: "jalandhar",
      name: "जालंधर–कपूरथला",
      metaTitle: "जालंधर जॉब वैकेंसी: कपूरथला में पैकिंग और फ़ैक्टरी का काम",
      description:
        "जालंधर, कपूरथला और फगवाड़ा में नौकरी की वैकेंसी। कोई फ़ीस नहीं। पूरी 8 घंटे की शिफ्ट। पैकिंग, फ़ैक्टरी और वेयरहाउस का काम। कुछ आसान सवाल, ऑनलाइन आवेदन।",
      eyebrow: "नौकरी · जालंधर–कपूरथला",
      heading: "कपूरथला और जालंधर में पैकिंग और फ़ैक्टरी की नौकरी।",
      lede: "कपूरथला में अभी पैकिंग का काम है। जालंधर और फगवाड़ा में फ़ैक्टरी और वेयरहाउस का काम।",
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
      slug: "uttarakhand",
      name: "उत्तराखंड",
      metaTitle: "रुद्रपुर, काशीपुर, हल्द्वानी में फ़ैक्टरी का काम: लिस्ट में जुड़ें",
      description:
        "रुद्रपुर, काशीपुर, सितारगंज, हल्द्वानी और पूरे उत्तराखंड में फ़ैक्टरी और वेयरहाउस का काम। हमारी वर्कर लिस्ट में जुड़ें: कोई फ़ीस नहीं, पूरी 8 घंटे की शिफ्ट।",
      eyebrow: "नौकरी · उत्तराखंड",
      heading: "रुद्रपुर, काशीपुर और पूरे उत्तराखंड में फ़ैक्टरी और वेयरहाउस का काम।",
      lede: "हम पूरे उत्तराखंड में वर्करों की लिस्ट बना रहे हैं। आपके पास किसी साइट को लोग चाहिए होंगे तो हम आपको कॉल करेंगे।",
      after: { label: "आवेदन के बाद", steps: ["VAYSPL से SMS", "साइट को ज़रूरत होने पर हम कॉल करते हैं", "फ़ैसला आपका"] },
      faqTitle: "सवाल।",
      faqs: [
        { question: "क्या अभी जगह खाली है?", answer: "हर हफ़्ते नहीं। आप हमारी लिस्ट में जुड़ते हैं, और आपके पास की किसी साइट को आपके जैसे काम की ज़रूरत होने पर हम कॉल करते हैं।", category: "operations" },
        { question: "कौन-से कागज़ चाहिए?", answer: "10वीं या 12वीं की मार्कशीट। ITI सर्टिफ़िकेट, अगर है। जॉइनिंग पर साइट जो ID माँगे। क्या लाना है, जॉइन से पहले हम बताते हैं। फ़ॉर्म में आधार या बैंक के कागज़ न भेजें।", category: "operations" },
        AGE_FAQ["hi-IN"],
        { question: "वेतन कौन देता है?", answer: "हम देते हैं, लागू होने पर EPF और ESIC के साथ।", category: "operations" },
      ],
    },
    {
      slug: "dehradun",
      name: "देहरादून",
      metaTitle: "देहरादून में नौकरी: सेलाकुई में फ़ैक्टरी और वेयरहाउस का काम",
      description:
        "देहरादून, सेलाकुई और ऋषिकेश में फ़ैक्टरी, पैकिंग और वेयरहाउस का काम। हमारी वर्कर लिस्ट में जुड़ें: कोई फ़ीस नहीं, पूरी 8 घंटे की शिफ्ट। ज़रूरत होने पर हम कॉल करते हैं।",
      eyebrow: "नौकरी · देहरादून",
      heading: "देहरादून में फ़ैक्टरी और वेयरहाउस का काम।",
      lede: "हम देहरादून, सेलाकुई, विकासनगर और ऋषिकेश में वर्करों की लिस्ट बना रहे हैं। वहाँ किसी साइट को लोग चाहिए होंगे तो हम आपको कॉल करेंगे।",
      after: { label: "आवेदन के बाद", steps: ["VAYSPL से SMS", "साइट को ज़रूरत होने पर हम कॉल करते हैं", "फ़ैसला आपका"] },
      faqTitle: "सवाल।",
      faqs: [
        { question: "क्या अभी जगह खाली है?", answer: "हर हफ़्ते नहीं। आप हमारी लिस्ट में जुड़ते हैं, और देहरादून या सेलाकुई की किसी साइट को आपके जैसे काम की ज़रूरत होने पर हम कॉल करते हैं।", category: "operations" },
        { question: "कौन-से कागज़ चाहिए?", answer: "10वीं या 12वीं की मार्कशीट। ITI सर्टिफ़िकेट, अगर है। जॉइनिंग पर साइट जो ID माँगे। क्या लाना है, जॉइन से पहले हम बताते हैं। फ़ॉर्म में आधार या बैंक के कागज़ न भेजें।", category: "operations" },
        AGE_FAQ["hi-IN"],
        { question: "वेतन कौन देता है?", answer: "हम देते हैं, लागू होने पर EPF और ESIC के साथ।", category: "operations" },
      ],
    },
    {
      slug: "punjab",
      name: "पंजाब",
      metaTitle: "पंजाब में फ़ैक्टरी का काम: हमारी वर्कर लिस्ट में जुड़ें",
      description:
        "पूरे पंजाब में फ़ैक्टरी, पैकिंग और वेयरहाउस का काम। हमारी वर्कर लिस्ट में जुड़ें: कोई फ़ीस नहीं, पूरी 8 घंटे की शिफ्ट। साइट पर ज़रूरत होने पर हम कॉल करते हैं।",
      eyebrow: "नौकरी · पंजाब",
      heading: "पूरे पंजाब में फ़ैक्टरी और पैकिंग का काम।",
      lede: "हम पूरे पंजाब में वर्करों की लिस्ट बना रहे हैं। आपके पास किसी साइट को लोग चाहिए होंगे तो हम आपको कॉल करेंगे।",
      after: { label: "आवेदन के बाद", steps: ["VAYSPL से SMS", "साइट को ज़रूरत होने पर हम कॉल करते हैं", "फ़ैसला आपका"] },
      faqTitle: "सवाल।",
      faqs: [
        { question: "क्या अभी जगह खाली है?", answer: "कपूरथला में हाँ: पैकिंग का काम। बाकी जगह हर हफ़्ते नहीं। आप हमारी लिस्ट में जुड़ते हैं, और आपके पास की किसी साइट को आपके जैसे काम की ज़रूरत होने पर हम कॉल करते हैं।", category: "operations" },
        { question: "कौन-से कागज़ चाहिए?", answer: "10वीं या 12वीं की मार्कशीट। ITI सर्टिफ़िकेट, अगर है। जॉइनिंग पर साइट जो ID माँगे। क्या लाना है, जॉइन से पहले हम बताते हैं। फ़ॉर्म में आधार या बैंक के कागज़ न भेजें।", category: "operations" },
        AGE_FAQ["hi-IN"],
        { question: "वेतन कौन देता है?", answer: "हम देते हैं, लागू होने पर EPF और ESIC के साथ।", category: "operations" },
      ],
    },
  ],
  "hi-Latn-IN": [
    {
      slug: "haridwar",
      name: "Haridwar",
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
    {
      slug: "jalandhar",
      name: "Jalandhar–Kapurthala",
      metaTitle: "Jalandhar Job Vacancy: Kapurthala Packing ka Kaam",
      description:
        "Jalandhar, Kapurthala aur Phagwara mein job vacancy. Koi fee nahi. Poori 8 ghante ki shift. Packing, factory aur warehouse ka kaam. Online apply karein.",
      eyebrow: "Jobs · Jalandhar–Kapurthala",
      heading: "Kapurthala aur Jalandhar mein packing aur factory ki job.",
      lede: "Kapurthala mein abhi packing ka kaam hai. Jalandhar aur Phagwara mein factory aur warehouse ka kaam.",
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
      slug: "uttarakhand",
      name: "Uttarakhand",
      metaTitle: "Rudrapur, Kashipur, Haldwani Job: List mein Judein",
      description:
        "Rudrapur, Kashipur, Sitarganj, Haldwani aur poore Uttarakhand mein factory aur warehouse ka kaam. Worker list mein judein: koi fee nahi, 8 ghante ki shift.",
      eyebrow: "Jobs · Uttarakhand",
      heading: "Rudrapur, Kashipur aur poore Uttarakhand mein factory aur warehouse ka kaam.",
      lede: "Hum poore Uttarakhand mein workers ki list bana rahe hain. Aapke paas kisi site ko log chahiye honge to hum aapko call karenge.",
      after: { label: "Apply ke baad", steps: ["VAYSPL se SMS", "Site ko zaroorat hone par hum call karte hain", "Faisla aapka"] },
      faqTitle: "Sawaal.",
      faqs: [
        { question: "Kya abhi jagah khaali hai?", answer: "Har hafte nahi. Aap hamari list mein judte hain, aur aapke paas ki kisi site ko aapke jaise kaam ki zaroorat hone par hum call karte hain.", category: "operations" },
        { question: "Kaun-se documents chahiye?", answer: "10th ya 12th ki marksheet. ITI certificate, agar hai. Joining par site jo ID maange. Kya lana hai, join se pehle hum batate hain. Form mein Aadhaar ya bank ke kaagaz na bhejein.", category: "operations" },
        AGE_FAQ["hi-Latn-IN"],
        { question: "Salary kaun deta hai?", answer: "Hum dete hain, laagu hone par EPF aur ESIC ke saath.", category: "operations" },
      ],
    },
    {
      slug: "dehradun",
      name: "Dehradun",
      metaTitle: "Dehradun Job: Selaqui Factory aur Warehouse ka Kaam",
      description:
        "Dehradun, Selaqui, Rishikesh mein factory, packing aur warehouse ka kaam. Worker list mein judein: koi fee nahi, 8 ghante ki shift. Zaroorat par call karenge.",
      eyebrow: "Jobs · Dehradun",
      heading: "Dehradun mein factory aur warehouse ka kaam.",
      lede: "Hum Dehradun, Selaqui, Vikasnagar aur Rishikesh mein workers ki list bana rahe hain. Wahan kisi site ko log chahiye honge to hum aapko call karenge.",
      after: { label: "Apply ke baad", steps: ["VAYSPL se SMS", "Site ko zaroorat hone par hum call karte hain", "Faisla aapka"] },
      faqTitle: "Sawaal.",
      faqs: [
        { question: "Kya abhi jagah khaali hai?", answer: "Har hafte nahi. Aap hamari list mein judte hain, aur Dehradun ya Selaqui ki kisi site ko aapke jaise kaam ki zaroorat hone par hum call karte hain.", category: "operations" },
        { question: "Kaun-se documents chahiye?", answer: "10th ya 12th ki marksheet. ITI certificate, agar hai. Joining par site jo ID maange. Kya lana hai, join se pehle hum batate hain. Form mein Aadhaar ya bank ke kaagaz na bhejein.", category: "operations" },
        AGE_FAQ["hi-Latn-IN"],
        { question: "Salary kaun deta hai?", answer: "Hum dete hain, laagu hone par EPF aur ESIC ke saath.", category: "operations" },
      ],
    },
    {
      slug: "punjab",
      name: "Punjab",
      metaTitle: "Punjab Factory Job: Worker List mein Judein",
      description:
        "Poore Punjab mein factory, packing aur warehouse ka kaam. Worker list mein judein: koi fee nahi, 8 ghante ki shift. Zaroorat par hum call karenge.",
      eyebrow: "Jobs · Punjab",
      heading: "Poore Punjab mein factory aur packing ka kaam.",
      lede: "Hum poore Punjab mein workers ki list bana rahe hain. Aapke paas kisi site ko log chahiye honge to hum aapko call karenge.",
      after: { label: "Apply ke baad", steps: ["VAYSPL se SMS", "Site ko zaroorat hone par hum call karte hain", "Faisla aapka"] },
      faqTitle: "Sawaal.",
      faqs: [
        { question: "Kya abhi jagah khaali hai?", answer: "Kapurthala mein haan: packing ka kaam. Baaki jagah har hafte nahi. Aap hamari list mein judte hain, aur aapke paas ki kisi site ko aapke jaise kaam ki zaroorat hone par hum call karte hain.", category: "operations" },
        { question: "Kaun-se documents chahiye?", answer: "10th ya 12th ki marksheet. ITI certificate, agar hai. Joining par site jo ID maange. Kya lana hai, join se pehle hum batate hain. Form mein Aadhaar ya bank ke kaagaz na bhejein.", category: "operations" },
        AGE_FAQ["hi-Latn-IN"],
        { question: "Salary kaun deta hai?", answer: "Hum dete hain, laagu hone par EPF aur ESIC ke saath.", category: "operations" },
      ],
    },
  ],
  // Punjabi: the Jalandhar region's hub only (draft pending native review).
  "pa-IN": [
    {
      slug: "jalandhar",
      name: "ਜਲੰਧਰ–ਕਪੂਰਥਲਾ",
      metaTitle: "ਜਲੰਧਰ ਜੌਬ ਵੈਕੈਂਸੀ: ਕਪੂਰਥਲਾ ਵਿੱਚ ਪੈਕਿੰਗ, ਫ਼ੈਕਟਰੀ ਦਾ ਕੰਮ",
      description:
        "ਜਲੰਧਰ, ਕਪੂਰਥਲਾ ਅਤੇ ਫਗਵਾੜਾ ਵਿੱਚ ਨੌਕਰੀ ਦੀ ਵੈਕੈਂਸੀ। ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ। ਪੂਰੀ 8 ਘੰਟੇ ਦੀ ਸ਼ਿਫ਼ਟ। ਪੈਕਿੰਗ, ਫ਼ੈਕਟਰੀ ਅਤੇ ਵੇਅਰਹਾਊਸ ਦਾ ਕੰਮ। ਕੁਝ ਸੌਖੇ ਸਵਾਲ, ਆਨਲਾਈਨ ਅਪਲਾਈ।",
      eyebrow: "ਨੌਕਰੀ · ਜਲੰਧਰ–ਕਪੂਰਥਲਾ",
      heading: "ਕਪੂਰਥਲਾ ਅਤੇ ਜਲੰਧਰ ਵਿੱਚ ਪੈਕਿੰਗ ਅਤੇ ਫ਼ੈਕਟਰੀ ਦੀ ਨੌਕਰੀ।",
      lede: "ਕਪੂਰਥਲਾ ਵਿੱਚ ਹੁਣ ਪੈਕਿੰਗ ਦਾ ਕੰਮ ਹੈ। ਜਲੰਧਰ ਅਤੇ ਫਗਵਾੜਾ ਵਿੱਚ ਫ਼ੈਕਟਰੀ ਅਤੇ ਵੇਅਰਹਾਊਸ ਦਾ ਕੰਮ।",
      after: { label: "ਅਪਲਾਈ ਕਰਨ ਤੋਂ ਬਾਅਦ", steps: ["VAYSPL ਤੋਂ SMS", "ਕੰਮ ਲਾਇਕ ਹੋਇਆ ਤਾਂ ਅਸੀਂ ਕਾਲ ਕਰਦੇ ਹਾਂ", "ਫ਼ੈਸਲਾ ਤੁਹਾਡਾ"] },
      faqTitle: "ਸਵਾਲ।",
      faqs: [
        {
          question: "ਕਿਹੜੇ ਕਾਗਜ਼ ਚਾਹੀਦੇ ਹਨ?",
          answer:
            "10ਵੀਂ ਜਾਂ 12ਵੀਂ ਦੀ ਮਾਰਕਸ਼ੀਟ। ITI ਸਰਟੀਫ਼ਿਕੇਟ, ਜੇ ਹੈ। ਜੁਆਇਨਿੰਗ 'ਤੇ ਸਾਈਟ ਜੋ ID ਮੰਗੇ। ਕੀ ਲਿਆਉਣਾ ਹੈ, ਜੁਆਇਨ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਅਸੀਂ ਦੱਸਦੇ ਹਾਂ। ਫ਼ਾਰਮ ਵਿੱਚ ਆਧਾਰ ਜਾਂ ਬੈਂਕ ਦੇ ਕਾਗਜ਼ ਨਾ ਭੇਜੋ।",
          category: "operations",
        },
        AGE_FAQ["pa-IN"],
        {
          question: "ਤਨਖ਼ਾਹ ਕੌਣ ਦਿੰਦਾ ਹੈ?",
          answer: "ਅਸੀਂ ਦਿੰਦੇ ਹਾਂ, ਲਾਗੂ ਹੋਣ 'ਤੇ EPF ਅਤੇ ESIC ਦੇ ਨਾਲ।",
          category: "operations",
        },
      ],
    },
    {
      slug: "punjab",
      name: "ਪੰਜਾਬ",
      metaTitle: "ਪੰਜਾਬ ਵਿੱਚ ਫ਼ੈਕਟਰੀ ਦਾ ਕੰਮ: ਸਾਡੀ ਵਰਕਰ ਲਿਸਟ ਵਿੱਚ ਜੁੜੋ",
      description:
        "ਪੂਰੇ ਪੰਜਾਬ ਵਿੱਚ ਫ਼ੈਕਟਰੀ, ਪੈਕਿੰਗ ਅਤੇ ਵੇਅਰਹਾਊਸ ਦਾ ਕੰਮ। ਸਾਡੀ ਵਰਕਰ ਲਿਸਟ ਵਿੱਚ ਜੁੜੋ: ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ, ਪੂਰੀ 8 ਘੰਟੇ ਦੀ ਸ਼ਿਫ਼ਟ। ਸਾਈਟ ਨੂੰ ਲੋੜ ਹੋਣ 'ਤੇ ਅਸੀਂ ਕਾਲ ਕਰਦੇ ਹਾਂ।",
      eyebrow: "ਨੌਕਰੀ · ਪੰਜਾਬ",
      heading: "ਪੂਰੇ ਪੰਜਾਬ ਵਿੱਚ ਫ਼ੈਕਟਰੀ ਅਤੇ ਪੈਕਿੰਗ ਦਾ ਕੰਮ।",
      lede: "ਅਸੀਂ ਪੂਰੇ ਪੰਜਾਬ ਵਿੱਚ ਵਰਕਰਾਂ ਦੀ ਲਿਸਟ ਬਣਾ ਰਹੇ ਹਾਂ। ਤੁਹਾਡੇ ਨੇੜੇ ਕਿਸੇ ਸਾਈਟ ਨੂੰ ਲੋਕ ਚਾਹੀਦੇ ਹੋਣਗੇ ਤਾਂ ਅਸੀਂ ਤੁਹਾਨੂੰ ਕਾਲ ਕਰਾਂਗੇ।",
      after: { label: "ਅਪਲਾਈ ਕਰਨ ਤੋਂ ਬਾਅਦ", steps: ["VAYSPL ਤੋਂ SMS", "ਸਾਈਟ ਨੂੰ ਲੋੜ ਹੋਣ 'ਤੇ ਅਸੀਂ ਕਾਲ ਕਰਦੇ ਹਾਂ", "ਫ਼ੈਸਲਾ ਤੁਹਾਡਾ"] },
      faqTitle: "ਸਵਾਲ।",
      faqs: [
        { question: "ਕੀ ਹੁਣ ਜਗ੍ਹਾ ਖ਼ਾਲੀ ਹੈ?", answer: "ਕਪੂਰਥਲਾ ਵਿੱਚ ਹਾਂ: ਪੈਕਿੰਗ ਦਾ ਕੰਮ। ਬਾਕੀ ਥਾਵਾਂ 'ਤੇ ਹਰ ਹਫ਼ਤੇ ਨਹੀਂ। ਤੁਸੀਂ ਸਾਡੀ ਲਿਸਟ ਵਿੱਚ ਜੁੜਦੇ ਹੋ, ਅਤੇ ਤੁਹਾਡੇ ਨੇੜੇ ਦੀ ਕਿਸੇ ਸਾਈਟ ਨੂੰ ਤੁਹਾਡੇ ਵਰਗੇ ਕੰਮ ਦੀ ਲੋੜ ਹੋਣ 'ਤੇ ਅਸੀਂ ਕਾਲ ਕਰਦੇ ਹਾਂ।", category: "operations" },
        { question: "ਕਿਹੜੇ ਕਾਗਜ਼ ਚਾਹੀਦੇ ਹਨ?", answer: "10ਵੀਂ ਜਾਂ 12ਵੀਂ ਦੀ ਮਾਰਕਸ਼ੀਟ। ITI ਸਰਟੀਫ਼ਿਕੇਟ, ਜੇ ਹੈ। ਜੁਆਇਨਿੰਗ 'ਤੇ ਸਾਈਟ ਜੋ ID ਮੰਗੇ। ਕੀ ਲਿਆਉਣਾ ਹੈ, ਜੁਆਇਨ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਅਸੀਂ ਦੱਸਦੇ ਹਾਂ। ਫ਼ਾਰਮ ਵਿੱਚ ਆਧਾਰ ਜਾਂ ਬੈਂਕ ਦੇ ਕਾਗਜ਼ ਨਾ ਭੇਜੋ।", category: "operations" },
        AGE_FAQ["pa-IN"],
        { question: "ਤਨਖ਼ਾਹ ਕੌਣ ਦਿੰਦਾ ਹੈ?", answer: "ਅਸੀਂ ਦਿੰਦੇ ਹਾਂ, ਲਾਗੂ ਹੋਣ 'ਤੇ EPF ਅਤੇ ESIC ਦੇ ਨਾਲ।", category: "operations" },
      ],
    },
  ],
  // Kannada: the Bengaluru worker list only (draft pending native review).
  "kn-IN": [
    {
      slug: "bengaluru",
      name: "ಬೆಂಗಳೂರು",
      metaTitle: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ಫ್ಯಾಕ್ಟರಿ ಕೆಲಸ: ನಮ್ಮ ಪಟ್ಟಿಗೆ ಸೇರಿ",
      description:
        "ಬೆಂಗಳೂರಿನಲ್ಲಿ ಫ್ಯಾಕ್ಟರಿ, ವೇರ್‌ಹೌಸ್ ಮತ್ತು ಹೌಸ್‌ಕೀಪಿಂಗ್ ಕೆಲಸ. ನಮ್ಮ ಕಾರ್ಮಿಕರ ಪಟ್ಟಿಗೆ ಸೇರಿ: ಯಾವುದೇ ಶುಲ್ಕವಿಲ್ಲ, 8 ಗಂಟೆಗಳ ಶಿಫ್ಟ್. ಬೇಕಾದಾಗ ನಾವು ಕರೆ ಮಾಡುತ್ತೇವೆ.",
      eyebrow: "ಉದ್ಯೋಗಗಳು · ಬೆಂಗಳೂರು",
      heading: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ಫ್ಯಾಕ್ಟರಿ ಮತ್ತು ವೇರ್‌ಹೌಸ್ ಕೆಲಸ.",
      lede: "ನಾವು ಬೆಂಗಳೂರಿನಲ್ಲಿ ಕಾರ್ಮಿಕರ ಪಟ್ಟಿಯನ್ನು ಮಾಡುತ್ತಿದ್ದೇವೆ. ಅಲ್ಲಿನ ಸೈಟ್‌ಗೆ ಜನ ಬೇಕಾದಾಗ, ನಾವು ನಿಮಗೆ ಕರೆ ಮಾಡುತ್ತೇವೆ.",
      after: { label: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ನಂತರ", steps: ["VAYSPL ಇಂದ SMS", "ಸೈಟ್‌ಗೆ ಬೇಕಾದಾಗ ನಾವು ಕರೆ ಮಾಡುತ್ತೇವೆ", "ನಿರ್ಧಾರ ನಿಮ್ಮದು"] },
      faqTitle: "ಪ್ರಶ್ನೆಗಳು.",
      faqs: [
        { question: "ಈಗ ಖಾಲಿ ಹುದ್ದೆಗಳಿವೆಯೇ?", answer: "ಪ್ರತಿ ವಾರ ಅಲ್ಲ. ನೀವು ನಮ್ಮ ಪಟ್ಟಿಗೆ ಸೇರುತ್ತೀರಿ, ಮತ್ತು ಬೆಂಗಳೂರಿನ ಸೈಟ್‌ಗೆ ನಿಮ್ಮಂತಹ ಕೆಲಸ ಬೇಕಾದಾಗ ನಾವು ಕರೆ ಮಾಡುತ್ತೇವೆ.", category: "operations" },
        {
          question: "ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?",
          answer: "ನಿಮ್ಮ 10ನೇ ಅಥವಾ 12ನೇ ತರಗತಿಯ ಅಂಕಪಟ್ಟಿ. ITI ಪ್ರಮಾಣಪತ್ರ, ಇದ್ದರೆ. ಸೇರುವಾಗ ಸೈಟ್ ಕೇಳುವ ID. ಏನು ತರಬೇಕು ಎಂದು ಸೇರುವ ಮೊದಲು ನಾವು ಹೇಳುತ್ತೇವೆ. ಫಾರ್ಮ್‌ನಲ್ಲಿ ಆಧಾರ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ದಾಖಲೆಗಳನ್ನು ಕಳುಹಿಸಬೇಡಿ.",
          category: "operations",
        },
        AGE_FAQ["kn-IN"],
        { question: "ಸಂಬಳ ಯಾರು ಕೊಡುತ್ತಾರೆ?", answer: "ನಾವು ಕೊಡುತ್ತೇವೆ, ಅನ್ವಯವಾದಲ್ಲಿ EPF ಮತ್ತು ESIC ಜೊತೆ.", category: "operations" },
      ],
    },
  ],
};

export function getJobCluster(slug: string, locale: Locale) {
  return jobClusters[locale].find((c) => c.slug === slug);
}

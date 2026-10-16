import type { Locale } from "@/lib/i18n";
import type { FaqItem } from "../types";

type Link = { href: string; label: string };

export interface ContractLabourCopy {
  title: string;
  description: string;
  breadcrumb: { home: string; services: string; page: string };
  hero: [string, string];
  lede: string;
  /** The hero's button to the Request a crew form. */
  heroCta: string;
  /** One quiet line for job seekers under the hero. No phone near it. */
  jobs: { text: string; link: Link };
  introEyebrow: string;
  introHeading: string;
  intro: string[];
  localLink: Link;
  areasEyebrow: string;
  workAreas: { title: string; text: string; href: string; link: string }[];
  stepsEyebrow: string;
  stepsHeading: string;
  steps: { title: string; text: string }[];
  complianceHeading: string;
  complianceText: string;
  complianceLink: string;
  faqEyebrow: string;
  faqHeading: string;
  /** Page FAQs; the standard agency FAQ (src/content/agency-faq.ts) is added after them. */
  faqs: FaqItem[];
  contactHeading: string;
  contactText: string;
  contactLink: string;
}

/**
 * /services/contract-labour in every locale: the main page for "labour
 * contractor" and "contract labour" searches, in the home page's voice
 * (workers on our payroll; we pay, deposit, supervise and replace). hi-IN and
 * hi-Latn-IN are drafts pending native-speaker review; keep all three in step
 * when the English changes. Agency words: only in the standard FAQ.
 */
export const contractLabourCopy: Record<Locale, ContractLabourCopy> = {
  "en-IN": {
    title: "Contract Labour Contractor in SIDCUL Haridwar",
    description:
      "Workers on our payroll at your plant. We pay wages, deposit EPF and ESIC where they apply, supervise shifts and replace absentees. SIDCUL and across Haridwar.",
    breadcrumb: { home: "Home", services: "Services", page: "Contract labour" },
    hero: ["Contract labour for factory", "and warehouse operations."],
    lede: "Workers on our payroll, on your site. We pay wages, deposit EPF and ESIC where they apply, supervise the crew and replace absentees.",
    heroCta: "Request a crew",
    jobs: { text: "Looking for work?", link: { href: "/jobs/haridwar", label: "Jobs in Haridwar" } },
    introEyebrow: "CONTRACT LABOUR",
    introHeading: "What you get from us.",
    intro: [
      "You tell us the work, the headcount and the shifts. We supply the workers and employ them: they are on our payroll, not yours.",
      "We pay their wages, deposit EPF and ESIC where they apply, keep the attendance and wage registers, and supervise the crew. If someone is absent, we send a replacement.",
      "Every shift is a full 8 hours. Ongoing work, project work and seasonal peaks can each be planned as its own engagement.",
    ],
    localLink: { href: "/haridwar-sidcul", label: "Labour contractor in SIDCUL Haridwar" },
    areasEyebrow: "WHERE OUR CREWS WORK",
    workAreas: [
      {
        title: "Factory and production",
        text: "Production helpers, packers, material handlers and quality check helpers for shopfloor work.",
        href: "/services/factory-labour",
        link: "Factory labour",
      },
      {
        title: "Warehouse and dispatch",
        text: "Crews for loading, unloading, picking, packing, stacking and dispatch, planned around your dock hours.",
        href: "/services/warehouse-labour",
        link: "Warehouse labour",
      },
      {
        title: "Facilities and site support",
        text: "Housekeeping, pantry and grounds staff for plants, warehouses and offices.",
        href: "/services/housekeeping",
        link: "Housekeeping",
      },
    ],
    stepsEyebrow: "HOW AN ENGAGEMENT RUNS",
    stepsHeading: "From requirement to monthly records.",
    steps: [
      {
        title: "You send the requirement",
        text: "The site, the work, the headcount, the shifts and the start date. We agree the supervision and site rules with you.",
      },
      {
        title: "We recruit and onboard",
        text: "We find the workers and put them on our payroll before they start on your site.",
      },
      {
        title: "We run the crew",
        text: "We supervise the crew, keep attendance for every shift and replace absentees.",
      },
      {
        title: "We keep the records",
        text: "We keep the attendance and wage registers, deposit EPF and ESIC where they apply, and share the challans with you each month.",
      },
    ],
    complianceHeading: "Records you can check.",
    complianceText:
      "We are registered under EPF and ESIC. Attendance and wage registers, wage slips, and EPF and ESIC challans for the workers on your site are open for your monthly review and for audits.",
    complianceLink: "How we handle labour compliance",
    faqEyebrow: "QUESTIONS",
    faqHeading: "Common questions.",
    faqs: [
      {
        question: "Who employs the workers?",
        answer:
          "We do. The workers are on our payroll. We pay their wages and deposit EPF and ESIC where they apply. You pay us against one invoice.",
        category: "commercial",
      },
    ],
    contactHeading: "Send us a requirement.",
    contactText:
      "Tell us the site, the roles, roughly how many workers and the shifts. We aim to reply within two working days (Monday to Saturday, IST).",
    contactLink: "Request a crew",
  },
  "hi-IN": {
    title: "हरिद्वार में कॉन्ट्रैक्ट लेबर और मैनपावर सप्लाई",
    description:
      "कामगार हमारे पेरोल पर, आपकी साइट पर। हम मज़दूरी देते हैं, जहाँ लागू हो EPF और ESIC जमा करते हैं, शिफ्ट की देखरेख करते हैं और ग़ैरहाज़िर की जगह दूसरा भेजते हैं।",
    breadcrumb: { home: "होम", services: "सेवाएँ", page: "कॉन्ट्रैक्ट लेबर" },
    hero: ["फ़ैक्टरी और वेयरहाउस के लिए", "कॉन्ट्रैक्ट लेबर।"],
    lede: "कामगार हमारे पेरोल पर, आपकी साइट पर। हम मज़दूरी देते हैं, जहाँ लागू हो EPF और ESIC जमा करते हैं, टीम की देखरेख करते हैं और ग़ैरहाज़िर कामगार की जगह दूसरा भेजते हैं।",
    heroCta: "कामगार माँगें",
    jobs: { text: "काम चाहिए?", link: { href: "/jobs/haridwar", label: "हरिद्वार में नौकरी" } },
    introEyebrow: "कॉन्ट्रैक्ट लेबर",
    introHeading: "हमसे आपको क्या मिलता है।",
    intro: [
      "आप काम, कितने लोग और शिफ्ट बताइए। हम कामगार देते हैं और उन्हें नौकरी पर रखते हैं: वे हमारे पेरोल पर होते हैं, आपके नहीं।",
      "हम उनकी मज़दूरी देते हैं, जहाँ लागू हो EPF और ESIC जमा करते हैं, हाज़िरी और वेतन रजिस्टर रखते हैं, और टीम की देखरेख करते हैं। कोई ग़ैरहाज़िर हो तो हम दूसरा कामगार भेजते हैं।",
      "हर शिफ्ट पूरे 8 घंटे की होती है। लगातार चलने वाला काम, प्रोजेक्ट का काम और सीज़न का ज़्यादा काम, हर एक की अलग योजना बन सकती है।",
    ],
    localLink: { href: "/haridwar-sidcul", label: "सिडकुल हरिद्वार में लेबर ठेकेदार" },
    areasEyebrow: "हमारी टीमें कहाँ काम करती हैं",
    workAreas: [
      {
        title: "फ़ैक्टरी और प्रोडक्शन",
        text: "शॉपफ़्लोर के काम के लिए प्रोडक्शन हेल्पर, पैकर, मटीरियल हैंडलर और क्वालिटी चेक हेल्पर।",
        href: "/services/factory-labour",
        link: "फ़ैक्टरी लेबर (अंग्रेज़ी में)",
      },
      {
        title: "वेयरहाउस और डिस्पैच",
        text: "लोडिंग, अनलोडिंग, पिकिंग, पैकिंग, स्टैकिंग और डिस्पैच के लिए टीमें, आपके डॉक के समय के हिसाब से।",
        href: "/services/warehouse-labour",
        link: "वेयरहाउस लेबर (अंग्रेज़ी में)",
      },
      {
        title: "फ़ैसिलिटी और साइट सपोर्ट",
        text: "प्लांट, वेयरहाउस और ऑफ़िस के लिए हाउसकीपिंग, पैंट्री और ग्राउंड्स स्टाफ़।",
        href: "/services/housekeeping",
        link: "हाउसकीपिंग (अंग्रेज़ी में)",
      },
    ],
    stepsEyebrow: "काम कैसे चलता है",
    stepsHeading: "ज़रूरत से हर महीने के रिकॉर्ड तक।",
    steps: [
      {
        title: "आप ज़रूरत भेजते हैं",
        text: "साइट, काम, कितने लोग, शिफ्ट और शुरू करने की तारीख़। देखरेख और साइट के नियम हम आपके साथ तय करते हैं।",
      },
      {
        title: "हम भर्ती करते हैं",
        text: "हम कामगार ढूँढते हैं और आपकी साइट पर शुरू करने से पहले उन्हें अपने पेरोल पर रखते हैं।",
      },
      {
        title: "हम टीम चलाते हैं",
        text: "हम टीम की देखरेख करते हैं, हर शिफ्ट की हाज़िरी रखते हैं और ग़ैरहाज़िर की जगह दूसरा भेजते हैं।",
      },
      {
        title: "रिकॉर्ड हम रखते हैं",
        text: "हम हाज़िरी और वेतन रजिस्टर रखते हैं, जहाँ लागू हो EPF और ESIC जमा करते हैं, और हर महीने चालान आपसे साझा करते हैं।",
      },
    ],
    complianceHeading: "रिकॉर्ड जिन्हें आप जाँच सकते हैं।",
    complianceText:
      "हम EPF और ESIC में रजिस्टर्ड हैं। आपकी साइट के कामगारों के हाज़िरी और वेतन रजिस्टर, वेतन पर्ची, और EPF व ESIC चालान आपकी मासिक जाँच और ऑडिट के लिए खुले हैं।",
    complianceLink: "हमारा लेबर कंप्लायंस तरीका (अंग्रेज़ी में)",
    faqEyebrow: "सवाल",
    faqHeading: "आम सवाल।",
    faqs: [
      {
        question: "कामगारों को नौकरी पर कौन रखता है?",
        answer:
          "हम। कामगार हमारे पेरोल पर होते हैं। हम उनकी मज़दूरी देते हैं और जहाँ लागू हो EPF और ESIC जमा करते हैं। आप हमें एक इनवॉइस पर भुगतान करते हैं।",
        category: "commercial",
      },
    ],
    contactHeading: "अपनी ज़रूरत भेजिए।",
    contactText:
      "साइट, रोल, लगभग कितने कामगार और शिफ्ट बताइए। हम दो कामकाजी दिनों में जवाब देने की कोशिश करते हैं (सोमवार से शनिवार, IST)।",
    contactLink: "कामगार माँगें",
  },
  "hi-Latn-IN": {
    title: "Haridwar mein Contract Labour aur Manpower Supply",
    description:
      "Workers hamare payroll par, aapki site par. Hum wages dete hain, EPF aur ESIC jama karte hain jahan laagu ho, aur absent ki jagah doosra bhejte hain.",
    breadcrumb: { home: "Home", services: "Services", page: "Contract labour" },
    hero: ["Factory aur warehouse ke liye", "contract labour."],
    lede: "Workers hamare payroll par, aapki site par. Hum wages dete hain, jahan laagu ho EPF aur ESIC jama karte hain, team ki dekhrekh karte hain aur absent worker ki jagah doosra bhejte hain.",
    heroCta: "Workers maangein",
    jobs: { text: "Kaam chahiye?", link: { href: "/jobs/haridwar", label: "Haridwar mein job" } },
    introEyebrow: "Contract labour",
    introHeading: "Humse aapko kya milta hai.",
    intro: [
      "Aap kaam, kitne log aur shifts bataiye. Hum workers dete hain aur unhe naukri par rakhte hain: woh hamare payroll par hote hain, aapke nahi.",
      "Hum unki wages dete hain, jahan laagu ho EPF aur ESIC jama karte hain, attendance aur wage registers rakhte hain, aur team ki dekhrekh karte hain. Koi absent ho to hum doosra worker bhejte hain.",
      "Har shift poore 8 ghante ki hoti hai. Ongoing kaam, project ka kaam aur season ka zyada kaam, har ek ki alag planning ho sakti hai.",
    ],
    localLink: { href: "/haridwar-sidcul", label: "SIDCUL Haridwar mein labour contractor" },
    areasEyebrow: "Hamari teams kahan kaam karti hain",
    workAreas: [
      {
        title: "Factory aur production",
        text: "Shopfloor ke kaam ke liye production helpers, packers, material handlers aur quality check helpers.",
        href: "/services/factory-labour",
        link: "Factory labour",
      },
      {
        title: "Warehouse aur dispatch",
        text: "Loading, unloading, picking, packing, stacking aur dispatch ke liye teams, aapke dock hours ke hisaab se.",
        href: "/services/warehouse-labour",
        link: "Warehouse labour",
      },
      {
        title: "Facilities aur site support",
        text: "Plant, warehouse aur office ke liye housekeeping, pantry aur grounds staff.",
        href: "/services/housekeeping",
        link: "Housekeeping",
      },
    ],
    stepsEyebrow: "Kaam kaise chalta hai",
    stepsHeading: "Requirement se har mahine ke records tak.",
    steps: [
      {
        title: "Aap requirement bhejte hain",
        text: "Site, kaam, kitne log, shifts aur start date. Supervision aur site ke rules hum aapke saath tay karte hain.",
      },
      {
        title: "Hum bharti karte hain",
        text: "Hum workers dhoondhte hain aur aapki site par shuru karne se pehle unhe apne payroll par rakhte hain.",
      },
      {
        title: "Hum team chalate hain",
        text: "Hum team ki dekhrekh karte hain, har shift ki attendance rakhte hain aur absent ki jagah doosra bhejte hain.",
      },
      {
        title: "Records hum rakhte hain",
        text: "Hum attendance aur wage registers rakhte hain, jahan laagu ho EPF aur ESIC jama karte hain, aur har mahine challans aapse share karte hain.",
      },
    ],
    complianceHeading: "Records jo aap check kar sakte hain.",
    complianceText:
      "Hum EPF aur ESIC mein registered hain. Aapki site ke workers ke attendance aur wage registers, wage slips, aur EPF aur ESIC challans aapke monthly review aur audits ke liye khule hain.",
    complianceLink: "Hamara labour compliance approach (English mein)",
    faqEyebrow: "Sawaal",
    faqHeading: "Aam sawaal.",
    faqs: [
      {
        question: "Workers ko naukri par kaun rakhta hai?",
        answer:
          "Hum. Workers hamare payroll par hote hain. Hum unki wages dete hain aur jahan laagu ho EPF aur ESIC jama karte hain. Aap humein ek invoice par payment karte hain.",
        category: "commercial",
      },
    ],
    contactHeading: "Apni requirement bhejiye.",
    contactText:
      "Site, roles, lagbhag kitne workers aur shifts bataiye. Hum do working days mein jawaab dene ki koshish karte hain (Monday se Saturday, IST).",
    contactLink: "Workers maangein",
  },
};

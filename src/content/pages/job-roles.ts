import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";
import type { JobRole } from "@/lib/talent-intake/rules";

/**
 * Role pages under /jobs/<slug> (and /hi, /hinglish): one per kind of work
 * people search for, each with the jobs form tagged with its role. They are
 * about the kind of work, not vacancies, so no JobPosting markup (Google
 * allows it only for a real, open position).
 *
 * Claims discipline: no pay figures, no promised call-back times, no
 * guarantee of work. Hindi and Hinglish are drafts pending native review;
 * spellings follow docs/hindi-glossary.md.
 */
export interface JobRoleCopy {
  slug: JobRole;
  /** Short name for breadcrumbs and links. */
  name: string;
  metaTitle: string;
  description: string;
  heading: string;
  lede: string;
  work: string[];
  /** Where and when: sites, shifts. */
  setting: string;
  suits: string[];
  send: string[];
  faqs: FaqItem[];
}

export interface JobRoleLabels {
  workHeading: string;
  suitsHeading: string;
  sendHeading: string;
  records: string;
  otherEyebrow: string;
  allJobs: string;
  faqEyebrow: string;
  faqTitle: string;
}

export const jobRoleLabels: Record<Locale, JobRoleLabels> = {
  en: {
    workHeading: "The work.",
    suitsHeading: "Who it suits",
    sendHeading: "Useful to send",
    records: "Workers we deploy are on our records, with applicable EPF and ESIC.",
    otherEyebrow: "OTHER WORK WE HIRE FOR",
    allJobs: "All jobs",
    faqEyebrow: "QUESTIONS",
    faqTitle: "About this work.",
  },
  hi: {
    workHeading: "काम क्या है।",
    suitsHeading: "किसके लिए",
    sendHeading: "भेज सकें तो अच्छा",
    records: "हम जिन लोगों को काम पर रखते हैं, वे हमारे रिकॉर्ड में होते हैं, लागू होने पर EPF और ESIC के साथ।",
    otherEyebrow: "और किन कामों के लिए",
    allJobs: "सभी नौकरियाँ",
    faqEyebrow: "सवाल",
    faqTitle: "इस काम के बारे में।",
  },
  hinglish: {
    workHeading: "Kaam kya hai.",
    suitsHeading: "Kiske liye",
    sendHeading: "Bhej sakein to achha",
    records: "Hum jin logon ko kaam par rakhte hain, woh hamare records mein hote hain, applicable EPF aur ESIC ke saath.",
    otherEyebrow: "AUR KIN KAAMON KE LIYE",
    allJobs: "Saari naukriyan",
    faqEyebrow: "SAWAAL",
    faqTitle: "Is kaam ke baare mein.",
  },
};

export const jobRoles: Record<Locale, JobRoleCopy[]> = {
  en: [
    {
      slug: "factory-helper",
      name: "Factory helper",
      metaTitle: "Factory Helper Jobs in SIDCUL Haridwar",
      description:
        "Factory helper and production helper jobs in SIDCUL and across Haridwar: line work, material handling and packing. Tell us by voice. No fee, ever.",
      heading: "Factory helper jobs in SIDCUL Haridwar.",
      lede: "Production helper work on factory shopfloors. Tell us about yourself in your own voice and we'll call you when there's suitable work.",
      work: [
        "Feeding and assisting on production lines",
        "Moving material between stores and the line",
        "Packing, labelling and simple quality checks",
        "Keeping the work area clean and safe",
      ],
      setting:
        "Factories in SIDCUL and across Haridwar. Plants run day, night and rotating shifts; the site, shift and work are discussed with you before you join.",
      suits: [
        "Freshers: many helper roles need no prior experience",
        "People who have worked on a line or in packing before",
        "Anyone ready to follow site safety rules and wear PPE",
      ],
      send: ["10th or 12th marksheet", "Any experience letter or salary slip", "A resume, if you have one"],
      faqs: [
        {
          question: "Do I need experience for a factory helper job?",
          answer:
            "Often not. Many helper roles are open to freshers, and the site explains the work at induction. If you have worked in a factory before, tell us where and what you did.",
          category: "operations",
        },
        {
          question: "Which factories are these jobs in?",
          answer:
            "Factories in SIDCUL and across Haridwar that we supply workers to. We tell you the site, the shift and the work before you join.",
          category: "operations",
        },
        {
          question: "Will I get PF and ESIC?",
          answer:
            "Workers we deploy are on our records, and applicable EPF and ESIC contributions are made in your name. Ask us about it when we call.",
          category: "compliance",
        },
      ],
    },
    {
      slug: "warehouse",
      name: "Warehouse jobs",
      metaTitle: "Warehouse Jobs in SIDCUL Haridwar: Loading, Picking, Packing",
      description:
        "Warehouse jobs in SIDCUL and across Haridwar: loading, unloading, picking, packing, stacking and dispatch. Tell us by voice. No fee, ever.",
      heading: "Warehouse jobs in SIDCUL Haridwar.",
      lede: "Loading, unloading, picking, packing and dispatch. Tell us about yourself in your own voice and we'll call you when there's suitable work.",
      work: [
        "Loading and unloading trucks",
        "Picking and packing orders",
        "Stacking, racking and keeping stock in order",
        "Dispatch and staging",
        "Forklift and MHE work, for those with experience",
      ],
      setting:
        "Warehouses and dispatch areas in SIDCUL and across Haridwar. Work follows truck and dispatch timings, with day and night shifts; we discuss the shift with you before you join.",
      suits: [
        "Freshers who are fit for physical work",
        "People with loading, packing or store experience",
        "Forklift operators with a licence and experience",
      ],
      send: ["Forklift licence, if you have one", "Any experience letter or salary slip", "10th or 12th marksheet"],
      faqs: [
        {
          question: "Is there night shift work in warehouses?",
          answer:
            "Some warehouses work at night or on peak days. We tell you the shift before you join, so tell us if you can or cannot do nights.",
          category: "operations",
        },
        {
          question: "Do you hire forklift operators?",
          answer:
            "Yes, when a site needs them. Send a photo of your licence and tell us how long you have operated a forklift or other MHE.",
          category: "operations",
        },
        {
          question: "Will I get PF and ESIC?",
          answer:
            "Workers we deploy are on our records, and applicable EPF and ESIC contributions are made in your name. Ask us about it when we call.",
          category: "compliance",
        },
      ],
    },
    {
      slug: "data-entry-operator",
      name: "Data entry operator",
      metaTitle: "Data Entry Operator Jobs in Haridwar (ERP, SAP)",
      description:
        "Data entry operator (DEO) jobs in SIDCUL and across Haridwar: computer entry in ERP systems such as SAP for stores, dispatch and production. No fee.",
      heading: "Data entry operator jobs in Haridwar.",
      lede: "Computer work in ERP systems such as SAP, at factories and warehouses in SIDCUL. Tell us about yourself in your own voice and we'll call you when there's suitable work.",
      work: [
        "Stores and inventory entries: receipts, issues, stock",
        "Dispatch, gate entry and delivery documents",
        "Production and attendance records",
        "Office records and simple reports in Excel",
      ],
      setting:
        "Factories, warehouses and site offices in SIDCUL and across Haridwar, usually in general or shift timings set by the site.",
      suits: [
        "People who can type in English and Hindi and know basic Excel",
        "Anyone who has worked in SAP, Tally or another ERP",
        "Graduates and 12th pass with a computer course",
      ],
      send: ["Computer course certificate (such as CCC or DCA)", "Graduation or 12th marksheet", "Any experience letter or resume"],
      faqs: [
        {
          question: "Do I need SAP experience?",
          answer:
            "It helps, but many sites don't require it. Tell us which systems you have used (SAP, Tally, another ERP or only Excel) and the modules or screens you worked on.",
          category: "operations",
        },
        {
          question: "What typing speed is needed?",
          answer:
            "It depends on the site. Tell us your typing speed in English and Hindi if you know it; the site may give a short test.",
          category: "operations",
        },
        {
          question: "Is this an office job?",
          answer:
            "Mostly. You work at a computer in the plant's office, stores or dispatch area, sometimes checking material or documents on the floor.",
          category: "operations",
        },
      ],
    },
    {
      slug: "housekeeping",
      name: "Housekeeping",
      metaTitle: "Housekeeping Jobs in SIDCUL Haridwar",
      description:
        "Housekeeping jobs in SIDCUL and across Haridwar: factories, offices, canteens and campuses. For men and women. Tell us by voice. No fee, ever.",
      heading: "Housekeeping jobs in SIDCUL Haridwar.",
      lede: "Housekeeping at factories, offices, canteens and campuses. Tell us about yourself in your own voice and we'll call you when there's suitable work.",
      work: [
        "Cleaning shopfloors, offices and common areas",
        "Washroom upkeep",
        "Pantry and canteen help",
        "Gardening and grounds work",
      ],
      setting:
        "Industrial sites, offices and campuses in SIDCUL and across Haridwar. Most work is in day shifts, with some early-morning and evening shifts.",
      suits: ["Men and women", "Freshers and people with housekeeping experience", "People who want steady day work"],
      send: ["Any experience letter or salary slip", "Marksheet, if you have one"],
      faqs: [
        {
          question: "Are there housekeeping jobs for women?",
          answer:
            "Yes. Many sites have housekeeping roles for women. Tell us your preferred shift and the area you live in.",
          category: "operations",
        },
        {
          question: "Do I need experience?",
          answer:
            "No. Sites explain their routines and the cleaning materials they use. Experience in a factory, hospital or hotel is useful to mention.",
          category: "operations",
        },
        {
          question: "Will I get PF and ESIC?",
          answer:
            "Workers we deploy are on our records, and applicable EPF and ESIC contributions are made in your name. Ask us about it when we call.",
          category: "compliance",
        },
      ],
    },
    {
      slug: "iti-trades",
      name: "ITI trades",
      metaTitle: "ITI Jobs in SIDCUL Haridwar: Welder, Fitter, Electrician",
      description:
        "Jobs for ITI welders, fitters and electricians in SIDCUL and across Haridwar: fabrication, installation and maintenance work. Tell us by voice. No fee.",
      heading: "ITI jobs in SIDCUL Haridwar: welder, fitter, electrician.",
      lede: "Fabrication, installation and maintenance work at plants in SIDCUL. Tell us about your trade in your own voice and we'll call you when there's suitable work.",
      work: [
        "Welding and gas cutting for fabrication (MS and SS)",
        "Fitting and installation of structures and equipment",
        "Electrical maintenance and wiring support",
        "Breakdown and shutdown maintenance",
      ],
      setting:
        "Plants and project sites in SIDCUL and across Haridwar, in general shifts or on project and shutdown schedules.",
      suits: [
        "ITI pass in welder, fitter, electrician or a related trade",
        "People with plant, fabrication or maintenance experience",
        "Freshers from ITI, for helper and trainee roles",
      ],
      send: ["ITI certificate and marksheet", "Any experience letter or salary slip", "Photos of work you've done"],
      faqs: [
        {
          question: "Which trades do you hire?",
          answer:
            "Mainly welders, fitters, gas cutters and electricians, plus maintenance helpers. Tell us your trade and the machines or processes you have worked on.",
          category: "operations",
        },
        {
          question: "Can ITI freshers apply?",
          answer:
            "Yes. Some sites take ITI freshers as helpers or trainees. Send your ITI certificate and tell us your trade.",
          category: "operations",
        },
        {
          question: "Is the work permanent?",
          answer:
            "Some work is ongoing and some is for a project or shutdown. We tell you what the work is and how long it is expected to last before you join.",
          category: "operations",
        },
      ],
    },
  ],
  hi: [
    {
      slug: "factory-helper",
      name: "फ़ैक्टरी हेल्पर",
      metaTitle: "सिडकुल हरिद्वार में फ़ैक्टरी हेल्पर की नौकरी",
      description:
        "सिडकुल और पूरे हरिद्वार में फ़ैक्टरी हेल्पर और प्रोडक्शन हेल्पर की नौकरी: लाइन का काम, माल उठाना-रखना और पैकिंग। बोलकर बताइए। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में फ़ैक्टरी हेल्पर की नौकरी।",
      lede: "फ़ैक्टरी के शॉपफ़्लोर पर प्रोडक्शन हेल्पर का काम। अपनी आवाज़ में अपने बारे में बताइए, सही काम होने पर हम आपको फ़ोन करेंगे।",
      work: [
        "प्रोडक्शन लाइन पर माल डालना और मदद करना",
        "स्टोर से लाइन तक माल लाना-ले जाना",
        "पैकिंग, लेबलिंग और आसान क्वालिटी चेक",
        "काम की जगह को साफ़ और सुरक्षित रखना",
      ],
      setting:
        "सिडकुल और पूरे हरिद्वार की फ़ैक्टरियाँ। प्लांट दिन, रात और बदलती शिफ्ट में चलते हैं; साइट, शिफ्ट और काम जॉइन करने से पहले आपसे बात करके तय होता है।",
      suits: [
        "फ़्रेशर: हेल्पर के कई कामों में पहले का अनुभव ज़रूरी नहीं",
        "जिन्होंने पहले लाइन या पैकिंग में काम किया है",
        "जो साइट के सेफ़्टी नियम मानें और PPE पहनें",
      ],
      send: ["10वीं या 12वीं की मार्कशीट", "अनुभव का कोई पत्र या सैलरी स्लिप", "रिज़्यूमे, अगर हो"],
      faqs: [
        {
          question: "क्या फ़ैक्टरी हेल्पर के लिए अनुभव ज़रूरी है?",
          answer:
            "अक्सर नहीं। हेल्पर के कई काम फ़्रेशर के लिए भी हैं, और साइट इंडक्शन में काम समझाती है। पहले किसी फ़ैक्टरी में काम किया है तो बताइए कहाँ और क्या किया।",
          category: "operations",
        },
        {
          question: "ये नौकरियाँ किन फ़ैक्टरियों में हैं?",
          answer:
            "सिडकुल और पूरे हरिद्वार की उन फ़ैक्टरियों में जहाँ हम वर्कर देते हैं। जॉइन करने से पहले हम साइट, शिफ्ट और काम बताते हैं।",
          category: "operations",
        },
        {
          question: "क्या PF और ESIC मिलेगा?",
          answer:
            "हम जिन वर्करों को काम पर रखते हैं, वे हमारे रिकॉर्ड में होते हैं, और लागू होने पर EPF और ESIC आपके नाम पर जमा होता है। फ़ोन पर हमसे पूछिए।",
          category: "compliance",
        },
      ],
    },
    {
      slug: "warehouse",
      name: "वेयरहाउस की नौकरी",
      metaTitle: "सिडकुल हरिद्वार में वेयरहाउस की नौकरी: लोडिंग, पिकिंग, पैकिंग",
      description:
        "सिडकुल और पूरे हरिद्वार में वेयरहाउस की नौकरी: लोडिंग, अनलोडिंग, पिकिंग, पैकिंग, स्टैकिंग और डिस्पैच। बोलकर बताइए। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में वेयरहाउस की नौकरी।",
      lede: "लोडिंग, अनलोडिंग, पिकिंग, पैकिंग और डिस्पैच। अपनी आवाज़ में अपने बारे में बताइए, सही काम होने पर हम आपको फ़ोन करेंगे।",
      work: [
        "ट्रक में माल चढ़ाना और उतारना",
        "ऑर्डर का माल निकालना और पैक करना",
        "स्टैकिंग, रैकिंग और स्टॉक को सही जगह रखना",
        "डिस्पैच और स्टेजिंग",
        "फ़ोर्कलिफ़्ट और MHE का काम, अनुभव वालों के लिए",
      ],
      setting:
        "सिडकुल और पूरे हरिद्वार के वेयरहाउस और डिस्पैच एरिया। काम ट्रक और डिस्पैच के समय के हिसाब से, दिन और रात की शिफ्ट में; शिफ्ट जॉइन करने से पहले आपसे तय होती है।",
      suits: [
        "मेहनत का काम कर सकने वाले फ़्रेशर",
        "लोडिंग, पैकिंग या स्टोर का अनुभव रखने वाले",
        "लाइसेंस और अनुभव वाले फ़ोर्कलिफ़्ट ऑपरेटर",
      ],
      send: ["फ़ोर्कलिफ़्ट लाइसेंस, अगर हो", "अनुभव का कोई पत्र या सैलरी स्लिप", "10वीं या 12वीं की मार्कशीट"],
      faqs: [
        {
          question: "क्या वेयरहाउस में रात की शिफ्ट होती है?",
          answer:
            "कुछ वेयरहाउस रात में या भीड़ वाले दिनों में काम करते हैं। शिफ्ट हम जॉइन करने से पहले बताते हैं, इसलिए बताइए कि आप रात में काम कर सकते हैं या नहीं।",
          category: "operations",
        },
        {
          question: "क्या आप फ़ोर्कलिफ़्ट ऑपरेटर रखते हैं?",
          answer:
            "हाँ, जब साइट को ज़रूरत हो। अपने लाइसेंस की फ़ोटो भेजिए और बताइए कि कितने समय से फ़ोर्कलिफ़्ट या दूसरी MHE चला रहे हैं।",
          category: "operations",
        },
        {
          question: "क्या PF और ESIC मिलेगा?",
          answer:
            "हम जिन वर्करों को काम पर रखते हैं, वे हमारे रिकॉर्ड में होते हैं, और लागू होने पर EPF और ESIC आपके नाम पर जमा होता है। फ़ोन पर हमसे पूछिए।",
          category: "compliance",
        },
      ],
    },
    {
      slug: "data-entry-operator",
      name: "डेटा एंट्री ऑपरेटर",
      metaTitle: "हरिद्वार में डेटा एंट्री ऑपरेटर की नौकरी (ERP, SAP)",
      description:
        "सिडकुल और पूरे हरिद्वार में डेटा एंट्री ऑपरेटर (DEO) की नौकरी: स्टोर, डिस्पैच और प्रोडक्शन के लिए SAP जैसे ERP में कंप्यूटर एंट्री। कोई फ़ीस नहीं।",
      heading: "हरिद्वार में डेटा एंट्री ऑपरेटर की नौकरी।",
      lede: "सिडकुल की फ़ैक्टरियों और वेयरहाउस में SAP जैसे ERP पर कंप्यूटर का काम। अपनी आवाज़ में अपने बारे में बताइए, सही काम होने पर हम आपको फ़ोन करेंगे।",
      work: [
        "स्टोर और इन्वेंटरी की एंट्री: माल आना, जाना, स्टॉक",
        "डिस्पैच, गेट एंट्री और डिलीवरी के कागज़",
        "प्रोडक्शन और हाज़िरी के रिकॉर्ड",
        "ऑफ़िस के रिकॉर्ड और Excel में आसान रिपोर्ट",
      ],
      setting:
        "सिडकुल और पूरे हरिद्वार की फ़ैक्टरियाँ, वेयरहाउस और साइट ऑफ़िस, आमतौर पर साइट की तय जनरल या शिफ्ट टाइमिंग में।",
      suits: [
        "जो अंग्रेज़ी और हिंदी में टाइप कर सकें और बेसिक Excel जानें",
        "जिन्होंने SAP, Tally या किसी और ERP पर काम किया है",
        "ग्रेजुएट और कंप्यूटर कोर्स के साथ 12वीं पास",
      ],
      send: ["कंप्यूटर कोर्स का सर्टिफ़िकेट (जैसे CCC या DCA)", "ग्रेजुएशन या 12वीं की मार्कशीट", "अनुभव का कोई पत्र या रिज़्यूमे"],
      faqs: [
        {
          question: "क्या SAP का अनुभव ज़रूरी है?",
          answer:
            "हो तो अच्छा है, पर कई साइट पर ज़रूरी नहीं। बताइए आपने कौन-से सिस्टम चलाए हैं (SAP, Tally, कोई और ERP या सिर्फ़ Excel) और किन मॉड्यूल या स्क्रीन पर काम किया।",
          category: "operations",
        },
        {
          question: "कितनी टाइपिंग स्पीड चाहिए?",
          answer:
            "यह साइट पर निर्भर है। अंग्रेज़ी और हिंदी में अपनी टाइपिंग स्पीड पता हो तो बताइए; साइट छोटा टेस्ट ले सकती है।",
          category: "operations",
        },
        {
          question: "क्या यह ऑफ़िस का काम है?",
          answer:
            "ज़्यादातर। आप प्लांट के ऑफ़िस, स्टोर या डिस्पैच एरिया में कंप्यूटर पर काम करते हैं, कभी-कभी फ़्लोर पर माल या कागज़ मिलाते हैं।",
          category: "operations",
        },
      ],
    },
    {
      slug: "housekeeping",
      name: "हाउसकीपिंग",
      metaTitle: "सिडकुल हरिद्वार में हाउसकीपिंग की नौकरी",
      description:
        "सिडकुल और पूरे हरिद्वार में हाउसकीपिंग की नौकरी: फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस। पुरुष और महिलाएँ दोनों। बोलकर बताइए। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में हाउसकीपिंग की नौकरी।",
      lede: "फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस में हाउसकीपिंग। अपनी आवाज़ में अपने बारे में बताइए, सही काम होने पर हम आपको फ़ोन करेंगे।",
      work: [
        "शॉपफ़्लोर, ऑफ़िस और कॉमन एरिया की सफ़ाई",
        "वॉशरूम की देखभाल",
        "पैंट्री और कैंटीन में मदद",
        "बाग़वानी और ग्राउंड का काम",
      ],
      setting:
        "सिडकुल और पूरे हरिद्वार की इंडस्ट्रियल साइट, ऑफ़िस और कैंपस। ज़्यादातर काम दिन की शिफ्ट में, कुछ सुबह जल्दी और शाम की शिफ्ट में।",
      suits: ["पुरुष और महिलाएँ", "फ़्रेशर और हाउसकीपिंग का अनुभव रखने वाले", "जो दिन में पक्का काम चाहते हैं"],
      send: ["अनुभव का कोई पत्र या सैलरी स्लिप", "मार्कशीट, अगर हो"],
      faqs: [
        {
          question: "क्या महिलाओं के लिए हाउसकीपिंग की नौकरी है?",
          answer: "हाँ। कई साइट पर महिलाओं के लिए हाउसकीपिंग का काम है। अपनी पसंद की शिफ्ट और अपना इलाक़ा बताइए।",
          category: "operations",
        },
        {
          question: "क्या अनुभव ज़रूरी है?",
          answer:
            "नहीं। साइट अपना तरीक़ा और सफ़ाई का सामान समझाती है। फ़ैक्टरी, अस्पताल या होटल में काम किया हो तो ज़रूर बताइए।",
          category: "operations",
        },
        {
          question: "क्या PF और ESIC मिलेगा?",
          answer:
            "हम जिन वर्करों को काम पर रखते हैं, वे हमारे रिकॉर्ड में होते हैं, और लागू होने पर EPF और ESIC आपके नाम पर जमा होता है। फ़ोन पर हमसे पूछिए।",
          category: "compliance",
        },
      ],
    },
    {
      slug: "iti-trades",
      name: "ITI ट्रेड",
      metaTitle: "सिडकुल हरिद्वार में ITI की नौकरी: वेल्डर, फ़िटर, इलेक्ट्रीशियन",
      description:
        "सिडकुल और पूरे हरिद्वार में ITI वेल्डर, फ़िटर और इलेक्ट्रीशियन की नौकरी: फ़ैब्रिकेशन, इंस्टॉलेशन और मेंटेनेंस। बोलकर बताइए। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में ITI की नौकरी: वेल्डर, फ़िटर, इलेक्ट्रीशियन।",
      lede: "सिडकुल के प्लांट में फ़ैब्रिकेशन, इंस्टॉलेशन और मेंटेनेंस का काम। अपनी आवाज़ में अपने ट्रेड के बारे में बताइए, सही काम होने पर हम आपको फ़ोन करेंगे।",
      work: [
        "फ़ैब्रिकेशन के लिए वेल्डिंग और गैस कटिंग (MS और SS)",
        "स्ट्रक्चर और मशीनों की फ़िटिंग और इंस्टॉलेशन",
        "इलेक्ट्रिकल मेंटेनेंस और वायरिंग में मदद",
        "ब्रेकडाउन और शटडाउन मेंटेनेंस",
      ],
      setting: "सिडकुल और पूरे हरिद्वार के प्लांट और प्रोजेक्ट साइट, जनरल शिफ्ट में या प्रोजेक्ट और शटडाउन के हिसाब से।",
      suits: [
        "वेल्डर, फ़िटर, इलेक्ट्रीशियन या मिलते-जुलते ट्रेड में ITI पास",
        "प्लांट, फ़ैब्रिकेशन या मेंटेनेंस का अनुभव रखने वाले",
        "ITI फ़्रेशर, हेल्पर और ट्रेनी के काम के लिए",
      ],
      send: ["ITI सर्टिफ़िकेट और मार्कशीट", "अनुभव का कोई पत्र या सैलरी स्लिप", "अपने किए काम की फ़ोटो"],
      faqs: [
        {
          question: "आप किन ट्रेड के लोग रखते हैं?",
          answer:
            "मुख्य रूप से वेल्डर, फ़िटर, गैस कटर और इलेक्ट्रीशियन, और मेंटेनेंस हेल्पर। अपना ट्रेड और जिन मशीनों या काम पर हाथ चलाया है, वह बताइए।",
          category: "operations",
        },
        {
          question: "क्या ITI फ़्रेशर अप्लाई कर सकते हैं?",
          answer: "हाँ। कुछ साइट ITI फ़्रेशर को हेल्पर या ट्रेनी के तौर पर रखती हैं। अपना ITI सर्टिफ़िकेट भेजिए और ट्रेड बताइए।",
          category: "operations",
        },
        {
          question: "क्या काम पक्का है?",
          answer:
            "कुछ काम लगातार चलता है और कुछ किसी प्रोजेक्ट या शटडाउन के लिए होता है। जॉइन करने से पहले हम बताते हैं कि काम क्या है और कितने समय चलने की उम्मीद है।",
          category: "operations",
        },
      ],
    },
  ],
  hinglish: [
    {
      slug: "factory-helper",
      name: "Factory helper",
      metaTitle: "SIDCUL Haridwar mein Factory Helper Job",
      description:
        "SIDCUL aur poore Haridwar mein factory helper aur production helper ki naukri: line ka kaam, maal uthana-rakhna aur packing. Bolkar bataiye. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein factory helper ki naukri.",
      lede: "Factory ke shopfloor par production helper ka kaam. Apni awaaz mein apne baare mein bataiye, sahi kaam hone par hum aapko phone karenge.",
      work: [
        "Production line par maal daalna aur madad karna",
        "Store se line tak maal lana-le jana",
        "Packing, labelling aur aasaan quality check",
        "Kaam ki jagah ko saaf aur safe rakhna",
      ],
      setting:
        "SIDCUL aur poore Haridwar ki factories. Plant din, raat aur badalti shift mein chalte hain; site, shift aur kaam join karne se pehle aapse baat karke tay hota hai.",
      suits: [
        "Fresher: helper ke kai kaamon mein pehle ka experience zaroori nahi",
        "Jinhone pehle line ya packing mein kaam kiya hai",
        "Jo site ke safety rules maanein aur PPE pehnein",
      ],
      send: ["10th ya 12th ki marksheet", "Experience ka koi letter ya salary slip", "Resume, agar ho"],
      faqs: [
        {
          question: "Kya factory helper ke liye experience zaroori hai?",
          answer:
            "Aksar nahi. Helper ke kai kaam fresher ke liye bhi hain, aur site induction mein kaam samjhati hai. Pehle kisi factory mein kaam kiya hai to bataiye kahan aur kya kiya.",
          category: "operations",
        },
        {
          question: "Ye naukriyan kin factories mein hain?",
          answer:
            "SIDCUL aur poore Haridwar ki un factories mein jahan hum workers dete hain. Join karne se pehle hum site, shift aur kaam batate hain.",
          category: "operations",
        },
        {
          question: "Kya PF aur ESIC milega?",
          answer:
            "Hum jin workers ko kaam par rakhte hain, woh hamare records mein hote hain, aur applicable EPF aur ESIC aapke naam par jama hota hai. Phone par humse poochiye.",
          category: "compliance",
        },
      ],
    },
    {
      slug: "warehouse",
      name: "Warehouse job",
      metaTitle: "SIDCUL Haridwar mein Warehouse Job: Loading, Picking, Packing",
      description:
        "SIDCUL aur poore Haridwar mein warehouse ki naukri: loading, unloading, picking, packing, stacking aur dispatch. Bolkar bataiye. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein warehouse ki naukri.",
      lede: "Loading, unloading, picking, packing aur dispatch. Apni awaaz mein apne baare mein bataiye, sahi kaam hone par hum aapko phone karenge.",
      work: [
        "Truck mein maal chadhana aur utaarna",
        "Order ka maal nikaalna aur pack karna",
        "Stacking, racking aur stock ko sahi jagah rakhna",
        "Dispatch aur staging",
        "Forklift aur MHE ka kaam, experience walon ke liye",
      ],
      setting:
        "SIDCUL aur poore Haridwar ke warehouse aur dispatch area. Kaam truck aur dispatch ke time ke hisaab se, din aur raat ki shift mein; shift join karne se pehle aapse tay hoti hai.",
      suits: [
        "Mehnat ka kaam kar sakne wale fresher",
        "Loading, packing ya store ka experience rakhne wale",
        "Licence aur experience wale forklift operator",
      ],
      send: ["Forklift licence, agar ho", "Experience ka koi letter ya salary slip", "10th ya 12th ki marksheet"],
      faqs: [
        {
          question: "Kya warehouse mein night shift hoti hai?",
          answer:
            "Kuch warehouse raat mein ya peak dinon mein kaam karte hain. Shift hum join karne se pehle batate hain, isliye bataiye ki aap raat mein kaam kar sakte hain ya nahi.",
          category: "operations",
        },
        {
          question: "Kya aap forklift operator rakhte hain?",
          answer:
            "Haan, jab site ko zaroorat ho. Apne licence ki photo bhejiye aur bataiye ki kitne time se forklift ya doosri MHE chala rahe hain.",
          category: "operations",
        },
        {
          question: "Kya PF aur ESIC milega?",
          answer:
            "Hum jin workers ko kaam par rakhte hain, woh hamare records mein hote hain, aur applicable EPF aur ESIC aapke naam par jama hota hai. Phone par humse poochiye.",
          category: "compliance",
        },
      ],
    },
    {
      slug: "data-entry-operator",
      name: "Data entry operator",
      metaTitle: "Haridwar mein Data Entry Operator Job (ERP, SAP)",
      description:
        "SIDCUL aur poore Haridwar mein data entry operator (DEO) ki naukri: stores, dispatch aur production ke liye SAP jaise ERP mein computer entry. Koi fee nahi.",
      heading: "Haridwar mein data entry operator ki naukri.",
      lede: "SIDCUL ki factories aur warehouses mein SAP jaise ERP par computer ka kaam. Apni awaaz mein apne baare mein bataiye, sahi kaam hone par hum aapko phone karenge.",
      work: [
        "Stores aur inventory ki entry: maal aana, jaana, stock",
        "Dispatch, gate entry aur delivery ke documents",
        "Production aur attendance ke records",
        "Office ke records aur Excel mein aasaan reports",
      ],
      setting:
        "SIDCUL aur poore Haridwar ki factories, warehouses aur site offices, aamtaur par site ki tay general ya shift timing mein.",
      suits: [
        "Jo English aur Hindi mein type kar sakein aur basic Excel jaanein",
        "Jinhone SAP, Tally ya kisi aur ERP par kaam kiya hai",
        "Graduate aur computer course ke saath 12th pass",
      ],
      send: ["Computer course ka certificate (jaise CCC ya DCA)", "Graduation ya 12th ki marksheet", "Experience ka koi letter ya resume"],
      faqs: [
        {
          question: "Kya SAP ka experience zaroori hai?",
          answer:
            "Ho to achha hai, par kai sites par zaroori nahi. Bataiye aapne kaun-se system chalaye hain (SAP, Tally, koi aur ERP ya sirf Excel) aur kin modules ya screens par kaam kiya.",
          category: "operations",
        },
        {
          question: "Kitni typing speed chahiye?",
          answer:
            "Ye site par depend karta hai. English aur Hindi mein apni typing speed pata ho to bataiye; site chhota test le sakti hai.",
          category: "operations",
        },
        {
          question: "Kya ye office ka kaam hai?",
          answer:
            "Zyadatar. Aap plant ke office, store ya dispatch area mein computer par kaam karte hain, kabhi-kabhi floor par maal ya documents milaate hain.",
          category: "operations",
        },
      ],
    },
    {
      slug: "housekeeping",
      name: "Housekeeping",
      metaTitle: "SIDCUL Haridwar mein Housekeeping Job",
      description:
        "SIDCUL aur poore Haridwar mein housekeeping ki naukri: factory, office, canteen aur campus. Purush aur mahilaayein dono. Bolkar bataiye. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein housekeeping ki naukri.",
      lede: "Factory, office, canteen aur campus mein housekeeping. Apni awaaz mein apne baare mein bataiye, sahi kaam hone par hum aapko phone karenge.",
      work: [
        "Shopfloor, office aur common area ki safai",
        "Washroom ki dekhbhaal",
        "Pantry aur canteen mein madad",
        "Gardening aur ground ka kaam",
      ],
      setting:
        "SIDCUL aur poore Haridwar ki industrial sites, offices aur campus. Zyadatar kaam din ki shift mein, kuch subah jaldi aur shaam ki shift mein.",
      suits: ["Purush aur mahilaayein", "Fresher aur housekeeping ka experience rakhne wale", "Jo din mein pakka kaam chahte hain"],
      send: ["Experience ka koi letter ya salary slip", "Marksheet, agar ho"],
      faqs: [
        {
          question: "Kya mahilaon ke liye housekeeping ki naukri hai?",
          answer: "Haan. Kai sites par mahilaon ke liye housekeeping ka kaam hai. Apni pasand ki shift aur apna ilaaka bataiye.",
          category: "operations",
        },
        {
          question: "Kya experience zaroori hai?",
          answer:
            "Nahi. Site apna tareeka aur safai ka samaan samjhati hai. Factory, hospital ya hotel mein kaam kiya ho to zaroor bataiye.",
          category: "operations",
        },
        {
          question: "Kya PF aur ESIC milega?",
          answer:
            "Hum jin workers ko kaam par rakhte hain, woh hamare records mein hote hain, aur applicable EPF aur ESIC aapke naam par jama hota hai. Phone par humse poochiye.",
          category: "compliance",
        },
      ],
    },
    {
      slug: "iti-trades",
      name: "ITI trades",
      metaTitle: "SIDCUL Haridwar mein ITI Job: Welder, Fitter, Electrician",
      description:
        "SIDCUL aur poore Haridwar mein ITI welder, fitter aur electrician ki naukri: fabrication, installation aur maintenance. Bolkar bataiye. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein ITI ki naukri: welder, fitter, electrician.",
      lede: "SIDCUL ke plants mein fabrication, installation aur maintenance ka kaam. Apni awaaz mein apne trade ke baare mein bataiye, sahi kaam hone par hum aapko phone karenge.",
      work: [
        "Fabrication ke liye welding aur gas cutting (MS aur SS)",
        "Structure aur machines ki fitting aur installation",
        "Electrical maintenance aur wiring mein madad",
        "Breakdown aur shutdown maintenance",
      ],
      setting: "SIDCUL aur poore Haridwar ke plants aur project sites, general shift mein ya project aur shutdown ke hisaab se.",
      suits: [
        "Welder, fitter, electrician ya milte-julte trade mein ITI pass",
        "Plant, fabrication ya maintenance ka experience rakhne wale",
        "ITI fresher, helper aur trainee ke kaam ke liye",
      ],
      send: ["ITI certificate aur marksheet", "Experience ka koi letter ya salary slip", "Apne kiye kaam ki photos"],
      faqs: [
        {
          question: "Aap kin trades ke log rakhte hain?",
          answer:
            "Mainly welder, fitter, gas cutter aur electrician, aur maintenance helper. Apna trade aur jin machines ya kaam par haath chalaya hai, woh bataiye.",
          category: "operations",
        },
        {
          question: "Kya ITI fresher apply kar sakte hain?",
          answer: "Haan. Kuch sites ITI fresher ko helper ya trainee ke taur par rakhti hain. Apna ITI certificate bhejiye aur trade bataiye.",
          category: "operations",
        },
        {
          question: "Kya kaam pakka hai?",
          answer:
            "Kuch kaam lagataar chalta hai aur kuch kisi project ya shutdown ke liye hota hai. Join karne se pehle hum batate hain ki kaam kya hai aur kitne time chalne ki ummeed hai.",
          category: "operations",
        },
      ],
    },
  ],
};

export function getJobRole(slug: string, locale: Locale) {
  return jobRoles[locale].find((r) => r.slug === slug);
}

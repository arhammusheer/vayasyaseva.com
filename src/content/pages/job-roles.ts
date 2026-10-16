import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";
import type { JobRole } from "@/lib/talent-intake/rules";

/**
 * Role pages under /jobs/<slug> in every locale: one per kind of work
 * people search for, each with the jobs form tagged with its role. They are
 * about the kind of work, not vacancies, so no JobPosting markup (Google
 * allows it only for a real, open position).
 *
 * One job per page: a one-sentence lede that says who the work suits, the
 * form, the duties, two or three questions about this work only, and three
 * related roles. Fees, shifts and pay each have one home elsewhere (the
 * form's lines, /jobs/fees-and-fraud and the /jobs/haridwar FAQ).
 *
 * Claims discipline: no pay figures, no promised call-back times, no
 * guarantee of work. hi-IN and hi-Latn-IN are drafts pending native review;
 * spellings follow docs/hindi-glossary.md.
 */
export interface JobRoleCopy {
  slug: JobRole;
  /** Short name for breadcrumbs and links. */
  name: string;
  metaTitle: string;
  description: string;
  heading: string;
  /** One sentence: the work, and who it suits. */
  lede: string;
  /** The duties, shown as a numbered strip. */
  work: string[];
  faqs: FaqItem[];
}

export interface JobRoleLabels {
  workHeading: string;
  related: string;
  allJobs: string;
  faqTitle: string;
}

export const jobRoleLabels: Record<Locale, JobRoleLabels> = {
  "en-IN": { workHeading: "The work.", related: "Related work", allJobs: "All jobs", faqTitle: "Questions." },
  "hi-IN": { workHeading: "काम क्या है।", related: "मिलते-जुलते काम", allJobs: "सभी नौकरियाँ", faqTitle: "सवाल।" },
  "hi-Latn-IN": { workHeading: "Kaam kya hai.", related: "Milte-julte kaam", allJobs: "Saari naukriyan", faqTitle: "Sawaal." },
};

/** Three related roles per role page, closest first. */
export const RELATED_ROLES: Record<JobRole, [JobRole, JobRole, JobRole]> = {
  "factory-helper": ["packing", "warehouse", "machine-operator"],
  packing: ["factory-helper", "warehouse", "machine-operator"],
  "machine-operator": ["factory-helper", "packing", "iti-trades"],
  warehouse: ["forklift-operator", "packing", "factory-helper"],
  "forklift-operator": ["warehouse", "machine-operator", "factory-helper"],
  "data-entry-operator": ["warehouse", "packing", "factory-helper"],
  housekeeping: ["factory-helper", "packing", "warehouse"],
  "iti-trades": ["electrician", "welder", "fitter"],
  electrician: ["fitter", "welder", "iti-trades"],
  welder: ["fitter", "electrician", "iti-trades"],
  fitter: ["welder", "electrician", "machine-operator"],
};

export const jobRoles: Record<Locale, JobRoleCopy[]> = {
  "en-IN": [
    {
      slug: "factory-helper",
      name: "Factory helper",
      metaTitle: "Factory Helper Jobs in SIDCUL Haridwar",
      description: "Factory helper and production helper jobs in SIDCUL and across Haridwar: line work, material handling and packing. Apply online. There is no fee to apply.",
      heading: "Factory helper jobs in SIDCUL Haridwar.",
      lede: "Production helper work on the factory line, open to freshers and to anyone who has worked on a line.",
      work: [
        "Feeding and assisting on production lines",
        "Moving material between stores and the line",
        "Packing, labelling and simple quality checks",
        "Keeping the work area clean and safe",
      ],
      faqs: [
        {
          question: "Do I need experience for a factory helper job?",
          answer: "Often not. Many helper roles are open to freshers, and the site teaches the work on the first day. If you have worked in a factory before, tell us where and what you did.",
          category: "operations",
        },
        {
          question: "Do I need safety shoes?",
          answer: "Factories ask you to follow safety rules and wear safety shoes and gloves on the floor. We tell you what to bring before you join.",
          category: "operations",
        },
      ],
    },
    {
      slug: "packing",
      name: "Packing jobs",
      metaTitle: "Packing Jobs in SIDCUL Haridwar: Pharma and FMCG",
      description: "Packing jobs in SIDCUL and across Haridwar: line packing, cartons, labelling and checks at pharma and FMCG plants. Apply online. There is no fee to apply.",
      heading: "Packing jobs in SIDCUL Haridwar.",
      lede: "Packing, labelling and checks on factory lines, open to freshers and to people with packing experience.",
      work: [
        "Packing products into cartons, cases and pouches on the line",
        "Labelling, batch coding and checking the print",
        "Counting, weighing and sealing",
        "Checking packs and setting aside damaged ones",
        "Stacking finished cases for dispatch",
      ],
      faqs: [
        {
          question: "Do I need experience for a packing job?",
          answer: "Usually not. Most packing work is taught at the site. If you have packed at a pharma or FMCG plant before, tell us where; some sites prefer that experience.",
          category: "operations",
        },
        {
          question: "Can women apply for packing jobs?",
          answer: "Yes. Packing roles are open to women and men. Tell us which shifts you can work, and we tell you the site's shift timings before you join.",
          category: "operations",
        },
        {
          question: "What is different about pharma packing?",
          answer: "Pharma packing areas follow clean-room rules: special clothing, hand hygiene, no phones on the floor and careful batch records. The site teaches you these on the first day.",
          category: "operations",
        },
      ],
    },
    {
      slug: "machine-operator",
      name: "Machine operator",
      metaTitle: "Machine Operator Jobs in SIDCUL Haridwar",
      description: "Machine operator jobs in SIDCUL and across Haridwar: packing, moulding, press and production machines at plants. Apply online. There is no fee to apply.",
      heading: "Machine operator jobs in SIDCUL Haridwar.",
      lede: "Running production and packing machines, for people who have run a machine or helped an operator.",
      work: [
        "Running packing machines: blister, filling, sealing and cartoning",
        "Injection moulding, press and other production machines",
        "Loading material, starting up and changing over",
        "Checking output against the standard and recording counts",
        "Reporting faults and keeping the machine area clean",
      ],
      faqs: [
        {
          question: "Which machines do you hire operators for?",
          answer: "It depends on the site: packing machines at pharma and FMCG plants, moulding and press machines at component plants, and other production machines. Tell us the machines you know and for how long.",
          category: "operations",
        },
        {
          question: "Can a helper become a machine operator?",
          answer: "Often, yes. Helpers who have assisted on a machine fit trainee operator roles well. Tell us which machine you worked beside.",
          category: "operations",
        },
        {
          question: "Do you hire CNC or VMC operators?",
          answer: "When a site needs them. Tell us the machines you have run, the parts you made and whether you can set up a job or only run it.",
          category: "operations",
        },
      ],
    },
    {
      slug: "warehouse",
      name: "Warehouse jobs",
      metaTitle: "Warehouse Jobs in SIDCUL Haridwar: Loading, Picking",
      description: "Warehouse jobs in SIDCUL and across Haridwar: loading, unloading, picking, packing, stacking and dispatch. Apply online. There is no fee to apply.",
      heading: "Warehouse jobs in SIDCUL Haridwar.",
      lede: "Loading, unloading, picking and dispatch, for freshers fit for physical work and people with store experience.",
      work: [
        "Loading and unloading trucks",
        "Picking and packing orders",
        "Stacking, racking and keeping stock in order",
        "Dispatch and staging",
        "Forklift and MHE work, for those with experience",
      ],
      faqs: [
        {
          question: "Is there night shift work in warehouses?",
          answer: "Some warehouses work at night or on peak days. We tell you the shift before you join, so tell us if you can or cannot do nights.",
          category: "operations",
        },
        {
          question: "Do you hire forklift operators?",
          answer: "Yes, when a site needs them. Send a photo of your licence and tell us how long you have operated a forklift or other MHE.",
          category: "operations",
        },
      ],
    },
    {
      slug: "forklift-operator",
      name: "Forklift operator",
      metaTitle: "Forklift Operator Jobs in SIDCUL Haridwar",
      description: "Forklift operator jobs in SIDCUL and across Haridwar: loading and stacking in warehouses and plants, for experienced operators. There is no fee to apply.",
      heading: "Forklift operator jobs in SIDCUL Haridwar.",
      lede: "Loading and stacking by forklift in warehouses and plants, for operators with experience and a driving licence.",
      work: [
        "Loading and unloading trucks by forklift",
        "Moving pallets between docks, stores and the line",
        "Stacking and taking down pallets on racks",
        "Checking the forklift before each shift",
        "Following site traffic and safety rules",
      ],
      faqs: [
        {
          question: "What do I need for a forklift operator job?",
          answer: "Experience operating a forklift, and the documents sites usually ask for: a driving licence and, if you have one, a forklift training certificate. Tell us which types you have run.",
          category: "operations",
        },
        {
          question: "Can I apply without forklift experience?",
          answer: "Operator roles need experience. If you are new, apply for warehouse work instead; some sites train warehouse staff on forklifts over time.",
          category: "operations",
        },
      ],
    },
    {
      slug: "data-entry-operator",
      name: "Data entry operator",
      metaTitle: "Data Entry Operator Jobs in Haridwar (ERP, SAP)",
      description: "Data entry operator (DEO) jobs in SIDCUL and across Haridwar: computer entry in ERP systems such as SAP for stores, dispatch and production. No fee.",
      heading: "Data entry operator jobs in Haridwar.",
      lede: "Computer entries in ERP systems such as SAP at factories and warehouses, for 12th pass or graduates who can type and use Excel.",
      work: [
        "Stores and inventory entries: receipts, issues, stock",
        "Dispatch, gate entry and delivery documents",
        "Production and attendance records",
        "Office records and simple reports in Excel",
      ],
      faqs: [
        {
          question: "Do I need SAP experience?",
          answer: "It helps, but many sites don't require it. Tell us which systems you have used (SAP, Tally, another ERP or only Excel) and the modules or screens you worked on.",
          category: "operations",
        },
        {
          question: "Do I need computer skills for data entry?",
          answer: "Basic typing and comfort with a computer, and Excel if you know it. Tell us your typing speed if you know it; the site may give a short test.",
          category: "operations",
        },
        {
          question: "Is this an office job?",
          answer: "Mostly. You work at a computer in the plant's office, stores or dispatch area, sometimes checking material or documents on the floor.",
          category: "operations",
        },
      ],
    },
    {
      slug: "housekeeping",
      name: "Housekeeping",
      metaTitle: "Housekeeping Jobs in SIDCUL Haridwar",
      description: "Housekeeping jobs in SIDCUL and across Haridwar: factories, offices, canteens and campuses. For men and women. Apply online. There is no fee to apply.",
      heading: "Housekeeping jobs in SIDCUL Haridwar.",
      lede: "Housekeeping at factories, offices, canteens and campuses, for men and women, freshers or experienced.",
      work: [
        "Cleaning shopfloors, offices and common areas",
        "Washroom upkeep",
        "Pantry and canteen help",
        "Gardening and grounds work",
      ],
      faqs: [
        {
          question: "Are there housekeeping jobs for women?",
          answer: "Yes. Many sites have housekeeping roles for women. Tell us your preferred shift and the area you live in.",
          category: "operations",
        },
        {
          question: "Do I need experience?",
          answer: "No. Sites explain their routines and the cleaning materials they use. Experience in a factory, hospital or hotel is useful to mention.",
          category: "operations",
        },
      ],
    },
    {
      slug: "iti-trades",
      name: "ITI trades",
      metaTitle: "SIDCUL Haridwar ITI Jobs: Welder, Fitter, Electrician",
      description: "Jobs for ITI welders, fitters and electricians in SIDCUL and across Haridwar: fabrication, installation and maintenance work. Apply online. No fee.",
      heading: "ITI jobs in SIDCUL Haridwar: welder, fitter, electrician.",
      lede: "Fabrication, installation and maintenance work at plants, for ITI pass in welder, fitter, electrician or a related trade.",
      work: [
        "Welding and gas cutting for fabrication (MS and SS)",
        "Fitting and installation of structures and equipment",
        "Electrical maintenance and wiring support",
        "Breakdown and shutdown maintenance",
      ],
      faqs: [
        {
          question: "Which trades do you hire?",
          answer: "Mainly welders, fitters, gas cutters and electricians, plus maintenance helpers. Tell us your trade and the machines or processes you have worked on.",
          category: "operations",
        },
        {
          question: "Can ITI freshers apply?",
          answer: "Yes. Some sites take ITI freshers as helpers or trainees. Send your ITI certificate and tell us your trade.",
          category: "operations",
        },
        {
          question: "Is the work permanent?",
          answer: "Some work is ongoing and some is for a project or shutdown. We tell you what the work is and how long it is expected to last before you join.",
          category: "operations",
        },
      ],
    },
    {
      slug: "electrician",
      name: "Electrician",
      metaTitle: "Electrician Jobs in SIDCUL Haridwar: ITI Electrician",
      description: "Electrician jobs in SIDCUL and across Haridwar: plant maintenance, wiring, motors and panels for ITI electricians. Apply online. There is no fee to apply.",
      heading: "Electrician jobs in SIDCUL Haridwar.",
      lede: "Maintenance and wiring at plants, for ITI electricians and wiremen, with or without plant experience.",
      work: [
        "Preventive and breakdown maintenance on plant equipment",
        "Wiring, cabling and lighting work",
        "Motors, starters and control panels",
        "Shutdown and project electrical work",
        "Following lockout and electrical safety steps",
      ],
      faqs: [
        {
          question: "Do I need an ITI to apply?",
          answer: "Most plant electrician roles ask for an ITI in electrician or wireman. Some helper roles take people with practical experience; tell us what you have done.",
          category: "operations",
        },
        {
          question: "Can ITI freshers apply?",
          answer: "Yes. Some sites take ITI freshers as electrical helpers or trainees. Send your ITI certificate.",
          category: "operations",
        },
        {
          question: "Is the work permanent?",
          answer: "Some work is ongoing maintenance and some is for a project or shutdown. We tell you what the work is and how long it is expected to last before you join.",
          category: "operations",
        },
      ],
    },
    {
      slug: "welder",
      name: "Welder",
      metaTitle: "Welder Jobs in SIDCUL Haridwar: Arc, MIG, TIG Welding",
      description: "Welder jobs in SIDCUL and across Haridwar: arc, MIG and TIG welding and gas cutting for fabrication and repair. Apply online. There is no fee to apply.",
      heading: "Welder jobs in SIDCUL Haridwar.",
      lede: "Fabrication and maintenance welding, for ITI welders and experienced welders who can show their work.",
      work: [
        "Arc, MIG and TIG welding on MS and SS",
        "Gas cutting and grinding",
        "Fabricating structures, frames and supports",
        "Repair welding during breakdowns and shutdowns",
        "Working to drawings and site safety rules, including hot work permits",
      ],
      faqs: [
        {
          question: "Which welding processes do sites need?",
          answer: "Mostly arc and MIG for fabrication, TIG for stainless steel and finer work, and gas cutting. Tell us which you know and on what metal.",
          category: "operations",
        },
        {
          question: "Can I apply without an ITI?",
          answer: "Yes, if you have welding experience. Send photos of your work and tell us where you have worked; some sites do a short trade test.",
          category: "operations",
        },
      ],
    },
    {
      slug: "fitter",
      name: "Fitter",
      metaTitle: "Fitter Jobs in SIDCUL Haridwar: Maintenance Fitter",
      description: "Fitter jobs in SIDCUL and across Haridwar: maintenance, machine fitting and installation for ITI fitters. Apply online. There is no fee to apply.",
      heading: "Fitter jobs in SIDCUL Haridwar.",
      lede: "Mechanical maintenance and fitting at plants, for ITI fitters and maintenance helpers ready to move up.",
      work: [
        "Mechanical maintenance of machines and conveyors",
        "Fitting, alignment and installation of equipment",
        "Changing bearings, belts, gears and seals",
        "Pipe fitting and fabrication support",
        "Breakdown repairs and shutdown work",
      ],
      faqs: [
        {
          question: "What kind of fitter work is it?",
          answer: "Mainly mechanical maintenance at plants, plus installation and pipe fitting on projects. Tell us the machines or systems you have worked on.",
          category: "operations",
        },
        {
          question: "Can ITI freshers apply?",
          answer: "Yes. Some sites take ITI fitter freshers as maintenance helpers or trainees. Send your ITI certificate.",
          category: "operations",
        },
        {
          question: "Is the work permanent?",
          answer: "Some work is ongoing maintenance and some is for a project or shutdown. We tell you what the work is and how long it is expected to last before you join.",
          category: "operations",
        },
      ],
    },
  ],
  "hi-IN": [
    {
      slug: "factory-helper",
      name: "फ़ैक्टरी हेल्पर",
      metaTitle: "सिडकुल हरिद्वार में फ़ैक्टरी हेल्पर की नौकरी",
      description: "सिडकुल और पूरे हरिद्वार में फ़ैक्टरी हेल्पर और प्रोडक्शन हेल्पर की नौकरी: लाइन का काम, माल उठाना-रखना और पैकिंग। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में फ़ैक्टरी हेल्पर की नौकरी।",
      lede: "फ़ैक्टरी की लाइन पर प्रोडक्शन हेल्पर का काम, फ़्रेशर और लाइन पर काम कर चुके लोगों के लिए।",
      work: [
        "प्रोडक्शन लाइन पर माल डालना और मदद करना",
        "स्टोर से लाइन तक माल लाना-ले जाना",
        "पैकिंग, लेबलिंग और आसान क्वालिटी चेक",
        "काम की जगह को साफ़ और सुरक्षित रखना",
      ],
      faqs: [
        {
          question: "क्या फ़ैक्टरी हेल्पर के लिए अनुभव ज़रूरी है?",
          answer: "अक्सर नहीं। हेल्पर के कई काम फ़्रेशर के लिए भी हैं, और पहले दिन काम सिखाया जाता है। पहले किसी फ़ैक्टरी में काम किया है तो बताइए कहाँ और क्या किया।",
          category: "operations",
        },
        {
          question: "क्या सेफ़्टी जूते चाहिए?",
          answer: "फ़ैक्टरी में सेफ़्टी नियम मानने होते हैं और फ़्लोर पर सेफ़्टी जूते और दस्ताने पहनने होते हैं। क्या लाना है, जॉइन से पहले हम बताते हैं।",
          category: "operations",
        },
      ],
    },
    {
      slug: "packing",
      name: "पैकिंग की नौकरी",
      metaTitle: "सिडकुल हरिद्वार में पैकिंग की नौकरी: फ़ार्मा, FMCG और लाइन पैकिंग",
      description: "सिडकुल और पूरे हरिद्वार में पैकिंग की नौकरी: फ़ार्मा, FMCG और दूसरी फ़ैक्टरियों में लाइन पैकिंग, कार्टन, लेबलिंग और चेकिंग। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में पैकिंग की नौकरी।",
      lede: "फ़ैक्टरी की लाइन पर पैकिंग, लेबलिंग और चेकिंग, फ़्रेशर और पैकिंग का अनुभव रखने वालों के लिए।",
      work: [
        "लाइन पर माल को कार्टन, केस और पाउच में पैक करना",
        "लेबल लगाना, बैच कोडिंग और प्रिंट चेक करना",
        "गिनती, तौल और सीलिंग",
        "पैक चेक करना और ख़राब पैक अलग रखना",
        "तैयार केस डिस्पैच के लिए लगाना",
      ],
      faqs: [
        {
          question: "क्या पैकिंग की नौकरी के लिए अनुभव ज़रूरी है?",
          answer: "आम तौर पर नहीं। पैकिंग का ज़्यादातर काम साइट पर सिखाया जाता है। पहले किसी फ़ार्मा या FMCG प्लांट में पैकिंग की है तो बताइए कहाँ; कुछ साइटें ऐसा अनुभव पसंद करती हैं।",
          category: "operations",
        },
        {
          question: "क्या महिलाएँ पैकिंग की नौकरी के लिए अप्लाई कर सकती हैं?",
          answer: "हाँ। पैकिंग का काम महिलाओं और पुरुषों दोनों के लिए है। बताइए आप किन शिफ्टों में काम कर सकती हैं, और जॉइन करने से पहले हम साइट की शिफ्ट का समय बताते हैं।",
          category: "operations",
        },
        {
          question: "फ़ार्मा पैकिंग में क्या अलग होता है?",
          answer: "फ़ार्मा पैकिंग में क्लीन-रूम के नियम चलते हैं: ख़ास कपड़े, हाथों की सफ़ाई, फ़्लोर पर फ़ोन नहीं और बैच का पूरा रिकॉर्ड। पहले दिन ये सब सिखाया जाता है।",
          category: "operations",
        },
      ],
    },
    {
      slug: "machine-operator",
      name: "मशीन ऑपरेटर",
      metaTitle: "सिडकुल हरिद्वार में मशीन ऑपरेटर की नौकरी",
      description: "सिडकुल और पूरे हरिद्वार में मशीन ऑपरेटर की नौकरी: प्लांट में पैकिंग, मोल्डिंग, प्रेस और प्रोडक्शन मशीनें। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में मशीन ऑपरेटर की नौकरी।",
      lede: "प्रोडक्शन और पैकिंग मशीनें चलाना, उनके लिए जिन्होंने मशीन चलाई है या ऑपरेटर की मदद की है।",
      work: [
        "पैकिंग मशीनें चलाना: ब्लिस्टर, फ़िलिंग, सीलिंग और कार्टनिंग",
        "इंजेक्शन मोल्डिंग, प्रेस और दूसरी प्रोडक्शन मशीनें",
        "माल डालना, मशीन चालू करना और चेंजओवर",
        "माल को स्टैंडर्ड से मिलाना और गिनती लिखना",
        "ख़राबी बताना और मशीन की जगह साफ़ रखना",
      ],
      faqs: [
        {
          question: "आप किन मशीनों के लिए ऑपरेटर रखते हैं?",
          answer: "साइट पर निर्भर है: फ़ार्मा और FMCG प्लांट में पैकिंग मशीनें, कंपोनेंट प्लांट में मोल्डिंग और प्रेस मशीनें, और दूसरी प्रोडक्शन मशीनें। बताइए आप कौन-सी मशीनें जानते हैं और कितने समय से।",
          category: "operations",
        },
        {
          question: "क्या हेल्पर मशीन ऑपरेटर बन सकता है?",
          answer: "अक्सर हाँ। जिन हेल्परों ने मशीन पर मदद की है, वे ट्रेनी ऑपरेटर के लिए अच्छे रहते हैं। बताइए आप किस मशीन के साथ काम करते थे।",
          category: "operations",
        },
        {
          question: "क्या आप CNC या VMC ऑपरेटर रखते हैं?",
          answer: "जब किसी साइट को ज़रूरत हो। बताइए आपने कौन-सी मशीनें चलाई हैं, कौन-से पार्ट बनाए हैं, और आप जॉब सेट कर सकते हैं या सिर्फ़ चलाते हैं।",
          category: "operations",
        },
      ],
    },
    {
      slug: "warehouse",
      name: "वेयरहाउस की नौकरी",
      metaTitle: "सिडकुल हरिद्वार में वेयरहाउस की नौकरी: लोडिंग, पिकिंग, पैकिंग",
      description: "सिडकुल और पूरे हरिद्वार में वेयरहाउस की नौकरी: लोडिंग, अनलोडिंग, पिकिंग, पैकिंग, स्टैकिंग और डिस्पैच। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में वेयरहाउस की नौकरी।",
      lede: "लोडिंग, अनलोडिंग, पिकिंग और डिस्पैच, मेहनत का काम कर सकने वाले फ़्रेशर और स्टोर का अनुभव रखने वालों के लिए।",
      work: [
        "ट्रक में माल चढ़ाना और उतारना",
        "ऑर्डर का माल निकालना और पैक करना",
        "स्टैकिंग, रैकिंग और स्टॉक को सही जगह रखना",
        "डिस्पैच और स्टेजिंग",
        "फ़ोर्कलिफ़्ट और MHE का काम, अनुभव वालों के लिए",
      ],
      faqs: [
        {
          question: "क्या वेयरहाउस में रात की शिफ्ट होती है?",
          answer: "कुछ वेयरहाउस रात में या भीड़ वाले दिनों में काम करते हैं। शिफ्ट हम जॉइन करने से पहले बताते हैं, इसलिए बताइए कि आप रात में काम कर सकते हैं या नहीं।",
          category: "operations",
        },
        {
          question: "क्या आप फ़ोर्कलिफ़्ट ऑपरेटर रखते हैं?",
          answer: "हाँ, जब साइट को ज़रूरत हो। अपने लाइसेंस की फ़ोटो भेजिए और बताइए कि कितने समय से फ़ोर्कलिफ़्ट या दूसरी MHE चला रहे हैं।",
          category: "operations",
        },
      ],
    },
    {
      slug: "forklift-operator",
      name: "फ़ोर्कलिफ़्ट ऑपरेटर",
      metaTitle: "सिडकुल हरिद्वार में फ़ोर्कलिफ़्ट ऑपरेटर की नौकरी",
      description: "सिडकुल और पूरे हरिद्वार में फ़ोर्कलिफ़्ट ऑपरेटर की नौकरी: वेयरहाउस और प्लांट में माल की लोडिंग, स्टैकिंग और ढुलाई। अनुभवी ऑपरेटरों के लिए। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में फ़ोर्कलिफ़्ट ऑपरेटर की नौकरी।",
      lede: "वेयरहाउस और प्लांट में फ़ोर्कलिफ़्ट से लोडिंग और स्टैकिंग, अनुभव और ड्राइविंग लाइसेंस वाले ऑपरेटरों के लिए।",
      work: [
        "फ़ोर्कलिफ़्ट से ट्रक की लोडिंग और अनलोडिंग",
        "डॉक, स्टोर और लाइन के बीच पैलेट ले जाना",
        "रैक पर पैलेट लगाना और उतारना",
        "हर शिफ्ट से पहले फ़ोर्कलिफ़्ट चेक करना",
        "साइट के ट्रैफ़िक और सेफ़्टी नियम मानना",
      ],
      faqs: [
        {
          question: "फ़ोर्कलिफ़्ट ऑपरेटर की नौकरी के लिए क्या चाहिए?",
          answer: "फ़ोर्कलिफ़्ट चलाने का अनुभव, और वे कागज़ जो साइटें आम तौर पर माँगती हैं: ड्राइविंग लाइसेंस और, अगर हो, फ़ोर्कलिफ़्ट ट्रेनिंग सर्टिफ़िकेट। बताइए आपने कौन-सी फ़ोर्कलिफ़्ट चलाई हैं।",
          category: "operations",
        },
        {
          question: "क्या बिना फ़ोर्कलिफ़्ट अनुभव के अप्लाई कर सकते हैं?",
          answer: "ऑपरेटर के काम के लिए अनुभव चाहिए। नए हैं तो वेयरहाउस के काम के लिए अप्लाई कीजिए; कुछ साइटें समय के साथ वेयरहाउस स्टाफ़ को फ़ोर्कलिफ़्ट सिखाती हैं।",
          category: "operations",
        },
      ],
    },
    {
      slug: "data-entry-operator",
      name: "डेटा एंट्री ऑपरेटर",
      metaTitle: "हरिद्वार में डेटा एंट्री ऑपरेटर की नौकरी (ERP, SAP)",
      description: "सिडकुल और पूरे हरिद्वार में डेटा एंट्री ऑपरेटर (DEO) की नौकरी: स्टोर, डिस्पैच और प्रोडक्शन के लिए SAP जैसे ERP में कंप्यूटर एंट्री। कोई फ़ीस नहीं।",
      heading: "हरिद्वार में डेटा एंट्री ऑपरेटर की नौकरी।",
      lede: "फ़ैक्टरी और वेयरहाउस में SAP जैसे ERP पर कंप्यूटर एंट्री, टाइपिंग और Excel जानने वाले 12वीं पास या ग्रेजुएट के लिए।",
      work: [
        "स्टोर और इन्वेंटरी की एंट्री: माल आना, जाना, स्टॉक",
        "डिस्पैच, गेट एंट्री और डिलीवरी के कागज़",
        "प्रोडक्शन और हाज़िरी के रिकॉर्ड",
        "ऑफ़िस के रिकॉर्ड और Excel में आसान रिपोर्ट",
      ],
      faqs: [
        {
          question: "क्या SAP का अनुभव ज़रूरी है?",
          answer: "हो तो अच्छा है, पर कई साइट पर ज़रूरी नहीं। बताइए आपने कौन-से सिस्टम चलाए हैं (SAP, Tally, कोई और ERP या सिर्फ़ Excel) और किन मॉड्यूल या स्क्रीन पर काम किया।",
          category: "operations",
        },
        {
          question: "क्या डेटा एंट्री के लिए कंप्यूटर आना ज़रूरी है?",
          answer: "बेसिक टाइपिंग और कंप्यूटर चलाना, और Excel आता हो तो अच्छा। अपनी टाइपिंग स्पीड पता हो तो बताइए; साइट छोटा टेस्ट ले सकती है।",
          category: "operations",
        },
        {
          question: "क्या यह ऑफ़िस का काम है?",
          answer: "ज़्यादातर। आप प्लांट के ऑफ़िस, स्टोर या डिस्पैच एरिया में कंप्यूटर पर काम करते हैं, कभी-कभी फ़्लोर पर माल या कागज़ मिलाते हैं।",
          category: "operations",
        },
      ],
    },
    {
      slug: "housekeeping",
      name: "हाउसकीपिंग",
      metaTitle: "सिडकुल हरिद्वार में हाउसकीपिंग की नौकरी",
      description: "सिडकुल और पूरे हरिद्वार में हाउसकीपिंग की नौकरी: फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस। पुरुष और महिलाएँ दोनों। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में हाउसकीपिंग की नौकरी।",
      lede: "फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस में हाउसकीपिंग, पुरुषों और महिलाओं के लिए, फ़्रेशर हों या अनुभवी।",
      work: [
        "शॉपफ़्लोर, ऑफ़िस और कॉमन एरिया की सफ़ाई",
        "वॉशरूम की देखभाल",
        "पैंट्री और कैंटीन में मदद",
        "बाग़वानी और ग्राउंड का काम",
      ],
      faqs: [
        {
          question: "क्या महिलाओं के लिए हाउसकीपिंग की नौकरी है?",
          answer: "हाँ। कई साइट पर महिलाओं के लिए हाउसकीपिंग का काम है। अपनी पसंद की शिफ्ट और अपना इलाक़ा बताइए।",
          category: "operations",
        },
        {
          question: "क्या अनुभव ज़रूरी है?",
          answer: "नहीं। साइट अपना तरीक़ा और सफ़ाई का सामान समझाती है। फ़ैक्टरी, अस्पताल या होटल में काम किया हो तो ज़रूर बताइए।",
          category: "operations",
        },
      ],
    },
    {
      slug: "iti-trades",
      name: "ITI ट्रेड",
      metaTitle: "सिडकुल हरिद्वार में ITI की नौकरी: वेल्डर, फ़िटर, इलेक्ट्रीशियन",
      description: "सिडकुल और पूरे हरिद्वार में ITI वेल्डर, फ़िटर और इलेक्ट्रीशियन की नौकरी: फ़ैब्रिकेशन, इंस्टॉलेशन और मेंटेनेंस। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में ITI की नौकरी: वेल्डर, फ़िटर, इलेक्ट्रीशियन।",
      lede: "प्लांट में फ़ैब्रिकेशन, इंस्टॉलेशन और मेंटेनेंस का काम, वेल्डर, फ़िटर, इलेक्ट्रीशियन या मिलते-जुलते ट्रेड में ITI पास के लिए।",
      work: [
        "फ़ैब्रिकेशन के लिए वेल्डिंग और गैस कटिंग (MS और SS)",
        "स्ट्रक्चर और मशीनों की फ़िटिंग और इंस्टॉलेशन",
        "इलेक्ट्रिकल मेंटेनेंस और वायरिंग में मदद",
        "ब्रेकडाउन और शटडाउन मेंटेनेंस",
      ],
      faqs: [
        {
          question: "आप किन ट्रेड के लोग रखते हैं?",
          answer: "मुख्य रूप से वेल्डर, फ़िटर, गैस कटर और इलेक्ट्रीशियन, और मेंटेनेंस हेल्पर। अपना ट्रेड और जिन मशीनों या काम पर हाथ चलाया है, वह बताइए।",
          category: "operations",
        },
        {
          question: "क्या ITI फ़्रेशर अप्लाई कर सकते हैं?",
          answer: "हाँ। कुछ साइट ITI फ़्रेशर को हेल्पर या ट्रेनी के तौर पर रखती हैं। अपना ITI सर्टिफ़िकेट भेजिए और ट्रेड बताइए।",
          category: "operations",
        },
        {
          question: "क्या काम पक्का है?",
          answer: "कुछ काम लगातार चलता है और कुछ किसी प्रोजेक्ट या शटडाउन के लिए होता है। जॉइन करने से पहले हम बताते हैं कि काम क्या है और कितने समय चलने की उम्मीद है।",
          category: "operations",
        },
      ],
    },
    {
      slug: "electrician",
      name: "इलेक्ट्रीशियन",
      metaTitle: "सिडकुल हरिद्वार में इलेक्ट्रीशियन की नौकरी: ITI इलेक्ट्रीशियन वैकेंसी",
      description: "सिडकुल और पूरे हरिद्वार में इलेक्ट्रीशियन की नौकरी: ITI इलेक्ट्रीशियन के लिए प्लांट मेंटेनेंस, वायरिंग, मोटर और पैनल का काम। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में इलेक्ट्रीशियन की नौकरी।",
      lede: "प्लांट में मेंटेनेंस और वायरिंग का काम, ITI इलेक्ट्रीशियन और वायरमैन के लिए, प्लांट के अनुभव के साथ या बिना।",
      work: [
        "प्लांट की मशीनों का रूटीन और ब्रेकडाउन मेंटेनेंस",
        "वायरिंग, केबलिंग और लाइटिंग का काम",
        "मोटर, स्टार्टर और कंट्रोल पैनल",
        "शटडाउन और प्रोजेक्ट का इलेक्ट्रिकल काम",
        "लॉकआउट और बिजली की सेफ़्टी के नियम मानना",
      ],
      faqs: [
        {
          question: "क्या अप्लाई करने के लिए ITI ज़रूरी है?",
          answer: "प्लांट में इलेक्ट्रीशियन के ज़्यादातर कामों के लिए इलेक्ट्रीशियन या वायरमैन में ITI माँगा जाता है। हेल्पर के कुछ कामों में हाथ का अनुभव भी चलता है; बताइए आपने क्या काम किया है।",
          category: "operations",
        },
        {
          question: "क्या ITI फ़्रेशर अप्लाई कर सकते हैं?",
          answer: "हाँ। कुछ साइटें ITI फ़्रेशर को इलेक्ट्रिकल हेल्पर या ट्रेनी के तौर पर रखती हैं। अपना ITI सर्टिफ़िकेट भेजिए।",
          category: "operations",
        },
        {
          question: "क्या काम पक्का है?",
          answer: "कुछ काम लगातार चलने वाला मेंटेनेंस है और कुछ किसी प्रोजेक्ट या शटडाउन के लिए। जॉइन करने से पहले हम बताते हैं कि काम क्या है और कितने समय चलने की उम्मीद है।",
          category: "operations",
        },
      ],
    },
    {
      slug: "welder",
      name: "वेल्डर",
      metaTitle: "सिडकुल हरिद्वार में वेल्डर की नौकरी: आर्क, MIG, TIG और गैस कटिंग",
      description: "सिडकुल और पूरे हरिद्वार में वेल्डर की नौकरी: फ़ैब्रिकेशन और मेंटेनेंस के लिए आर्क, MIG और TIG वेल्डिंग और गैस कटिंग। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में वेल्डर की नौकरी।",
      lede: "फ़ैब्रिकेशन और मेंटेनेंस की वेल्डिंग, ITI वेल्डर और अपना काम दिखा सकने वाले अनुभवी वेल्डरों के लिए।",
      work: [
        "MS और SS पर आर्क, MIG और TIG वेल्डिंग",
        "गैस कटिंग और ग्राइंडिंग",
        "स्ट्रक्चर, फ़्रेम और सपोर्ट बनाना",
        "ब्रेकडाउन और शटडाउन में रिपेयर वेल्डिंग",
        "ड्रॉइंग के हिसाब से काम, और हॉट वर्क परमिट समेत साइट के सेफ़्टी नियम",
      ],
      faqs: [
        {
          question: "साइटों पर कौन-सी वेल्डिंग चाहिए?",
          answer: "ज़्यादातर फ़ैब्रिकेशन के लिए आर्क और MIG, स्टेनलेस स्टील और बारीक काम के लिए TIG, और गैस कटिंग। बताइए आप कौन-सी जानते हैं और किस धातु पर।",
          category: "operations",
        },
        {
          question: "क्या बिना ITI के अप्लाई कर सकते हैं?",
          answer: "हाँ, अगर वेल्डिंग का अनुभव है। अपने काम की फ़ोटो भेजिए और बताइए कहाँ काम किया है; कुछ साइटें छोटा ट्रेड टेस्ट लेती हैं।",
          category: "operations",
        },
      ],
    },
    {
      slug: "fitter",
      name: "फ़िटर",
      metaTitle: "सिडकुल हरिद्वार में फ़िटर की नौकरी: मेंटेनेंस और मैकेनिकल फ़िटर",
      description: "सिडकुल और पूरे हरिद्वार में फ़िटर की नौकरी: ITI फ़िटर के लिए मैकेनिकल मेंटेनेंस, मशीन फ़िटिंग और इंस्टॉलेशन। ऑनलाइन आवेदन करें। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में फ़िटर की नौकरी।",
      lede: "प्लांट में मैकेनिकल मेंटेनेंस और फ़िटिंग, ITI फ़िटर और आगे बढ़ना चाहने वाले मेंटेनेंस हेल्पर के लिए।",
      work: [
        "मशीनों और कन्वेयर का मैकेनिकल मेंटेनेंस",
        "मशीनों की फ़िटिंग, अलाइनमेंट और इंस्टॉलेशन",
        "बेयरिंग, बेल्ट, गियर और सील बदलना",
        "पाइप फ़िटिंग और फ़ैब्रिकेशन में मदद",
        "ब्रेकडाउन रिपेयर और शटडाउन का काम",
      ],
      faqs: [
        {
          question: "फ़िटर का काम किस तरह का है?",
          answer: "ज़्यादातर प्लांट में मैकेनिकल मेंटेनेंस, और प्रोजेक्ट पर इंस्टॉलेशन और पाइप फ़िटिंग। बताइए आपने किन मशीनों या सिस्टम पर काम किया है।",
          category: "operations",
        },
        {
          question: "क्या ITI फ़्रेशर अप्लाई कर सकते हैं?",
          answer: "हाँ। कुछ साइटें ITI फ़िटर फ़्रेशर को मेंटेनेंस हेल्पर या ट्रेनी के तौर पर रखती हैं। अपना ITI सर्टिफ़िकेट भेजिए।",
          category: "operations",
        },
        {
          question: "क्या काम पक्का है?",
          answer: "कुछ काम लगातार चलने वाला मेंटेनेंस है और कुछ किसी प्रोजेक्ट या शटडाउन के लिए। जॉइन करने से पहले हम बताते हैं कि काम क्या है और कितने समय चलने की उम्मीद है।",
          category: "operations",
        },
      ],
    },
  ],
  "hi-Latn-IN": [
    {
      slug: "factory-helper",
      name: "Factory helper",
      metaTitle: "SIDCUL Haridwar mein Factory Helper Job",
      description: "SIDCUL aur poore Haridwar mein factory helper aur production helper ki naukri: line ka kaam, maal uthana-rakhna aur packing. Online apply karein. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein factory helper ki naukri.",
      lede: "Factory ki line par production helper ka kaam, fresher aur line par kaam kar chuke logon ke liye.",
      work: [
        "Production line par maal daalna aur madad karna",
        "Store se line tak maal lana-le jana",
        "Packing, labelling aur aasaan quality check",
        "Kaam ki jagah ko saaf aur safe rakhna",
      ],
      faqs: [
        {
          question: "Kya factory helper ke liye experience zaroori hai?",
          answer: "Aksar nahi. Helper ke kai kaam fresher ke liye bhi hain, aur pehle din kaam sikhaya jaata hai. Pehle kisi factory mein kaam kiya hai to bataiye kahan aur kya kiya.",
          category: "operations",
        },
        {
          question: "Kya safety shoes chahiye?",
          answer: "Factory mein safety rules maanne hote hain aur floor par safety shoes aur gloves pehnne hote hain. Kya lana hai, join se pehle hum batate hain.",
          category: "operations",
        },
      ],
    },
    {
      slug: "packing",
      name: "Packing job",
      metaTitle: "SIDCUL Haridwar mein Packing Job: Pharma aur FMCG",
      description: "Packing job SIDCUL Haridwar mein. Koi fee nahi. Poori 8 ghante ki shift. Pharma, FMCG factories mein line packing, carton, labelling. Online apply karein.",
      heading: "SIDCUL Haridwar mein packing ki naukri.",
      lede: "Factory ki line par packing, labelling aur checking, fresher aur packing ka experience rakhne walon ke liye.",
      work: [
        "Line par maal ko carton, case aur pouch mein pack karna",
        "Label lagana, batch coding aur print check karna",
        "Ginti, taul aur sealing",
        "Pack check karna aur kharab pack alag rakhna",
        "Taiyaar case dispatch ke liye lagana",
      ],
      faqs: [
        {
          question: "Kya packing job ke liye experience zaroori hai?",
          answer: "Aam taur par nahi. Packing ka zyada kaam site par sikhaya jaata hai. Pehle kisi pharma ya FMCG plant mein packing ki hai to bataiye kahan; kuch sites aisa experience pasand karti hain.",
          category: "operations",
        },
        {
          question: "Kya ladies packing job ke liye apply kar sakti hain?",
          answer: "Haan. Packing ka kaam mahilaon aur purushon dono ke liye hai. Bataiye aap kin shifts mein kaam kar sakti hain, aur join karne se pehle hum site ki shift timing batate hain.",
          category: "operations",
        },
        {
          question: "Pharma packing mein kya alag hota hai?",
          answer: "Pharma packing mein clean-room ke rules chalte hain: khaas kapde, haathon ki safai, floor par phone nahi aur batch ka poora record. Pehle din ye sab sikhaya jaata hai.",
          category: "operations",
        },
      ],
    },
    {
      slug: "machine-operator",
      name: "Machine operator",
      metaTitle: "SIDCUL Haridwar mein Machine Operator Job",
      description: "SIDCUL aur poore Haridwar mein machine operator ki naukri: plants mein packing, moulding, press aur production machines. Online apply karein. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein machine operator ki naukri.",
      lede: "Production aur packing machines chalana, unke liye jinhone machine chalayi hai ya operator ki madad ki hai.",
      work: [
        "Packing machines chalana: blister, filling, sealing aur cartoning",
        "Injection moulding, press aur dusri production machines",
        "Maal daalna, machine start karna aur changeover",
        "Output ko standard se milana aur ginti likhna",
        "Kharabi batana aur machine ki jagah saaf rakhna",
      ],
      faqs: [
        {
          question: "Aap kin machines ke liye operator rakhte hain?",
          answer: "Site par depend karta hai: pharma aur FMCG plants mein packing machines, component plants mein moulding aur press machines, aur dusri production machines. Bataiye aap kaun-si machines jaante hain aur kitne time se.",
          category: "operations",
        },
        {
          question: "Kya helper machine operator ban sakta hai?",
          answer: "Aksar haan. Jin helpers ne machine par madad ki hai, woh trainee operator ke liye achhe rehte hain. Bataiye aap kis machine ke saath kaam karte the.",
          category: "operations",
        },
        {
          question: "Kya aap CNC ya VMC operator rakhte hain?",
          answer: "Jab kisi site ko zaroorat ho. Bataiye aapne kaun-si machines chalayi hain, kaun-se parts banaye hain, aur aap job set kar sakte hain ya sirf chalate hain.",
          category: "operations",
        },
      ],
    },
    {
      slug: "warehouse",
      name: "Warehouse job",
      metaTitle: "SIDCUL Haridwar mein Warehouse Job: Loading, Picking",
      description: "SIDCUL aur poore Haridwar mein warehouse ki naukri: loading, unloading, picking, packing, stacking aur dispatch. Online apply karein. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein warehouse ki naukri.",
      lede: "Loading, unloading, picking aur dispatch, mehnat ka kaam kar sakne wale fresher aur store ka experience rakhne walon ke liye.",
      work: [
        "Truck mein maal chadhana aur utaarna",
        "Order ka maal nikaalna aur pack karna",
        "Stacking, racking aur stock ko sahi jagah rakhna",
        "Dispatch aur staging",
        "Forklift aur MHE ka kaam, experience walon ke liye",
      ],
      faqs: [
        {
          question: "Kya warehouse mein night shift hoti hai?",
          answer: "Kuch warehouse raat mein ya peak dinon mein kaam karte hain. Shift hum join karne se pehle batate hain, isliye bataiye ki aap raat mein kaam kar sakte hain ya nahi.",
          category: "operations",
        },
        {
          question: "Kya aap forklift operator rakhte hain?",
          answer: "Haan, jab site ko zaroorat ho. Apne licence ki photo bhejiye aur bataiye ki kitne time se forklift ya doosri MHE chala rahe hain.",
          category: "operations",
        },
      ],
    },
    {
      slug: "forklift-operator",
      name: "Forklift operator",
      metaTitle: "SIDCUL Haridwar mein Forklift Operator Job",
      description: "Forklift operator job SIDCUL Haridwar mein. Koi fee nahi. Poori 8 ghante ki shift. Warehouse aur plant mein loading, stacking. Experienced operators ke liye.",
      heading: "SIDCUL Haridwar mein forklift operator ki naukri.",
      lede: "Warehouse aur plant mein forklift se loading aur stacking, experience aur driving licence wale operators ke liye.",
      work: [
        "Forklift se truck ki loading aur unloading",
        "Dock, store aur line ke beech pallet le jaana",
        "Rack par pallet lagana aur utaarna",
        "Har shift se pehle forklift check karna",
        "Site ke traffic aur safety rules maanna",
      ],
      faqs: [
        {
          question: "Forklift operator job ke liye kya chahiye?",
          answer: "Forklift chalane ka experience, aur woh kaagaz jo sites aam taur par maangti hain: driving licence aur, agar ho, forklift training certificate. Bataiye aapne kaun-si forklift chalayi hain.",
          category: "operations",
        },
        {
          question: "Kya bina forklift experience ke apply kar sakte hain?",
          answer: "Operator ke kaam ke liye experience chahiye. Naye hain to warehouse ke kaam ke liye apply kijiye; kuch sites time ke saath warehouse staff ko forklift sikhati hain.",
          category: "operations",
        },
      ],
    },
    {
      slug: "data-entry-operator",
      name: "Data entry operator",
      metaTitle: "Haridwar mein Data Entry Operator Job (ERP, SAP)",
      description: "SIDCUL aur poore Haridwar mein data entry operator (DEO) ki naukri: stores, dispatch aur production ke liye SAP jaise ERP mein computer entry. Koi fee nahi.",
      heading: "Haridwar mein data entry operator ki naukri.",
      lede: "Factory aur warehouse mein SAP jaise ERP par computer entry, typing aur Excel jaanne wale 12th pass ya graduate ke liye.",
      work: [
        "Stores aur inventory ki entry: maal aana, jaana, stock",
        "Dispatch, gate entry aur delivery ke documents",
        "Production aur attendance ke records",
        "Office ke records aur Excel mein aasaan reports",
      ],
      faqs: [
        {
          question: "Kya SAP ka experience zaroori hai?",
          answer: "Ho to achha hai, par kai sites par zaroori nahi. Bataiye aapne kaun-se system chalaye hain (SAP, Tally, koi aur ERP ya sirf Excel) aur kin modules ya screens par kaam kiya.",
          category: "operations",
        },
        {
          question: "Kya data entry ke liye computer aana zaroori hai?",
          answer: "Basic typing aur computer chalana, aur Excel aata ho to achha. Apni typing speed pata ho to bataiye; site chhota test le sakti hai.",
          category: "operations",
        },
        {
          question: "Kya ye office ka kaam hai?",
          answer: "Zyadatar. Aap plant ke office, store ya dispatch area mein computer par kaam karte hain, kabhi-kabhi floor par maal ya documents milaate hain.",
          category: "operations",
        },
      ],
    },
    {
      slug: "housekeeping",
      name: "Housekeeping",
      metaTitle: "SIDCUL Haridwar mein Housekeeping Job",
      description: "SIDCUL aur poore Haridwar mein housekeeping ki naukri: factory, office, canteen aur campus. Purush aur mahilaayein dono. Online apply karein. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein housekeeping ki naukri.",
      lede: "Factory, office, canteen aur campus mein housekeeping, purushon aur mahilaon ke liye, fresher hon ya experienced.",
      work: [
        "Shopfloor, office aur common area ki safai",
        "Washroom ki dekhbhaal",
        "Pantry aur canteen mein madad",
        "Gardening aur ground ka kaam",
      ],
      faqs: [
        {
          question: "Kya mahilaon ke liye housekeeping ki naukri hai?",
          answer: "Haan. Kai sites par mahilaon ke liye housekeeping ka kaam hai. Apni pasand ki shift aur apna ilaaka bataiye.",
          category: "operations",
        },
        {
          question: "Kya experience zaroori hai?",
          answer: "Nahi. Site apna tareeka aur safai ka samaan samjhati hai. Factory, hospital ya hotel mein kaam kiya ho to zaroor bataiye.",
          category: "operations",
        },
      ],
    },
    {
      slug: "iti-trades",
      name: "ITI trades",
      metaTitle: "SIDCUL Haridwar ITI Job: Welder, Fitter, Electrician",
      description: "SIDCUL aur poore Haridwar mein ITI welder, fitter aur electrician ki naukri: fabrication, installation aur maintenance. Online apply karein. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein ITI ki naukri: welder, fitter, electrician.",
      lede: "Plants mein fabrication, installation aur maintenance ka kaam, welder, fitter, electrician ya milte-julte trade mein ITI pass ke liye.",
      work: [
        "Fabrication ke liye welding aur gas cutting (MS aur SS)",
        "Structure aur machines ki fitting aur installation",
        "Electrical maintenance aur wiring mein madad",
        "Breakdown aur shutdown maintenance",
      ],
      faqs: [
        {
          question: "Aap kin trades ke log rakhte hain?",
          answer: "Mainly welder, fitter, gas cutter aur electrician, aur maintenance helper. Apna trade aur jin machines ya kaam par haath chalaya hai, woh bataiye.",
          category: "operations",
        },
        {
          question: "Kya ITI fresher apply kar sakte hain?",
          answer: "Haan. Kuch sites ITI fresher ko helper ya trainee ke taur par rakhti hain. Apna ITI certificate bhejiye aur trade bataiye.",
          category: "operations",
        },
        {
          question: "Kya kaam pakka hai?",
          answer: "Kuch kaam lagataar chalta hai aur kuch kisi project ya shutdown ke liye hota hai. Join karne se pehle hum batate hain ki kaam kya hai aur kitne time chalne ki ummeed hai.",
          category: "operations",
        },
      ],
    },
    {
      slug: "electrician",
      name: "Electrician",
      metaTitle: "SIDCUL Haridwar mein Electrician Job: ITI Electrician",
      description: "ITI electrician job SIDCUL Haridwar mein. Koi fee nahi. Poori 8 ghante ki shift. Plant maintenance, wiring, motor aur panel ka kaam. Online apply karein.",
      heading: "SIDCUL Haridwar mein electrician ki naukri.",
      lede: "Plants mein maintenance aur wiring ka kaam, ITI electrician aur wireman ke liye, plant ke experience ke saath ya bina.",
      work: [
        "Plant ki machines ka routine aur breakdown maintenance",
        "Wiring, cabling aur lighting ka kaam",
        "Motor, starter aur control panel",
        "Shutdown aur project ka electrical kaam",
        "Lockout aur bijli ki safety ke rules maanna",
      ],
      faqs: [
        {
          question: "Kya apply karne ke liye ITI zaroori hai?",
          answer: "Plant mein electrician ke zyada kaamon ke liye electrician ya wireman mein ITI maanga jaata hai. Helper ke kuch kaamon mein haath ka experience bhi chalta hai; bataiye aapne kya kaam kiya hai.",
          category: "operations",
        },
        {
          question: "Kya ITI fresher apply kar sakte hain?",
          answer: "Haan. Kuch sites ITI fresher ko electrical helper ya trainee ke taur par rakhti hain. Apna ITI certificate bhejiye.",
          category: "operations",
        },
        {
          question: "Kya kaam pakka hai?",
          answer: "Kuch kaam lagataar chalne wala maintenance hai aur kuch kisi project ya shutdown ke liye. Join karne se pehle hum batate hain ki kaam kya hai aur kitne time chalne ki ummeed hai.",
          category: "operations",
        },
      ],
    },
    {
      slug: "welder",
      name: "Welder",
      metaTitle: "SIDCUL Haridwar mein Welder Job: Arc, MIG, TIG Welding",
      description: "Welder job SIDCUL Haridwar mein. Koi fee nahi. Poori 8 ghante ki shift. Fabrication aur maintenance: arc, MIG, TIG welding aur gas cutting. Online apply.",
      heading: "SIDCUL Haridwar mein welder ki naukri.",
      lede: "Fabrication aur maintenance ki welding, ITI welder aur apna kaam dikha sakne wale experienced welders ke liye.",
      work: [
        "MS aur SS par arc, MIG aur TIG welding",
        "Gas cutting aur grinding",
        "Structure, frame aur support banana",
        "Breakdown aur shutdown mein repair welding",
        "Drawing ke hisaab se kaam, aur hot work permit samet site ke safety rules",
      ],
      faqs: [
        {
          question: "Sites par kaun-si welding chahiye?",
          answer: "Zyadatar fabrication ke liye arc aur MIG, stainless steel aur baareek kaam ke liye TIG, aur gas cutting. Bataiye aap kaun-si jaante hain aur kis metal par.",
          category: "operations",
        },
        {
          question: "Kya bina ITI ke apply kar sakte hain?",
          answer: "Haan, agar welding ka experience hai. Apne kaam ki photos bhejiye aur bataiye kahan kaam kiya hai; kuch sites chhota trade test leti hain.",
          category: "operations",
        },
      ],
    },
    {
      slug: "fitter",
      name: "Fitter",
      metaTitle: "SIDCUL Haridwar mein Fitter Job: Maintenance Fitter",
      description: "SIDCUL aur poore Haridwar mein fitter ki naukri: ITI fitter ke liye mechanical maintenance, machine fitting aur installation. Online apply karein. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein fitter ki naukri.",
      lede: "Plants mein mechanical maintenance aur fitting, ITI fitter aur aage badhna chahne wale maintenance helper ke liye.",
      work: [
        "Machines aur conveyor ka mechanical maintenance",
        "Machines ki fitting, alignment aur installation",
        "Bearing, belt, gear aur seal badalna",
        "Pipe fitting aur fabrication mein madad",
        "Breakdown repair aur shutdown ka kaam",
      ],
      faqs: [
        {
          question: "Fitter ka kaam kis tarah ka hai?",
          answer: "Zyadatar plant mein mechanical maintenance, aur project par installation aur pipe fitting. Bataiye aapne kin machines ya systems par kaam kiya hai.",
          category: "operations",
        },
        {
          question: "Kya ITI fresher apply kar sakte hain?",
          answer: "Haan. Kuch sites ITI fitter fresher ko maintenance helper ya trainee ke taur par rakhti hain. Apna ITI certificate bhejiye.",
          category: "operations",
        },
        {
          question: "Kya kaam pakka hai?",
          answer: "Kuch kaam lagataar chalne wala maintenance hai aur kuch kisi project ya shutdown ke liye. Join karne se pehle hum batate hain ki kaam kya hai aur kitne time chalne ki ummeed hai.",
          category: "operations",
        },
      ],
    },
  ],
};

export function getJobRole(slug: string, locale: Locale) {
  return jobRoles[locale].find((r) => r.slug === slug);
}

import type { LocationCopy } from "./types";

/**
 * Delhi NCR location pages: the hub and four industrial areas. Facts come
 * from the research of 16–17 Oct 2026, each cited in `sources` (official
 * first). Wage figures: Haryana notification of 9 Apr 2026 (from 1 Apr
 * 2026), UP order of 17 Apr 2026 (Category I), Delhi order of 15 Apr 2025.
 * No tenant names, registrations, headcount or shift patterns are claimed.
 */

const HR_WAGE = { label: "Haryana minimum wage notification No. 2/25/26-2 Lab, 9 Apr 2026 (gazette copy)", url: "https://www.sgcms.com/regulatory-updates/wp-content/uploads/2026/04/HAMWA2026Sep4.pdf" };
const HR_ENFORCE = { label: "Haryana Labour Department: order to enforce minimum wages, 5 Oct 2026", url: "https://storage.hrylabour.gov.in/uploads/labour_laws/Y2026/Oct/W1/D05/1791186016.pdf" };
const UP_WAGE = { label: "UP Labour Department: minimum wage order No. 374/36-2-2026-2041256, 17 Apr 2026", url: "https://uplabour.gov.in/MediaGallery/TickerScrolls/document-34.pdf" };
const DL_WAGE = { label: "Delhi Labour Department: minimum wage order of 15 Apr 2025", url: "https://labour.delhi.gov.in/sites/default/files/Labour/generic_multiple_files/da15april2025.pdf" };
const DL_RATES = { label: "Delhi Labour Department: current minimum wage rates", url: "https://labour.delhi.gov.in/labour/current-minimum-wage-rate" };
const HR_LWF = { label: "SCC Online: Haryana Labour Welfare Fund contribution revised, 2026", url: "https://www.scconline.com/blog/post/2026/05/11/haryana-labour-welfare-fund-contribution-revised-2026/" };
const DL_LWF = { label: "greytHR: Delhi Labour Welfare Fund rules", url: "https://www.greythr.com/wiki/acts/delhi-labour-welfare-fund-rules" };
const HR_LOCAL_HC = { label: "LiveLaw: High Court strikes down Haryana's 75% local quota, 17 Nov 2023", url: "https://www.livelaw.in/high-court/punjab-and-haryana-high-court/punjab-haryana-high-court-struck-down-75-reservation-for-haryana-domicile-in-private-sector-unconstitutional-242457" };
const HR_LOCAL_SC = { label: "LiveLaw: Supreme Court notice on Haryana's appeal, Feb 2024", url: "https://www.livelaw.in/top-stories/supreme-court-haryana-government-punjab-and-haryana-high-court-75-percent-domicile-quota-unconstitutional-248522" };
const GRAP = { label: "Commission for Air Quality Management: Graded Response Action Plan", url: "https://caqm.nic.in/index1.aspx?lsid=4217&lev=2&lid=4216&langid=1" };

const RULE_LINKS = {
  delhi: { href: "/minimum-wages/delhi", label: "Delhi minimum wages" },
  up: { href: "/minimum-wages/uttar-pradesh", label: "UP minimum wages" },
  haryana: { href: "/minimum-wages/haryana", label: "Haryana minimum wages" },
  compliance: { href: "/compliance", label: "How we handle compliance" },
};

export const delhiNcrPages: LocationCopy[] = [
  {
    cluster: "delhi-ncr",
    name: "Delhi NCR",
    placeId: "delhi-ncr",
    metaTitle: "Manpower Company and Labour Contractor in Delhi NCR",
    description:
      "Supervised contract labour crews for factories and warehouses in Delhi NCR: Gurugram and Manesar, Noida, Faridabad, Ghaziabad and Delhi's industrial areas.",
    heading: "Labour contractor in Delhi NCR.",
    lede: "Supervised crews for factories, warehouses and facilities across Delhi, Haryana and Uttar Pradesh.",
    paragraph:
      "Delhi NCR is three states sharing one labour market: a worker can live in Delhi and work in Kundli on Haryana's rate, or live in Ghaziabad and cross into Faridabad. We pay each crew on the rules of the state its site is in. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/delhi-ncr/gurugram-manesar", name: "Gurugram and Manesar" },
      { href: "/locations/delhi-ncr/noida-greater-noida", name: "Noida and Greater Noida" },
      { href: "/locations/delhi-ncr/faridabad-ghaziabad", name: "Faridabad and Ghaziabad" },
      { href: "/locations/delhi-ncr/delhi-industrial-areas", name: "Delhi's industrial areas" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Delhi NCR?",
        answer: "Yes. We supply supervised crews on our own payroll for factory work, loading and unloading, and housekeeping in Delhi, Haryana and UP.",
        category: "operations",
      },
      {
        question: "Do the winter pollution curbs affect crews?",
        answer: "They can: at the Graded Response Action Plan's higher stages older diesel trucks cannot enter Delhi and diesel generators are restricted. Tell us what your site depends on and we plan around it.",
        category: "operations",
      },
      {
        question: "Which minimum wage and rules apply in Delhi NCR?",
        answer: "The state the site is in sets them: Delhi ₹18,456, Haryana ₹15,220.71 and UP Category I ₹13,883.59 a month unskilled. None of the three levies Professional Tax.",
        link: RULE_LINKS.compliance,
        category: "compliance",
      },
      {
        question: "Can one contract cover sites in two NCR states?",
        answer: "Yes. Each site is paid and recorded on its own state's rules, and you get one monthly invoice.",
        category: "commercial",
      },
    ],
    sources: [HR_WAGE, HR_ENFORCE, UP_WAGE, DL_WAGE, DL_RATES, GRAP, HR_LWF, DL_LWF, HR_LOCAL_HC, HR_LOCAL_SC, { label: "DPCC response in NGT Appeal No. 39 of 2026 (Delhi industrial areas and unit counts)", url: "https://www.greentribunal.gov.in/sites/default/files/news_updates/RESPONSE%20BY%20DPCC%20IN%20APPEAL%20NO.%2039%20of%202026%20HARJEET%20SINGH%20VS%20DPCC%20and%20ORS.pdf" }],
    // Drafts pending native review (docs/hindi-glossary.md).
    translations: {
      "hi-IN": {
        name: "दिल्ली NCR",
        metaTitle: "दिल्ली NCR में लेबर ठेकेदार (Labour Contractor)",
        description:
          "दिल्ली NCR की फ़ैक्टरियों और वेयरहाउस के लिए सुपरवाइज़र के साथ कॉन्ट्रैक्ट लेबर: गुरुग्राम, मानेसर, नोएडा, फ़रीदाबाद, गाज़ियाबाद और दिल्ली के इंडस्ट्रियल एरिया।",
        heading: "दिल्ली NCR में लेबर ठेकेदार।",
        lede: "दिल्ली, हरियाणा और उत्तर प्रदेश की फ़ैक्टरियों, वेयरहाउस और फ़ैसिलिटी के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
        paragraph:
          "दिल्ली NCR में तीन राज्य हैं, पर लेबर मार्केट एक है: कोई कामगार दिल्ली में रहकर कुंडली में हरियाणा की दर पर काम कर सकता है, या गाज़ियाबाद में रहकर फ़रीदाबाद काम करने जा सकता है। हर टीम को हम उसी राज्य के नियमों से वेतन देते हैं जिसमें उसकी साइट है। हम {areas} की यूनिटों से ज़रूरतें लेते हैं।",
        areas: [
          { href: "/locations/delhi-ncr/gurugram-manesar", name: "गुरुग्राम और मानेसर" },
          { href: "/locations/delhi-ncr/noida-greater-noida", name: "नोएडा और ग्रेटर नोएडा" },
          { href: "/locations/delhi-ncr/faridabad-ghaziabad", name: "फ़रीदाबाद और गाज़ियाबाद" },
          { href: "/locations/delhi-ncr/delhi-industrial-areas", name: "दिल्ली के इंडस्ट्रियल एरिया" },
        ],
        faqs: [
          {
            question: "क्या आप दिल्ली NCR में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। दिल्ली, हरियाणा और UP में फ़ैक्टरी के काम, लोडिंग और अनलोडिंग, और हाउसकीपिंग के लिए हम अपने पेरोल पर सुपरवाइज़र के साथ टीमें देते हैं।",
            category: "operations",
          },
          {
            question: "क्या सर्दियों की प्रदूषण पाबंदियों का असर टीमों पर पड़ता है?",
            answer:
              "पड़ सकता है: Graded Response Action Plan के ऊँचे स्टेज पर पुराने डीज़ल ट्रक दिल्ली में नहीं आ सकते और डीज़ल जनरेटर पर पाबंदी लगती है। बताइए आपकी साइट किन चीज़ों पर निर्भर है, हम उसी हिसाब से प्लान करते हैं।",
            category: "operations",
          },
          {
            question: "दिल्ली NCR में कौन-सी न्यूनतम मजदूरी और नियम लागू होते हैं?",
            answer: "यह साइट वाला राज्य तय करता है: अकुशल कामगार के लिए हर महीने दिल्ली में ₹18,456, हरियाणा में ₹15,220.71 और UP कैटेगरी I में ₹13,883.59। तीनों में से कोई भी राज्य प्रोफ़ेशनल टैक्स नहीं लेता।",
            link: { href: RULE_LINKS.compliance.href, label: "हम कंप्लायंस कैसे संभालते हैं (English)" },
            category: "compliance",
          },
          {
            question: "क्या एक कॉन्ट्रैक्ट में NCR के दो राज्यों की साइटें आ सकती हैं?",
            answer: "हाँ। हर साइट का वेतन और रिकॉर्ड उसके अपने राज्य के नियमों से होता है, और आपको हर महीने एक ही इनवॉइस मिलता है।",
            category: "commercial",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Delhi NCR",
        metaTitle: "Delhi NCR mein Labour Thekedar (Contractor)",
        description:
          "Delhi NCR ki factories aur warehouses ke liye supervisor ke saath contract labour: Gurugram, Manesar, Noida, Faridabad, Ghaziabad aur Delhi ke industrial areas.",
        heading: "Delhi NCR mein labour contractor.",
        lede: "Delhi, Haryana aur Uttar Pradesh ki factories, warehouses aur facilities ke liye supervisor ke saath workers ki team.",
        paragraph:
          "Delhi NCR mein teen states hain, par labour market ek hai: koi worker Delhi mein rehkar Kundli mein Haryana ke rate par kaam kar sakta hai, ya Ghaziabad mein rehkar Faridabad kaam karne ja sakta hai. Har team ko hum usi state ke rules se wages dete hain jismein uski site hai. Hum {areas} ki units se requirements lete hain.",
        areas: [
          { href: "/locations/delhi-ncr/gurugram-manesar", name: "Gurugram aur Manesar" },
          { href: "/locations/delhi-ncr/noida-greater-noida", name: "Noida aur Greater Noida" },
          { href: "/locations/delhi-ncr/faridabad-ghaziabad", name: "Faridabad aur Ghaziabad" },
          { href: "/locations/delhi-ncr/delhi-industrial-areas", name: "Delhi ke industrial areas" },
        ],
        faqs: [
          {
            question: "Kya aap Delhi NCR mein contract labour dete hain?",
            answer: "Haan. Delhi, Haryana aur UP mein factory ke kaam, loading aur unloading, aur housekeeping ke liye hum apne payroll par supervisor ke saath teams dete hain.",
            category: "operations",
          },
          {
            question: "Kya sardiyon ki pollution pabandiyon ka asar teams par padta hai?",
            answer:
              "Pad sakta hai: Graded Response Action Plan ke upar ke stages par purane diesel trucks Delhi mein nahi aa sakte aur diesel generators par pabandi lagti hai. Bataiye aapki site kin cheezon par nirbhar hai, hum usi hisaab se plan karte hain.",
            category: "operations",
          },
          {
            question: "Delhi NCR mein kaun si minimum wage aur rules lagu hote hain?",
            answer: "Yeh site wala state tay karta hai: unskilled ke liye har mahine Delhi mein ₹18,456, Haryana mein ₹15,220.71 aur UP Category I mein ₹13,883.59. Teenon mein se koi bhi state Professional Tax nahi leta.",
            link: { href: RULE_LINKS.compliance.href, label: "Hum compliance kaise sambhalte hain (English)" },
            category: "compliance",
          },
          {
            question: "Kya ek contract mein NCR ke do states ki sites aa sakti hain?",
            answer: "Haan. Har site ki wages aur records uske apne state ke rules se hote hain, aur aapko har mahine ek hi invoice milta hai.",
            category: "commercial",
          },
        ],
      },
    },
  },
  {
    cluster: "delhi-ncr",
    estate: "gurugram-manesar",
    name: "Gurugram and Manesar",
    placeId: "gurugram-manesar",
    metaTitle: "Contract Labour in IMT Manesar and Gurugram",
    description:
      "Supervised contract labour for IMT Manesar, Udyog Vihar and Gurugram's industrial sectors: factory crews, loading and housekeeping on Haryana's 2026 wage.",
    heading: "Labour contractor in IMT Manesar and Gurugram.",
    lede: "Supervised crews for auto component, garment and warehousing units in IMT Manesar, Udyog Vihar and along NH-48.",
    paragraph:
      "IMT Manesar is HSIIDC's township on NH-48, built in phases from 1997, with a transport hub and a warehousing hub beside it; its units make auto components, die-castings, plastic mouldings and knitted garments. Closer to Delhi, Udyog Vihar in Gurugram has grown since 1976 into 1,124.5 acres of IT, garment and auto-ancillary units.",
    faqs: [
      {
        question: "Do you supply contract labour in Manesar and Gurugram?",
        answer: "Yes. We supply supervised factory, loading and housekeeping crews to units in IMT Manesar, Udyog Vihar and along NH-48.",
        category: "operations",
      },
      {
        question: "Is the minimum wage different in Manesar and Gurugram?",
        answer: "No. Haryana's 2026 notification sets one rate for the whole state, with no zones.",
        category: "compliance",
      },
      {
        question: "Which wage and rules apply in Haryana?",
        answer: "₹15,220.71 a month unskilled from 1 April 2026, and the notification makes the principal employer liable if a contractor underpays. There is no Professional Tax; the Labour Welfare Fund is 0.2% of wages a month, up to ₹35 from the worker and ₹70 from the employer.",
        link: RULE_LINKS.haryana,
        category: "compliance",
      },
      {
        question: "How do workers reach Manesar?",
        answer: "By road on NH-48 and the KMP and Dwarka expressways; no metro reaches Manesar yet. We plan how a crew reaches your gate before it starts.",
        category: "operations",
      },
    ],
    sources: [
      { label: "HSIIDC: IMT Manesar", url: "https://hsiidc.org.in/activities-and-services/infrastructure-imts/imts-manesar" },
      { label: "HSIIDC: Udyog Vihar, Gurugram", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/udyog-vihar-gurugram" },
      { label: "HSIIDC: Dharuhera", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/dharuhera" },
      HR_WAGE,
      HR_ENFORCE,
      HR_LWF,
      HR_LOCAL_HC,
      HR_LOCAL_SC,
      { label: "Swarajya: proposed Gurugram metro expansion (secondary)", url: "https://swarajyamag.com/amp/story/news-brief/gurugrams-rs-10000-crore-metro-dream-takes-shape-with-36-km-expansion-plan" },
    ],
    // Drafts pending native review (docs/hindi-glossary.md).
    translations: {
      "hi-IN": {
        name: "गुरुग्राम और मानेसर",
        metaTitle: "IMT मानेसर, गुरुग्राम में लेबर ठेकेदार (Contractor)",
        description:
          "IMT मानेसर, उद्योग विहार और गुरुग्राम के इंडस्ट्रियल सेक्टरों के लिए सुपरवाइज़र वाली फ़ैक्टरी, लोडिंग और हाउसकीपिंग टीमें, हरियाणा के 2026 रेट पर।",
        heading: "IMT मानेसर और गुरुग्राम में लेबर ठेकेदार।",
        lede: "IMT मानेसर, उद्योग विहार और NH-48 के किनारे ऑटो कंपोनेंट, गारमेंट और वेयरहाउसिंग यूनिटों के लिए सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "IMT मानेसर NH-48 पर HSIIDC की टाउनशिप है, जो 1997 से कई फ़ेज़ में बनी है, और इसके पास एक ट्रांसपोर्ट हब और एक वेयरहाउसिंग हब है। यहाँ की यूनिटें ऑटो कंपोनेंट, डाई-कास्टिंग, प्लास्टिक मोल्डिंग और निटेड गारमेंट बनाती हैं। दिल्ली के और पास, गुरुग्राम का उद्योग विहार 1976 से बढ़कर 1,124.5 एकड़ का हो गया है, जिसमें IT, गारमेंट और ऑटो-एंसिलरी यूनिटें हैं।",
        faqs: [
          {
            question: "क्या आप मानेसर और गुरुग्राम में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। IMT मानेसर, उद्योग विहार और NH-48 के किनारे की यूनिटों को हम सुपरवाइज़र के साथ फ़ैक्टरी, लोडिंग और हाउसकीपिंग टीमें देते हैं।",
            category: "operations",
          },
          {
            question: "क्या मानेसर और गुरुग्राम में न्यूनतम मजदूरी अलग है?",
            answer: "नहीं। हरियाणा का 2026 का नोटिफ़िकेशन पूरे राज्य के लिए एक ही दर तय करता है, इसमें कोई ज़ोन नहीं है।",
            category: "compliance",
          },
          {
            question: "हरियाणा में कौन-सी मजदूरी और नियम लागू होते हैं?",
            answer:
              "1 अप्रैल 2026 से अकुशल के लिए ₹15,220.71 महीना, और अगर ठेकेदार कम वेतन दे तो नोटिफ़िकेशन प्रिंसिपल एम्प्लॉयर को ज़िम्मेदार बनाता है। प्रोफ़ेशनल टैक्स नहीं है। लेबर वेलफ़ेयर फ़ंड हर महीने वेतन का 0.2% है, कामगार से ज़्यादा से ज़्यादा ₹35 और एम्प्लॉयर से ₹70।",
            link: { href: RULE_LINKS.haryana.href, label: "हरियाणा न्यूनतम मजदूरी (English)" },
            category: "compliance",
          },
          {
            question: "कामगार मानेसर कैसे पहुँचते हैं?",
            answer: "सड़क से, NH-48 और KMP और द्वारका एक्सप्रेसवे के रास्ते। मानेसर तक अभी कोई मेट्रो नहीं है। टीम शुरू होने से पहले हम प्लान करते हैं कि वह आपके गेट तक कैसे पहुँचेगी।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Gurugram aur Manesar",
        metaTitle: "IMT Manesar, Gurugram mein Labour Thekedar (Contractor)",
        description:
          "IMT Manesar, Udyog Vihar aur Gurugram ke industrial sectors ke liye supervised contract labour: factory, loading, housekeeping teams, Haryana ke 2026 rate par.",
        heading: "IMT Manesar aur Gurugram mein labour contractor.",
        lede: "IMT Manesar, Udyog Vihar aur NH-48 ke kinare auto component, garment aur warehousing units ke liye supervisor ke saath teams.",
        paragraph:
          "IMT Manesar NH-48 par HSIIDC ki township hai, jo 1997 se kai phases mein bani hai, aur iske paas ek transport hub aur ek warehousing hub hai. Yahan ki units auto components, die-castings, plastic mouldings aur knitted garments banati hain. Delhi ke aur paas, Gurugram ka Udyog Vihar 1976 se badhkar 1,124.5 acre ka ho gaya hai, jismein IT, garment aur auto-ancillary units hain.",
        faqs: [
          {
            question: "Kya aap Manesar aur Gurugram mein contract labour dete hain?",
            answer: "Haan. IMT Manesar, Udyog Vihar aur NH-48 ke kinare ki units ko hum supervisor ke saath factory, loading aur housekeeping teams dete hain.",
            category: "operations",
          },
          {
            question: "Kya Manesar aur Gurugram mein minimum wage alag hai?",
            answer: "Nahi. Haryana ka 2026 ka notification poore state ke liye ek hi rate tay karta hai, ismein koi zone nahi hai.",
            category: "compliance",
          },
          {
            question: "Haryana mein kaun si wage aur rules lagu hote hain?",
            answer:
              "1 April 2026 se unskilled ke liye ₹15,220.71 mahina, aur agar contractor kam pay kare to notification principal employer ko zimmedar banata hai. Professional Tax nahi hai. Labour Welfare Fund har mahine wages ka 0.2% hai, worker se zyada se zyada ₹35 aur employer se ₹70.",
            link: { href: RULE_LINKS.haryana.href, label: "Haryana minimum wages (English)" },
            category: "compliance",
          },
          {
            question: "Workers Manesar kaise pahunchte hain?",
            answer: "Road se, NH-48 aur KMP aur Dwarka expressways ke raaste. Manesar tak abhi koi metro nahi hai. Team ke kaam shuru karne se pehle hum plan karte hain ki woh aapke gate tak kaise pahunchegi.",
            category: "operations",
          },
        ],
      },
    },
  },
  {
    cluster: "delhi-ncr",
    estate: "noida-greater-noida",
    name: "Noida and Greater Noida",
    placeId: "noida-greater-noida",
    metaTitle: "Contract Labour in Noida and Greater Noida",
    description:
      "Supervised contract labour for Noida's phases, the export zone and Greater Noida's industrial sectors: factory, garment, loading and housekeeping crews.",
    heading: "Labour contractor in Noida and Greater Noida.",
    lede: "Supervised crews for electronics, garment and engineering units in Noida, the export zone, Greater Noida and the Yamuna Expressway area.",
    paragraph:
      "Noida was set up by the NOIDA Authority in 1976, its three phases taking in the export processing zone; Greater Noida followed in 1991 with its Ecotech sectors, Surajpur and EPIP Kasna. Hosiery and garments is the district's largest industry, beside electronics and engineering goods.",
    faqs: [
      {
        question: "Do you supply contract labour in Noida and Greater Noida?",
        answer: "Yes. We supply production helpers, packers, line feeders, loading crews and housekeeping, with a supervisor on site.",
        category: "operations",
      },
      {
        question: "Why did UP raise the Noida rate in April 2026?",
        answer: "The order of 17 April 2026 cites labour unrest in Noida and Greater Noida, where workers asked for Haryana's rates, and revisions due in 2019 and 2024 that were not made.",
        category: "compliance",
      },
      {
        question: "Which minimum wage and rules apply in Noida?",
        answer: "Gautam Buddha Nagar is UP's Category I: ₹13,883.59 a month unskilled from 1 October 2026, the same through Greater Noida and the Yamuna Expressway area. UP levies no Professional Tax.",
        link: RULE_LINKS.up,
        category: "compliance",
      },
      {
        question: "How do workers reach the sectors?",
        answer: "The Noida Metro Aqua Line runs from Sector 51 through Knowledge Park II and Pari Chowk, and the Delhi Metro Blue Line links Delhi to Noida.",
        category: "operations",
      },
    ],
    sources: [
      UP_WAGE,
      // GNIDA's own site stopped answering (Oct 2026); the CAG audit gives January 1991, the Ecotech sectors and Surajpur.
      { label: "CAG: performance audit of GNIDA, Report No. 4 of 2023", url: "https://cag.gov.in/ag1/uttar-pradesh/en/audit-report/details/122410" },
      { label: "MSME-DI: District profile, Gautam Buddha Nagar (2012–13)", url: "https://dcmsme.gov.in/old/dips/DIP%20Report%20Gautam%20Budh%20Nagar.pdf" },
      { label: "ThePrint: Noida at 50 (secondary)", url: "https://theprint.in/ground-reports/at-50-noida-cosmopolitan-city-commercial-centre-industrial-utopia/2666905/" },
      { label: "PTI via The Week: Surajpur and UPSIDA (secondary)", url: "https://www.theweek.in/wire-updates/business/2024/12/21/des89-ncr-cm-surajpur.html" },
      { label: "Wikipedia: Aqua Line, Noida Metro (secondary)", url: "https://en.wikipedia.org/wiki/Aqua_Line_(Noida_Metro)" },
      { label: "Business Standard: Aqua Line extension approved (secondary)", url: "https://www.business-standard.com/india-news/noida-metro-govt-approves-aqua-line-extension-from-sector-51-greater-noida-124112500413_1.html" },
    ],
    // Drafts pending native review (docs/hindi-glossary.md).
    translations: {
      "hi-IN": {
        name: "नोएडा और ग्रेटर नोएडा",
        metaTitle: "नोएडा, ग्रेटर नोएडा में लेबर ठेकेदार (Contractor)",
        description:
          "नोएडा के फ़ेज़, एक्सपोर्ट ज़ोन और ग्रेटर नोएडा के इंडस्ट्रियल सेक्टरों के लिए सुपरवाइज़र के साथ कॉन्ट्रैक्ट लेबर: फ़ैक्टरी, गारमेंट, लोडिंग और हाउसकीपिंग टीमें।",
        heading: "नोएडा और ग्रेटर नोएडा में लेबर ठेकेदार।",
        lede: "नोएडा, एक्सपोर्ट ज़ोन, ग्रेटर नोएडा और यमुना एक्सप्रेसवे इलाके में इलेक्ट्रॉनिक्स, गारमेंट और इंजीनियरिंग यूनिटों के लिए सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "नोएडा को NOIDA अथॉरिटी ने 1976 में बसाया, और इसके तीन फ़ेज़ में एक्सपोर्ट प्रोसेसिंग ज़ोन भी आता है। ग्रेटर नोएडा 1991 में बना, अपने इकोटेक सेक्टरों, सूरजपुर और EPIP कासना के साथ। ज़िले की सबसे बड़ी इंडस्ट्री होज़री और गारमेंट है, और साथ में इलेक्ट्रॉनिक्स और इंजीनियरिंग गुड्स।",
        faqs: [
          {
            question: "क्या आप नोएडा और ग्रेटर नोएडा में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। हम प्रोडक्शन हेल्पर, पैकर, लाइन फ़ीडर, लोडिंग टीमें और हाउसकीपिंग देते हैं, साइट पर सुपरवाइज़र के साथ।",
            category: "operations",
          },
          {
            question: "UP ने अप्रैल 2026 में नोएडा की दर क्यों बढ़ाई?",
            answer:
              "17 अप्रैल 2026 के आदेश में नोएडा और ग्रेटर नोएडा में लेबर अशांति का ज़िक्र है, जहाँ कामगारों ने हरियाणा वाली दरें माँगी थीं। उसमें 2019 और 2024 के उन रिवीज़न का भी ज़िक्र है, जो होने थे पर नहीं हुए।",
            category: "compliance",
          },
          {
            question: "नोएडा में कौन-सी न्यूनतम मजदूरी और नियम लागू होते हैं?",
            answer:
              "गौतम बुद्ध नगर UP की कैटेगरी I में है: 1 अक्टूबर 2026 से अकुशल के लिए ₹13,883.59 महीना, और पूरे ग्रेटर नोएडा और यमुना एक्सप्रेसवे इलाके में भी यही दर है। UP प्रोफ़ेशनल टैक्स नहीं लेता।",
            link: { href: RULE_LINKS.up.href, label: "UP न्यूनतम मजदूरी (English)" },
            category: "compliance",
          },
          {
            question: "कामगार सेक्टरों तक कैसे पहुँचते हैं?",
            answer: "नोएडा मेट्रो की एक्वा लाइन सेक्टर 51 से नॉलेज पार्क II और परी चौक होते हुए चलती है, और दिल्ली मेट्रो की ब्लू लाइन दिल्ली को नोएडा से जोड़ती है।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Noida aur Greater Noida",
        metaTitle: "Noida, Greater Noida mein Labour Thekedar (Contractor)",
        description:
          "Noida ke phases, export zone aur Greater Noida ke industrial sectors ke liye supervised contract labour: factory, garment, loading aur housekeeping teams.",
        heading: "Noida aur Greater Noida mein labour contractor.",
        lede: "Noida, export zone, Greater Noida aur Yamuna Expressway area mein electronics, garment aur engineering units ke liye supervisor ke saath teams.",
        paragraph:
          "Noida ko NOIDA Authority ne 1976 mein basaya, aur iske teen phases mein export processing zone bhi aata hai. Greater Noida 1991 mein bana, apne Ecotech sectors, Surajpur aur EPIP Kasna ke saath. District ki sabse badi industry hosiery aur garments hai, aur saath mein electronics aur engineering goods.",
        faqs: [
          {
            question: "Kya aap Noida aur Greater Noida mein contract labour dete hain?",
            answer: "Haan. Hum production helpers, packers, line feeders, loading crews aur housekeeping dete hain, site par supervisor ke saath.",
            category: "operations",
          },
          {
            question: "UP ne April 2026 mein Noida ka rate kyon badhaya?",
            answer:
              "17 April 2026 ke order mein Noida aur Greater Noida mein labour unrest ka zikr hai, jahan workers ne Haryana wale rates maange the. Usmein 2019 aur 2024 ke un revisions ka bhi zikr hai, jo due the par kiye nahi gaye.",
            category: "compliance",
          },
          {
            question: "Noida mein kaun si minimum wage aur rules lagu hote hain?",
            answer:
              "Gautam Buddh Nagar UP ki Category I mein hai: 1 October 2026 se unskilled ke liye ₹13,883.59 mahina, aur poore Greater Noida aur Yamuna Expressway area mein bhi yahi rate hai. UP Professional Tax nahi leta.",
            link: { href: RULE_LINKS.up.href, label: "UP minimum wages (English)" },
            category: "compliance",
          },
          {
            question: "Workers sectors tak kaise pahunchte hain?",
            answer: "Noida Metro ki Aqua Line Sector 51 se Knowledge Park II aur Pari Chowk hote hue chalti hai, aur Delhi Metro ki Blue Line Delhi ko Noida se jodti hai.",
            category: "operations",
          },
        ],
      },
    },
  },
  {
    cluster: "delhi-ncr",
    estate: "faridabad-ghaziabad",
    name: "Faridabad and Ghaziabad",
    placeId: "faridabad-ghaziabad",
    metaTitle: "Contract Labour in Faridabad and Ghaziabad",
    description:
      "Supervised contract labour for Faridabad's industrial sectors and Ghaziabad's Sahibabad, Loni and Meerut Road sites, each paid on its own state's wage rate.",
    heading: "Labour contractor in Faridabad and Ghaziabad.",
    lede: "Supervised crews for engineering, auto component and garment units in Faridabad's sectors and Ghaziabad's industrial sites.",
    paragraph:
      "Faridabad, founded in 1607 by Shaikh Farid, is Haryana's engineering city, with HSIIDC estates in sectors 31 and 59 and IMT Faridabad in sectors 66 to 69. Across the state border, Ghaziabad's industry runs along Sahibabad, Loni Road and Meerut Road, and engineering goods is its One District One Product sector.",
    faqs: [
      {
        question: "Do you supply contract labour in Faridabad and Ghaziabad?",
        answer: "Yes. We supply supervised factory, loading and housekeeping crews in Faridabad's sectors and at Sahibabad, Loni and Meerut Road.",
        category: "operations",
      },
      {
        question: "Why is the wage lower in Ghaziabad than in Faridabad?",
        answer: "They are in different states a few kilometres apart. A worker moved between sites is paid the rate of the site they work at.",
        category: "compliance",
      },
      {
        question: "Which minimum wage and rules apply?",
        answer: "Faridabad pays Haryana's ₹15,220.71 a month unskilled plus the Labour Welfare Fund; Ghaziabad pays UP Category I, ₹13,883.59. Neither state levies Professional Tax.",
        link: RULE_LINKS.up,
        category: "compliance",
      },
      {
        question: "How do workers reach the sites?",
        answer: "The Namo Bharat line between Delhi and Meerut stops at Sahibabad and Ghaziabad, and the Violet Line and NH-44 serve Faridabad.",
        category: "operations",
      },
    ],
    sources: [
      { label: "HSIIDC: Faridabad estates", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/faridabad" },
      { label: "HSIIDC: IMT Faridabad", url: "https://hsiidc.org.in/activities-and-services/infrastructure-imts/imt-faridabad" },
      { label: "MSME-DI: District profile, Faridabad (2012)", url: "https://dcmsme.gov.in/old/dips/DIP%20Report%20%20Faridabad.pdf" },
      { label: "Ghaziabad district: about the district", url: "https://ghaziabad.nic.in/about-district/" },
      { label: "MSME-DI: District profile, Ghaziabad (2012–13)", url: "https://dcmsme.gov.in/old/dips/final%20Report%20Ghaziabad.pdf" },
      { label: "UPSDM: Ghaziabad district skill plan", url: "https://www.upsdm.gov.in/Content/WebAssets/DSDP/GHAZIABAD.pdf" },
      HR_WAGE,
      UP_WAGE,
      HR_LWF,
      { label: "Swarajya: Namo Bharat corridor fully open (secondary)", url: "https://swarajyamag.com/amp/story/infrastructure/indias-first-rrts-fully-operational-as-pm-modi-dedicates-final-26-km-of-82-km-delhimeerut-namo-bharat-corridor-to-nation" },
    ],
    // Drafts pending native review (docs/hindi-glossary.md).
    translations: {
      "hi-IN": {
        name: "फ़रीदाबाद और गाज़ियाबाद",
        metaTitle: "फ़रीदाबाद, गाज़ियाबाद में लेबर ठेकेदार (Contractor)",
        description:
          "फ़रीदाबाद के इंडस्ट्रियल सेक्टरों और गाज़ियाबाद के साहिबाबाद, लोनी और मेरठ रोड की साइटों के लिए सुपरवाइज़र के साथ कॉन्ट्रैक्ट लेबर, हर साइट अपने राज्य की दर पर।",
        heading: "फ़रीदाबाद और गाज़ियाबाद में लेबर ठेकेदार।",
        lede: "फ़रीदाबाद के सेक्टरों और गाज़ियाबाद की इंडस्ट्रियल साइटों पर इंजीनियरिंग, ऑटो कंपोनेंट और गारमेंट यूनिटों के लिए सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "फ़रीदाबाद, जिसे 1607 में शेख़ फ़रीद ने बसाया था, हरियाणा का इंजीनियरिंग शहर है। यहाँ सेक्टर 31 और 59 में HSIIDC की इंडस्ट्रियल एस्टेट हैं, और सेक्टर 66 से 69 में IMT फ़रीदाबाद। राज्य की सीमा के उस पार, गाज़ियाबाद की इंडस्ट्री साहिबाबाद, लोनी रोड और मेरठ रोड के किनारे है, और एक जनपद एक उत्पाद (One District One Product) में इसका सेक्टर इंजीनियरिंग गुड्स है।",
        faqs: [
          {
            question: "क्या आप फ़रीदाबाद और गाज़ियाबाद में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। फ़रीदाबाद के सेक्टरों में और साहिबाबाद, लोनी और मेरठ रोड पर हम सुपरवाइज़र के साथ फ़ैक्टरी, लोडिंग और हाउसकीपिंग टीमें देते हैं।",
            category: "operations",
          },
          {
            question: "गाज़ियाबाद में मजदूरी फ़रीदाबाद से कम क्यों है?",
            answer: "दोनों कुछ किलोमीटर की दूरी पर हैं, पर अलग-अलग राज्यों में। जिस कामगार को एक साइट से दूसरी पर भेजा जाए, उसे उस साइट की दर मिलती है जहाँ वह काम करता है।",
            category: "compliance",
          },
          {
            question: "कौन-सी न्यूनतम मजदूरी और नियम लागू होते हैं?",
            answer:
              "फ़रीदाबाद में हरियाणा की दर, अकुशल के लिए ₹15,220.71 महीना, और साथ में लेबर वेलफ़ेयर फ़ंड। गाज़ियाबाद में UP कैटेगरी I की दर, ₹13,883.59। दोनों में से कोई भी राज्य प्रोफ़ेशनल टैक्स नहीं लेता।",
            link: { href: RULE_LINKS.up.href, label: "UP न्यूनतम मजदूरी (English)" },
            category: "compliance",
          },
          {
            question: "कामगार साइटों तक कैसे पहुँचते हैं?",
            answer: "दिल्ली और मेरठ के बीच की नमो भारत लाइन साहिबाबाद और गाज़ियाबाद में रुकती है, और फ़रीदाबाद तक वायलेट लाइन और NH-44 जाते हैं।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Faridabad aur Ghaziabad",
        metaTitle: "Faridabad, Ghaziabad mein Labour Thekedar (Contractor)",
        description:
          "Faridabad ke industrial sectors aur Ghaziabad ke Sahibabad, Loni aur Meerut Road ki sites ke liye supervised contract labour, har site apne state ke rate par.",
        heading: "Faridabad aur Ghaziabad mein labour contractor.",
        lede: "Faridabad ke sectors aur Ghaziabad ki industrial sites par engineering, auto component aur garment units ke liye supervisor ke saath teams.",
        paragraph:
          "Faridabad, jise 1607 mein Shaikh Farid ne basaya tha, Haryana ka engineering shehar hai. Yahan sector 31 aur 59 mein HSIIDC ke estates hain, aur sector 66 se 69 mein IMT Faridabad. State border ke us paar, Ghaziabad ki industry Sahibabad, Loni Road aur Meerut Road ke kinare hai, aur One District One Product mein iska sector engineering goods hai.",
        faqs: [
          {
            question: "Kya aap Faridabad aur Ghaziabad mein contract labour dete hain?",
            answer: "Haan. Faridabad ke sectors mein aur Sahibabad, Loni aur Meerut Road par hum supervisor ke saath factory, loading aur housekeeping teams dete hain.",
            category: "operations",
          },
          {
            question: "Ghaziabad mein wage Faridabad se kam kyon hai?",
            answer: "Dono kuch kilometre ki doori par hain, par alag-alag states mein. Jis worker ko ek site se doosri par bheja jaye, use us site ka rate milta hai jahan woh kaam karta hai.",
            category: "compliance",
          },
          {
            question: "Kaun si minimum wage aur rules lagu hote hain?",
            answer:
              "Faridabad mein Haryana ka rate, unskilled ke liye ₹15,220.71 mahina, aur saath mein Labour Welfare Fund. Ghaziabad mein UP Category I ka rate, ₹13,883.59. Dono mein se koi bhi state Professional Tax nahi leta.",
            link: { href: RULE_LINKS.up.href, label: "UP minimum wages (English)" },
            category: "compliance",
          },
          {
            question: "Workers sites tak kaise pahunchte hain?",
            answer: "Delhi aur Meerut ke beech ki Namo Bharat line Sahibabad aur Ghaziabad mein rukti hai, aur Faridabad tak Violet Line aur NH-44 jaate hain.",
            category: "operations",
          },
        ],
      },
    },
  },
  {
    cluster: "delhi-ncr",
    estate: "delhi-industrial-areas",
    name: "Delhi industrial areas",
    placeId: "delhi-industrial-areas",
    metaTitle: "Contract Labour in Bawana, Narela, Okhla and Kundli",
    description:
      "Supervised contract labour for Delhi's industrial areas, Bawana, Narela, Okhla, Mayapuri, Wazirpur and Naraina, and Kundli across the Haryana border.",
    heading: "Labour contractor in Delhi's industrial areas.",
    lede: "Supervised crews for units in Bawana, Narela, Okhla, Mayapuri, Wazirpur and Naraina, and in Kundli just across the border.",
    paragraph:
      "Delhi has 28 approved industrial areas with 24,169 units on pollution-board records; Bawana alone holds 8,875, built by DSIIDC for the relocation of units from residential areas. Okhla's units run to garments, leather, pharma and printing. Kundli, across the border in Sonipat, is HSIIDC's estate on NH-44.",
    faqs: [
      {
        question: "Do you supply contract labour in Delhi's industrial areas?",
        answer: "Yes. We supply supervised crews to units in Bawana, Narela, Okhla, Mayapuri, Wazirpur, Naraina and Kundli.",
        category: "operations",
      },
      {
        question: "Why is Kundli's rate lower than Narela's next door?",
        answer: "Kundli is in Haryana, so a worker who lives in Delhi but works there is paid Haryana's ₹15,220.71, not Delhi's rate. Pay follows the site, not the worker's address.",
        category: "compliance",
      },
      {
        question: "Which minimum wage and rules apply in Delhi?",
        answer: "One rate across the territory: ₹18,456 a month unskilled from the order of 15 April 2025. Delhi levies no Professional Tax; its Labour Welfare Fund is ₹0.75 from the worker and ₹2.25 from the employer every six months.",
        link: RULE_LINKS.delhi,
        category: "compliance",
      },
      {
        question: "Do the winter pollution curbs affect crews?",
        answer: "They can affect dispatch and power backup: at higher stages older trucks cannot enter Delhi and diesel generators are restricted. We plan around what your site depends on.",
        category: "operations",
      },
    ],
    sources: [
      { label: "DPCC response in NGT Appeal No. 39 of 2026 (industrial areas and unit counts)", url: "https://www.greentribunal.gov.in/sites/default/files/news_updates/RESPONSE%20BY%20DPCC%20IN%20APPEAL%20NO.%2039%20of%202026%20HARJEET%20SINGH%20VS%20DPCC%20and%20ORS.pdf" },
      { label: "DSIIDC: relocation scheme", url: "https://dsiidc.delhi.gov.in/relocation" },
      { label: "HSIIDC: Kundli", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/kundli" },
      { label: "Delhi Industries Department: export promotion cell (Okhla)", url: "https://industries.delhi.gov.in/industries/export-promotion-cell" },
      DL_WAGE,
      DL_RATES,
      HR_WAGE,
      GRAP,
      DL_LWF,
      { label: "PUDR: Living, Working and Dying in Bawana, 2018 (secondary)", url: "https://www.pudr.org/publicatiosn-files/2018-Living%20Working%20and%20Dying%20in%20Bawana.pdf" },
      { label: "NBM&CW: Rithala–Narela–Kundli metro approved (secondary)", url: "https://www.nbmcw.com/news/pm-approves-rithala-narela-nathupur-corridor-under-delhi-metro-phase-iv.html" },
    ],
    // Drafts pending native review (docs/hindi-glossary.md).
    translations: {
      "hi-IN": {
        name: "दिल्ली के इंडस्ट्रियल एरिया",
        metaTitle: "बवाना, नरेला, ओखला, कुंडली में लेबर ठेकेदार",
        description:
          "दिल्ली के इंडस्ट्रियल एरिया बवाना, नरेला, ओखला, मायापुरी, वज़ीरपुर और नारायणा, और हरियाणा बॉर्डर के पार कुंडली के लिए सुपरवाइज़र के साथ कॉन्ट्रैक्ट लेबर।",
        heading: "दिल्ली के इंडस्ट्रियल एरिया में लेबर ठेकेदार।",
        lede: "बवाना, नरेला, ओखला, मायापुरी, वज़ीरपुर और नारायणा की यूनिटों के लिए, और बॉर्डर के ठीक पार कुंडली के लिए, सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "दिल्ली में 28 मंज़ूर इंडस्ट्रियल एरिया हैं, जिनमें प्रदूषण बोर्ड के रिकॉर्ड में 24,169 यूनिटें दर्ज हैं। अकेले बवाना में 8,875 यूनिटें हैं, जिसे DSIIDC ने रिहायशी इलाकों से यूनिटें हटाकर बसाने के लिए बनाया था। ओखला की यूनिटों में गारमेंट, लेदर, फ़ार्मा और प्रिंटिंग का काम होता है। कुंडली, बॉर्डर के पार सोनीपत में, NH-44 पर HSIIDC की इंडस्ट्रियल एस्टेट है।",
        faqs: [
          {
            question: "क्या आप दिल्ली के इंडस्ट्रियल एरिया में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। बवाना, नरेला, ओखला, मायापुरी, वज़ीरपुर, नारायणा और कुंडली की यूनिटों को हम सुपरवाइज़र के साथ टीमें देते हैं।",
            category: "operations",
          },
          {
            question: "कुंडली की दर बगल के नरेला से कम क्यों है?",
            answer: "कुंडली हरियाणा में है, इसलिए जो कामगार दिल्ली में रहता है पर वहाँ काम करता है, उसे दिल्ली की दर नहीं, हरियाणा के ₹15,220.71 मिलते हैं। वेतन साइट से तय होता है, कामगार के पते से नहीं।",
            category: "compliance",
          },
          {
            question: "दिल्ली में कौन-सी न्यूनतम मजदूरी और नियम लागू होते हैं?",
            answer:
              "पूरी दिल्ली में एक ही दर: 15 अप्रैल 2025 के आदेश से अकुशल के लिए ₹18,456 महीना। दिल्ली में प्रोफ़ेशनल टैक्स नहीं है। यहाँ का लेबर वेलफ़ेयर फ़ंड हर छह महीने में कामगार से ₹0.75 और एम्प्लॉयर से ₹2.25 है।",
            link: { href: RULE_LINKS.delhi.href, label: "दिल्ली न्यूनतम मजदूरी (English)" },
            category: "compliance",
          },
          {
            question: "क्या सर्दियों की प्रदूषण पाबंदियों का असर टीमों पर पड़ता है?",
            answer: "डिस्पैच और पावर बैकअप पर असर पड़ सकता है: ऊँचे स्टेज पर पुराने ट्रक दिल्ली में नहीं आ सकते और डीज़ल जनरेटर पर पाबंदी लगती है। आपकी साइट जिन चीज़ों पर निर्भर है, हम उनके हिसाब से प्लान करते हैं।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Delhi ke industrial areas",
        metaTitle: "Bawana, Narela, Okhla, Kundli mein Labour Thekedar",
        description:
          "Delhi ke industrial areas Bawana, Narela, Okhla, Mayapuri, Wazirpur aur Naraina, aur Haryana border ke paar Kundli ke liye supervisor ke saath contract labour.",
        heading: "Delhi ke industrial areas mein labour contractor.",
        lede: "Bawana, Narela, Okhla, Mayapuri, Wazirpur aur Naraina ki units ke liye, aur border ke theek paar Kundli ke liye, supervisor ke saath teams.",
        paragraph:
          "Delhi mein 28 approved industrial areas hain, jinmein pollution board ke records mein 24,169 units darj hain. Akele Bawana mein 8,875 units hain, jise DSIIDC ne residential ilaakon se units hatakar basane ke liye banaya tha. Okhla ki units mein garments, leather, pharma aur printing ka kaam hota hai. Kundli, border ke paar Sonipat mein, NH-44 par HSIIDC ka estate hai.",
        faqs: [
          {
            question: "Kya aap Delhi ke industrial areas mein contract labour dete hain?",
            answer: "Haan. Bawana, Narela, Okhla, Mayapuri, Wazirpur, Naraina aur Kundli ki units ko hum supervisor ke saath teams dete hain.",
            category: "operations",
          },
          {
            question: "Kundli ka rate bagal ke Narela se kam kyon hai?",
            answer: "Kundli Haryana mein hai, isliye jo worker Delhi mein rehta hai par wahan kaam karta hai, use Delhi ka rate nahi, Haryana ke ₹15,220.71 milte hain. Pay site se tay hoti hai, worker ke address se nahi.",
            category: "compliance",
          },
          {
            question: "Delhi mein kaun si minimum wage aur rules lagu hote hain?",
            answer:
              "Poori Delhi mein ek hi rate: 15 April 2025 ke order se unskilled ke liye ₹18,456 mahina. Delhi mein Professional Tax nahi hai. Yahan ka Labour Welfare Fund har chhah mahine mein worker se ₹0.75 aur employer se ₹2.25 hai.",
            link: { href: RULE_LINKS.delhi.href, label: "Delhi minimum wages (English)" },
            category: "compliance",
          },
          {
            question: "Kya sardiyon ki pollution pabandiyon ka asar teams par padta hai?",
            answer: "Dispatch aur power backup par asar pad sakta hai: upar ke stages par purane trucks Delhi mein nahi aa sakte aur diesel generators par pabandi lagti hai. Aapki site jin cheezon par nirbhar hai, hum unke hisaab se plan karte hain.",
            category: "operations",
          },
        ],
      },
    },
  },
];

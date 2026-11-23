import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";

/**
 * The Jalandhar region, Punjab: the hub and three industrial clusters, with
 * Kapurthala as a cluster of its own (owner direction, 17 Oct 2026), on the
 * location page structure. Business only: since 20 Oct 2026 Kapurthala
 * district (Phagwara included) is a jobs market of its own, so its pages
 * send job seekers to /jobs/kapurthala (`jobsMarket`). Facts from the research of 17 Oct 2026, each
 * cited in `sources`; MSME-DI district profiles carry 2010–11 data, so their
 * figures are named as theirs. Road distances not in a source are left out.
 * No tenant names (the Rail Coach Factory, the mills and the focal point's
 * plants included), registrations, headcount or shift claims; security
 * guards are out of scope (no PSARA licence).
 */

const WAGES_LINK = { href: "/minimum-wages/punjab", label: "Punjab minimum wages" };

const wagesFaq: FaqItem = {
  question: "Which minimum wage and rules apply?",
  answer:
    "Punjab's, with one rate for the whole state: ₹13,486 a month unskilled from 1 May 2026. The ₹200 development tax applies only to income-tax payers, so it rarely touches a crew's wages, and the Labour Welfare Fund is paid half-yearly.",
  link: WAGES_LINK,
  category: "compliance",
};

/** The wages answer in each translation, linking to the English wage page. */
const translatedWagesFaq = (question: string, answer: string, label: string): FaqItem => ({
  question,
  answer,
  link: { href: WAGES_LINK.href, label },
  category: "compliance",
});

const WAGES_FAQ = {
  "pa-IN": translatedWagesFaq(
    "ਕਿਹੜੀ ਘੱਟੋ-ਘੱਟ ਤਨਖ਼ਾਹ ਅਤੇ ਨਿਯਮ ਲਾਗੂ ਹੁੰਦੇ ਹਨ?",
    "ਪੰਜਾਬ ਦੇ। ਪੂਰੇ ਰਾਜ ਵਿੱਚ ਇੱਕੋ ਰੇਟ ਹੈ: 1 ਮਈ 2026 ਤੋਂ ਅਕੁਸ਼ਲ ਲਈ ₹13,486 ਮਹੀਨਾ। ₹200 ਦਾ ਡਿਵੈਲਪਮੈਂਟ ਟੈਕਸ ਸਿਰਫ਼ ਇਨਕਮ ਟੈਕਸ ਭਰਨ ਵਾਲਿਆਂ 'ਤੇ ਲਾਗੂ ਹੁੰਦਾ ਹੈ, ਇਸ ਲਈ ਕਾਮਿਆਂ ਦੀ ਤਨਖ਼ਾਹ 'ਤੇ ਇਸਦਾ ਅਸਰ ਘੱਟ ਹੀ ਪੈਂਦਾ ਹੈ, ਅਤੇ ਲੇਬਰ ਵੈਲਫ਼ੇਅਰ ਫ਼ੰਡ ਛਿਮਾਹੀ ਭਰਿਆ ਜਾਂਦਾ ਹੈ।",
    "ਪੰਜਾਬ ਦੀ ਘੱਟੋ-ਘੱਟ ਤਨਖ਼ਾਹ (English)",
  ),
  "hi-IN": translatedWagesFaq(
    "कौन-सी न्यूनतम मज़दूरी और नियम लागू होते हैं?",
    "पंजाब के। पूरे राज्य में एक ही दर है: 1 मई 2026 से अकुशल के लिए ₹13,486 महीना। ₹200 का डेवलपमेंट टैक्स सिर्फ़ इनकम टैक्स भरने वालों पर लागू होता है, इसलिए कामगारों के वेतन पर इसका असर कम ही पड़ता है, और लेबर वेलफ़ेयर फ़ंड हर छह महीने में भरा जाता है।",
    "पंजाब न्यूनतम मज़दूरी (English)",
  ),
  "hi-Latn-IN": translatedWagesFaq(
    "Kaunsi minimum wage aur rules laagu hote hain?",
    "Punjab ke. Poore state mein ek hi rate hai: 1 May 2026 se unskilled ke liye ₹13,486 mahina. ₹200 ka development tax sirf income tax bharne walon par laagu hota hai, isliye workers ki wages par iska asar kam hi padta hai, aur Labour Welfare Fund har chhe mahine bhara jaata hai.",
    "Punjab minimum wages (English)",
  ),
};

const SRC = {
  psiec: { label: "PSIEC: industrial estates, Zone 6 (Jalandhar)", url: "https://psiec.punjab.gov.in/?p=94" },
  msmeJalandhar: { label: "MSME-DI: Jalandhar district industrial profile (2010–11 data)", url: "https://www.dcmsme.gov.in/old/dips/Jalandhar.pdf" },
  msmeKapurthala: { label: "MSME-DI: Kapurthala district industrial profile (2010–11 data)", url: "https://dcmsme.gov.in/old/dips/Kapurthala.pdf" },
  kapurthalaProfile: { label: "Kapurthala district: district profile", url: "https://kapurthala.gov.in/?p=24430" },
  kapurthalaReach: { label: "Kapurthala district: how to reach", url: "https://kapurthala.gov.in/how-to-reach/" },
  jalandharReach: { label: "Jalandhar district: how to reach", url: "https://jalandhar.nic.in/how-to-reach/" },
  jalandharDistrict: { label: "Jalandhar district: about the district", url: "https://jalandhar.nic.in/about-district/" },
  mcPhagwara: { label: "Municipal Corporation Phagwara", url: "https://mcphagwara.punjab.gov.in/" },
  goraya: { label: "Goraya", url: "https://en.wikipedia.org/wiki/Goraya" },
  clri: { label: "CSIR-CLRI Regional Centre, Leather Complex, Kapurthala Road", url: "https://clri.org/DepartmentDetails.aspx?D=45" },
  tribune2025: { label: "Tribune: administrative secretary on Jalandhar's industrial complexes, 3 Jul 2025", url: "https://www.tribuneindia.com/news/jalandhar/admn-secretary-yadav-assures-industrialists-of-fast-tracked-solutions-to-their-concerns" },
  pbWages: { label: "Punjab Labour Department: minimum rates of wages from 1 May 2026", url: "https://pblabour.gov.in/pbLabourStaticSiteAdmin/uploads/8ec9bd9d-aecf-4bf6-b9bf-672b2970adad_Basic%20Minimum%20rates%20of%20wages.pdf" },
  psdt: { label: "Punjab State Development Tax Act, 2018", url: "https://taxation.punjab.gov.in/attachments/attachment0015236141020201602663756_punjab_state_development_tax_2018.pdf" },
  lwf2025: { label: "Punjab Labour Welfare Fund (Amendment) Bill, 2025, as passed", url: "https://punjabassembly.gov.in/images/docs/AssemblyFiles/16/179/20250710/Documents/15%20PLA%20passed%20Bill%202025.pdf" },
};

export const jalandharPages: LocationCopy[] = [
  {
    cluster: "jalandhar",
    name: "Jalandhar and Kapurthala",
    placeId: "jalandhar",
    metaTitle: "Labour Contractor in Jalandhar and Kapurthala",
    description:
      "Supervised contract labour crews for factories, food plants and warehouses in the Jalandhar region: Kapurthala, Jalandhar's focal points, Phagwara and Goraya.",
    heading: "Labour contractor in Jalandhar and Kapurthala.",
    lede: "Supervised packing, factory and loading crews across the Jalandhar region's industrial clusters.",
    paragraph:
      "The Jalandhar region works in clusters. The city makes hand tools, valves, auto parts and sports goods in PSIEC's focal points and complexes; Kapurthala, PSIEC's other estate in the zone, adds food, starch, sugar and engineering units; and Phagwara and Goraya line NH-44 to the south-east. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/jalandhar/kapurthala", name: "Kapurthala" },
      { href: "/locations/jalandhar/jalandhar-focal-point", name: "Jalandhar's Focal Point" },
      { href: "/locations/jalandhar/phagwara-goraya", name: "Phagwara and Goraya" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Jalandhar and Kapurthala?",
        answer: "Yes. Supervised packing, factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Where do your workers come from?",
        answer: "Job seekers across Jalandhar, Kapurthala and Phagwara apply on our jobs pages for each. We build each crew from them, close to your site.",
        category: "operations",
      },
      wagesFaq,
      {
        question: "Can you supply security guards?",
        answer: "No. Security work needs a private security agency licence, which we don't hold.",
        category: "commercial",
      },
    ],
    sources: [SRC.psiec, SRC.msmeJalandhar, SRC.msmeKapurthala, SRC.mcPhagwara, SRC.goraya, SRC.pbWages, SRC.psdt, SRC.lwf2025],
    // Drafts pending native review (docs/punjabi-glossary.md, docs/hindi-glossary.md).
    translations: {
      "pa-IN": {
        name: "ਜਲੰਧਰ ਅਤੇ ਕਪੂਰਥਲਾ",
        metaTitle: "ਜਲੰਧਰ ਅਤੇ ਕਪੂਰਥਲਾ ਵਿੱਚ ਲੇਬਰ ਠੇਕੇਦਾਰ (Labour Contractor)",
        description:
          "ਜਲੰਧਰ ਇਲਾਕੇ ਦੀਆਂ ਫ਼ੈਕਟਰੀਆਂ, ਫ਼ੂਡ ਪਲਾਂਟਾਂ ਅਤੇ ਵੇਅਰਹਾਊਸਾਂ ਲਈ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਕੰਟਰੈਕਟ ਲੇਬਰ ਦੀਆਂ ਟੀਮਾਂ: ਕਪੂਰਥਲਾ, ਜਲੰਧਰ ਦੇ ਫ਼ੋਕਲ ਪੁਆਇੰਟ, ਫਗਵਾੜਾ ਅਤੇ ਗੁਰਾਇਆ।",
        heading: "ਜਲੰਧਰ ਅਤੇ ਕਪੂਰਥਲਾ ਵਿੱਚ ਲੇਬਰ ਠੇਕੇਦਾਰ।",
        lede: "ਜਲੰਧਰ ਇਲਾਕੇ ਦੇ ਇੰਡਸਟਰੀਅਲ ਕਲੱਸਟਰਾਂ ਵਿੱਚ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਪੈਕਿੰਗ, ਫ਼ੈਕਟਰੀ ਅਤੇ ਲੋਡਿੰਗ ਦੀਆਂ ਟੀਮਾਂ।",
        paragraph:
          "ਜਲੰਧਰ ਇਲਾਕੇ ਵਿੱਚ ਕੰਮ ਕਲੱਸਟਰਾਂ ਵਿੱਚ ਹੁੰਦਾ ਹੈ। ਸ਼ਹਿਰ ਵਿੱਚ PSIEC ਦੇ ਫ਼ੋਕਲ ਪੁਆਇੰਟਾਂ ਅਤੇ ਕੰਪਲੈਕਸਾਂ ਵਿੱਚ ਹੈਂਡ ਟੂਲ, ਵਾਲਵ, ਆਟੋ ਪਾਰਟਸ ਅਤੇ ਖੇਡਾਂ ਦਾ ਸਮਾਨ ਬਣਦਾ ਹੈ। ਕਪੂਰਥਲਾ ਵਿੱਚ, ਜੋ ਇਸ ਜ਼ੋਨ ਵਿੱਚ PSIEC ਦੀ ਦੂਜੀ ਅਸਟੇਟ ਹੈ, ਫ਼ੂਡ, ਸਟਾਰਚ, ਖੰਡ ਅਤੇ ਇੰਜੀਨੀਅਰਿੰਗ ਦੀਆਂ ਯੂਨਿਟਾਂ ਵੀ ਹਨ। ਫਗਵਾੜਾ ਅਤੇ ਗੁਰਾਇਆ ਦੱਖਣ-ਪੂਰਬ ਵੱਲ NH-44 ਦੇ ਨਾਲ ਹਨ। ਅਸੀਂ {areas} ਦੀਆਂ ਯੂਨਿਟਾਂ ਤੋਂ ਲੋੜਾਂ ਲੈਂਦੇ ਹਾਂ।",
        areas: [
          { href: "/locations/jalandhar/kapurthala", name: "ਕਪੂਰਥਲਾ" },
          { href: "/locations/jalandhar/jalandhar-focal-point", name: "ਜਲੰਧਰ ਦਾ ਫ਼ੋਕਲ ਪੁਆਇੰਟ" },
          { href: "/locations/jalandhar/phagwara-goraya", name: "ਫਗਵਾੜਾ ਅਤੇ ਗੁਰਾਇਆ" },
        ],
        faqs: [
          {
            question: "ਕੀ ਤੁਸੀਂ ਜਲੰਧਰ ਅਤੇ ਕਪੂਰਥਲਾ ਵਿੱਚ ਕੰਟਰੈਕਟ ਲੇਬਰ ਦਿੰਦੇ ਹੋ?",
            answer: "ਹਾਂ। ਪੈਕਿੰਗ, ਫ਼ੈਕਟਰੀ, ਲੋਡਿੰਗ ਅਤੇ ਅਨਲੋਡਿੰਗ, ਅਤੇ ਹਾਊਸਕੀਪਿੰਗ ਦੀਆਂ ਟੀਮਾਂ, ਸਾਡੇ ਪੇਰੋਲ 'ਤੇ, ਅਤੇ ਤੁਹਾਡੀ ਸਾਈਟ 'ਤੇ ਸਾਡੇ ਸੁਪਰਵਾਈਜ਼ਰ ਦੀ ਨਿਗਰਾਨੀ ਹੇਠ।",
            category: "commercial",
          },
          {
            question: "ਤੁਹਾਡੇ ਕਾਮੇ ਕਿੱਥੋਂ ਆਉਂਦੇ ਹਨ?",
            answer: "ਜਲੰਧਰ, ਕਪੂਰਥਲਾ ਅਤੇ ਫਗਵਾੜਾ ਵਿੱਚ ਕੰਮ ਲੱਭਣ ਵਾਲੇ ਹਰ ਥਾਂ ਲਈ ਸਾਡੇ ਨੌਕਰੀਆਂ ਵਾਲੇ ਪੰਨਿਆਂ 'ਤੇ ਅਪਲਾਈ ਕਰਦੇ ਹਨ। ਹਰ ਟੀਮ ਅਸੀਂ ਉਨ੍ਹਾਂ ਵਿੱਚੋਂ, ਤੁਹਾਡੀ ਸਾਈਟ ਦੇ ਨੇੜੇ, ਬਣਾਉਂਦੇ ਹਾਂ।",
            category: "operations",
          },
          WAGES_FAQ["pa-IN"],
          {
            question: "ਕੀ ਤੁਸੀਂ ਸਕਿਓਰਿਟੀ ਗਾਰਡ ਦੇ ਸਕਦੇ ਹੋ?",
            answer: "ਨਹੀਂ। ਸਕਿਓਰਿਟੀ ਦੇ ਕੰਮ ਲਈ ਪ੍ਰਾਈਵੇਟ ਸਕਿਓਰਿਟੀ ਏਜੰਸੀ ਦਾ ਲਾਇਸੈਂਸ ਚਾਹੀਦਾ ਹੈ, ਜੋ ਸਾਡੇ ਕੋਲ ਨਹੀਂ ਹੈ।",
            category: "commercial",
          },
        ],
      },
      "hi-IN": {
        name: "जालंधर और कपूरथला",
        metaTitle: "जालंधर और कपूरथला में लेबर ठेकेदार (Labour Contractor)",
        description:
          "जालंधर इलाके की फ़ैक्टरियों, फ़ूड प्लांट और वेयरहाउस के लिए सुपरवाइज़र के साथ कॉन्ट्रैक्ट लेबर की टीमें: कपूरथला, जालंधर के फ़ोकल पॉइंट, फगवाड़ा और गुराया।",
        heading: "जालंधर और कपूरथला में लेबर ठेकेदार।",
        lede: "जालंधर इलाके के इंडस्ट्रियल क्लस्टरों में सुपरवाइज़र के साथ पैकिंग, फ़ैक्टरी और लोडिंग की टीमें।",
        paragraph:
          "जालंधर इलाके में काम क्लस्टरों में होता है। शहर में PSIEC के फ़ोकल पॉइंट और कॉम्प्लेक्स में हैंड टूल, वाल्व, ऑटो पार्ट्स और खेल का सामान बनता है। कपूरथला में, जो इस ज़ोन में PSIEC का दूसरा एस्टेट है, फ़ूड, स्टार्च, चीनी और इंजीनियरिंग की यूनिटें भी हैं। फगवाड़ा और गुराया दक्षिण-पूर्व में NH-44 के किनारे हैं। हम {areas} की यूनिटों से ज़रूरतें लेते हैं।",
        areas: [
          { href: "/locations/jalandhar/kapurthala", name: "कपूरथला" },
          { href: "/locations/jalandhar/jalandhar-focal-point", name: "जालंधर का फ़ोकल पॉइंट" },
          { href: "/locations/jalandhar/phagwara-goraya", name: "फगवाड़ा और गुराया" },
        ],
        faqs: [
          {
            question: "क्या आप जालंधर और कपूरथला में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। पैकिंग, फ़ैक्टरी, लोडिंग और अनलोडिंग, और हाउसकीपिंग की टीमें, हमारे पेरोल पर, और आपकी साइट पर हमारे सुपरवाइज़र की देखरेख में।",
            category: "commercial",
          },
          {
            question: "आपके कामगार कहाँ से आते हैं?",
            answer: "जालंधर, कपूरथला और फगवाड़ा में काम ढूँढने वाले हर जगह के लिए हमारे जॉब्स पेज पर अप्लाई करते हैं। हर टीम हम उनमें से, आपकी साइट के पास, बनाते हैं।",
            category: "operations",
          },
          WAGES_FAQ["hi-IN"],
          {
            question: "क्या आप सिक्योरिटी गार्ड दे सकते हैं?",
            answer: "नहीं। सिक्योरिटी के काम के लिए प्राइवेट सिक्योरिटी एजेंसी का लाइसेंस चाहिए, जो हमारे पास नहीं है।",
            category: "commercial",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Jalandhar aur Kapurthala",
        metaTitle: "Jalandhar aur Kapurthala mein Labour Thekedar",
        description:
          "Jalandhar ilaake ki factories, food plants aur warehouses ke liye supervised contract labour teams: Kapurthala, Jalandhar ke focal points, Phagwara aur Goraya.",
        heading: "Jalandhar aur Kapurthala mein labour contractor.",
        lede: "Jalandhar ilaake ke industrial clusters mein supervisor ke saath packing, factory aur loading ki teams.",
        paragraph:
          "Jalandhar ilaake mein kaam clusters mein hota hai. Shehar mein PSIEC ke focal points aur complexes mein hand tools, valves, auto parts aur sports goods bante hain. Kapurthala mein, jo is zone mein PSIEC ka doosra estate hai, food, starch, sugar aur engineering units bhi hain. Phagwara aur Goraya south-east mein NH-44 ke kinaare hain. Hum {areas} ki units se requirements lete hain.",
        areas: [
          { href: "/locations/jalandhar/kapurthala", name: "Kapurthala" },
          { href: "/locations/jalandhar/jalandhar-focal-point", name: "Jalandhar ka Focal Point" },
          { href: "/locations/jalandhar/phagwara-goraya", name: "Phagwara aur Goraya" },
        ],
        faqs: [
          {
            question: "Kya aap Jalandhar aur Kapurthala mein contract labour dete hain?",
            answer: "Haan. Packing, factory, loading aur unloading, aur housekeeping ki teams, hamare payroll par, aur aapki site par hamare supervisor ki dekhrekh mein.",
            category: "commercial",
          },
          {
            question: "Aapke workers kahan se aate hain?",
            answer: "Jalandhar, Kapurthala aur Phagwara mein kaam dhoondhne wale har jagah ke liye hamare jobs pages par apply karte hain. Har team hum unmein se, aapki site ke paas, banate hain.",
            category: "operations",
          },
          WAGES_FAQ["hi-Latn-IN"],
          {
            question: "Kya aap security guards de sakte hain?",
            answer: "Nahi. Security ke kaam ke liye private security agency ka licence chahiye, jo hamare paas nahi hai.",
            category: "commercial",
          },
        ],
      },
    },
  },
  {
    cluster: "jalandhar",
    estate: "kapurthala",
    jobsMarket: "kapurthala",
    name: "Kapurthala",
    placeId: "kapurthala",
    metaTitle: "Labour Contractor in Kapurthala, Punjab",
    description:
      "Supervised packing, factory, loading and housekeeping crews for Kapurthala's Industrial Focal Point and the food, starch and engineering units around it.",
    heading: "Labour contractor in Kapurthala.",
    lede: "Supervised packing and factory crews for Kapurthala's focal point and the units around it.",
    paragraph:
      "Kapurthala is the Jalandhar region's second industrial cluster, on the Jalandhar–Ferozepur road and railway. PSIEC runs its Industrial Focal Point. The district's industry is food and beverages, starch, sugar, distilling and textiles, with a foundry and engineering cluster making castings, engine parts and auto components.",
    faqs: [
      {
        question: "Do you supply contract labour in Kapurthala?",
        answer: "Yes. Packing crews, line and production helpers, loading and unloading, and housekeeping, for units in the focal point and across the district.",
        category: "commercial",
      },
      {
        question: "Can you staff packing lines at food plants?",
        answer: "Yes. Line packing, cartoning, labelling and dispatch crews, inducted on your site's hygiene and safety rules before they start.",
        category: "operations",
      },
      wagesFaq,
      {
        question: "How do workers reach Kapurthala?",
        answer: "Government and private buses link Kapurthala with Jalandhar, and autos run within the town. For shifts outside bus hours, we plan transport with you.",
        category: "operations",
      },
    ],
    sources: [SRC.psiec, SRC.kapurthalaProfile, SRC.msmeKapurthala, SRC.kapurthalaReach, SRC.pbWages],
    // Drafts pending native review (docs/punjabi-glossary.md, docs/hindi-glossary.md).
    translations: {
      "pa-IN": {
        name: "ਕਪੂਰਥਲਾ",
        metaTitle: "ਕਪੂਰਥਲਾ ਲੇਬਰ ਠੇਕੇਦਾਰ ਅਤੇ ਮੈਨਪਾਵਰ (Labour Contractor)",
        description:
          "ਕਪੂਰਥਲਾ ਦੇ ਇੰਡਸਟਰੀਅਲ ਫ਼ੋਕਲ ਪੁਆਇੰਟ ਅਤੇ ਆਲੇ-ਦੁਆਲੇ ਦੀਆਂ ਫ਼ੂਡ, ਸਟਾਰਚ ਅਤੇ ਇੰਜੀਨੀਅਰਿੰਗ ਯੂਨਿਟਾਂ ਲਈ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਪੈਕਿੰਗ, ਫ਼ੈਕਟਰੀ, ਲੋਡਿੰਗ ਅਤੇ ਹਾਊਸਕੀਪਿੰਗ ਦੀਆਂ ਟੀਮਾਂ।",
        heading: "ਕਪੂਰਥਲਾ ਵਿੱਚ ਲੇਬਰ ਠੇਕੇਦਾਰ।",
        lede: "ਕਪੂਰਥਲਾ ਦੇ ਫ਼ੋਕਲ ਪੁਆਇੰਟ ਅਤੇ ਆਲੇ-ਦੁਆਲੇ ਦੀਆਂ ਯੂਨਿਟਾਂ ਲਈ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਪੈਕਿੰਗ ਅਤੇ ਫ਼ੈਕਟਰੀ ਦੀਆਂ ਟੀਮਾਂ।",
        paragraph:
          "ਕਪੂਰਥਲਾ ਜਲੰਧਰ ਇਲਾਕੇ ਦਾ ਦੂਜਾ ਇੰਡਸਟਰੀਅਲ ਕਲੱਸਟਰ ਹੈ, ਜਲੰਧਰ-ਫ਼ਿਰੋਜ਼ਪੁਰ ਸੜਕ ਅਤੇ ਰੇਲ ਲਾਈਨ 'ਤੇ। ਇਸਦਾ ਇੰਡਸਟਰੀਅਲ ਫ਼ੋਕਲ ਪੁਆਇੰਟ PSIEC ਚਲਾਉਂਦੀ ਹੈ। ਜ਼ਿਲ੍ਹੇ ਦੀ ਇੰਡਸਟਰੀ ਵਿੱਚ ਖਾਣ-ਪੀਣ ਦਾ ਸਮਾਨ, ਸਟਾਰਚ, ਖੰਡ, ਡਿਸਟਿਲਰੀ ਅਤੇ ਟੈਕਸਟਾਈਲ ਹਨ, ਅਤੇ ਨਾਲ ਹੀ ਫ਼ਾਊਂਡਰੀ ਅਤੇ ਇੰਜੀਨੀਅਰਿੰਗ ਦਾ ਇੱਕ ਕਲੱਸਟਰ ਹੈ ਜੋ ਕਾਸਟਿੰਗ, ਇੰਜਣ ਪਾਰਟਸ ਅਤੇ ਆਟੋ ਕੰਪੋਨੈਂਟ ਬਣਾਉਂਦਾ ਹੈ।",
        faqs: [
          {
            question: "ਕੀ ਤੁਸੀਂ ਕਪੂਰਥਲਾ ਵਿੱਚ ਕੰਟਰੈਕਟ ਲੇਬਰ ਦਿੰਦੇ ਹੋ?",
            answer: "ਹਾਂ। ਪੈਕਿੰਗ ਟੀਮਾਂ, ਲਾਈਨ ਅਤੇ ਪ੍ਰੋਡਕਸ਼ਨ ਹੈਲਪਰ, ਲੋਡਿੰਗ ਅਤੇ ਅਨਲੋਡਿੰਗ, ਅਤੇ ਹਾਊਸਕੀਪਿੰਗ, ਫ਼ੋਕਲ ਪੁਆਇੰਟ ਅਤੇ ਪੂਰੇ ਜ਼ਿਲ੍ਹੇ ਦੀਆਂ ਯੂਨਿਟਾਂ ਲਈ।",
            category: "commercial",
          },
          {
            question: "ਕੀ ਤੁਸੀਂ ਫ਼ੂਡ ਪਲਾਂਟਾਂ ਦੀਆਂ ਪੈਕਿੰਗ ਲਾਈਨਾਂ ਲਈ ਕਾਮੇ ਦੇ ਸਕਦੇ ਹੋ?",
            answer: "ਹਾਂ। ਲਾਈਨ ਪੈਕਿੰਗ, ਕਾਰਟਨਿੰਗ, ਲੇਬਲਿੰਗ ਅਤੇ ਡਿਸਪੈਚ ਦੀਆਂ ਟੀਮਾਂ। ਕੰਮ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਉਨ੍ਹਾਂ ਨੂੰ ਤੁਹਾਡੀ ਸਾਈਟ ਦੇ ਸਫ਼ਾਈ ਅਤੇ ਸੇਫ਼ਟੀ ਨਿਯਮ ਸਿਖਾਏ ਜਾਂਦੇ ਹਨ।",
            category: "operations",
          },
          WAGES_FAQ["pa-IN"],
          {
            question: "ਕਾਮੇ ਕਪੂਰਥਲਾ ਕਿਵੇਂ ਪਹੁੰਚਦੇ ਹਨ?",
            answer: "ਸਰਕਾਰੀ ਅਤੇ ਪ੍ਰਾਈਵੇਟ ਬੱਸਾਂ ਕਪੂਰਥਲਾ ਨੂੰ ਜਲੰਧਰ ਨਾਲ ਜੋੜਦੀਆਂ ਹਨ, ਅਤੇ ਸ਼ਹਿਰ ਦੇ ਅੰਦਰ ਆਟੋ ਚੱਲਦੇ ਹਨ। ਬੱਸਾਂ ਦੇ ਸਮੇਂ ਤੋਂ ਬਾਹਰ ਦੀਆਂ ਸ਼ਿਫ਼ਟਾਂ ਲਈ ਅਸੀਂ ਤੁਹਾਡੇ ਨਾਲ ਮਿਲ ਕੇ ਟਰਾਂਸਪੋਰਟ ਦੀ ਪਲਾਨਿੰਗ ਕਰਦੇ ਹਾਂ।",
            category: "operations",
          },
        ],
      },
      "hi-IN": {
        name: "कपूरथला",
        metaTitle: "कपूरथला, पंजाब में लेबर ठेकेदार (Labour Contractor)",
        description:
          "कपूरथला के इंडस्ट्रियल फ़ोकल पॉइंट और आसपास की फ़ूड, स्टार्च और इंजीनियरिंग यूनिटों के लिए सुपरवाइज़र के साथ पैकिंग, फ़ैक्टरी, लोडिंग और हाउसकीपिंग की टीमें।",
        heading: "कपूरथला में लेबर ठेकेदार।",
        lede: "कपूरथला के फ़ोकल पॉइंट और आसपास की यूनिटों के लिए सुपरवाइज़र के साथ पैकिंग और फ़ैक्टरी की टीमें।",
        paragraph:
          "कपूरथला जालंधर इलाके का दूसरा इंडस्ट्रियल क्लस्टर है, जालंधर-फ़िरोज़पुर सड़क और रेल लाइन पर। इसका इंडस्ट्रियल फ़ोकल पॉइंट PSIEC चलाती है। ज़िले के उद्योग में खाने-पीने का सामान, स्टार्च, चीनी, डिस्टिलरी और टेक्सटाइल हैं, और साथ में फ़ाउंड्री और इंजीनियरिंग का एक क्लस्टर है जो कास्टिंग, इंजन पार्ट्स और ऑटो कंपोनेंट बनाता है।",
        faqs: [
          {
            question: "क्या आप कपूरथला में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। पैकिंग टीमें, लाइन और प्रोडक्शन हेल्पर, लोडिंग और अनलोडिंग, और हाउसकीपिंग, फ़ोकल पॉइंट और पूरे ज़िले की यूनिटों के लिए।",
            category: "commercial",
          },
          {
            question: "क्या आप फ़ूड प्लांट की पैकिंग लाइनों के लिए कामगार दे सकते हैं?",
            answer: "हाँ। लाइन पैकिंग, कार्टनिंग, लेबलिंग और डिस्पैच की टीमें। काम शुरू करने से पहले उन्हें आपकी साइट के हाइजीन और सेफ़्टी नियम सिखाए जाते हैं।",
            category: "operations",
          },
          WAGES_FAQ["hi-IN"],
          {
            question: "कामगार कपूरथला कैसे पहुँचते हैं?",
            answer: "सरकारी और प्राइवेट बसें कपूरथला को जालंधर से जोड़ती हैं, और शहर के अंदर ऑटो चलते हैं। बसों के समय से बाहर की शिफ़्टों के लिए हम आपके साथ मिलकर ट्रांसपोर्ट प्लान करते हैं।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Kapurthala",
        metaTitle: "Kapurthala, Punjab mein Labour Thekedar (Contractor)",
        description:
          "Kapurthala ke Industrial Focal Point aur aaspaas ki food, starch aur engineering units ke liye supervised packing, factory, loading aur housekeeping teams.",
        heading: "Kapurthala mein labour contractor.",
        lede: "Kapurthala ke focal point aur aaspaas ki units ke liye supervisor ke saath packing aur factory ki teams.",
        paragraph:
          "Kapurthala, Jalandhar ilaake ka doosra industrial cluster hai, Jalandhar-Ferozepur road aur railway line par. Iska Industrial Focal Point PSIEC chalati hai. District ki industry mein food aur beverages, starch, sugar, distilling aur textiles hain, aur saath mein ek foundry aur engineering cluster hai jo castings, engine parts aur auto components banata hai.",
        faqs: [
          {
            question: "Kya aap Kapurthala mein contract labour dete hain?",
            answer: "Haan. Packing teams, line aur production helpers, loading aur unloading, aur housekeeping, focal point aur poore district ki units ke liye.",
            category: "commercial",
          },
          {
            question: "Kya aap food plants ki packing lines ke liye workers de sakte hain?",
            answer: "Haan. Line packing, cartoning, labelling aur dispatch ki teams. Kaam shuru karne se pehle unhe aapki site ke hygiene aur safety rules sikhaye jaate hain.",
            category: "operations",
          },
          WAGES_FAQ["hi-Latn-IN"],
          {
            question: "Workers Kapurthala kaise pahunchte hain?",
            answer: "Sarkari aur private buses Kapurthala ko Jalandhar se jodti hain, aur shehar ke andar autos chalte hain. Bus ke time se bahar ki shifts ke liye hum aapke saath milkar transport plan karte hain.",
            category: "operations",
          },
        ],
      },
    },
  },
  {
    cluster: "jalandhar",
    estate: "jalandhar-focal-point",
    name: "Focal Point, Jalandhar",
    placeId: "jalandhar-focal-point",
    metaTitle: "Labour Contractor in Focal Point, Jalandhar",
    description:
      "Supervised factory, packing, loading and housekeeping crews for Jalandhar's Industrial Focal Point, Leather Complex and Sports and Surgical Goods Complex.",
    heading: "Labour contractor in Focal Point, Jalandhar.",
    lede: "Supervised crews for Jalandhar's hand tool, valve, auto part, sports goods and leather units.",
    paragraph:
      "Jalandhar's industry sits in PSIEC estates: the Industrial Focal Point and its extension, about 305 acres in the MSME-DI district profile, the older Industrial Area, the Sports and Surgical Goods Complex, and the Leather Complex on Kapurthala Road. Its units make hand tools, valves, auto parts, sports and surgical goods, and leather.",
    faqs: [
      {
        question: "Do you supply contract labour in Focal Point, Jalandhar?",
        answer: "Yes. Shop-floor helpers, packers, loaders and housekeeping staff for units in the Focal Point and its extension.",
        category: "commercial",
      },
      {
        question: "Do you cover the Leather and Sports Complexes too?",
        answer: "Yes. The same supervised crews for units in the Leather Complex, the Sports and Surgical Goods Complex and the Industrial Area.",
        category: "operations",
      },
      wagesFaq,
      {
        question: "How do workers reach the industrial areas?",
        answer: "Most live in the city, which has a large network of state and private buses. Jalandhar City station is a major stop on the Amritsar–Delhi line.",
        category: "operations",
      },
    ],
    sources: [SRC.psiec, SRC.msmeJalandhar, SRC.clri, SRC.tribune2025, SRC.jalandharReach, SRC.pbWages],
    // Drafts pending native review (docs/punjabi-glossary.md, docs/hindi-glossary.md).
    translations: {
      "pa-IN": {
        name: "ਫ਼ੋਕਲ ਪੁਆਇੰਟ, ਜਲੰਧਰ",
        metaTitle: "ਫ਼ੋਕਲ ਪੁਆਇੰਟ, ਜਲੰਧਰ: ਲੇਬਰ ਠੇਕੇਦਾਰ (Labour Contractor)",
        description:
          "ਜਲੰਧਰ ਦੇ ਇੰਡਸਟਰੀਅਲ ਫ਼ੋਕਲ ਪੁਆਇੰਟ, ਲੈਦਰ ਕੰਪਲੈਕਸ ਅਤੇ ਸਪੋਰਟਸ ਅਤੇ ਸਰਜੀਕਲ ਗੁੱਡਜ਼ ਕੰਪਲੈਕਸ ਲਈ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਫ਼ੈਕਟਰੀ, ਪੈਕਿੰਗ, ਲੋਡਿੰਗ ਅਤੇ ਹਾਊਸਕੀਪਿੰਗ ਦੀਆਂ ਟੀਮਾਂ।",
        heading: "ਫ਼ੋਕਲ ਪੁਆਇੰਟ, ਜਲੰਧਰ ਵਿੱਚ ਲੇਬਰ ਠੇਕੇਦਾਰ।",
        lede: "ਜਲੰਧਰ ਦੀਆਂ ਹੈਂਡ ਟੂਲ, ਵਾਲਵ, ਆਟੋ ਪਾਰਟਸ, ਖੇਡਾਂ ਦੇ ਸਮਾਨ ਅਤੇ ਚਮੜੇ ਦੀਆਂ ਯੂਨਿਟਾਂ ਲਈ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਟੀਮਾਂ।",
        paragraph:
          "ਜਲੰਧਰ ਦੀ ਇੰਡਸਟਰੀ PSIEC ਦੀਆਂ ਅਸਟੇਟਾਂ ਵਿੱਚ ਹੈ: ਇੰਡਸਟਰੀਅਲ ਫ਼ੋਕਲ ਪੁਆਇੰਟ ਅਤੇ ਉਸਦਾ ਐਕਸਟੈਂਸ਼ਨ, MSME-DI ਦੀ ਜ਼ਿਲ੍ਹਾ ਪ੍ਰੋਫ਼ਾਈਲ ਮੁਤਾਬਕ ਲਗਭਗ 305 ਏਕੜ, ਪੁਰਾਣਾ ਇੰਡਸਟਰੀਅਲ ਏਰੀਆ, ਸਪੋਰਟਸ ਅਤੇ ਸਰਜੀਕਲ ਗੁੱਡਜ਼ ਕੰਪਲੈਕਸ, ਅਤੇ ਕਪੂਰਥਲਾ ਰੋਡ 'ਤੇ ਲੈਦਰ ਕੰਪਲੈਕਸ। ਇੱਥੋਂ ਦੀਆਂ ਯੂਨਿਟਾਂ ਹੈਂਡ ਟੂਲ, ਵਾਲਵ, ਆਟੋ ਪਾਰਟਸ, ਖੇਡਾਂ ਦਾ ਸਮਾਨ, ਸਰਜੀਕਲ ਸਮਾਨ, ਅਤੇ ਚਮੜਾ ਬਣਾਉਂਦੀਆਂ ਹਨ।",
        faqs: [
          {
            question: "ਕੀ ਤੁਸੀਂ ਫ਼ੋਕਲ ਪੁਆਇੰਟ, ਜਲੰਧਰ ਵਿੱਚ ਕੰਟਰੈਕਟ ਲੇਬਰ ਦਿੰਦੇ ਹੋ?",
            answer: "ਹਾਂ। ਫ਼ੋਕਲ ਪੁਆਇੰਟ ਅਤੇ ਉਸਦੇ ਐਕਸਟੈਂਸ਼ਨ ਦੀਆਂ ਯੂਨਿਟਾਂ ਲਈ ਸ਼ਾਪ-ਫ਼ਲੋਰ ਹੈਲਪਰ, ਪੈਕਰ, ਲੋਡਰ ਅਤੇ ਹਾਊਸਕੀਪਿੰਗ ਸਟਾਫ਼।",
            category: "commercial",
          },
          {
            question: "ਕੀ ਤੁਸੀਂ ਲੈਦਰ ਅਤੇ ਸਪੋਰਟਸ ਕੰਪਲੈਕਸਾਂ ਵਿੱਚ ਵੀ ਕੰਮ ਕਰਦੇ ਹੋ?",
            answer: "ਹਾਂ। ਲੈਦਰ ਕੰਪਲੈਕਸ, ਸਪੋਰਟਸ ਅਤੇ ਸਰਜੀਕਲ ਗੁੱਡਜ਼ ਕੰਪਲੈਕਸ ਅਤੇ ਇੰਡਸਟਰੀਅਲ ਏਰੀਆ ਦੀਆਂ ਯੂਨਿਟਾਂ ਲਈ ਵੀ ਇਸੇ ਤਰ੍ਹਾਂ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਟੀਮਾਂ।",
            category: "operations",
          },
          WAGES_FAQ["pa-IN"],
          {
            question: "ਕਾਮੇ ਇੰਡਸਟਰੀਅਲ ਇਲਾਕਿਆਂ ਤੱਕ ਕਿਵੇਂ ਪਹੁੰਚਦੇ ਹਨ?",
            answer: "ਜ਼ਿਆਦਾਤਰ ਸ਼ਹਿਰ ਵਿੱਚ ਰਹਿੰਦੇ ਹਨ, ਜਿੱਥੇ ਸਰਕਾਰੀ ਅਤੇ ਪ੍ਰਾਈਵੇਟ ਬੱਸਾਂ ਦਾ ਵੱਡਾ ਨੈੱਟਵਰਕ ਹੈ। ਜਲੰਧਰ ਸਿਟੀ ਸਟੇਸ਼ਨ ਅੰਮ੍ਰਿਤਸਰ-ਦਿੱਲੀ ਲਾਈਨ ਦਾ ਇੱਕ ਵੱਡਾ ਸਟਾਪ ਹੈ।",
            category: "operations",
          },
        ],
      },
      "hi-IN": {
        name: "फ़ोकल पॉइंट, जालंधर",
        metaTitle: "फ़ोकल पॉइंट, जालंधर: लेबर ठेकेदार (Labour Contractor)",
        description:
          "जालंधर के फ़ोकल पॉइंट, लेदर कॉम्प्लेक्स और स्पोर्ट्स और सर्जिकल गुड्स कॉम्प्लेक्स के लिए सुपरवाइज़र के साथ फ़ैक्टरी, पैकिंग, लोडिंग और हाउसकीपिंग की टीमें।",
        heading: "फ़ोकल पॉइंट, जालंधर में लेबर ठेकेदार।",
        lede: "जालंधर की हैंड टूल, वाल्व, ऑटो पार्ट्स, खेल के सामान और लेदर की यूनिटों के लिए सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "जालंधर का उद्योग PSIEC के एस्टेट में है: इंडस्ट्रियल फ़ोकल पॉइंट और उसका एक्सटेंशन, MSME-DI की ज़िला प्रोफ़ाइल के मुताबिक़ लगभग 305 एकड़, पुराना इंडस्ट्रियल एरिया, स्पोर्ट्स और सर्जिकल गुड्स कॉम्प्लेक्स, और कपूरथला रोड पर लेदर कॉम्प्लेक्स। यहाँ की यूनिटें हैंड टूल, वाल्व, ऑटो पार्ट्स, खेल और सर्जिकल सामान, और चमड़ा बनाती हैं।",
        faqs: [
          {
            question: "क्या आप फ़ोकल पॉइंट, जालंधर में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। फ़ोकल पॉइंट और उसके एक्सटेंशन की यूनिटों के लिए शॉप-फ़्लोर हेल्पर, पैकर, लोडर और हाउसकीपिंग स्टाफ़।",
            category: "commercial",
          },
          {
            question: "क्या आप लेदर और स्पोर्ट्स कॉम्प्लेक्स में भी काम करते हैं?",
            answer: "हाँ। लेदर कॉम्प्लेक्स, स्पोर्ट्स और सर्जिकल गुड्स कॉम्प्लेक्स और इंडस्ट्रियल एरिया की यूनिटों के लिए भी इसी तरह सुपरवाइज़र के साथ टीमें।",
            category: "operations",
          },
          WAGES_FAQ["hi-IN"],
          {
            question: "कामगार इंडस्ट्रियल इलाकों तक कैसे पहुँचते हैं?",
            answer: "ज़्यादातर शहर में रहते हैं, जहाँ सरकारी और प्राइवेट बसों का बड़ा नेटवर्क है। जालंधर सिटी स्टेशन अमृतसर-दिल्ली लाइन का एक बड़ा स्टॉप है।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Focal Point, Jalandhar",
        metaTitle: "Focal Point, Jalandhar mein Labour Thekedar",
        description:
          "Jalandhar ke Industrial Focal Point, Leather Complex aur Sports and Surgical Goods Complex ke liye supervised factory, packing, loading aur housekeeping teams.",
        heading: "Focal Point, Jalandhar mein labour contractor.",
        lede: "Jalandhar ki hand tool, valve, auto parts, sports goods aur leather units ke liye supervisor ke saath teams.",
        paragraph:
          "Jalandhar ki industry PSIEC ke estates mein hai: Industrial Focal Point aur uska extension, MSME-DI ki district profile ke hisaab se lagbhag 305 acre, purana Industrial Area, Sports and Surgical Goods Complex, aur Kapurthala Road par Leather Complex. Yahan ki units hand tools, valves, auto parts, sports aur surgical goods, aur leather banati hain.",
        faqs: [
          {
            question: "Kya aap Focal Point, Jalandhar mein contract labour dete hain?",
            answer: "Haan. Focal Point aur uske extension ki units ke liye shop-floor helpers, packers, loaders aur housekeeping staff.",
            category: "commercial",
          },
          {
            question: "Kya aap Leather aur Sports Complex mein bhi kaam karte hain?",
            answer: "Haan. Leather Complex, Sports and Surgical Goods Complex aur Industrial Area ki units ke liye bhi isi tarah supervisor ke saath teams.",
            category: "operations",
          },
          WAGES_FAQ["hi-Latn-IN"],
          {
            question: "Workers industrial areas tak kaise pahunchte hain?",
            answer: "Zyaadatar shehar mein rehte hain, jahan sarkari aur private buses ka bada network hai. Jalandhar City station Amritsar-Delhi line ka ek bada stop hai.",
            category: "operations",
          },
        ],
      },
    },
  },
  {
    cluster: "jalandhar",
    estate: "phagwara-goraya",
    // Phagwara leads the page and is in Kapurthala district.
    jobsMarket: "kapurthala",
    name: "Phagwara and Goraya",
    placeId: "phagwara-goraya",
    metaTitle: "Labour Contractor in Phagwara and Goraya",
    description:
      "Supervised factory, packing, loading and housekeeping crews for Phagwara's mills and industrial area and the Goraya engineering belt on NH-44, Punjab.",
    heading: "Labour contractor in Phagwara and Goraya.",
    lede: "Supervised crews for the mills and engineering units along NH-44, south-east of Jalandhar.",
    paragraph:
      "Phagwara is a sub-division of Kapurthala district on NH-44, about 20 km from Jalandhar, known for sugar, glucose, starch, fine textiles and engine parts; its industrial area of about 35 acres is fully allotted, per the MSME-DI profile. Goraya, further along the old GT Road in Jalandhar district, was once called the Manchester of Punjab for its foundries and bearings, and still makes fodder cutters and ball bearings.",
    faqs: [
      {
        question: "Do you supply contract labour in Phagwara and Goraya?",
        answer: "Yes. Production helpers, packers, loaders and housekeeping staff for mills, machine shops and foundries along NH-44.",
        category: "commercial",
      },
      {
        question: "Can one contract cover Phagwara and Jalandhar sites?",
        answer: "Yes. Both are in Punjab, on the same rules, so each site gets its own crew and you get one monthly invoice.",
        category: "commercial",
      },
      wagesFaq,
      {
        question: "Can you supply foundry and machine-shop helpers?",
        answer: "Yes. Helpers, material handlers and loaders for the shop floor. Welders and fitters on request.",
        category: "operations",
      },
    ],
    sources: [SRC.kapurthalaProfile, SRC.mcPhagwara, SRC.msmeKapurthala, SRC.goraya, SRC.jalandharDistrict, SRC.pbWages],
    // Drafts pending native review (docs/punjabi-glossary.md, docs/hindi-glossary.md).
    translations: {
      "pa-IN": {
        name: "ਫਗਵਾੜਾ ਅਤੇ ਗੁਰਾਇਆ",
        metaTitle: "ਫਗਵਾੜਾ ਅਤੇ ਗੁਰਾਇਆ ਵਿੱਚ ਲੇਬਰ ਠੇਕੇਦਾਰ (Labour Contractor)",
        description:
          "ਫਗਵਾੜਾ ਦੀਆਂ ਮਿੱਲਾਂ ਅਤੇ ਇੰਡਸਟਰੀਅਲ ਏਰੀਆ, ਅਤੇ ਪੰਜਾਬ ਵਿੱਚ NH-44 'ਤੇ ਗੁਰਾਇਆ ਦੀ ਇੰਜੀਨੀਅਰਿੰਗ ਬੈਲਟ ਲਈ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਫ਼ੈਕਟਰੀ, ਪੈਕਿੰਗ, ਲੋਡਿੰਗ ਅਤੇ ਹਾਊਸਕੀਪਿੰਗ ਦੀਆਂ ਟੀਮਾਂ।",
        heading: "ਫਗਵਾੜਾ ਅਤੇ ਗੁਰਾਇਆ ਵਿੱਚ ਲੇਬਰ ਠੇਕੇਦਾਰ।",
        lede: "ਜਲੰਧਰ ਤੋਂ ਦੱਖਣ-ਪੂਰਬ ਵੱਲ NH-44 ਦੇ ਨਾਲ ਮਿੱਲਾਂ ਅਤੇ ਇੰਜੀਨੀਅਰਿੰਗ ਯੂਨਿਟਾਂ ਲਈ ਸੁਪਰਵਾਈਜ਼ਰ ਨਾਲ ਟੀਮਾਂ।",
        paragraph:
          "ਫਗਵਾੜਾ ਕਪੂਰਥਲਾ ਜ਼ਿਲ੍ਹੇ ਦੀ ਇੱਕ ਸਬ-ਡਿਵੀਜ਼ਨ ਹੈ, NH-44 'ਤੇ, ਜਲੰਧਰ ਤੋਂ ਲਗਭਗ 20 ਕਿਲੋਮੀਟਰ। ਇਹ ਖੰਡ, ਗਲੂਕੋਜ਼, ਸਟਾਰਚ, ਬਰੀਕ ਕੱਪੜੇ ਅਤੇ ਇੰਜਣ ਪਾਰਟਸ ਲਈ ਜਾਣਿਆ ਜਾਂਦਾ ਹੈ। MSME-DI ਪ੍ਰੋਫ਼ਾਈਲ ਮੁਤਾਬਕ ਇਸਦਾ ਲਗਭਗ 35 ਏਕੜ ਦਾ ਇੰਡਸਟਰੀਅਲ ਏਰੀਆ ਪੂਰਾ ਅਲਾਟ ਹੋ ਚੁੱਕਾ ਹੈ। ਗੁਰਾਇਆ, ਜਲੰਧਰ ਜ਼ਿਲ੍ਹੇ ਵਿੱਚ ਪੁਰਾਣੀ GT ਰੋਡ 'ਤੇ ਹੋਰ ਅੱਗੇ, ਕਦੇ ਆਪਣੀਆਂ ਫ਼ਾਊਂਡਰੀਆਂ ਅਤੇ ਬੇਅਰਿੰਗਾਂ ਕਰਕੇ ਪੰਜਾਬ ਦਾ ਮੈਨਚੈਸਟਰ ਕਹਾਉਂਦਾ ਸੀ, ਅਤੇ ਅੱਜ ਵੀ ਟੋਕਾ ਮਸ਼ੀਨਾਂ (ਚਾਰਾ ਕੁਤਰਨ ਵਾਲੀਆਂ) ਅਤੇ ਬਾਲ ਬੇਅਰਿੰਗ ਬਣਾਉਂਦਾ ਹੈ।",
        faqs: [
          {
            question: "ਕੀ ਤੁਸੀਂ ਫਗਵਾੜਾ ਅਤੇ ਗੁਰਾਇਆ ਵਿੱਚ ਕੰਟਰੈਕਟ ਲੇਬਰ ਦਿੰਦੇ ਹੋ?",
            answer: "ਹਾਂ। NH-44 ਦੇ ਨਾਲ ਮਿੱਲਾਂ, ਮਸ਼ੀਨ ਸ਼ਾਪਾਂ ਅਤੇ ਫ਼ਾਊਂਡਰੀਆਂ ਲਈ ਪ੍ਰੋਡਕਸ਼ਨ ਹੈਲਪਰ, ਪੈਕਰ, ਲੋਡਰ ਅਤੇ ਹਾਊਸਕੀਪਿੰਗ ਸਟਾਫ਼।",
            category: "commercial",
          },
          {
            question: "ਕੀ ਇੱਕੋ ਕੰਟਰੈਕਟ ਵਿੱਚ ਫਗਵਾੜਾ ਅਤੇ ਜਲੰਧਰ ਦੀਆਂ ਸਾਈਟਾਂ ਆ ਸਕਦੀਆਂ ਹਨ?",
            answer: "ਹਾਂ। ਦੋਵੇਂ ਪੰਜਾਬ ਵਿੱਚ ਹਨ, ਇੱਕੋ ਨਿਯਮਾਂ ਹੇਠ, ਇਸ ਲਈ ਹਰ ਸਾਈਟ ਨੂੰ ਆਪਣੀ ਟੀਮ ਮਿਲਦੀ ਹੈ ਅਤੇ ਤੁਹਾਨੂੰ ਮਹੀਨੇ ਦਾ ਇੱਕ ਇਨਵੌਇਸ ਮਿਲਦਾ ਹੈ।",
            category: "commercial",
          },
          WAGES_FAQ["pa-IN"],
          {
            question: "ਕੀ ਤੁਸੀਂ ਫ਼ਾਊਂਡਰੀ ਅਤੇ ਮਸ਼ੀਨ ਸ਼ਾਪ ਲਈ ਹੈਲਪਰ ਦੇ ਸਕਦੇ ਹੋ?",
            answer: "ਹਾਂ। ਸ਼ਾਪ ਫ਼ਲੋਰ ਲਈ ਹੈਲਪਰ, ਮਟੀਰੀਅਲ ਹੈਂਡਲਰ ਅਤੇ ਲੋਡਰ। ਮੰਗਣ 'ਤੇ ਵੈਲਡਰ ਅਤੇ ਫ਼ਿਟਰ ਵੀ।",
            category: "operations",
          },
        ],
      },
      "hi-IN": {
        name: "फगवाड़ा और गुराया",
        metaTitle: "फगवाड़ा और गुराया में लेबर ठेकेदार (Labour Contractor)",
        description:
          "फगवाड़ा की मिलों और इंडस्ट्रियल एरिया, पंजाब में NH-44 पर गुराया की इंजीनियरिंग बेल्ट के लिए सुपरवाइज़र के साथ फ़ैक्टरी, पैकिंग, लोडिंग और हाउसकीपिंग की टीमें।",
        heading: "फगवाड़ा और गुराया में लेबर ठेकेदार।",
        lede: "जालंधर से दक्षिण-पूर्व में NH-44 के किनारे मिलों और इंजीनियरिंग यूनिटों के लिए सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "फगवाड़ा कपूरथला ज़िले का एक सब-डिवीज़न है, NH-44 पर, जालंधर से लगभग 20 किलोमीटर। यह चीनी, ग्लूकोज़, स्टार्च, बारीक कपड़े और इंजन पार्ट्स के लिए जाना जाता है। MSME-DI प्रोफ़ाइल के मुताबिक़ इसका लगभग 35 एकड़ का इंडस्ट्रियल एरिया पूरी तरह अलॉट हो चुका है। गुराया, जालंधर ज़िले में पुराने GT रोड पर आगे, कभी अपनी फ़ाउंड्री और बेयरिंग की वजह से पंजाब का मैनचेस्टर कहलाता था, और आज भी चारा काटने की मशीनें और बॉल बेयरिंग बनाता है।",
        faqs: [
          {
            question: "क्या आप फगवाड़ा और गुराया में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। NH-44 के किनारे मिलों, मशीन शॉप और फ़ाउंड्री के लिए प्रोडक्शन हेल्पर, पैकर, लोडर और हाउसकीपिंग स्टाफ़।",
            category: "commercial",
          },
          {
            question: "क्या एक ही कॉन्ट्रैक्ट में फगवाड़ा और जालंधर की साइटें आ सकती हैं?",
            answer: "हाँ। दोनों पंजाब में हैं, एक ही नियमों के तहत, इसलिए हर साइट को अपनी टीम मिलती है और आपको महीने का एक इनवॉइस मिलता है।",
            category: "commercial",
          },
          WAGES_FAQ["hi-IN"],
          {
            question: "क्या आप फ़ाउंड्री और मशीन शॉप के लिए हेल्पर दे सकते हैं?",
            answer: "हाँ। शॉप फ़्लोर के लिए हेल्पर, मटीरियल हैंडलर और लोडर। माँगने पर वेल्डर और फ़िटर भी।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Phagwara aur Goraya",
        metaTitle: "Phagwara aur Goraya mein Labour Thekedar (Contractor)",
        description:
          "Phagwara ki mills aur industrial area, aur Punjab mein NH-44 par Goraya ki engineering belt ke liye supervised factory, packing, loading aur housekeeping teams.",
        heading: "Phagwara aur Goraya mein labour contractor.",
        lede: "Jalandhar se south-east mein NH-44 ke kinaare mills aur engineering units ke liye supervisor ke saath teams.",
        paragraph:
          "Phagwara, Kapurthala district ka ek sub-division hai, NH-44 par, Jalandhar se lagbhag 20 km. Yeh sugar, glucose, starch, fine textiles aur engine parts ke liye jaana jaata hai. MSME-DI profile ke hisaab se iska lagbhag 35 acre ka industrial area poora allot ho chuka hai. Goraya, Jalandhar district mein purane GT Road par aage, kabhi apni foundries aur bearings ki wajah se Punjab ka Manchester kehlata tha, aur aaj bhi chara cutter machines aur ball bearings banata hai.",
        faqs: [
          {
            question: "Kya aap Phagwara aur Goraya mein contract labour dete hain?",
            answer: "Haan. NH-44 ke kinaare mills, machine shops aur foundries ke liye production helpers, packers, loaders aur housekeeping staff.",
            category: "commercial",
          },
          {
            question: "Kya ek hi contract mein Phagwara aur Jalandhar ki sites aa sakti hain?",
            answer: "Haan. Dono Punjab mein hain, ek hi rules ke tahat, isliye har site ko apni team milti hai aur aapko mahine ka ek invoice milta hai.",
            category: "commercial",
          },
          WAGES_FAQ["hi-Latn-IN"],
          {
            question: "Kya aap foundry aur machine-shop helpers de sakte hain?",
            answer: "Haan. Shop floor ke liye helpers, material handlers aur loaders. Maangne par welders aur fitters bhi.",
            category: "operations",
          },
        ],
      },
    },
  },
];

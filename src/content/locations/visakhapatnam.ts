import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";
import { linkable } from "@/content/registry";
import { wageStatePath } from "@/content/registry/identifiers";

/**
 * Visakhapatnam, Andhra Pradesh: the hub and four industrial belts, on the
 * location page structure (owner direction, 17 Oct 2026), put up on 22 Oct
 * 2026 to be indexed before any ads run. Parawada and Atchutapuram–Rambilli
 * are in Anakapalli district (split from Visakhapatnam's on 4 April 2022)
 * but are Vizag's industrial belt to buyers and job seekers alike. Facts
 * from the SEZ notifications list, the JN Pharma City environment report,
 * APSEZ's and VSEZ's records and the district pages, each in `sources`. No
 * tenant names, registrations, headcount or shift claims; security guards
 * are out of scope (no PSARA licence).
 *
 * OPEN (owner, 22 Oct 2026): Gajuwaka is published without Autonagar, as an
 * interim call. More data is needed: a citable source on the Autonagar
 * (Visakhapatnam) industrial estate (APIIC estate list, layout, units) and
 * whether buyers name it apart from Gajuwaka. Until then "autonagar" is also
 * not a place word in src/markets/data.ts, because Vijayawada has an
 * Autonagar too and would misroute visitors.
 */

const AP_WAGES = wageStatePath("andhra-pradesh");
/**
 * The Andhra Pradesh wage page comes in its own change; until it is
 * published, the wages answer links to /compliance (as Bengaluru's did while
 * Karnataka's was in review). Switches by itself once the page is linkable.
 */
const WAGES_LINK = linkable(AP_WAGES, "en-IN")
  ? { href: AP_WAGES, label: "Andhra Pradesh minimum wages" }
  : { href: "/compliance", label: "How we handle compliance" };

const wagesFaq = (zone: string): FaqItem => ({
  question: "Which minimum wage and rules apply?",
  answer: `Andhra Pradesh's, by type of work, zone and skill: a basic rate plus a dearness allowance (VDA) revised on 1 April and 1 October. Professional Tax and the Labour Welfare Fund apply too. ${zone}`,
  link: WAGES_LINK,
  category: "compliance",
});

const VISIT_FAQ: FaqItem = {
  question: "Will you visit our site first?",
  answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
  category: "operations",
};

/** The te-IN wages and visit answers (docs/telugu-glossary.md); the pages they link to are English. */
const WAGES_LINK_TE = linkable(AP_WAGES, "en-IN")
  ? { href: AP_WAGES, label: "ఆంధ్రప్రదేశ్ కనీస వేతనాలు (English)" }
  : { href: "/compliance", label: "మేము కంప్లయన్స్ ఎలా చూసుకుంటాం (English)" };

const wagesFaqTe = (zone: string): FaqItem => ({
  question: "ఏ కనీస వేతనం, ఏ రూల్స్ వర్తిస్తాయి?",
  answer: `ఆంధ్రప్రదేశ్ కనీస వేతనాలే, పని రకం, జోన్, స్కిల్‌ని బట్టి: బేసిక్ రేటు, దానితో పాటు ప్రతి ఏప్రిల్ 1, అక్టోబర్ 1న మారే కరువు భత్యం (VDA). ప్రొఫెషనల్ ట్యాక్స్, లేబర్ వెల్ఫేర్ ఫండ్ కూడా వర్తిస్తాయి. ${zone}`,
  link: WAGES_LINK_TE,
  category: "compliance",
});

const VISIT_FAQ_TE: FaqItem = {
  question: "ముందుగా మా సైట్‌ను చూడటానికి వస్తారా?",
  answer: "అవును. టీమ్ పని మొదలుపెట్టే ముందే సైట్‌కి వచ్చి పని, షిఫ్ట్‌లు, మీ హైజీన్, సేఫ్టీ రూల్స్ చూస్తాం.",
  category: "operations",
};

/** The hi-IN and hi-Latn-IN wages and visit answers (docs/hindi-glossary.md); the pages they link to are English. */
const WAGES_LINK_HI = linkable(AP_WAGES, "en-IN")
  ? { href: AP_WAGES, label: "आंध्र प्रदेश न्यूनतम मज़दूरी (अंग्रेज़ी में)" }
  : { href: "/compliance", label: "हम कंप्लायंस कैसे संभालते हैं (अंग्रेज़ी में)" };

const wagesFaqHi = (zone: string): FaqItem => ({
  question: "कौन-सी न्यूनतम मज़दूरी और नियम लागू होते हैं?",
  answer: `आंध्र प्रदेश की, काम के प्रकार, ज़ोन और स्किल के हिसाब से: बेसिक रेट और उसके ऊपर महँगाई भत्ता (VDA), जो 1 अप्रैल और 1 अक्टूबर को बदलता है। प्रोफ़ेशनल टैक्स और लेबर वेलफ़ेयर फ़ंड भी लागू होते हैं। ${zone}`,
  link: WAGES_LINK_HI,
  category: "compliance",
});

const VISIT_FAQ_HI: FaqItem = {
  question: "क्या आप पहले हमारी साइट देखने आएँगे?",
  answer: "हाँ। टीम शुरू होने से पहले हम साइट पर आकर काम, शिफ्ट और आपके हाइजीन और सेफ़्टी नियम देखते हैं।",
  category: "operations",
};

const WAGES_LINK_LATN = linkable(AP_WAGES, "en-IN")
  ? { href: AP_WAGES, label: "Andhra Pradesh minimum wages (English)" }
  : { href: "/compliance", label: "Hum compliance kaise sambhalte hain (English)" };

const wagesFaqLatn = (zone: string): FaqItem => ({
  question: "Kaunsi minimum wage aur rules laagu hote hain?",
  answer: `Andhra Pradesh ki, kaam ke type, zone aur skill ke hisaab se: basic rate aur uske upar dearness allowance (VDA), jo 1 April aur 1 October ko badalta hai. Professional Tax aur Labour Welfare Fund bhi laagu hote hain. ${zone}`,
  link: WAGES_LINK_LATN,
  category: "compliance",
});

const VISIT_FAQ_LATN: FaqItem = {
  question: "Kya aap pehle hamari site dekhne aayenge?",
  answer: "Haan. Team ke kaam shuru karne se pehle hum site par aakar kaam, shifts aur aapke hygiene aur safety rules dekhte hain.",
  category: "operations",
};

const SRC = {
  vizag: { label: "Visakhapatnam", url: "https://en.wikipedia.org/wiki/Visakhapatnam" },
  vizagDistrict: { label: "Visakhapatnam district (mandals since April 2022)", url: "https://en.wikipedia.org/wiki/Visakhapatnam_district" },
  anakapalli: { label: "Anakapalli district (formed 4 April 2022)", url: "https://en.wikipedia.org/wiki/Anakapalli_district" },
  neighbourhoods: { label: "List of neighbourhoods in Visakhapatnam", url: "https://en.wikipedia.org/wiki/List_of_neighbourhoods_in_Visakhapatnam" },
  sezList: { label: "Ministry of Commerce: notified SEZs (as on 18 March 2025)", url: "https://sezindia.gov.in/sites/default/files/notifed/Notified%20SEZs%20UPDATED.pdf" },
  jnpcEmp: { label: "JN Pharma City, Parawada: environment management plan (park area, CETP, location)", url: "https://torrentpharma.com/assets/EMP_Report_a00fd31559.pdf" },
  jnpc: { label: "Jawaharlal Nehru Pharma City", url: "https://en.wikipedia.org/wiki/Jawaharlal_Nehru_Pharma_City" },
  apsez: { label: "Andhra Pradesh Special Economic Zone", url: "https://en.wikipedia.org/wiki/Andhra_Pradesh_Special_Economic_Zone" },
  vcic: { label: "ADB: Visakhapatnam–Chennai Industrial Corridor (Rambilli and Nakkapalli clusters)", url: "https://ewsdata.rightsindevelopment.org/projects/48434-004-visakhapatnam-chennai-industrial-corridor-developm/" },
  vsez: { label: "Visakhapatnam Special Economic Zone", url: "https://en.wikipedia.org/wiki/Visakhapatnam_Special_Economic_Zone" },
  gajuwaka: { label: "Gajuwaka", url: "https://en.wikipedia.org/wiki/Gajuwaka" },
  // CDSCO's own copy (paras 3.4 and 11.4.6: cleaning and contract staff).
  scheduleM: { label: "Revised Schedule M, Drugs Rules, G.S.R. 922(E), 28 December 2023 (CDSCO copy)", url: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadGazette_NotificationsFiles/2023.12.28_DR_Final%20G.S.R.%20922(E)_Notification%20of%20Schedule%20M%20of.pdf" },
  apWages: { label: "Labour Department, Andhra Pradesh: VDA for the scheduled employments from 1 October 2026 (basic plus VDA, revised 1 April and 1 October)", url: "https://api.apfd.apcfss.in/socialwelfaredms/user-defined-path/file-download/bucket/documents.socialwlfare.apcfss.in/labour/1790751054626_VDAGazetteason01.10.2026.pdf" },
  apPt: { label: "Commercial Taxes Department, Andhra Pradesh: Professional Tax First Schedule (Internet Archive copy, June 2022)", url: "https://web.archive.org/web/20220623183430id_/https://apct.gov.in/apportal/AllActs/APPT/APPTSchedule.aspx" },
  apLwf: { label: "Labour Department, Andhra Pradesh: Labour Welfare Fund Act, 1987", url: "https://api.apfd.apcfss.in/socialwelfaredms/user-defined-path/file-download/bucket/documents.socialwlfare.apcfss.in/labour/1755841991986_LABOUR_WELFAREFUNDACT1987.pdf" },
};
const WAGE_SOURCES = [SRC.apWages, SRC.apPt, SRC.apLwf];

export const visakhapatnamPages: LocationCopy[] = [
  {
    cluster: "visakhapatnam",
    name: "Visakhapatnam",
    placeId: "visakhapatnam",
    metaTitle: "Labour Contractor in Visakhapatnam (Vizag)",
    description:
      "Supervised contract labour crews for factories, pharma and port-side units in Visakhapatnam: JN Pharma City Parawada, APSEZ Atchutapuram, VSEZ and Gajuwaka.",
    heading: "Labour contractor in Visakhapatnam.",
    lede: "Supervised crews for pharma, engineering, apparel and port-side units across Vizag's industrial belt.",
    paragraph:
      "Visakhapatnam is a port and steel city, with pharma, petrochemical and engineering units around it. Most of its industry lies south-west of the centre: the steel plant and Gangavaram Port by Gajuwaka, the VSEZ at Duvvada, then, in Anakapalli district since 2022, a pharma city at Parawada and APIIC's SEZ at Atchutapuram and Rambilli. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/visakhapatnam/parawada-pharma-city", name: "JN Pharma City, Parawada" },
      { href: "/locations/visakhapatnam/atchutapuram-rambilli", name: "APSEZ Atchutapuram and Rambilli" },
      { href: "/locations/visakhapatnam/duvvada-vsez", name: "VSEZ Duvvada" },
      { href: "/locations/visakhapatnam/gajuwaka", name: "Gajuwaka" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Visakhapatnam?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Do you have workers in Visakhapatnam?",
        answer: "We keep a worker list for Vizag, and job seekers from the city, Gajuwaka, Pendurthi and Anakapalli join it on our Visakhapatnam jobs page. We build each crew from it for your site.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "Can you supply security guards?",
        answer: "No. Security work needs a private security agency licence, which we don't hold.",
        category: "commercial",
      },
    ],
    sources: [SRC.vizag, SRC.vizagDistrict, SRC.anakapalli, SRC.gajuwaka, SRC.vsez, SRC.jnpc, SRC.apsez, SRC.sezList, ...WAGE_SOURCES],
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "విశాఖపట్నం",
        metaTitle: "విశాఖపట్నంలో లేబర్ కాంట్రాక్టర్ (Labour Contractor)",
        description:
          "విశాఖపట్నంలో ఫ్యాక్టరీలు, ఫార్మా, పోర్టు దగ్గరి యూనిట్లకు సూపర్‌వైజర్ చూసుకునే కాంట్రాక్ట్ లేబర్ టీమ్‌లు: పరవాడ JN ఫార్మా సిటీ, అచ్యుతాపురం APSEZ, VSEZ.",
        heading: "విశాఖపట్నంలో లేబర్ కాంట్రాక్టర్.",
        lede: "వైజాగ్ ఇండస్ట్రియల్ బెల్ట్ అంతటా ఫార్మా, ఇంజినీరింగ్, గార్మెంట్స్, పోర్టు దగ్గరి యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "విశాఖపట్నం పోర్టు, స్టీల్ ప్లాంట్ ఉన్న నగరం. చుట్టూ ఫార్మా, పెట్రోకెమికల్, ఇంజినీరింగ్ యూనిట్లు ఉన్నాయి. ఎక్కువ పరిశ్రమలు నగరానికి నైరుతి వైపు ఉన్నాయి: గాజువాక దగ్గర స్టీల్ ప్లాంట్, గంగవరం పోర్టు; దువ్వాడలో VSEZ; ఆ తర్వాత అనకాపల్లి జిల్లాలో (2022 నుండి) పరవాడలో ఫార్మా సిటీ, అచ్యుతాపురం-రాంబిల్లిలో APIIC SEZ. {areas}లోని యూనిట్ల నుండి రిక్వైర్‌మెంట్లు తీసుకుంటాం.",
        areas: [
          { href: "/locations/visakhapatnam/parawada-pharma-city", name: "పరవాడ JN ఫార్మా సిటీ" },
          { href: "/locations/visakhapatnam/atchutapuram-rambilli", name: "అచ్యుతాపురం-రాంబిల్లి APSEZ" },
          { href: "/locations/visakhapatnam/duvvada-vsez", name: "VSEZ దువ్వాడ" },
          { href: "/locations/visakhapatnam/gajuwaka", name: "గాజువాక" },
        ],
        faqs: [
          {
            question: "విశాఖపట్నంలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. ఫ్యాక్టరీ, లోడింగ్-అన్‌లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం. వర్కర్లు మా పేరోల్‌లో ఉంటారు, మీ సైట్‌లో మా సూపర్‌వైజర్ వాళ్లను చూసుకుంటారు.",
            category: "commercial",
          },
          {
            question: "విశాఖపట్నంలో మీ దగ్గర వర్కర్లు ఉన్నారా?",
            answer:
              "వైజాగ్‌కి మా దగ్గర వర్కర్ల లిస్ట్ ఉంది. సిటీ, గాజువాక, పెందుర్తి, అనకాపల్లి నుండి జాబ్ కోసం చూస్తున్నవారు మా విశాఖపట్నం జాబ్స్ పేజీ ద్వారా ఈ లిస్ట్‌లో చేరుతారు. మీ సైట్‌కి ప్రతి టీమ్‌ని ఈ లిస్ట్ నుండే ఏర్పాటు చేస్తాం.",
            category: "operations",
          },
          wagesFaqTe("రేటు చెప్పే ముందు మీ అడ్రస్ ఏ జోన్‌లోకి వస్తుందో కన్ఫర్మ్ చేస్తాం."),
          {
            question: "సెక్యూరిటీ గార్డులను సప్లై చేస్తారా?",
            answer: "లేదు. సెక్యూరిటీ పనికి ప్రైవేట్ సెక్యూరిటీ ఏజెన్సీ లైసెన్స్ కావాలి, అది మా దగ్గర లేదు.",
            category: "commercial",
          },
        ],
      },
      "hi-IN": {
        name: "विशाखापत्तनम",
        metaTitle: "विशाखापत्तनम (वाइज़ैग) में लेबर ठेकेदार",
        description:
          "विशाखापत्तनम की फ़ैक्टरियों, फ़ार्मा और पोर्ट के पास की यूनिटों के लिए सुपरवाइज़र के साथ कॉन्ट्रैक्ट लेबर: परवाड़ा JN Pharma City, APSEZ, VSEZ और गाजुवाका।",
        heading: "विशाखापत्तनम में लेबर ठेकेदार।",
        lede: "वाइज़ैग के इंडस्ट्रियल बेल्ट में फ़ार्मा, इंजीनियरिंग, गारमेंट और पोर्ट के पास की यूनिटों के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
        paragraph:
          "विशाखापत्तनम पोर्ट और स्टील का शहर है, और इसके आस-पास फ़ार्मा, पेट्रोकेमिकल और इंजीनियरिंग की यूनिटें हैं। ज़्यादातर इंडस्ट्री शहर के दक्षिण-पश्चिम में है: गाजुवाका के पास स्टील प्लांट और गंगावरम पोर्ट, दुव्वाडा में VSEZ, और फिर अनकापल्ली ज़िले में (2022 से) परवाड़ा की फ़ार्मा सिटी और अच्युतापुरम और रामबिल्ली में APIIC का SEZ। हम {areas} की यूनिटों से रिक्वायरमेंट लेते हैं।",
        areas: [
          { href: "/locations/visakhapatnam/parawada-pharma-city", name: "परवाड़ा JN Pharma City" },
          { href: "/locations/visakhapatnam/atchutapuram-rambilli", name: "APSEZ अच्युतापुरम और रामबिल्ली" },
          { href: "/locations/visakhapatnam/duvvada-vsez", name: "VSEZ दुव्वाडा" },
          { href: "/locations/visakhapatnam/gajuwaka", name: "गाजुवाका" },
        ],
        faqs: [
          {
            question: "क्या आप विशाखापत्तनम में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। फ़ैक्टरी, लोडिंग-अनलोडिंग और हाउसकीपिंग के लिए टीमें। कामगार हमारे पेरोल पर रहते हैं, और आपकी साइट पर हमारा सुपरवाइज़र उन्हें देखता है।",
            category: "commercial",
          },
          {
            question: "क्या विशाखापत्तनम में आपके पास कामगार हैं?",
            answer:
              "वाइज़ैग के लिए हमारे पास कामगारों की लिस्ट है। शहर, गाजुवाका, पेंदुर्ती और अनकापल्ली में काम ढूँढने वाले लोग हमारे विशाखापत्तनम जॉब्स पेज पर इस लिस्ट में नाम लिखवाते हैं। आपकी साइट के लिए हर टीम हम इसी लिस्ट से बनाते हैं।",
            category: "operations",
          },
          wagesFaqHi("रेट बताने से पहले हम आपके पते का ज़ोन पक्का करते हैं।"),
          {
            question: "क्या आप सिक्योरिटी गार्ड देते हैं?",
            answer: "नहीं। सिक्योरिटी के काम के लिए प्राइवेट सिक्योरिटी एजेंसी का लाइसेंस चाहिए, जो हमारे पास नहीं है।",
            category: "commercial",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Visakhapatnam",
        metaTitle: "Visakhapatnam (Vizag) mein Labour Thekedar (Contractor)",
        description:
          "Vizag ki factories, pharma aur port ke paas ki units ke liye supervised contract labour: Parawada JN Pharma City, APSEZ Atchutapuram, VSEZ aur Gajuwaka.",
        heading: "Visakhapatnam mein labour contractor.",
        lede: "Vizag ke industrial belt mein pharma, engineering, garment aur port ke paas ki units ke liye supervisor ke saath workers ki team.",
        paragraph:
          "Visakhapatnam port aur steel ka shehar hai, aur iske aas-paas pharma, petrochemical aur engineering ki units hain. Zyadatar industry shehar ke south-west mein hai: Gajuwaka ke paas steel plant aur Gangavaram Port, Duvvada mein VSEZ, aur phir Anakapalli district mein (2022 se) Parawada ki pharma city aur Atchutapuram aur Rambilli mein APIIC ka SEZ. Hum {areas} ki units se requirements lete hain.",
        areas: [
          { href: "/locations/visakhapatnam/parawada-pharma-city", name: "JN Pharma City, Parawada" },
          { href: "/locations/visakhapatnam/atchutapuram-rambilli", name: "APSEZ Atchutapuram aur Rambilli" },
          { href: "/locations/visakhapatnam/duvvada-vsez", name: "VSEZ Duvvada" },
          { href: "/locations/visakhapatnam/gajuwaka", name: "Gajuwaka" },
        ],
        faqs: [
          {
            question: "Kya aap Visakhapatnam mein contract labour dete hain?",
            answer:
              "Haan. Factory, loading-unloading aur housekeeping ke liye teams. Workers hamare payroll par rehte hain, aur aapki site par kaam hamara supervisor chalata hai.",
            category: "commercial",
          },
          {
            question: "Kya Visakhapatnam mein aapke paas workers hain?",
            answer:
              "Vizag ke liye hamare paas workers ki list hai. Shehar, Gajuwaka, Pendurthi aur Anakapalli ke job seekers hamare Visakhapatnam jobs page par is list mein naam likhwate hain. Aapki site ke liye har team hum isi list se banate hain.",
            category: "operations",
          },
          wagesFaqLatn("Rate batane se pehle hum aapke address ka zone confirm karte hain."),
          {
            question: "Kya aap security guards dete hain?",
            answer: "Nahi. Security ke kaam ke liye private security agency ka licence chahiye, jo hamare paas nahi hai.",
            category: "commercial",
          },
        ],
      },
    },
  },
  {
    cluster: "visakhapatnam",
    estate: "parawada-pharma-city",
    name: "JN Pharma City, Parawada",
    placeId: "parawada-pharma-city",
    metaTitle: "Contract Labour in JN Pharma City, Parawada",
    description:
      "Supervised production support, packing, stores and housekeeping crews for bulk drug and API units in Jawaharlal Nehru Pharma City, Parawada, near Vizag.",
    heading: "Contract labour in JN Pharma City, Parawada.",
    lede: "Supervised crews for bulk drug and API units in Parawada, trained to your plant's hygiene and safety rules.",
    paragraph:
      "Jawaharlal Nehru Pharma City is a park built only for bulk drugs, pharmaceuticals and fine chemicals: about 2,100 acres at Parawada, developed with APIIC as a public–private partnership, with its own effluent treatment plant and a notified pharma SEZ inside it. It lies in Anakapalli district, about 8 km from Duvvada station.",
    faqs: [
      {
        question: "Do you supply contract labour in JN Pharma City?",
        answer: "Yes. Crews for production support, packing, stores and dispatch, and housekeeping, planned with your site team and run by our supervisor.",
        category: "operations",
      },
      {
        question: "Can your crews meet GMP training rules?",
        answer:
          "Yes. The revised Schedule M names contract staff, cleaners included. We plan each crew around your plant's training, gowning and health checks, and keep the training records.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for Parawada before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.jnpcEmp, SRC.jnpc, SRC.sezList, SRC.anakapalli, SRC.scheduleM, ...WAGE_SOURCES],
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "పరవాడ JN ఫార్మా సిటీ",
        metaTitle: "పరవాడ ఫార్మా సిటీలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "పరవాడలోని జవహర్‌లాల్ నెహ్రూ ఫార్మా సిటీలో బల్క్ డ్రగ్, API యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ప్రొడక్షన్ సపోర్ట్, ప్యాకింగ్, స్టోర్స్, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "పరవాడ JN ఫార్మా సిటీలో కాంట్రాక్ట్ లేబర్.",
        lede: "పరవాడలోని బల్క్ డ్రగ్, API యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు, మీ ప్లాంట్ హైజీన్, సేఫ్టీ రూల్స్‌పై ట్రైనింగ్‌తో.",
        paragraph:
          "జవహర్‌లాల్ నెహ్రూ ఫార్మా సిటీ బల్క్ డ్రగ్స్, ఫార్మాస్యూటికల్స్, ఫైన్ కెమికల్స్ కోసమే నిర్మించిన పార్క్: పరవాడలో దాదాపు 2,100 ఎకరాలు, APIICతో కలిసి పబ్లిక్-ప్రైవేట్ పార్ట్‌నర్‌షిప్ (PPP) పద్ధతిలో అభివృద్ధి చేశారు. దీనికి సొంత ఎఫ్లుయెంట్ ట్రీట్‌మెంట్ ప్లాంట్ ఉంది, లోపల నోటిఫై చేసిన ఫార్మా SEZ కూడా ఉంది. ఇది అనకాపల్లి జిల్లాలో, దువ్వాడ స్టేషన్ నుండి దాదాపు 8 కి.మీ. దూరంలో ఉంది.",
        faqs: [
          {
            question: "JN ఫార్మా సిటీలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. ప్రొడక్షన్ సపోర్ట్, ప్యాకింగ్, స్టోర్స్-డిస్పాచ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం. మీ సైట్ టీమ్‌తో కలిసి ప్లాన్ చేస్తాం, పని మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "operations",
          },
          {
            question: "మీ టీమ్‌లు GMP ట్రైనింగ్ రూల్స్ పాటించగలవా?",
            answer:
              "అవును. రివైజ్డ్ షెడ్యూల్ Mలో క్లీనర్లతో సహా కాంట్రాక్ట్ స్టాఫ్ గురించి కూడా ఉంది. మీ ప్లాంట్ ట్రైనింగ్, గౌనింగ్, మెడికల్ చెకప్‌లకు తగ్గట్టు ప్రతి టీమ్‌ని ప్లాన్ చేస్తాం, ట్రైనింగ్ రికార్డులు కూడా ఉంచుతాం.",
            category: "operations",
          },
          wagesFaqTe("రేటు చెప్పే ముందు పరవాడ ఏ జోన్‌లోకి వస్తుందో కన్ఫర్మ్ చేస్తాం."),
          VISIT_FAQ_TE,
        ],
      },
      "hi-IN": {
        name: "JN Pharma City, परवाड़ा",
        metaTitle: "JN Pharma City, परवाड़ा में कॉन्ट्रैक्ट लेबर",
        description:
          "वाइज़ैग के पास परवाड़ा की जवाहरलाल नेहरू फ़ार्मा सिटी में बल्क ड्रग और API यूनिटों के लिए सुपरवाइज़र के साथ प्रोडक्शन सपोर्ट, पैकिंग, स्टोर और हाउसकीपिंग टीमें।",
        heading: "JN Pharma City, परवाड़ा में कॉन्ट्रैक्ट लेबर।",
        lede: "परवाड़ा की बल्क ड्रग और API यूनिटों के लिए सुपरवाइज़र के साथ कामगारों की टीम, आपके प्लांट के हाइजीन और सेफ़्टी नियमों की ट्रेनिंग के साथ।",
        paragraph:
          "जवाहरलाल नेहरू फ़ार्मा सिटी सिर्फ़ बल्क ड्रग, दवाओं और फ़ाइन केमिकल के लिए बना पार्क है: परवाड़ा में करीब 2,100 एकड़, जिसे APIIC के साथ पब्लिक-प्राइवेट पार्टनरशिप में डेवलप किया गया। इसका अपना एफ़्लुएंट ट्रीटमेंट प्लांट है, और इसके अंदर एक नोटिफ़ाइड फ़ार्मा SEZ भी है। यह अनकापल्ली ज़िले में है, दुव्वाडा स्टेशन से करीब 8 किलोमीटर दूर।",
        faqs: [
          {
            question: "क्या आप JN Pharma City में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। प्रोडक्शन सपोर्ट, पैकिंग, स्टोर और डिस्पैच, और हाउसकीपिंग के लिए टीमें, आपकी साइट टीम के साथ प्लान की हुई और हमारे सुपरवाइज़र की देखरेख में।",
            category: "operations",
          },
          {
            question: "क्या आपकी टीमें GMP ट्रेनिंग के नियम पूरे कर सकती हैं?",
            answer:
              "हाँ। रिवाइज़्ड Schedule M में कॉन्ट्रैक्ट स्टाफ़ का साफ़ ज़िक्र है, सफ़ाई स्टाफ़ भी। हम हर टीम आपके प्लांट की ट्रेनिंग, गाउनिंग और हेल्थ चेक के हिसाब से प्लान करते हैं, और ट्रेनिंग रिकॉर्ड रखते हैं।",
            category: "operations",
          },
          wagesFaqHi("रेट बताने से पहले हम परवाड़ा का ज़ोन पक्का करते हैं।"),
          VISIT_FAQ_HI,
        ],
      },
      "hi-Latn-IN": {
        name: "JN Pharma City, Parawada",
        metaTitle: "JN Pharma City, Parawada mein Contract Labour",
        description:
          "Vizag ke paas Parawada ki Jawaharlal Nehru Pharma City mein bulk drug, API units ke liye supervised production support, packing, stores aur housekeeping teams.",
        heading: "JN Pharma City, Parawada mein contract labour.",
        lede: "Parawada ki bulk drug aur API units ke liye supervisor ke saath workers ki team, aapke plant ke hygiene aur safety rules ki training ke saath.",
        paragraph:
          "Jawaharlal Nehru Pharma City sirf bulk drugs, pharmaceuticals aur fine chemicals ke liye bana park hai: Parawada mein kareeb 2,100 acre, jise APIIC ke saath public-private partnership mein develop kiya gaya. Iska apna effluent treatment plant hai, aur iske andar ek notified pharma SEZ bhi hai. Ye Anakapalli district mein hai, Duvvada station se kareeb 8 km door.",
        faqs: [
          {
            question: "Kya aap JN Pharma City mein contract labour dete hain?",
            answer:
              "Haan. Production support, packing, stores aur dispatch, aur housekeeping ke liye teams. Plan aapki site team ke saath banta hai, aur kaam hamara supervisor chalata hai.",
            category: "operations",
          },
          {
            question: "Kya aapki teams GMP training ke rules poore kar sakti hain?",
            answer:
              "Haan. Revised Schedule M mein contract staff ka zikr hai, cleaners bhi. Hum har team aapke plant ki training, gowning aur health checks ke hisaab se plan karte hain, aur training records rakhte hain.",
            category: "operations",
          },
          wagesFaqLatn("Rate batane se pehle hum Parawada ka zone confirm karte hain."),
          VISIT_FAQ_LATN,
        ],
      },
    },
  },
  {
    cluster: "visakhapatnam",
    estate: "atchutapuram-rambilli",
    name: "APSEZ Atchutapuram and Rambilli",
    placeId: "atchutapuram-rambilli",
    metaTitle: "Contract Labour in APSEZ Atchutapuram and Rambilli",
    description:
      "Supervised factory, loading and housekeeping crews for the Andhra Pradesh SEZ at Atchutapuram and Rambilli, Anakapalli district: pharma, engineering, apparel.",
    heading: "Contract labour in APSEZ Atchutapuram and Rambilli.",
    lede: "Supervised crews for pharma, engineering and apparel units in the SEZ belt south of Vizag.",
    paragraph:
      "The Andhra Pradesh Special Economic Zone is APIIC's multi-product SEZ across Atchutapuram and Rambilli mandals in Anakapalli district, planned within the Visakhapatnam–Kakinada petrochemical region and served by Visakhapatnam and Gangavaram ports. Its units work in pharmaceuticals, engineering, logistics and petrochemicals, beside an apparel SEZ, with new corridor clusters coming up at Rambilli and Nakkapalli.",
    faqs: [
      {
        question: "Do you supply contract labour in APSEZ?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews, working under your site's induction, hygiene and PPE rules.",
        category: "commercial",
      },
      {
        question: "How do crews get to sites this far out?",
        answer: "We plan company transport or housing for the crew with you before it starts.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "How do we start?",
        answer: "Request a crew with the site address and the roles. We'll tell you plainly whether we can staff it, and plan the crew from there.",
        category: "commercial",
      },
    ],
    sources: [SRC.apsez, SRC.sezList, SRC.anakapalli, SRC.vcic, ...WAGE_SOURCES],
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "అచ్యుతాపురం-రాంబిల్లి APSEZ",
        metaTitle: "APSEZ అచ్యుతాపురంలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "అనకాపల్లి జిల్లా అచ్యుతాపురం, రాంబిల్లిలోని ఆంధ్రప్రదేశ్ SEZకి సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు: ఫార్మా, ఇంజినీరింగ్, గార్మెంట్స్.",
        heading: "అచ్యుతాపురం, రాంబిల్లి APSEZలో కాంట్రాక్ట్ లేబర్.",
        lede: "వైజాగ్‌కు దక్షిణాన ఉన్న SEZ బెల్ట్‌లో ఫార్మా, ఇంజినీరింగ్, గార్మెంట్స్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "ఆంధ్రప్రదేశ్ స్పెషల్ ఎకనామిక్ జోన్ అనకాపల్లి జిల్లాలోని అచ్యుతాపురం, రాంబిల్లి మండలాల్లో ఉన్న APIIC మల్టీ-ప్రొడక్ట్ SEZ. దీన్ని విశాఖపట్నం-కాకినాడ పెట్రోకెమికల్ రీజియన్‌లో భాగంగా ప్లాన్ చేశారు, విశాఖపట్నం, గంగవరం పోర్టులు దీనికి అందుబాటులో ఉన్నాయి. ఇక్కడి యూనిట్లు ఫార్మాస్యూటికల్స్, ఇంజినీరింగ్, లాజిస్టిక్స్, పెట్రోకెమికల్స్ రంగాల్లో పనిచేస్తాయి. పక్కనే ఒక అపెరల్ SEZ ఉంది, రాంబిల్లి, నక్కపల్లిలో కొత్త కారిడార్ క్లస్టర్లు వస్తున్నాయి.",
        faqs: [
          {
            question: "APSEZలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, లోడింగ్-అన్‌లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం. మీ సైట్ ఇండక్షన్, హైజీన్, PPE రూల్స్ ప్రకారమే పనిచేస్తాయి.",
            category: "commercial",
          },
          {
            question: "ఇంత దూరం ఉన్న సైట్లకు టీమ్‌లు ఎలా వస్తాయి?",
            answer: "టీమ్ పని మొదలుపెట్టే ముందే కంపెనీ ట్రాన్స్‌పోర్ట్ గానీ, ఉండటానికి వసతి గానీ మీతో కలిసి ప్లాన్ చేస్తాం.",
            category: "operations",
          },
          wagesFaqTe("రేటు చెప్పే ముందు మీ అడ్రస్ ఏ జోన్‌లోకి వస్తుందో కన్ఫర్మ్ చేస్తాం."),
          {
            question: "ఎలా మొదలుపెట్టాలి?",
            answer: "సైట్ అడ్రస్, ఏ రోల్స్ కావాలో చెబుతూ రిక్వెస్ట్ పంపండి. వర్కర్లను ఇవ్వగలమో లేదో స్పష్టంగా చెబుతాం, అక్కడి నుండి టీమ్‌ని ప్లాన్ చేస్తాం.",
            category: "commercial",
          },
        ],
      },
      "hi-IN": {
        name: "APSEZ अच्युतापुरम और रामबिल्ली",
        metaTitle: "APSEZ अच्युतापुरम, रामबिल्ली में कॉन्ट्रैक्ट लेबर",
        description:
          "अनकापल्ली ज़िले में अच्युतापुरम और रामबिल्ली के आंध्र प्रदेश SEZ के लिए सुपरवाइज़र के साथ फ़ैक्टरी, लोडिंग और हाउसकीपिंग टीमें: फ़ार्मा, इंजीनियरिंग, गारमेंट।",
        heading: "APSEZ अच्युतापुरम और रामबिल्ली में कॉन्ट्रैक्ट लेबर।",
        lede: "वाइज़ैग के दक्षिण में SEZ बेल्ट की फ़ार्मा, इंजीनियरिंग और गारमेंट यूनिटों के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
        paragraph:
          "आंध्र प्रदेश स्पेशल इकोनॉमिक ज़ोन APIIC का मल्टी-प्रोडक्ट SEZ है, जो अनकापल्ली ज़िले के अच्युतापुरम और रामबिल्ली मंडलों में फैला है। इसे विशाखापत्तनम-काकीनाडा पेट्रोकेमिकल रीजन के अंदर प्लान किया गया, और विशाखापत्तनम और गंगावरम, दोनों पोर्ट इससे जुड़े हैं। यहाँ की यूनिटें फ़ार्मा, इंजीनियरिंग, लॉजिस्टिक्स और पेट्रोकेमिकल का काम करती हैं, और बगल में एक गारमेंट SEZ है। रामबिल्ली और नक्कापल्ली में नए कॉरिडोर क्लस्टर बन रहे हैं।",
        faqs: [
          {
            question: "क्या आप APSEZ में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। सुपरवाइज़र के साथ फ़ैक्टरी, लोडिंग-अनलोडिंग और हाउसकीपिंग टीमें, जो आपकी साइट के इंडक्शन, हाइजीन और PPE नियमों के हिसाब से काम करती हैं।",
            category: "commercial",
          },
          {
            question: "इतनी दूर की साइटों तक टीमें कैसे पहुँचती हैं?",
            answer: "टीम शुरू होने से पहले हम आपके साथ कंपनी ट्रांसपोर्ट या टीम के रहने का इंतज़ाम प्लान करते हैं।",
            category: "operations",
          },
          wagesFaqHi("रेट बताने से पहले हम आपके पते का ज़ोन पक्का करते हैं।"),
          {
            question: "शुरुआत कैसे करें?",
            answer:
              "साइट का पता और कौन-से रोल चाहिए, यह लिखकर टीम के लिए रिक्वेस्ट भेजें। हम साफ़ बताएँगे कि हम कामगार दे सकते हैं या नहीं, और फिर वहीं से टीम प्लान करेंगे।",
            category: "commercial",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "APSEZ Atchutapuram aur Rambilli",
        metaTitle: "APSEZ Atchutapuram, Rambilli mein Contract Labour",
        description:
          "Atchutapuram aur Rambilli, Anakapalli district ke Andhra Pradesh SEZ ke liye supervised factory, loading aur housekeeping teams: pharma, engineering, garment.",
        heading: "APSEZ Atchutapuram aur Rambilli mein contract labour.",
        lede: "Vizag ke south mein SEZ belt ki pharma, engineering aur garment units ke liye supervisor ke saath workers ki team.",
        paragraph:
          "Andhra Pradesh Special Economic Zone APIIC ka multi-product SEZ hai, jo Anakapalli district ke Atchutapuram aur Rambilli mandals mein faila hai. Ise Visakhapatnam-Kakinada petrochemical region ke andar plan kiya gaya, aur Visakhapatnam aur Gangavaram, dono ports isse jude hain. Yahan ki units pharma, engineering, logistics aur petrochemicals ka kaam karti hain, aur bagal mein ek apparel SEZ hai. Rambilli aur Nakkapalli mein naye corridor clusters ban rahe hain.",
        faqs: [
          {
            question: "Kya aap APSEZ mein contract labour dete hain?",
            answer:
              "Haan. Supervisor ke saath factory, loading-unloading aur housekeeping teams, jo aapki site ke induction, hygiene aur PPE rules ke hisaab se kaam karti hain.",
            category: "commercial",
          },
          {
            question: "Itni door ki sites tak teams kaise pahunchti hain?",
            answer: "Team ke kaam shuru karne se pehle hum aapke saath company transport ya team ke rehne ka intezaam plan karte hain.",
            category: "operations",
          },
          wagesFaqLatn("Rate batane se pehle hum aapke address ka zone confirm karte hain."),
          {
            question: "Shuruaat kaise karein?",
            answer:
              "Site ka address aur kaunse roles chahiye, ye likhkar team ke liye request bhejein. Hum saaf bataenge ki hum workers de sakte hain ya nahi, aur phir wahin se team plan karenge.",
            category: "commercial",
          },
        ],
      },
    },
  },
  {
    cluster: "visakhapatnam",
    estate: "duvvada-vsez",
    name: "VSEZ Duvvada",
    placeId: "duvvada-vsez",
    metaTitle: "Contract Labour in VSEZ Duvvada, Visakhapatnam",
    description:
      "Supervised factory, packing, loading and housekeeping crews for the Visakhapatnam Special Economic Zone at Duvvada: electronics, software and pharma units.",
    heading: "Contract labour in VSEZ Duvvada.",
    lede: "Supervised crews for electronics, pharma and export units inside the Visakhapatnam SEZ.",
    paragraph:
      "The Visakhapatnam Special Economic Zone at Duvvada began in 1989 as an export processing zone and became an SEZ in 2003. It is owned by the Government of India and run by a Development Commissioner under the Ministry of Commerce: about 146 hectares of electronics, software and pharmaceutical units, some 20 km from the city.",
    faqs: [
      {
        question: "Do you supply contract labour in VSEZ?",
        answer: "Yes. Helpers, packers, loaders and housekeeping crews for units in the zone, planned with your site team and run by our supervisor.",
        category: "commercial",
      },
      {
        question: "Can your crews work with the zone's entry rules?",
        answer: "Yes. We sort out passes and IDs with your site team before the crew starts, and our supervisor keeps the list current as people change.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for Duvvada before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.vsez, SRC.sezList, SRC.neighbourhoods, ...WAGE_SOURCES],
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "VSEZ దువ్వాడ",
        metaTitle: "VSEZ దువ్వాడలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "దువ్వాడలోని విశాఖపట్నం స్పెషల్ ఎకనామిక్ జోన్‌కి సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, ప్యాకింగ్, లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు: ఎలక్ట్రానిక్స్, ఫార్మా యూనిట్లు.",
        heading: "VSEZ దువ్వాడలో కాంట్రాక్ట్ లేబర్.",
        lede: "విశాఖపట్నం SEZ లోపల ఎలక్ట్రానిక్స్, ఫార్మా, ఎక్స్‌పోర్ట్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "దువ్వాడలోని విశాఖపట్నం స్పెషల్ ఎకనామిక్ జోన్ 1989లో ఎక్స్‌పోర్ట్ ప్రాసెసింగ్ జోన్‌గా మొదలై, 2003లో SEZ అయింది. ఇది కేంద్ర ప్రభుత్వానిది, కేంద్ర వాణిజ్య శాఖ కింద డెవలప్‌మెంట్ కమిషనర్ దీన్ని నడుపుతారు. దాదాపు 146 హెక్టార్లలో ఎలక్ట్రానిక్స్, సాఫ్ట్‌వేర్, ఫార్మాస్యూటికల్ యూనిట్లు ఉన్నాయి. ఇది నగరం నుండి దాదాపు 20 కి.మీ. దూరంలో ఉంది.",
        faqs: [
          {
            question: "VSEZలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. జోన్‌లోని యూనిట్లకు హెల్పర్లు, ప్యాకర్లు, లోడర్లు, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం. మీ సైట్ టీమ్‌తో కలిసి ప్లాన్ చేస్తాం, పని మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "commercial",
          },
          {
            question: "జోన్ ఎంట్రీ రూల్స్‌కి తగ్గట్టు మీ టీమ్‌లు పనిచేయగలవా?",
            answer: "అవును. టీమ్ పనిలోకి వచ్చే ముందే మీ సైట్ టీమ్‌తో కలిసి పాస్‌లు, ID కార్డులు రెడీ చేస్తాం. మనుషులు మారినప్పుడల్లా మా సూపర్‌వైజర్ లిస్ట్ అప్‌డేట్ చేస్తారు.",
            category: "operations",
          },
          wagesFaqTe("రేటు చెప్పే ముందు దువ్వాడ ఏ జోన్‌లోకి వస్తుందో కన్ఫర్మ్ చేస్తాం."),
          VISIT_FAQ_TE,
        ],
      },
      "hi-IN": {
        name: "VSEZ दुव्वाडा",
        metaTitle: "VSEZ दुव्वाडा, विशाखापत्तनम में कॉन्ट्रैक्ट लेबर",
        description:
          "दुव्वाडा के विशाखापत्तनम स्पेशल इकोनॉमिक ज़ोन के लिए सुपरवाइज़र के साथ फ़ैक्टरी, पैकिंग, लोडिंग और हाउसकीपिंग टीम: इलेक्ट्रॉनिक्स, सॉफ़्टवेयर, फ़ार्मा यूनिटें।",
        heading: "VSEZ दुव्वाडा में कॉन्ट्रैक्ट लेबर।",
        lede: "विशाखापत्तनम SEZ के अंदर इलेक्ट्रॉनिक्स, फ़ार्मा और एक्सपोर्ट यूनिटों के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
        paragraph:
          "दुव्वाडा का विशाखापत्तनम स्पेशल इकोनॉमिक ज़ोन 1989 में एक्सपोर्ट प्रोसेसिंग ज़ोन के रूप में शुरू हुआ और 2003 में SEZ बना। यह भारत सरकार का है, और इसे कॉमर्स मंत्रालय के तहत एक डेवलपमेंट कमिश्नर चलाता है। करीब 146 हेक्टेयर में इलेक्ट्रॉनिक्स, सॉफ़्टवेयर और फ़ार्मा यूनिटें हैं, और यह शहर से करीब 20 किलोमीटर दूर है।",
        faqs: [
          {
            question: "क्या आप VSEZ में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। ज़ोन की यूनिटों के लिए हेल्पर, पैकर, लोडर और हाउसकीपिंग टीमें, आपकी साइट टीम के साथ प्लान की हुई और हमारे सुपरवाइज़र की देखरेख में।",
            category: "commercial",
          },
          {
            question: "क्या आपकी टीमें ज़ोन के एंट्री नियमों के हिसाब से काम कर सकती हैं?",
            answer:
              "हाँ। टीम शुरू होने से पहले हम आपकी साइट टीम के साथ पास और ID तैयार करवाते हैं, और लोग बदलने पर हमारा सुपरवाइज़र लिस्ट अपडेट रखता है।",
            category: "operations",
          },
          wagesFaqHi("रेट बताने से पहले हम दुव्वाडा का ज़ोन पक्का करते हैं।"),
          VISIT_FAQ_HI,
        ],
      },
      "hi-Latn-IN": {
        name: "VSEZ Duvvada",
        metaTitle: "VSEZ Duvvada, Visakhapatnam mein Contract Labour",
        description:
          "Duvvada ke Visakhapatnam Special Economic Zone ke liye supervised factory, packing, loading aur housekeeping teams: electronics, software aur pharma units.",
        heading: "VSEZ Duvvada mein contract labour.",
        lede: "Visakhapatnam SEZ ke andar electronics, pharma aur export units ke liye supervisor ke saath workers ki team.",
        paragraph:
          "Duvvada ka Visakhapatnam Special Economic Zone 1989 mein export processing zone ke roop mein shuru hua aur 2003 mein SEZ bana. Ye Government of India ka hai, aur ise Commerce Ministry ke under ek Development Commissioner chalata hai. Kareeb 146 hectare mein electronics, software aur pharma units hain, aur ye shehar se kareeb 20 km door hai.",
        faqs: [
          {
            question: "Kya aap VSEZ mein contract labour dete hain?",
            answer:
              "Haan. Zone ki units ke liye helpers, packers, loaders aur housekeeping teams. Plan aapki site team ke saath banta hai, aur kaam hamara supervisor chalata hai.",
            category: "commercial",
          },
          {
            question: "Kya aapki teams zone ke entry rules ke hisaab se kaam kar sakti hain?",
            answer:
              "Haan. Team ke kaam shuru karne se pehle hum aapki site team ke saath passes aur IDs tayyar karwate hain, aur log badalne par hamara supervisor list update rakhta hai.",
            category: "operations",
          },
          wagesFaqLatn("Rate batane se pehle hum Duvvada ka zone confirm karte hain."),
          VISIT_FAQ_LATN,
        ],
      },
    },
  },
  {
    cluster: "visakhapatnam",
    estate: "gajuwaka",
    name: "Gajuwaka",
    placeId: "gajuwaka",
    metaTitle: "Labour Contractor in Gajuwaka, Visakhapatnam",
    description:
      "Supervised loading, factory and housekeeping crews for units in Gajuwaka and south Visakhapatnam, near the steel plant, Gangavaram Port and NH-16.",
    heading: "Labour contractor in Gajuwaka.",
    lede: "Supervised crews for engineering, port-side and logistics units in Visakhapatnam's industrial south.",
    paragraph:
      "Gajuwaka is the centre of south Visakhapatnam, a mix of homes, shops and industry, with the steel plant and Gangavaram Port close by. NH-16 runs through the mandal, and Kurmannapalem, Aganampudi, Malkapuram and the Steel Plant township lie around it.",
    faqs: [
      {
        question: "Do you supply contract labour in Gajuwaka?",
        answer: "Yes. Supervised loading and unloading, factory and housekeeping crews for units and yards in Gajuwaka and around it.",
        category: "commercial",
      },
      {
        question: "How do workers reach sites here?",
        answer: "Most come by APSRTC bus: Gajuwaka has its own bus station, with city routes through Kurmannapalem and the Steel Plant. For night shifts we plan transport with you.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.gajuwaka, SRC.neighbourhoods, SRC.vizagDistrict, ...WAGE_SOURCES],
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "గాజువాక",
        metaTitle: "గాజువాకలో లేబర్ కాంట్రాక్టర్ (Labour Contractor)",
        description:
          "గాజువాక, దక్షిణ విశాఖపట్నంలో స్టీల్ ప్లాంట్, గంగవరం పోర్టు, NH-16 దగ్గరి యూనిట్లకు సూపర్‌వైజర్ చూసుకునే లోడింగ్, ఫ్యాక్టరీ, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "గాజువాకలో లేబర్ కాంట్రాక్టర్.",
        lede: "విశాఖపట్నం దక్షిణ ఇండస్ట్రియల్ ఏరియాలో ఇంజినీరింగ్, పోర్టు దగ్గరి, లాజిస్టిక్స్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "గాజువాక దక్షిణ విశాఖపట్నానికి కేంద్రం: ఇళ్లు, దుకాణాలు, పరిశ్రమలు కలిసి ఉన్న ప్రాంతం, దగ్గర్లోనే స్టీల్ ప్లాంట్, గంగవరం పోర్టు ఉన్నాయి. NH-16 మండలం గుండా వెళుతుంది, చుట్టూ కూర్మన్నపాలెం, అగనంపూడి, మల్కాపురం, స్టీల్ ప్లాంట్ టౌన్‌షిప్ ఉన్నాయి.",
        faqs: [
          {
            question: "గాజువాకలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. గాజువాకలో, చుట్టుపక్కల ఉన్న యూనిట్లు, యార్డులకు సూపర్‌వైజర్ చూసుకునే లోడింగ్-అన్‌లోడింగ్, ఫ్యాక్టరీ, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం.",
            category: "commercial",
          },
          {
            question: "వర్కర్లు ఇక్కడి సైట్లకు ఎలా వస్తారు?",
            answer:
              "చాలామంది APSRTC బస్సుల్లో వస్తారు: గాజువాకలోనే బస్ స్టేషన్ ఉంది, కూర్మన్నపాలెం, స్టీల్ ప్లాంట్ మీదుగా సిటీ బస్సులు తిరుగుతాయి. నైట్ షిఫ్ట్‌లకు మీతో కలిసి ట్రాన్స్‌పోర్ట్ ప్లాన్ చేస్తాం.",
            category: "operations",
          },
          wagesFaqTe("రేటు చెప్పే ముందు మీ అడ్రస్ ఏ జోన్‌లోకి వస్తుందో కన్ఫర్మ్ చేస్తాం."),
          VISIT_FAQ_TE,
        ],
      },
      "hi-IN": {
        name: "गाजुवाका",
        metaTitle: "गाजुवाका, विशाखापत्तनम में लेबर ठेकेदार",
        description:
          "गाजुवाका और दक्षिण विशाखापत्तनम की यूनिटों के लिए सुपरवाइज़र के साथ लोडिंग, फ़ैक्टरी और हाउसकीपिंग टीमें, स्टील प्लांट, गंगावरम पोर्ट और NH-16 के पास।",
        heading: "गाजुवाका में लेबर ठेकेदार।",
        lede: "दक्षिण विशाखापत्तनम के इंडस्ट्रियल एरिया में इंजीनियरिंग, लॉजिस्टिक्स और पोर्ट के पास की यूनिटों के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
        paragraph:
          "गाजुवाका दक्षिण विशाखापत्तनम का केंद्र है, जहाँ घर, दुकानें और इंडस्ट्री साथ-साथ हैं, और स्टील प्लांट और गंगावरम पोर्ट पास में हैं। NH-16 इस मंडल से होकर जाता है, और इसके आस-पास कूर्मन्नपालेम, अगनमपूडी, मल्कापुरम और स्टील प्लांट टाउनशिप हैं।",
        faqs: [
          {
            question: "क्या आप गाजुवाका में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer: "हाँ। गाजुवाका और आस-पास की यूनिटों और यार्ड के लिए सुपरवाइज़र के साथ लोडिंग-अनलोडिंग, फ़ैक्टरी और हाउसकीपिंग टीमें।",
            category: "commercial",
          },
          {
            question: "कामगार यहाँ की साइटों तक कैसे पहुँचते हैं?",
            answer:
              "ज़्यादातर APSRTC बस से आते हैं: गाजुवाका का अपना बस स्टेशन है, और सिटी बसें कूर्मन्नपालेम और स्टील प्लांट से होकर जाती हैं। नाइट शिफ्ट के लिए हम आपके साथ ट्रांसपोर्ट प्लान करते हैं।",
            category: "operations",
          },
          wagesFaqHi("रेट बताने से पहले हम आपके पते का ज़ोन पक्का करते हैं।"),
          VISIT_FAQ_HI,
        ],
      },
      "hi-Latn-IN": {
        name: "Gajuwaka",
        metaTitle: "Gajuwaka, Visakhapatnam mein Labour Thekedar",
        description:
          "Gajuwaka aur south Visakhapatnam ki units ke liye supervised loading, factory aur housekeeping teams, steel plant, Gangavaram Port aur NH-16 ke paas.",
        heading: "Gajuwaka mein labour contractor.",
        lede: "Visakhapatnam ke industrial south mein engineering, logistics aur port ke paas ki units ke liye supervisor ke saath workers ki team.",
        paragraph:
          "Gajuwaka south Visakhapatnam ka centre hai, jahan ghar, dukaanein aur industry saath-saath hain, aur steel plant aur Gangavaram Port paas mein hain. NH-16 is mandal se hokar jaata hai, aur iske aas-paas Kurmannapalem, Aganampudi, Malkapuram aur Steel Plant township hain.",
        faqs: [
          {
            question: "Kya aap Gajuwaka mein contract labour dete hain?",
            answer: "Haan. Gajuwaka aur aas-paas ki units aur yards ke liye supervisor ke saath loading-unloading, factory aur housekeeping teams.",
            category: "commercial",
          },
          {
            question: "Workers yahan ki sites tak kaise pahunchte hain?",
            answer:
              "Zyadatar APSRTC bus se aate hain: Gajuwaka ka apna bus station hai, aur city buses Kurmannapalem aur Steel Plant se hokar jaati hain. Night shift ke liye hum aapke saath transport plan karte hain.",
            category: "operations",
          },
          wagesFaqLatn("Rate batane se pehle hum aapke address ka zone confirm karte hain."),
          VISIT_FAQ_LATN,
        ],
      },
    },
  },
];

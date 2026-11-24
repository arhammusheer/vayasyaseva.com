import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";
import { linkable } from "@/content/registry";
import { wageStatePath } from "@/content/registry/identifiers";

/**
 * Hyderabad, Telangana: the hub and five industrial belts, on the location
 * page structure (owner direction, 17 Oct 2026), put up on 27 Oct 2026 to be
 * indexed before any ads run. The belts follow TGIIC's own zones (park list
 * of 8 April 2026): Patancheru (Sangareddy district), the Medchal side and
 * the east (Medchal-Malkajgiri) and Shamshabad (Rangareddy). Facts from
 * TGIIC, the state's life sciences pages, the PIB factsheet and the district
 * pages, each in `sources`. No tenant names, registrations, headcount or
 * shift claims; security guards are out of scope (no PSARA licence).
 *
 * Left out on purpose: acreage for the old estates (no official figure
 * found), and Hyderabad Pharma City at Mucherla (TGIIC lists a park there,
 * but the project's status is unsettled).
 */

const TG_WAGES = wageStatePath("telangana");
/**
 * The Telangana wage page is in review (owner, 27 Oct 2026: G.O.Ms. No. 6 is
 * before the High Court, no VDA has been declared under it, and it was not
 * in the state eGazette on 1 Nov 2026), so the wages answer links to
 * /compliance, as Bengaluru's did while Karnataka's was in review. Switches
 * by itself once the page is published.
 */
const WAGES_LINK = linkable(TG_WAGES, "en-IN")
  ? { href: TG_WAGES, label: "Telangana minimum wages" }
  : { href: "/compliance", label: "How we handle compliance" };

const wagesFaq = (zone: string): FaqItem => ({
  question: "Which minimum wage and rules apply?",
  answer: `Telangana's: since 1 June 2026, one order sets basic rates by zone and skill for every listed employment, with a cost of living allowance to be declared each April and October. Professional Tax and the Labour Welfare Fund apply too. ${zone}`,
  link: WAGES_LINK,
  category: "compliance",
});

const VISIT_FAQ: FaqItem = {
  question: "Will you visit our site first?",
  answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
  category: "operations",
};

/** The te-IN answers used on several pages (docs/telugu-glossary.md); the pages they link to are English. */
const WAGES_LINK_TE = linkable(TG_WAGES, "en-IN")
  ? { href: TG_WAGES, label: "తెలంగాణ కనీస వేతనాలు (English)" }
  : { href: "/compliance", label: "మేము కంప్లయన్స్ ఎలా చూసుకుంటాం (English)" };

const wagesFaqTe = (zone: string): FaqItem => ({
  question: "ఏ కనీస వేతనం, ఏ రూల్స్ వర్తిస్తాయి?",
  answer: `తెలంగాణ కనీస వేతనాలే: 2026 జూన్ 1 నుండి ఒకే జీవో, జాబితాలో ఉన్న ప్రతి రకం పనికి జోన్, స్కిల్‌ని బట్టి బేసిక్ రేట్లు నిర్ణయిస్తుంది. జీవన వ్యయ భత్యాన్ని ప్రతి ఏప్రిల్, అక్టోబర్‌లో ప్రకటించాల్సి ఉంటుంది. ప్రొఫెషనల్ ట్యాక్స్, లేబర్ వెల్ఫేర్ ఫండ్ కూడా వర్తిస్తాయి. ${zone}`,
  link: WAGES_LINK_TE,
  category: "compliance",
});
const ZONE_TE = "రేటు చెప్పే ముందు మీ అడ్రస్ ఏ జోన్‌లోకి వస్తుందో కన్ఫర్మ్ చేస్తాం.";

const VISIT_FAQ_TE: FaqItem = {
  question: "ముందుగా మా సైట్‌ను చూడటానికి వస్తారా?",
  answer: "అవును. టీమ్ పని మొదలుపెట్టే ముందే సైట్‌కి వచ్చి పని, షిఫ్ట్‌లు, మీ హైజీన్, సేఫ్టీ రూల్స్ చూస్తాం.",
  category: "operations",
};

const START_FAQ_TE: FaqItem = {
  question: "ఎలా మొదలుపెట్టాలి?",
  answer: "సైట్ అడ్రస్, ఏ రోల్స్ కావాలో చెబుతూ రిక్వెస్ట్ పంపండి. వర్కర్లను ఇవ్వగలమో లేదో స్పష్టంగా చెబుతాం, అక్కడి నుండి టీమ్‌ని ప్లాన్ చేస్తాం.",
  category: "commercial",
};

const gmpFaqTe = (where: string): FaqItem => ({
  question: "మీ టీమ్‌లు GMP ట్రైనింగ్ రూల్స్ పాటించగలవా?",
  answer: `అవును. రివైజ్డ్ షెడ్యూల్ Mలో క్లీనర్లతో సహా కాంట్రాక్ట్ స్టాఫ్ గురించి కూడా ఉంది. మీ ${where} ట్రైనింగ్, గౌనింగ్, మెడికల్ చెకప్‌లకు తగ్గట్టు ప్రతి టీమ్‌ని ప్లాన్ చేస్తాం, ట్రైనింగ్ రికార్డులు కూడా ఉంచుతాం.`,
  category: "operations",
});

/** The hi-IN and hi-Latn-IN answers used on several pages (docs/hindi-glossary.md); the pages they link to are English. */
const WAGES_LINK_HI = linkable(TG_WAGES, "en-IN")
  ? { href: TG_WAGES, label: "तेलंगाना न्यूनतम मज़दूरी (अंग्रेज़ी में)" }
  : { href: "/compliance", label: "हम कंप्लायंस कैसे संभालते हैं (अंग्रेज़ी में)" };

const WAGES_LINK_LATN = linkable(TG_WAGES, "en-IN")
  ? { href: TG_WAGES, label: "Telangana minimum wages (English)" }
  : { href: "/compliance", label: "Hum compliance kaise sambhalte hain (English)" };

const wagesFaqHi = (zone: string): FaqItem => ({
  question: "कौन-सी न्यूनतम मज़दूरी और कौन-से नियम लागू होते हैं?",
  answer: `तेलंगाना के। 1 जून 2026 से एक ही आदेश लिस्ट में शामिल हर काम के लिए ज़ोन और स्किल के हिसाब से बेसिक रेट तय करता है, और महँगाई भत्ता हर अप्रैल और अक्टूबर में घोषित होना है। प्रोफ़ेशनल टैक्स और लेबर वेलफ़ेयर फ़ंड भी लागू होते हैं। ${zone}`,
  link: WAGES_LINK_HI,
  category: "compliance",
});
const ZONE_HI = "रेट बताने से पहले हम कन्फ़र्म करते हैं कि आपका पता किस ज़ोन में आता है।";

const wagesFaqLatn = (zone: string): FaqItem => ({
  question: "Kaunsi minimum wage aur kaunse rules laagu hote hain?",
  answer: `Telangana ke. 1 June 2026 se ek hi order list mein shaamil har kaam ke liye zone aur skill ke hisaab se basic rates tay karta hai, aur cost of living allowance har April aur October mein declare hona hai. Professional Tax aur Labour Welfare Fund bhi laagu hote hain. ${zone}`,
  link: WAGES_LINK_LATN,
  category: "compliance",
});
const ZONE_LATN = "Rate batane se pehle hum confirm karte hain ki aapka address kis zone mein aata hai.";

const VISIT_FAQ_HI: FaqItem = {
  question: "क्या आप पहले हमारी साइट देखने आएँगे?",
  answer: "हाँ। टीम शुरू होने से पहले हम साइट पर आकर काम, शिफ्ट और आपके हाइजीन और सेफ़्टी नियम देखते हैं।",
  category: "operations",
};

const VISIT_FAQ_LATN: FaqItem = {
  question: "Kya aap pehle hamari site dekhne aayenge?",
  answer: "Haan. Team ke kaam shuru karne se pehle hum site par aakar kaam, shifts aur aapke hygiene aur safety rules dekhte hain.",
  category: "operations",
};

const START_FAQ_HI: FaqItem = {
  question: "शुरुआत कैसे करें?",
  answer: "साइट का पता और कौन-से रोल चाहिए, ये बताकर टीम के लिए रिक्वेस्ट भेजें। हम साफ़ बताएँगे कि टीम दे पाएँगे या नहीं, और फिर वहीं से टीम प्लान करेंगे।",
  category: "commercial",
};

const START_FAQ_LATN: FaqItem = {
  question: "Shuru kaise karein?",
  answer: "Site ka address aur kaunse roles chahiye, ye batakar team ke liye request bhejiye. Hum saaf bataenge ki team de payenge ya nahi, aur phir wahin se team plan karenge.",
  category: "commercial",
};

const gmpFaqHi = (where: string): FaqItem => ({
  question: "क्या आपकी टीमें GMP ट्रेनिंग के नियम पूरे कर सकती हैं?",
  answer: `हाँ। रिवाइज़्ड Schedule M में कॉन्ट्रैक्ट स्टाफ़ का ज़िक्र है, सफ़ाई स्टाफ़ भी। हम हर टीम आपके ${where} की ट्रेनिंग, गाउनिंग और हेल्थ चेक के हिसाब से प्लान करते हैं, और ट्रेनिंग रिकॉर्ड रखते हैं।`,
  category: "operations",
});

const gmpFaqLatn = (where: string): FaqItem => ({
  question: "Kya aapki teams GMP training ke rules poore kar sakti hain?",
  answer: `Haan. Revised Schedule M mein contract staff ka zikr hai, cleaners bhi. Hum har team aapke ${where} ki training, gowning aur health checks ke hisaab se plan karte hain, aur training records rakhte hain.`,
  category: "operations",
});

const SRC = {
  hyderabad: { label: "Hyderabad", url: "https://en.wikipedia.org/wiki/Hyderabad" },
  sangareddy: { label: "Sangareddy district", url: "https://en.wikipedia.org/wiki/Sangareddy_district" },
  medchal: { label: "Medchal–Malkajgiri district", url: "https://en.wikipedia.org/wiki/Medchal%E2%80%93Malkajgiri_district" },
  rangareddy: { label: "Ranga Reddy district", url: "https://en.wikipedia.org/wiki/Ranga_Reddy_district" },
  parks: {
    label: "TGIIC: list of industrial parks, by zone and district (8 April 2026)",
    url: "https://www.tgiic.telangana.gov.in/filePreview/custom/Total%20Industrial%20Parks%20List%20%2008_04_2026?fileName=CMS/File_090420261236097686806358.Total%20Industrial%20Parks%20List.pdf",
  },
  sez: { label: "TGIIC: special economic zones (area in acres and status)", url: "https://tgiic.telangana.gov.in/showView?div_id=21" },
  pib: {
    label: "PIB factsheet, 14 October 2025: Telangana's share of India's bulk drug exports and pharma output",
    url: "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/oct/doc20251014666001.pdf",
  },
  medicalDevices: { label: "Telangana Life Sciences: Medical Devices Park (302 acres, 2017)", url: "https://lifesciences.telangana.gov.in/life-sciences-grid/clusters/medical-device-park/" },
  genome: { label: "Telangana Life Sciences: Genome Valley (23 km from Secunderabad station)", url: "https://lifesciences.telangana.gov.in/genome-valley/" },
  lifeSciencesPolicy: { label: "Telangana Life Sciences Policy: Genome Valley, about 1,500 acres in four phases", url: "https://rich.telangana.gov.in/assets/pdfs/Resources/Life-Sciences-Policy.pdf" },
  industriesReport: {
    label: "Industries Department, Telangana: annual report 2022–23 (study of 380 micro and small units in Cherlapally Industrial Park)",
    url: "https://tgtpc.telangana.gov.in/wp-content/uploads/2024/04/Telangana-Industries-Dept-Annual-Report-2022-23.pdf",
  },
  patancheru: { label: "Patancheru", url: "https://en.wikipedia.org/wiki/Patancheru" },
  bollaram: { label: "IDA Bollaram", url: "https://en.wikipedia.org/wiki/IDA_Bollaram" },
  jeedimetla: { label: "Jeedimetla", url: "https://en.wikipedia.org/wiki/Jeedimetla" },
  medchalTown: { label: "Medchal", url: "https://en.wikipedia.org/wiki/Medchal" },
  cherlapally: { label: "Cherlapally", url: "https://en.wikipedia.org/wiki/Cherlapally" },
  genomeValley: { label: "Genome Valley", url: "https://en.wikipedia.org/wiki/Genome_Valley" },
  shadnagar: { label: "Shadnagar", url: "https://en.wikipedia.org/wiki/Shadnagar" },
  // CDSCO's own copy (paras 3.4 and 11.4.6: cleaning and contract staff).
  scheduleM: {
    label: "Revised Schedule M, Drugs Rules, G.S.R. 922(E), 28 December 2023 (CDSCO copy)",
    url: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadGazette_NotificationsFiles/2023.12.28_DR_Final%20G.S.R.%20922(E)_Notification%20of%20Schedule%20M%20of.pdf",
  },
  tgWages: { label: "G.O.Ms. No. 6, 30 May 2026: Telangana minimum wages by zone and skill from 1 June 2026 (our hosted copy)", url: "https://cdn.vayasyaseva.com/sources/telangana/tg-go6-9607b5ae.pdf" },
  tgPt: { label: "Commercial Taxes Department, Telangana: Professional Tax First Schedule", url: "https://tgct.gov.in/tgportal/AllActs/APPT/APPTSchedule.aspx" },
  tgLwf: {
    label: "Labour Department, Telangana: Labour Welfare Fund Act, 1987",
    url: "https://labour.telangana.gov.in/content/ActsRules/TELANGANA%20LABOUR%20WELFARE%20FUND%20ACT,%201987.htm",
  },
};
const WAGE_SOURCES = [SRC.tgWages, SRC.tgPt, SRC.tgLwf];

export const hyderabadPages: LocationCopy[] = [
  {
    cluster: "hyderabad",
    name: "Hyderabad",
    placeId: "hyderabad",
    metaTitle: "Manpower Company and Labour Contractor in Hyderabad",
    description:
      "Labour supplier for pharma, engineering and logistics units in Hyderabad: supervised contract workers in Patancheru, Jeedimetla, Cherlapally and Shamshabad.",
    heading: "Labour contractor and manpower supplier in Hyderabad.",
    lede: "Supervised contract workers for pharma, engineering and logistics units across Hyderabad's industrial belts.",
    paragraph:
      "Hyderabad is India's bulk drug centre: Telangana makes about a third of the country's pharma output and half its bulk drug exports. The city's industry sits in TGIIC parks around it: Patancheru and Pashamylaram to the north-west, in Sangareddy district; Jeedimetla and Medchal to the north and Cherlapally to the east, in Medchal-Malkajgiri; Genome Valley at Shamirpet; and Shamshabad, Kothur and Adibatla to the south, in Rangareddy. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/hyderabad/patancheru-pashamylaram", name: "Patancheru and Pashamylaram" },
      { href: "/locations/hyderabad/jeedimetla-medchal", name: "Jeedimetla and Medchal" },
      { href: "/locations/hyderabad/cherlapally-nacharam", name: "Cherlapally and Nacharam" },
      { href: "/locations/hyderabad/genome-valley", name: "Genome Valley" },
      { href: "/locations/hyderabad/shamshabad-kothur", name: "Shamshabad and Kothur" },
    ],
    faqs: [
      {
        question: "Are you a manpower supplier in Hyderabad?",
        answer: "Yes. We supply contract labour: supervised factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Do you have workers in Hyderabad?",
        answer: "We keep a worker list for Hyderabad, and job seekers from Kukatpally, Uppal, Patancheru and across the city join it on our Hyderabad jobs page. We build each crew from it for your site.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "Can you supply security guards?",
        answer: "No. Security work needs a private security agency licence, which we don't hold.",
        category: "commercial",
      },
    ],
    sources: [SRC.hyderabad, SRC.pib, SRC.parks, SRC.sangareddy, SRC.medchal, SRC.rangareddy, SRC.genome, ...WAGE_SOURCES],
    // Drafts pending native review (docs/telugu-glossary.md, docs/hindi-glossary.md).
    translations: {
      "te-IN": {
        name: "హైదరాబాద్",
        metaTitle: "హైదరాబాద్‌లో లేబర్ కాంట్రాక్టర్ (Labour Contractor)",
        description:
          "హైదరాబాద్‌లో ఫార్మా, ఇంజినీరింగ్, లాజిస్టిక్స్ యూనిట్లకు మ్యాన్‌పవర్ సప్లై: పటాన్‌చెరు, జీడిమెట్ల, చర్లపల్లి, శంషాబాద్‌లో సూపర్‌వైజర్ చూసుకునే వర్కర్లు.",
        heading: "హైదరాబాద్‌లో లేబర్ కాంట్రాక్టర్, మ్యాన్‌పవర్ సప్లై.",
        lede: "హైదరాబాద్ చుట్టూ ఉన్న ఇండస్ట్రియల్ బెల్ట్‌లన్నిటిలో ఫార్మా, ఇంజినీరింగ్, లాజిస్టిక్స్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే కాంట్రాక్ట్ వర్కర్లు.",
        paragraph:
          "హైదరాబాద్ భారతదేశ బల్క్ డ్రగ్ కేంద్రం: దేశ ఫార్మా ఉత్పత్తిలో దాదాపు మూడో వంతు, బల్క్ డ్రగ్ ఎగుమతుల్లో సగం తెలంగాణదే. ఇక్కడి పరిశ్రమలు నగరం చుట్టూ ఉన్న TGIIC పార్కుల్లో ఉన్నాయి: వాయువ్యం వైపు సంగారెడ్డి జిల్లాలో పటాన్‌చెరు, పాశమైలారం; మేడ్చల్-మల్కాజిగిరి జిల్లాలో ఉత్తరాన జీడిమెట్ల, మేడ్చల్, తూర్పున చర్లపల్లి; శామీర్‌పేటలో జీనోమ్ వ్యాలీ; దక్షిణాన రంగారెడ్డి జిల్లాలో శంషాబాద్, కొత్తూరు, ఆదిభట్ల. {areas}లోని యూనిట్ల నుండి రిక్వైర్‌మెంట్లు తీసుకుంటాం.",
        areas: [
          { href: "/locations/hyderabad/patancheru-pashamylaram", name: "పటాన్‌చెరు-పాశమైలారం" },
          { href: "/locations/hyderabad/jeedimetla-medchal", name: "జీడిమెట్ల-మేడ్చల్" },
          { href: "/locations/hyderabad/cherlapally-nacharam", name: "చర్లపల్లి-నాచారం" },
          { href: "/locations/hyderabad/genome-valley", name: "జీనోమ్ వ్యాలీ" },
          { href: "/locations/hyderabad/shamshabad-kothur", name: "శంషాబాద్-కొత్తూరు" },
        ],
        faqs: [
          {
            question: "హైదరాబాద్‌లో మీరు మ్యాన్‌పవర్ సప్లై చేస్తారా?",
            answer: "అవును. కాంట్రాక్ట్ లేబర్ సప్లై చేస్తాం: ఫ్యాక్టరీ, లోడింగ్-అన్‌లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు. వర్కర్లు మా పేరోల్‌లో ఉంటారు, మీ సైట్‌లో మా సూపర్‌వైజర్ వాళ్లను చూసుకుంటారు.",
            category: "commercial",
          },
          {
            question: "హైదరాబాద్‌లో మీ దగ్గర వర్కర్లు ఉన్నారా?",
            answer:
              "హైదరాబాద్‌కి మా దగ్గర వర్కర్ల లిస్ట్ ఉంది. కూకట్‌పల్లి, ఉప్పల్, పటాన్‌చెరుతో పాటు సిటీ నలుమూలల నుండి జాబ్ కోసం చూస్తున్నవారు మా హైదరాబాద్ జాబ్స్ పేజీ ద్వారా ఈ లిస్ట్‌లో చేరుతారు. మీ సైట్‌కి ప్రతి టీమ్‌ని ఈ లిస్ట్ నుండే ఏర్పాటు చేస్తాం.",
            category: "operations",
          },
          wagesFaqTe(ZONE_TE),
          {
            question: "సెక్యూరిటీ గార్డులను సప్లై చేస్తారా?",
            answer: "లేదు. సెక్యూరిటీ పనికి ప్రైవేట్ సెక్యూరిటీ ఏజెన్సీ లైసెన్స్ కావాలి, అది మా దగ్గర లేదు.",
            category: "commercial",
          },
        ],
      },
      "hi-IN": {
        name: "हैदराबाद",
        metaTitle: "हैदराबाद में लेबर ठेकेदार (Labour Contractor)",
        description:
          "हैदराबाद की फ़ार्मा, इंजीनियरिंग और लॉजिस्टिक्स यूनिटों के लिए लेबर सप्लायर: पटनचेरु, जीडीमेटला, चर्लापल्ली और शमशाबाद में सुपरवाइज़र के साथ कॉन्ट्रैक्ट कामगार।",
        heading: "हैदराबाद में लेबर ठेकेदार और मैनपावर सप्लायर।",
        lede: "हैदराबाद के सभी इंडस्ट्रियल बेल्ट में फ़ार्मा, इंजीनियरिंग और लॉजिस्टिक्स यूनिटों के लिए सुपरवाइज़र के साथ कॉन्ट्रैक्ट कामगार।",
        paragraph:
          "हैदराबाद भारत का बल्क ड्रग सेंटर है: देश का करीब एक-तिहाई फ़ार्मा प्रोडक्शन और आधा बल्क ड्रग एक्सपोर्ट तेलंगाना से होता है। शहर की इंडस्ट्री उसके चारों तरफ़ के TGIIC पार्कों में है। उत्तर-पश्चिम में, संगारेड्डी ज़िले में, पटनचेरु और पाशमैलारम हैं। मेडचल-मलकाजगिरी ज़िले में उत्तर की तरफ़ जीडीमेटला और मेडचल हैं, और पूर्व में चर्लापल्ली। शामीरपेट में जीनोम वैली है, और दक्षिण में, रंगारेड्डी ज़िले में, शमशाबाद, कोथुर और आदिबटला। हम {areas} की यूनिटों से रिक्वायरमेंट लेते हैं।",
        areas: [
          { href: "/locations/hyderabad/patancheru-pashamylaram", name: "पटनचेरु और पाशमैलारम" },
          { href: "/locations/hyderabad/jeedimetla-medchal", name: "जीडीमेटला और मेडचल" },
          { href: "/locations/hyderabad/cherlapally-nacharam", name: "चर्लापल्ली और नाचारम" },
          { href: "/locations/hyderabad/genome-valley", name: "जीनोम वैली" },
          { href: "/locations/hyderabad/shamshabad-kothur", name: "शमशाबाद और कोथुर" },
        ],
        faqs: [
          {
            question: "क्या आप हैदराबाद में मैनपावर सप्लायर हैं?",
            answer:
              "हाँ। हम कॉन्ट्रैक्ट लेबर देते हैं: फ़ैक्टरी, लोडिंग-अनलोडिंग और हाउसकीपिंग की टीमें, सुपरवाइज़र के साथ। कामगार हमारे पेरोल पर रहते हैं, और आपकी साइट पर काम हमारा सुपरवाइज़र चलाता है।",
            category: "commercial",
          },
          {
            question: "क्या हैदराबाद में आपके पास कामगार हैं?",
            answer:
              "हम हैदराबाद के लिए कामगारों की एक लिस्ट रखते हैं। कूकटपल्ली, उप्पल, पटनचेरु और पूरे शहर से काम ढूँढने वाले लोग हमारे हैदराबाद जॉब्स पेज पर इस लिस्ट में नाम लिखवाते हैं। आपकी साइट के लिए हर टीम हम इसी लिस्ट से बनाते हैं।",
            category: "operations",
          },
          wagesFaqHi(ZONE_HI),
          {
            question: "क्या आप सिक्योरिटी गार्ड देते हैं?",
            answer:
              "नहीं। सिक्योरिटी के काम के लिए प्राइवेट सिक्योरिटी एजेंसी का लाइसेंस चाहिए, जो हमारे पास नहीं है।",
            category: "commercial",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Hyderabad",
        metaTitle: "Hyderabad mein Labour Thekedar (Contractor)",
        description:
          "Hyderabad ki pharma, engineering aur logistics units ke liye labour supplier: Patancheru, Jeedimetla, Cherlapally, Shamshabad mein supervised contract labour.",
        heading: "Hyderabad mein labour contractor aur manpower supplier.",
        lede: "Hyderabad ke saare industrial belts mein pharma, engineering aur logistics units ke liye supervisor ke saath contract workers.",
        paragraph:
          "Hyderabad India ka bulk drug centre hai: desh ka kareeb ek-tihai pharma production aur aadha bulk drug export Telangana se hota hai. Shehar ki industry uske chaaron taraf ke TGIIC parks mein hai. North-west mein, Sangareddy district mein, Patancheru aur Pashamylaram hain. Medchal-Malkajgiri district mein north ki taraf Jeedimetla aur Medchal hain, aur east mein Cherlapally. Shamirpet mein Genome Valley hai, aur south mein, Rangareddy district mein, Shamshabad, Kothur aur Adibatla. Hum {areas} ki units se requirements lete hain.",
        areas: [
          { href: "/locations/hyderabad/patancheru-pashamylaram", name: "Patancheru aur Pashamylaram" },
          { href: "/locations/hyderabad/jeedimetla-medchal", name: "Jeedimetla aur Medchal" },
          { href: "/locations/hyderabad/cherlapally-nacharam", name: "Cherlapally aur Nacharam" },
          { href: "/locations/hyderabad/genome-valley", name: "Genome Valley" },
          { href: "/locations/hyderabad/shamshabad-kothur", name: "Shamshabad aur Kothur" },
        ],
        faqs: [
          {
            question: "Kya aap Hyderabad mein manpower supplier hain?",
            answer:
              "Haan. Hum contract labour dete hain: factory, loading-unloading aur housekeeping ki teams, supervisor ke saath. Workers hamare payroll par rehte hain, aur aapki site par kaam hamara supervisor chalata hai.",
            category: "commercial",
          },
          {
            question: "Kya Hyderabad mein aapke paas workers hain?",
            answer:
              "Hum Hyderabad ke liye workers ki ek list rakhte hain. Kukatpally, Uppal, Patancheru aur poore shehar se job seekers hamare Hyderabad jobs page par is list mein naam likhwate hain. Aapki site ke liye har team hum isi list se banate hain.",
            category: "operations",
          },
          wagesFaqLatn(ZONE_LATN),
          {
            question: "Kya aap security guards dete hain?",
            answer:
              "Nahi. Security ke kaam ke liye private security agency ka licence chahiye, jo hamare paas nahi hai.",
            category: "commercial",
          },
        ],
      },
    },
  },
  {
    cluster: "hyderabad",
    estate: "patancheru-pashamylaram",
    name: "Patancheru and Pashamylaram",
    placeId: "patancheru-pashamylaram",
    metaTitle: "Contract Labour in Patancheru and Pashamylaram",
    description:
      "Supervised production support, packing, stores and housekeeping crews for bulk drug, chemical and engineering units in Patancheru, Pashamylaram and Bollaram.",
    heading: "Contract labour in Patancheru and Pashamylaram.",
    lede: "Supervised crews for bulk drug, chemical and engineering units, trained to your plant's hygiene and safety rules.",
    paragraph:
      "Patancheru, on the Solapur highway north-west of Hyderabad, is the city's oldest bulk drug and chemical belt. TGIIC runs five phases of industrial park at Patancheru and four at Pashamylaram, with an export promotion park, a textile park and, at Sultanpur, a 302-acre medical devices park opened in 2017, all in Sangareddy district. IDA Bollaram and industrial land at Gaddapotharam, Gummadidala and Jinnaram lie close by.",
    faqs: [
      {
        question: "Do you supply contract labour in Patancheru and Pashamylaram?",
        answer: "Yes. Crews for production support, packing, stores and dispatch, and housekeeping, planned with your site team and run by our supervisor.",
        category: "operations",
      },
      {
        question: "How do your crews work safely in chemical and bulk drug plants?",
        answer:
          "Every worker goes through your site's induction before starting, and our supervisor holds the crew to your permit-to-work, PPE and restricted-area rules on the floor. We plan who works where with your safety team.",
        category: "operations",
      },
      {
        question: "Can your crews meet GMP training rules?",
        answer:
          "Yes. The revised Schedule M names contract staff, cleaners included. We plan each crew around your plant's training, gowning and health checks, and keep the training records.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
    ],
    sources: [SRC.parks, SRC.patancheru, SRC.bollaram, SRC.medicalDevices, SRC.sangareddy, SRC.scheduleM, ...WAGE_SOURCES],
    // Drafts pending native review (docs/telugu-glossary.md, docs/hindi-glossary.md).
    translations: {
      "te-IN": {
        name: "పటాన్‌చెరు-పాశమైలారం",
        metaTitle: "పటాన్‌చెరు, పాశమైలారంలో లేబర్ సప్లై (Contract Labour)",
        description:
          "పటాన్‌చెరు, పాశమైలారం, బొల్లారంలోని ఫార్మా, కెమికల్, ఇంజినీరింగ్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ప్రొడక్షన్ సపోర్ట్, ప్యాకింగ్, స్టోర్స్, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "పటాన్‌చెరు, పాశమైలారంలో కాంట్రాక్ట్ లేబర్.",
        lede: "బల్క్ డ్రగ్, కెమికల్, ఇంజినీరింగ్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు, మీ ప్లాంట్ హైజీన్, సేఫ్టీ రూల్స్‌పై ట్రైనింగ్‌తో.",
        paragraph:
          "సోలాపూర్ హైవే మీద, హైదరాబాద్‌కు వాయువ్యం వైపు ఉన్న పటాన్‌చెరు, నగరంలో అన్నిటికంటే పాత బల్క్ డ్రగ్, కెమికల్ బెల్ట్. TGIIC పటాన్‌చెరులో ఐదు ఫేజ్‌లలో, పాశమైలారంలో నాలుగు ఫేజ్‌లలో ఇండస్ట్రియల్ పార్కులు నడుపుతోంది. వీటితో పాటు ఎక్స్‌పోర్ట్ ప్రమోషన్ పార్క్, టెక్స్‌టైల్ పార్క్, సుల్తాన్‌పూర్‌లో 2017లో మొదలైన 302 ఎకరాల మెడికల్ డివైసెస్ పార్క్ కూడా ఉన్నాయి, ఇవన్నీ సంగారెడ్డి జిల్లాలోనే. IDA బొల్లారం, గడ్డపోతారం, గుమ్మడిదల, జిన్నారంలోని పారిశ్రామిక భూములు దగ్గర్లోనే ఉన్నాయి.",
        faqs: [
          {
            question: "పటాన్‌చెరు, పాశమైలారంలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. ప్రొడక్షన్ సపోర్ట్, ప్యాకింగ్, స్టోర్స్-డిస్పాచ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం. మీ సైట్ టీమ్‌తో కలిసి ప్లాన్ చేస్తాం, పని మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "operations",
          },
          {
            question: "కెమికల్, బల్క్ డ్రగ్ ప్లాంట్లలో మీ టీమ్‌లు సురక్షితంగా ఎలా పనిచేస్తాయి?",
            answer:
              "పని మొదలుపెట్టే ముందు ప్రతి వర్కర్ మీ సైట్ ఇండక్షన్ పూర్తి చేస్తారు. ఫ్లోర్ మీద మీ పర్మిట్-టు-వర్క్, PPE, రిస్ట్రిక్టెడ్ ఏరియా రూల్స్ టీమ్ పాటించేలా మా సూపర్‌వైజర్ చూసుకుంటారు. ఎవరు ఎక్కడ పనిచేయాలో మీ సేఫ్టీ టీమ్‌తో కలిసి ప్లాన్ చేస్తాం.",
            category: "operations",
          },
          gmpFaqTe("ప్లాంట్"),
          wagesFaqTe(ZONE_TE),
        ],
      },
      "hi-IN": {
        name: "पटनचेरु और पाशमैलारम",
        metaTitle: "पटनचेरु, पाशमैलारम में लेबर ठेकेदार (Contractor)",
        description:
          "पटनचेरु, पाशमैलारम और बोल्लारम की बल्क ड्रग, केमिकल और इंजीनियरिंग यूनिटों के लिए सुपरवाइज़र के साथ प्रोडक्शन सपोर्ट, पैकिंग, स्टोर और हाउसकीपिंग टीमें।",
        heading: "पटनचेरु और पाशमैलारम में कॉन्ट्रैक्ट लेबर।",
        lede: "बल्क ड्रग, केमिकल और इंजीनियरिंग यूनिटों के लिए सुपरवाइज़र के साथ टीमें, आपके प्लांट के हाइजीन और सेफ़्टी नियमों की ट्रेनिंग के साथ।",
        paragraph:
          "हैदराबाद के उत्तर-पश्चिम में सोलापुर हाईवे पर बसा पटनचेरु शहर का सबसे पुराना बल्क ड्रग और केमिकल बेल्ट है। पटनचेरु में TGIIC के पाँच फ़ेज़ के इंडस्ट्रियल पार्क हैं और पाशमैलारम में चार फ़ेज़ के। साथ में एक एक्सपोर्ट प्रमोशन पार्क, एक टेक्सटाइल पार्क और सुल्तानपुर में 2017 में खुला 302 एकड़ का मेडिकल डिवाइस पार्क भी है, ये सब संगारेड्डी ज़िले में। IDA बोल्लारम और गड्डापोतारम, गुम्मडिदला और जिन्नारम की इंडस्ट्रियल ज़मीन पास में ही है।",
        faqs: [
          {
            question: "क्या आप पटनचेरु और पाशमैलारम में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। प्रोडक्शन सपोर्ट, पैकिंग, स्टोर और डिस्पैच, और हाउसकीपिंग के लिए टीमें। प्लान आपकी साइट टीम के साथ बनता है, और काम हमारा सुपरवाइज़र चलाता है।",
            category: "operations",
          },
          {
            question: "केमिकल और बल्क ड्रग प्लांट में आपकी टीमें सुरक्षित तरीके से कैसे काम करती हैं?",
            answer:
              "काम शुरू करने से पहले हर कामगार आपकी साइट का इंडक्शन पूरा करता है। फ़्लोर पर हमारा सुपरवाइज़र देखता है कि टीम आपके परमिट-टू-वर्क, PPE और रिस्ट्रिक्टेड एरिया के नियम माने। कौन कहाँ काम करेगा, ये हम आपकी सेफ़्टी टीम के साथ मिलकर तय करते हैं।",
            category: "operations",
          },
          gmpFaqHi("प्लांट"),
          wagesFaqHi(ZONE_HI),
        ],
      },
      "hi-Latn-IN": {
        name: "Patancheru aur Pashamylaram",
        metaTitle: "Patancheru, Pashamylaram mein Labour Thekedar",
        description:
          "Patancheru, Pashamylaram, Bollaram ki bulk drug, chemical aur engineering units ke liye supervised production support, packing, stores aur housekeeping teams.",
        heading: "Patancheru aur Pashamylaram mein contract labour.",
        lede: "Bulk drug, chemical aur engineering units ke liye supervisor ke saath teams, aapke plant ke hygiene aur safety rules ki training ke saath.",
        paragraph:
          "Hyderabad ke north-west mein Solapur highway par Patancheru shehar ka sabse purana bulk drug aur chemical belt hai. Patancheru mein TGIIC ke paanch phases ke industrial parks hain aur Pashamylaram mein chaar phases ke. Saath mein ek export promotion park, ek textile park aur Sultanpur mein 2017 mein khula 302 acre ka medical devices park bhi hai, ye sab Sangareddy district mein. IDA Bollaram aur Gaddapotharam, Gummadidala aur Jinnaram ki industrial zameen paas mein hi hai.",
        faqs: [
          {
            question: "Kya aap Patancheru aur Pashamylaram mein contract labour dete hain?",
            answer:
              "Haan. Production support, packing, stores aur dispatch, aur housekeeping ke liye teams. Plan aapki site team ke saath banta hai, aur kaam hamara supervisor chalata hai.",
            category: "operations",
          },
          {
            question: "Chemical aur bulk drug plants mein aapki teams safely kaise kaam karti hain?",
            answer:
              "Kaam shuru karne se pehle har worker aapki site ka induction poora karta hai. Floor par hamara supervisor dekhta hai ki team aapke permit-to-work, PPE aur restricted area rules maane. Kaun kahan kaam karega, ye hum aapki safety team ke saath milkar tay karte hain.",
            category: "operations",
          },
          gmpFaqLatn("plant"),
          wagesFaqLatn(ZONE_LATN),
        ],
      },
    },
  },
  {
    cluster: "hyderabad",
    estate: "jeedimetla-medchal",
    name: "Jeedimetla and Medchal",
    placeId: "jeedimetla-medchal",
    metaTitle: "Contract Labour in Jeedimetla and Medchal",
    description:
      "Supervised factory, packing, loading and housekeeping crews for units in Jeedimetla, Gandimaisamma, Dundigal and Medchal, on Hyderabad's northern side.",
    heading: "Contract labour in Jeedimetla and Medchal.",
    lede: "Supervised crews for pharma, engineering and chemical units in Hyderabad's northern belt.",
    paragraph:
      "Jeedimetla is a TGIIC industrial park in six phases, in Medchal-Malkajgiri district, with pharma, machine tool, electrical, textile and chemical units. The belt runs north through Gandimaisamma and Dundigal to the industrial estate at Medchal, with the older estates at Kukatpally and Sanathnagar closer to the city.",
    faqs: [
      {
        question: "Do you supply contract labour in Jeedimetla?",
        answer: "Yes. Supervised factory, packing and housekeeping crews for units in Jeedimetla, Gandimaisamma and Medchal, on our payroll and run by our supervisor.",
        category: "commercial",
      },
      {
        question: "Can you supply loading and unloading crews?",
        answer: "Yes. Supervised loading, unloading and stores crews for dispatch bays and warehouses along the belt, working to your gate and safety rules.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.parks, SRC.jeedimetla, SRC.medchalTown, SRC.medchal, ...WAGE_SOURCES],
    // Drafts pending native review (docs/telugu-glossary.md, docs/hindi-glossary.md).
    translations: {
      "te-IN": {
        name: "జీడిమెట్ల-మేడ్చల్",
        metaTitle: "జీడిమెట్ల, మేడ్చల్ కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "హైదరాబాద్ ఉత్తర భాగంలో జీడిమెట్ల, గండిమైసమ్మ, దుండిగల్, మేడ్చల్‌లోని యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, ప్యాకింగ్, లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "జీడిమెట్ల, మేడ్చల్‌లో కాంట్రాక్ట్ లేబర్.",
        lede: "హైదరాబాద్ ఉత్తర ఇండస్ట్రియల్ బెల్ట్‌లో ఫార్మా, ఇంజినీరింగ్, కెమికల్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "జీడిమెట్ల అనేది మేడ్చల్-మల్కాజిగిరి జిల్లాలోని ఆరు ఫేజ్‌ల TGIIC ఇండస్ట్రియల్ పార్క్. ఇక్కడ ఫార్మా, మెషిన్ టూల్స్, ఎలక్ట్రికల్, టెక్స్‌టైల్, కెమికల్ యూనిట్లు ఉన్నాయి. ఈ బెల్ట్ ఉత్తరం వైపు గండిమైసమ్మ, దుండిగల్ మీదుగా మేడ్చల్ ఇండస్ట్రియల్ ఎస్టేట్ వరకు ఉంటుంది. నగరానికి దగ్గరగా కూకట్‌పల్లి, సనత్‌నగర్‌లో పాత ఎస్టేట్లు ఉన్నాయి.",
        faqs: [
          {
            question: "జీడిమెట్లలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. జీడిమెట్ల, గండిమైసమ్మ, మేడ్చల్‌లోని యూనిట్లకు ఫ్యాక్టరీ, ప్యాకింగ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం. వర్కర్లు మా పేరోల్‌లో ఉంటారు, మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "commercial",
          },
          {
            question: "లోడింగ్, అన్‌లోడింగ్ టీమ్‌లను సప్లై చేస్తారా?",
            answer: "అవును. ఈ బెల్ట్‌లోని డిస్పాచ్ బేలు, వేర్‌హౌస్‌లకు సూపర్‌వైజర్ చూసుకునే లోడింగ్, అన్‌లోడింగ్, స్టోర్స్ టీమ్‌లు ఇస్తాం. మీ గేట్, సేఫ్టీ రూల్స్ ప్రకారమే పనిచేస్తాయి.",
            category: "operations",
          },
          wagesFaqTe(ZONE_TE),
          VISIT_FAQ_TE,
        ],
      },
      "hi-IN": {
        name: "जीडीमेटला और मेडचल",
        metaTitle: "जीडीमेटला, मेडचल में लेबर ठेकेदार (Contractor)",
        description:
          "हैदराबाद के उत्तर में जीडीमेटला, गंडीमैसम्मा, दुंडीगल और मेडचल की यूनिटों के लिए सुपरवाइज़र के साथ फ़ैक्टरी, पैकिंग, लोडिंग और हाउसकीपिंग की टीमें।",
        heading: "जीडीमेटला और मेडचल में कॉन्ट्रैक्ट लेबर।",
        lede: "हैदराबाद के उत्तरी बेल्ट में फ़ार्मा, इंजीनियरिंग और केमिकल यूनिटों के लिए सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "जीडीमेटला मेडचल-मलकाजगिरी ज़िले में TGIIC का छह फ़ेज़ वाला इंडस्ट्रियल पार्क है, जहाँ फ़ार्मा, मशीन टूल, इलेक्ट्रिकल, टेक्सटाइल और केमिकल यूनिटें हैं। यह बेल्ट उत्तर की तरफ़ गंडीमैसम्मा और दुंडीगल से होते हुए मेडचल के इंडस्ट्रियल एस्टेट तक जाता है। शहर के और पास कूकटपल्ली और सनतनगर के पुराने एस्टेट हैं।",
        faqs: [
          {
            question: "क्या आप जीडीमेटला में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। जीडीमेटला, गंडीमैसम्मा और मेडचल की यूनिटों के लिए फ़ैक्टरी, पैकिंग और हाउसकीपिंग टीमें, सुपरवाइज़र के साथ। कामगार हमारे पेरोल पर रहते हैं, और काम हमारा सुपरवाइज़र चलाता है।",
            category: "commercial",
          },
          {
            question: "क्या आप लोडिंग और अनलोडिंग टीमें देते हैं?",
            answer:
              "हाँ। इस बेल्ट के डिस्पैच बे और वेयरहाउस के लिए सुपरवाइज़र के साथ लोडिंग, अनलोडिंग और स्टोर टीमें, जो आपके गेट और सेफ़्टी नियमों के हिसाब से काम करती हैं।",
            category: "operations",
          },
          wagesFaqHi(ZONE_HI),
          VISIT_FAQ_HI,
        ],
      },
      "hi-Latn-IN": {
        name: "Jeedimetla aur Medchal",
        metaTitle: "Jeedimetla, Medchal mein Labour Thekedar (Contractor)",
        description:
          "Hyderabad ke north mein Jeedimetla, Gandimaisamma, Dundigal aur Medchal ki units ke liye supervisor ke saath factory, packing, loading aur housekeeping teams.",
        heading: "Jeedimetla aur Medchal mein contract labour.",
        lede: "Hyderabad ke northern belt mein pharma, engineering aur chemical units ke liye supervisor ke saath teams.",
        paragraph:
          "Jeedimetla Medchal-Malkajgiri district mein TGIIC ka 6 phases wala industrial park hai, jahan pharma, machine tool, electrical, textile aur chemical units hain. Ye belt north ki taraf Gandimaisamma aur Dundigal se hote hue Medchal ke industrial estate tak jaata hai. Shehar ke aur paas Kukatpally aur Sanathnagar ke purane estates hain.",
        faqs: [
          {
            question: "Kya aap Jeedimetla mein contract labour dete hain?",
            answer:
              "Haan. Jeedimetla, Gandimaisamma aur Medchal ki units ke liye factory, packing aur housekeeping teams, supervisor ke saath. Workers hamare payroll par rehte hain, aur kaam hamara supervisor chalata hai.",
            category: "commercial",
          },
          {
            question: "Kya aap loading aur unloading teams dete hain?",
            answer:
              "Haan. Is belt ke dispatch bays aur warehouses ke liye supervisor ke saath loading, unloading aur stores teams, jo aapke gate aur safety rules ke hisaab se kaam karti hain.",
            category: "operations",
          },
          wagesFaqLatn(ZONE_LATN),
          VISIT_FAQ_LATN,
        ],
      },
    },
  },
  {
    cluster: "hyderabad",
    estate: "cherlapally-nacharam",
    name: "Cherlapally and Nacharam",
    placeId: "cherlapally-nacharam",
    metaTitle: "Contract Labour in Cherlapally and Nacharam",
    description:
      "Supervised factory, packing, loading and housekeeping crews for units in Cherlapally, Nacharam, Uppal, Mallapur and Moula Ali, on Hyderabad's eastern side.",
    heading: "Contract labour in Cherlapally and Nacharam.",
    lede: "Supervised crews for the small and mid-sized factories of east Hyderabad.",
    paragraph:
      "East Hyderabad's industry is a cluster of TGIIC parks in Medchal-Malkajgiri district: Cherlapally, in two phases, then Nacharam, Uppal, Mallapur, Moula Ali and the electronics complex at Kushaiguda. Most units are small: a 2022–23 state study looked at 380 micro and small units in Cherlapally's park alone.",
    faqs: [
      {
        question: "Do you supply contract labour in Cherlapally?",
        answer: "Yes. Supervised factory, packing, loading and housekeeping crews for units in Cherlapally, Nacharam, Uppal and Mallapur.",
        category: "commercial",
      },
      VISIT_FAQ,
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "How do we start?",
        answer: "Request a crew with the site address and the roles. We'll tell you plainly whether we can staff it, and plan the crew from there.",
        category: "commercial",
      },
    ],
    sources: [SRC.parks, SRC.industriesReport, SRC.cherlapally, SRC.medchal, ...WAGE_SOURCES],
    // Drafts pending native review (docs/telugu-glossary.md, docs/hindi-glossary.md).
    translations: {
      "te-IN": {
        name: "చర్లపల్లి-నాచారం",
        metaTitle: "చర్లపల్లి, నాచారంలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "హైదరాబాద్ తూర్పు భాగంలో చర్లపల్లి, నాచారం, ఉప్పల్, మల్లాపూర్, మౌలాలిలోని యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, ప్యాకింగ్, లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "చర్లపల్లి, నాచారంలో కాంట్రాక్ట్ లేబర్.",
        lede: "తూర్పు హైదరాబాద్‌లోని చిన్న, మధ్య తరహా ఫ్యాక్టరీలకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "తూర్పు హైదరాబాద్ పరిశ్రమలు మేడ్చల్-మల్కాజిగిరి జిల్లాలోని TGIIC పార్కుల్లో ఉన్నాయి: రెండు ఫేజ్‌ల చర్లపల్లి, తర్వాత నాచారం, ఉప్పల్, మల్లాపూర్, మౌలాలి, కుషాయిగూడలోని ఎలక్ట్రానిక్స్ కాంప్లెక్స్. చాలా యూనిట్లు చిన్నవే: 2022-23లో రాష్ట్ర ప్రభుత్వం చేసిన ఒక అధ్యయనం ఒక్క చర్లపల్లి పార్క్‌లోనే 380 మైక్రో, చిన్న యూనిట్లను పరిశీలించింది.",
        faqs: [
          {
            question: "చర్లపల్లిలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. చర్లపల్లి, నాచారం, ఉప్పల్, మల్లాపూర్‌లోని యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, ప్యాకింగ్, లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం.",
            category: "commercial",
          },
          VISIT_FAQ_TE,
          wagesFaqTe(ZONE_TE),
          START_FAQ_TE,
        ],
      },
      "hi-IN": {
        name: "चर्लापल्ली और नाचारम",
        metaTitle: "चर्लापल्ली, नाचारम में लेबर ठेकेदार (Contractor)",
        description:
          "हैदराबाद के पूर्व में चर्लापल्ली, नाचारम, उप्पल, मल्लापुर और मौला अली की यूनिटों के लिए सुपरवाइज़र के साथ फ़ैक्टरी, पैकिंग, लोडिंग और हाउसकीपिंग टीमें।",
        heading: "चर्लापल्ली और नाचारम में कॉन्ट्रैक्ट लेबर।",
        lede: "पूर्वी हैदराबाद की छोटी और मझोली फ़ैक्टरियों के लिए सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "पूर्वी हैदराबाद की इंडस्ट्री मेडचल-मलकाजगिरी ज़िले के TGIIC पार्कों का एक क्लस्टर है: दो फ़ेज़ वाला चर्लापल्ली, फिर नाचारम, उप्पल, मल्लापुर, मौला अली और कुशाईगुड़ा का इलेक्ट्रॉनिक्स कॉम्प्लेक्स। ज़्यादातर यूनिटें छोटी हैं: 2022-23 में राज्य की एक स्टडी ने अकेले चर्लापल्ली के पार्क में 380 माइक्रो और छोटी यूनिटों को देखा।",
        faqs: [
          {
            question: "क्या आप चर्लापल्ली में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। चर्लापल्ली, नाचारम, उप्पल और मल्लापुर की यूनिटों के लिए सुपरवाइज़र के साथ फ़ैक्टरी, पैकिंग, लोडिंग और हाउसकीपिंग टीमें।",
            category: "commercial",
          },
          VISIT_FAQ_HI,
          wagesFaqHi(ZONE_HI),
          START_FAQ_HI,
        ],
      },
      "hi-Latn-IN": {
        name: "Cherlapally aur Nacharam",
        metaTitle: "Cherlapally, Nacharam mein Labour Thekedar (Contractor)",
        description:
          "Hyderabad ke east mein Cherlapally, Nacharam, Uppal, Mallapur aur Moula Ali ki units ke liye supervised factory, packing, loading aur housekeeping teams.",
        heading: "Cherlapally aur Nacharam mein contract labour.",
        lede: "East Hyderabad ki chhoti aur medium size factories ke liye supervisor ke saath teams.",
        paragraph:
          "East Hyderabad ki industry Medchal-Malkajgiri district ke TGIIC parks ka ek cluster hai: do phases wala Cherlapally, phir Nacharam, Uppal, Mallapur, Moula Ali aur Kushaiguda ka electronics complex. Zyadatar units chhoti hain: 2022-23 mein state ki ek study ne akele Cherlapally ke park mein 380 micro aur small units ko dekha.",
        faqs: [
          {
            question: "Kya aap Cherlapally mein contract labour dete hain?",
            answer:
              "Haan. Cherlapally, Nacharam, Uppal aur Mallapur ki units ke liye supervisor ke saath factory, packing, loading aur housekeeping teams.",
            category: "commercial",
          },
          VISIT_FAQ_LATN,
          wagesFaqLatn(ZONE_LATN),
          START_FAQ_LATN,
        ],
      },
    },
  },
  {
    cluster: "hyderabad",
    estate: "genome-valley",
    name: "Genome Valley",
    placeId: "genome-valley",
    metaTitle: "Contract Labour in Genome Valley, Hyderabad",
    description:
      "Supervised housekeeping, stores, packing and production support crews for life sciences units in Genome Valley, Shamirpet and Turkapally, north of Hyderabad.",
    heading: "Contract labour in Genome Valley.",
    lede: "Supervised crews for vaccine, biotech and pharma research units, trained to your site's hygiene rules.",
    paragraph:
      "Genome Valley is Telangana's life sciences cluster: about 1,500 acres in four phases, from the biotech park at Turkapally and Kolthur to Lalgadi Malakpet, with TGIIC parks at Shameerpet and Turkapally. Its units include vaccine makers, biotech and pharma companies, and research labs. It lies about 23 km from Secunderabad station, off the Outer Ring Road.",
    faqs: [
      {
        question: "Do you supply contract labour in Genome Valley?",
        answer: "Yes. Housekeeping, stores, packing and production support crews, planned with your site team and run by our supervisor.",
        category: "commercial",
      },
      {
        question: "Can your crews meet GMP training rules?",
        answer:
          "Yes. The revised Schedule M names contract staff, cleaners included. We plan each crew around your site's training, gowning and health checks, and keep the training records.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "How do crews get to sites here?",
        answer: "We plan company transport or a pick-up route for the crew with you before it starts.",
        category: "operations",
      },
    ],
    sources: [SRC.genome, SRC.lifeSciencesPolicy, SRC.genomeValley, SRC.parks, SRC.medchal, SRC.scheduleM, ...WAGE_SOURCES],
    // Drafts pending native review (docs/telugu-glossary.md, docs/hindi-glossary.md).
    translations: {
      "te-IN": {
        name: "జీనోమ్ వ్యాలీ",
        metaTitle: "జీనోమ్ వ్యాలీలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "జీనోమ్ వ్యాలీ, శామీర్‌పేట, తుర్కపల్లిలో లైఫ్ సైన్సెస్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే హౌస్‌కీపింగ్, స్టోర్స్, ప్యాకింగ్, ప్రొడక్షన్ సపోర్ట్ టీమ్‌లు.",
        heading: "జీనోమ్ వ్యాలీలో కాంట్రాక్ట్ లేబర్.",
        lede: "వ్యాక్సిన్, బయోటెక్, ఫార్మా రీసెర్చ్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు, మీ సైట్ హైజీన్ రూల్స్‌పై ట్రైనింగ్‌తో.",
        paragraph:
          "జీనోమ్ వ్యాలీ తెలంగాణ లైఫ్ సైన్సెస్ క్లస్టర్: నాలుగు ఫేజ్‌లలో దాదాపు 1,500 ఎకరాలు, తుర్కపల్లి-కొల్తూరులోని బయోటెక్ పార్క్ నుండి లాల్‌గడి మలక్‌పేట వరకు. శామీర్‌పేట, తుర్కపల్లిలో TGIIC పార్కులు కూడా ఉన్నాయి. ఇక్కడ వ్యాక్సిన్ తయారీ కంపెనీలు, బయోటెక్, ఫార్మా కంపెనీలు, రీసెర్చ్ ల్యాబ్‌లు ఉన్నాయి. ఇది ఔటర్ రింగ్ రోడ్ దగ్గర, సికింద్రాబాద్ స్టేషన్ నుండి దాదాపు 23 కి.మీ. దూరంలో ఉంది.",
        faqs: [
          {
            question: "జీనోమ్ వ్యాలీలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. హౌస్‌కీపింగ్, స్టోర్స్, ప్యాకింగ్, ప్రొడక్షన్ సపోర్ట్ టీమ్‌లు ఇస్తాం. మీ సైట్ టీమ్‌తో కలిసి ప్లాన్ చేస్తాం, పని మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "commercial",
          },
          gmpFaqTe("సైట్"),
          wagesFaqTe(ZONE_TE),
          {
            question: "ఇక్కడి సైట్లకు టీమ్‌లు ఎలా వస్తాయి?",
            answer: "టీమ్ పని మొదలుపెట్టే ముందే కంపెనీ ట్రాన్స్‌పోర్ట్ గానీ, పికప్ రూట్ గానీ మీతో కలిసి ప్లాన్ చేస్తాం.",
            category: "operations",
          },
        ],
      },
      "hi-IN": {
        name: "जीनोम वैली",
        metaTitle: "जीनोम वैली, हैदराबाद में लेबर ठेकेदार (Contractor)",
        description:
          "हैदराबाद के उत्तर में जीनोम वैली, शामीरपेट और तुर्कपल्ली की लाइफ़ साइंसेज़ यूनिटों के लिए सुपरवाइज़र के साथ हाउसकीपिंग, स्टोर, पैकिंग और प्रोडक्शन सपोर्ट टीमें।",
        heading: "जीनोम वैली में कॉन्ट्रैक्ट लेबर।",
        lede: "वैक्सीन, बायोटेक और फ़ार्मा रिसर्च यूनिटों के लिए सुपरवाइज़र के साथ टीमें, आपकी साइट के हाइजीन नियमों की ट्रेनिंग के साथ।",
        paragraph:
          "जीनोम वैली तेलंगाना का लाइफ़ साइंसेज़ क्लस्टर है: चार फ़ेज़ में करीब 1,500 एकड़, तुर्कपल्ली और कोल्थुर के बायोटेक पार्क से Lalgadi Malakpet तक। शामीरपेट और तुर्कपल्ली में TGIIC के पार्क भी हैं। यहाँ वैक्सीन बनाने वाली कंपनियाँ, बायोटेक और फ़ार्मा कंपनियाँ और रिसर्च लैब हैं। यह आउटर रिंग रोड के पास, सिकंदराबाद स्टेशन से करीब 23 किलोमीटर दूर है।",
        faqs: [
          {
            question: "क्या आप जीनोम वैली में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। हाउसकीपिंग, स्टोर, पैकिंग और प्रोडक्शन सपोर्ट के लिए टीमें। प्लान आपकी साइट टीम के साथ बनता है, और काम हमारा सुपरवाइज़र चलाता है।",
            category: "commercial",
          },
          gmpFaqHi("साइट"),
          wagesFaqHi(ZONE_HI),
          {
            question: "यहाँ की साइटों तक टीमें कैसे पहुँचती हैं?",
            answer:
              "टीम शुरू होने से पहले हम आपके साथ मिलकर कंपनी ट्रांसपोर्ट या टीम के लिए पिक-अप रूट प्लान करते हैं।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Genome Valley",
        metaTitle: "Genome Valley, Hyderabad mein Labour Thekedar",
        description:
          "North Hyderabad mein Genome Valley, Shamirpet, Turkapally ki life sciences units ke liye supervised housekeeping, stores, packing aur production support teams.",
        heading: "Genome Valley mein contract labour.",
        lede: "Vaccine, biotech aur pharma research units ke liye supervisor ke saath teams, aapki site ke hygiene rules ki training ke saath.",
        paragraph:
          "Genome Valley Telangana ka life sciences cluster hai: chaar phases mein kareeb 1,500 acre, Turkapally aur Kolthur ke biotech park se Lalgadi Malakpet tak. Shameerpet aur Turkapally mein TGIIC ke parks bhi hain. Yahan vaccine banane wali companies, biotech aur pharma companies aur research labs hain. Ye Outer Ring Road ke paas, Secunderabad station se kareeb 23 km door hai.",
        faqs: [
          {
            question: "Kya aap Genome Valley mein contract labour dete hain?",
            answer:
              "Haan. Housekeeping, stores, packing aur production support ke liye teams. Plan aapki site team ke saath banta hai, aur kaam hamara supervisor chalata hai.",
            category: "commercial",
          },
          gmpFaqLatn("site"),
          wagesFaqLatn(ZONE_LATN),
          {
            question: "Yahan ki sites tak teams kaise pahunchti hain?",
            answer:
              "Team ke kaam shuru karne se pehle hum aapke saath milkar company transport ya team ke liye pick-up route plan karte hain.",
            category: "operations",
          },
        ],
      },
    },
  },
  {
    cluster: "hyderabad",
    estate: "shamshabad-kothur",
    name: "Shamshabad and Kothur",
    placeId: "shamshabad-kothur",
    metaTitle: "Contract Labour in Shamshabad, Kothur and Adibatla",
    description:
      "Supervised loading, warehouse, factory and housekeeping crews for units in Shamshabad, Kothur, Shadnagar, Adibatla and Maheshwaram, south of Hyderabad.",
    heading: "Contract labour in Shamshabad and Kothur.",
    lede: "Supervised crews for warehouses, pharma and engineering units along Hyderabad's southern belt.",
    paragraph:
      "South of the city, in Rangareddy district, TGIIC runs industrial parks at Kothur and Mankhal, with a plastics park, and to the east the aerospace and precision engineering SEZ at Adibatla (about 338 acres) and the electronics cluster at Maheshwaram. The airport SEZ is at Shamshabad, and Shadnagar, further south, has pharma and battery units.",
    faqs: [
      {
        question: "Do you supply contract labour in Shamshabad and Kothur?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews for units from Shamshabad to Shadnagar, and at Adibatla and Maheshwaram.",
        category: "commercial",
      },
      {
        question: "Can you staff warehouses near the airport?",
        answer: "Yes. Loading, unloading, picking and packing crews for warehouses and logistics parks, run by our supervisor.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.parks, SRC.sez, SRC.shadnagar, SRC.rangareddy, ...WAGE_SOURCES],
    // Drafts pending native review (docs/telugu-glossary.md, docs/hindi-glossary.md).
    translations: {
      "te-IN": {
        name: "శంషాబాద్-కొత్తూరు",
        metaTitle: "శంషాబాద్, కొత్తూరు కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "హైదరాబాద్‌కు దక్షిణాన శంషాబాద్, కొత్తూరు, షాద్‌నగర్, ఆదిభట్ల, మహేశ్వరంలోని యూనిట్లకు సూపర్‌వైజర్ చూసుకునే లోడింగ్, వేర్‌హౌస్, ఫ్యాక్టరీ, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "శంషాబాద్, కొత్తూరులో కాంట్రాక్ట్ లేబర్.",
        lede: "హైదరాబాద్ దక్షిణ బెల్ట్‌లో వేర్‌హౌస్‌లు, ఫార్మా, ఇంజినీరింగ్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "నగరానికి దక్షిణాన రంగారెడ్డి జిల్లాలో TGIIC కొత్తూరు, మంఖాల్‌లో ఇండస్ట్రియల్ పార్కులు నడుపుతోంది, ఒక ప్లాస్టిక్స్ పార్క్ కూడా ఉంది. తూర్పు వైపు ఆదిభట్లలో ఏరోస్పేస్, ప్రెసిషన్ ఇంజినీరింగ్ SEZ (దాదాపు 338 ఎకరాలు), మహేశ్వరంలో ఎలక్ట్రానిక్స్ క్లస్టర్ ఉన్నాయి. ఎయిర్‌పోర్ట్ SEZ శంషాబాద్‌లో ఉంది, ఇంకా దక్షిణాన ఉన్న షాద్‌నగర్‌లో ఫార్మా, బ్యాటరీ యూనిట్లు ఉన్నాయి.",
        faqs: [
          {
            question: "శంషాబాద్, కొత్తూరులో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. శంషాబాద్ నుండి షాద్‌నగర్ వరకు, ఆదిభట్ల, మహేశ్వరంలోని యూనిట్లకు కూడా సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, లోడింగ్-అన్‌లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం.",
            category: "commercial",
          },
          {
            question: "ఎయిర్‌పోర్ట్ దగ్గరి వేర్‌హౌస్‌లకు వర్కర్లను ఇవ్వగలరా?",
            answer: "అవును. వేర్‌హౌస్‌లు, లాజిస్టిక్స్ పార్కులకు లోడింగ్, అన్‌లోడింగ్, పికింగ్, ప్యాకింగ్ టీమ్‌లు ఇస్తాం, పని మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "operations",
          },
          wagesFaqTe(ZONE_TE),
          VISIT_FAQ_TE,
        ],
      },
      "hi-IN": {
        name: "शमशाबाद और कोथुर",
        metaTitle: "शमशाबाद, कोथुर, आदिबटला में लेबर ठेकेदार",
        description:
          "हैदराबाद के दक्षिण में शमशाबाद, कोथुर, शादनगर, आदिबटला और महेश्वरम की यूनिटों के लिए सुपरवाइज़र के साथ लोडिंग, वेयरहाउस, फ़ैक्टरी और हाउसकीपिंग टीमें।",
        heading: "शमशाबाद और कोथुर में कॉन्ट्रैक्ट लेबर।",
        lede: "हैदराबाद के दक्षिणी बेल्ट में वेयरहाउस, फ़ार्मा और इंजीनियरिंग यूनिटों के लिए सुपरवाइज़र के साथ टीमें।",
        paragraph:
          "शहर के दक्षिण में, रंगारेड्डी ज़िले में, कोथुर और मनखाल में TGIIC के इंडस्ट्रियल पार्क हैं, साथ में एक प्लास्टिक पार्क भी। पूर्व की तरफ़ आदिबटला में एयरोस्पेस और प्रिसिज़न इंजीनियरिंग SEZ (करीब 338 एकड़) और महेश्वरम में इलेक्ट्रॉनिक्स क्लस्टर है। एयरपोर्ट SEZ शमशाबाद में है, और थोड़ा और दक्षिण में शादनगर है, जहाँ फ़ार्मा और बैटरी यूनिटें हैं।",
        faqs: [
          {
            question: "क्या आप शमशाबाद और कोथुर में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। शमशाबाद से शादनगर तक, और आदिबटला और महेश्वरम की यूनिटों के लिए सुपरवाइज़र के साथ फ़ैक्टरी, लोडिंग-अनलोडिंग और हाउसकीपिंग टीमें।",
            category: "commercial",
          },
          {
            question: "क्या आप एयरपोर्ट के पास के वेयरहाउस के लिए कामगार दे सकते हैं?",
            answer:
              "हाँ। वेयरहाउस और लॉजिस्टिक्स पार्कों के लिए लोडिंग, अनलोडिंग, पिकिंग और पैकिंग टीमें, जिनका काम हमारा सुपरवाइज़र चलाता है।",
            category: "operations",
          },
          wagesFaqHi(ZONE_HI),
          VISIT_FAQ_HI,
        ],
      },
      "hi-Latn-IN": {
        name: "Shamshabad aur Kothur",
        metaTitle: "Shamshabad, Kothur, Adibatla mein Labour Thekedar",
        description:
          "Hyderabad ke south mein Shamshabad, Kothur, Shadnagar, Adibatla aur Maheshwaram ki units ke liye supervised loading, warehouse, factory aur housekeeping teams.",
        heading: "Shamshabad aur Kothur mein contract labour.",
        lede: "Hyderabad ke southern belt mein warehouses, pharma aur engineering units ke liye supervisor ke saath teams.",
        paragraph:
          "Shehar ke south mein, Rangareddy district mein, Kothur aur Mankhal mein TGIIC ke industrial parks hain, saath mein ek plastics park bhi. East ki taraf Adibatla mein aerospace aur precision engineering SEZ (kareeb 338 acre) aur Maheshwaram mein electronics cluster hai. Airport SEZ Shamshabad mein hai, aur thoda aur south mein Shadnagar hai, jahan pharma aur battery units hain.",
        faqs: [
          {
            question: "Kya aap Shamshabad aur Kothur mein contract labour dete hain?",
            answer:
              "Haan. Shamshabad se Shadnagar tak, aur Adibatla aur Maheshwaram ki units ke liye supervisor ke saath factory, loading-unloading aur housekeeping teams.",
            category: "commercial",
          },
          {
            question: "Kya aap airport ke paas ke warehouses ke liye workers de sakte hain?",
            answer:
              "Haan. Warehouses aur logistics parks ke liye loading, unloading, picking aur packing teams, jinka kaam hamara supervisor chalata hai.",
            category: "operations",
          },
          wagesFaqLatn(ZONE_LATN),
          VISIT_FAQ_LATN,
        ],
      },
    },
  },
];

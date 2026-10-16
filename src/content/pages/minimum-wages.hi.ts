/**
 * Hindi (hi-IN) copy for the minimum wage pages (PLAN §5.5, PR8). Drafts in
 * review: the pages are built and noindex, unlinked, and out of the sitemap
 * and llms.txt until a native Hindi reviewer signs them off and the status in
 * src/content/registry/pages.ts (WAGE_HI_STATUS) becomes "published".
 *
 * Figures are never typed here: they come from the same datasets as the
 * English pages (src/content/wages), through the same helpers.
 *
 * sourceHash (PLAN §6.6): HI_SOURCE_HASH records, for every English block this
 * file translates, the hash of that English text when it was translated:
 * the "@hi-source" blocks in ./minimum-wages.ts, and each dataset table's
 * text. content:check (C13) fails when an English block changes and its hash
 * here does not; update the Hindi, then run `pnpm content:check` and copy the
 * new hash it prints.
 *
 * Voice: plain Hindi a buyer or a worker reads easily. आप with -इए forms,
 * acronyms in Latin (EPF, ESIC, VDA), Western digits, no agency words.
 */
import type { WageStateSlug } from "@/content/registry/identifiers";
import {
  formatRupees,
  getWageState,
  headlineRange,
  sourceById,
  unpublishedRevisions,
  wageStates,
  type Skill,
  type WageHistory,
  type WageState,
  type WageTable,
} from "@/content/wages";
import { rate, type WageStateCopy, type WageUi } from "./minimum-wages";

export const HI_SOURCE_HASH: Record<string, string> = {
  "state:uttarakhand": "33c08417d250",
  "state:uttar-pradesh": "26b90bdaa78c",
  "state:delhi": "93768f79b360",
  hub: "c66ae9e3a521",
  ui: "299f643bcda5",
  "data:uttarakhand": "c8c90432a4a4",
  "data:uttar-pradesh": "c6e7f721b7ba",
  "data:delhi": "b5901b619963",
};

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const longDate = new Intl.DateTimeFormat("hi-IN-u-nu-latn", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("hi-IN-u-nu-latn", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const shortMonth = new Intl.DateTimeFormat("hi-IN-u-nu-latn", { month: "short", year: "numeric", timeZone: "UTC" });
/** "16 अक्टूबर 2026": Hindi month names, Western digits (PLAN §6.2). */
export const formatDateHi = (iso: string) => longDate.format(parse(iso));
export const formatShortDateHi = (iso: string) => shortDate.format(parse(iso));
const formatShortMonthHi = (iso: string) => shortMonth.format(parse(iso));
export const listDatesHi = (dates: string[]) => {
  const parts = dates.map(formatDateHi);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} और ${parts.at(-1)}` : parts[0];
};

export const STATE_NAME_HI: Record<string, string> = { uttarakhand: "उत्तराखंड", "uttar-pradesh": "उत्तर प्रदेश", delhi: "दिल्ली" };
export const stateNameHi = (state: WageState) => STATE_NAME_HI[state.state] ?? state.name;

export const SKILLS_HI: Record<Skill, string> = {
  unskilled: "अकुशल",
  "semi-skilled": "अर्ध-कुशल",
  skilled: "कुशल",
  "highly-skilled": "अति कुशल",
  "clerical-non-matric": "लिपिक: मैट्रिक से कम",
  "clerical-matric": "लिपिक: मैट्रिक, स्नातक नहीं",
  "clerical-graduate": "लिपिक: स्नातक और ऊपर",
  "clerical-grade-1": "लिपिक ग्रेड I",
  "clerical-grade-2": "लिपिक ग्रेड II",
};

/** The "when is the next revision" answer, from the dataset. */
function nextRevisionAnswerHi(state: WageState, today?: string) {
  const due = unpublishedRevisions(state, today);
  const checked = formatDateHi(state.checked.on);
  if (due.length > 1)
    return `संशोधन ${listDatesHi(due)} को होने थे। ${checked} को हमारी पिछली जाँच तक इनमें से कोई प्रकाशित नहीं हुआ था। अगर ये पिछली तारीख़ से लागू हुए, तो बकाया (एरियर) बन सकता है। राज्य के प्रकाशित करते ही हम यह पेज अपडेट करते हैं।`;
  if (due.length === 1)
    return `एक संशोधन ${formatDateHi(due[0])} को होना था। ${checked} को हमारी जाँच तक राज्य ने उसे प्रकाशित नहीं किया था। प्रकाशित होते ही हम यह पेज अपडेट करते हैं।`;
  return `अगला संशोधन ${formatDateHi(state.nextRevision.expected)} को अपेक्षित है। राज्य के प्रकाशित करते ही हम यह पेज अपडेट करते हैं।`;
}

const JOBS_ELSEWHERE = "हमारी फ़ैक्टरी की नौकरियाँ हरिद्वार, उत्तराखंड में हैं।";
const contractCheck =
  "अगर आप कॉन्ट्रैक्ट लेबर लेते हैं, तो हर महीने अपने ठेकेदार से वेतन पर्ची, वेतन रजिस्टर और EPF व ESIC के चालान माँगिए। इनसे पता चलता है कि कामगारों को कम से कम ये दरें मिलीं या नहीं।";
const rs = (state: WageState, table: string, zone: string, skill: Skill) => formatRupees(rate(state, table, zone, skill).monthly);

const copyHi: Record<WageStateSlug, ((s: WageState) => WageStateCopy) | undefined> = {
  uttarakhand: (s) => {
    const factory = rs(s, "factories-and-industries", "uttarakhand", "unskilled");
    const engineering = rs(s, "engineering-50-plus", "uttarakhand", "unskilled");
    const unskilled = rate(s, "factories-and-industries", "uttarakhand", "unskilled");
    return {
      title: (year) => `उत्तराखंड न्यूनतम मजदूरी${year ? ` ${year}` : ""}: कौशल के हिसाब से दरें`,
      description: `उत्तराखंड में 1 अप्रैल 2026 से अकुशल कामगार की न्यूनतम मजदूरी अधिसूचना 289 के तहत ${factory} महीना, 50+ कामगारों वाली इंजीनियरिंग इकाइयों में ${engineering}। जाँच: ${formatShortMonthHi(s.checked.on)}।`,
      lede: `1 अप्रैल 2026 से उत्तराखंड में फ़ैक्टरी के अकुशल कामगार को कम से कम ${factory} महीना मिलना चाहिए। यह रोज़ का लगभग ${formatRupees(Math.round(unskilled.daily ?? 0))} है। यह दर अधिसूचना 289 की है, जो ज़्यादातर रजिस्टर्ड फ़ैक्टरियों पर लागू होती है। 50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाइयाँ कम से कम ${engineering} महीना देती हैं।`,
      headlineSource: { label: "अधिसूचना", number: "289 + VDA आदेश 1203" },
      contactHref: "/contact#location=haridwar",
      zones: {
        heading: "आपकी साइट पर कौन-सी दर लागू है",
        text: [
          "उत्तराखंड में पूरे राज्य के लिए एक ही दर है। शहर के हिसाब से कोई ज़ोन नहीं है। दर काम के प्रकार से तय होती है, और इंजीनियरिंग इकाइयों में कामगारों की संख्या से।",
          "50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाइयाँ 29 अप्रैल 2026 के अंतरिम आदेश को मानती हैं। आदेश कहता है कि ग़ैर-इंजीनियरिंग इकाइयों की दरें 2024 में बदली गई थीं, इसलिए यह उन पर लागू नहीं होता।",
          "अधिसूचना 289 के तहत बाकी हर फ़ैक्टरी, चाहे कितनी भी बड़ी हो, मूल वेतन और VDA देती है। इसमें 50 से कम कामगारों वाली इंजीनियरिंग इकाइयाँ और वे सभी रजिस्टर्ड फ़ैक्टरियाँ आती हैं जो किसी दूसरी अधिसूचना में नहीं हैं।",
          "दुकानों और व्यावसायिक प्रतिष्ठानों, निर्माण, होटल, परिवहन और कुछ दूसरे कामों की अपनी अधिसूचनाएँ और दरें हैं। श्रम विभाग की सूची में सब हैं।",
          "सिडकुल हरिद्वार, बहादराबाद, भगवानपुर और रुड़की सब उत्तराखंड में हैं, इसलिए वहाँ यही दरें लागू हैं।",
        ],
        link: { href: "https://labour.uk.gov.in/document-category/minimum-wages-notification/", label: "उत्तराखंड की सभी अधिसूचनाएँ (अंग्रेज़ी और हिंदी)" },
      },
      madeUp: [
        "अधिसूचना 289 में महीने की दर मूल वेतन और परिवर्तनशील महँगाई भत्ते (VDA) से मिलकर बनती है। मूल वेतन 1 अप्रैल 2024 से तय है।",
        `VDA अखिल भारतीय उपभोक्ता मूल्य सूचकांक (2016=100) के साथ चलता है: 139 से ऊपर हर अंक पर ₹57.60। 1 अप्रैल 2026 से यह ${formatRupees(unskilled.vda)} है, जो जुलाई से दिसंबर 2025 के औसत 148 से निकला है। यह हर अप्रैल और अक्टूबर में फिर से तय होता है।`,
        "रोज़ की दर महीने की दर के 1/26 से कम नहीं होती। घंटे की दर रोज़ की दर के 1/6 से कम नहीं होती।",
        `इसलिए अकुशल कामगार को ${formatRupees(unskilled.basic)} मूल वेतन और ${formatRupees(unskilled.vda)} VDA मिलता है: कुल ${factory} महीना, या ${formatRupees(unskilled.daily ?? 0)} रोज़।`,
        "50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाइयों के लिए अप्रैल 2026 का आदेश महँगाई भत्ते को एक ही मासिक रकम में मिला देता है। इसमें अलग DA और रोज़ की दर तय नहीं है।",
      ],
      contractLabour: {
        text: [
          "अधिसूचना 289 साफ़ कहती है: कॉन्ट्रैक्ट कामगारों को वही न्यूनतम वेतन और VDA मिलना चाहिए जो सीधे रखे गए कामगारों को मिलता है।",
          contractCheck,
        ],
        vspl: "हम सिडकुल और पूरे हरिद्वार में कॉन्ट्रैक्ट लेबर देते हैं। हम अपने कामगारों को उनके काम और कौशल की अधिसूचित दर से कम नहीं देते, और जहाँ लागू हो EPF और ESIC जमा करते हैं।",
        link: { href: "/contact#location=haridwar", label: "हरिद्वार में कामगार माँगें" },
      },
      faqs: [
        {
          question: "2026 में उत्तराखंड में न्यूनतम मजदूरी कितनी है?",
          answer: `1 अप्रैल 2026 से, अधिसूचना 289 वाली फ़ैक्टरी में अकुशल कामगार के लिए ${factory} महीना। यह ज़्यादातर रजिस्टर्ड फ़ैक्टरियों पर लागू है। 50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाई में ${engineering} महीना। कुछ दूसरे कामों की अपनी अधिसूचनाएँ हैं।`,
        },
        {
          question: `क्या ${engineering} वाली दर मेरी फ़ार्मा या फ़ूड फ़ैक्टरी पर लागू है?`,
          answer: "नहीं। अप्रैल 2026 का अंतरिम आदेश सिर्फ़ 50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाइयों पर लागू है। फ़ार्मा, फ़ूड या पैकेजिंग फ़ैक्टरी, चाहे कितनी भी बड़ी हो, अधिसूचना 289 या अपने काम की अधिसूचना मानती है।",
        },
        { question: "अगला संशोधन कब है?", answer: nextRevisionAnswerHi(s) },
        {
          question: "क्या यह कॉन्ट्रैक्ट कामगारों पर लागू है?",
          answer: "हाँ। अधिसूचना 289 कहती है कि कॉन्ट्रैक्ट कामगारों को वही न्यूनतम वेतन और VDA मिलता है जो सीधे रखे गए कामगारों को।",
        },
        {
          question: "क्या हरिद्वार और देहरादून में दर एक ही है?",
          answer: "हाँ। उत्तराखंड में पूरे राज्य के लिए एक दर है। यह काम और कौशल के स्तर पर निर्भर है, शहर पर नहीं।",
        },
      ],
      labourDepartment: { href: "https://labour.uk.gov.in/", label: "श्रम विभाग, उत्तराखंड" },
    };
  },
  "uttar-pradesh": (s) => {
    const t = "scheduled-employments";
    const [c1, c2, c3] = ["category-1", "category-2", "category-3"].map((z) => rs(s, t, z, "unskilled"));
    const first = rate(s, t, "category-1", "unskilled");
    return {
      title: (year) => `UP न्यूनतम मजदूरी${year ? ` ${year}` : ""}: कौशल के हिसाब से दरें`,
      description: `UP में 1 अप्रैल 2026 से अकुशल न्यूनतम मजदूरी: नोएडा/गाज़ियाबाद ${c1}, नगर निगम वाले ज़िले ${c2}, बाकी ज़िले ${c3}। जाँच: ${formatShortMonthHi(s.checked.on)}।`,
      lede: `1 अप्रैल 2026 से उत्तर प्रदेश में अकुशल कामगार को गौतम बुद्ध नगर और गाज़ियाबाद में कम से कम ${c1} महीना मिलना चाहिए। नगर निगम वाले दूसरे ज़िलों में यह ${c2} है, और बाकी जगह ${c3}। ये दरें आदेश ${sourceById(s, "up-2026-04").number} से हैं।`,
      headlineSource: { label: "आदेश", number: sourceById(s, "up-2026-04").number },
      contactHref: "/contact#state=UP",
      jobsLine: JOBS_ELSEWHERE,
      zones: {
        heading: "आपका ज़िला किस श्रेणी में है",
        text: [
          "अप्रैल 2026 का आदेश उत्तर प्रदेश के ज़िलों को तीन श्रेणियों में बाँटता है। काम जिस ज़िले में होता है, दर वहीं से तय होती है।",
          "श्रेणी I में गौतम बुद्ध नगर (नोएडा और ग्रेटर नोएडा) और गाज़ियाबाद हैं।",
          "श्रेणी II में नगर निगम वाले बाकी सभी ज़िले हैं: आगरा, अलीगढ़, अयोध्या, बरेली, फ़िरोज़ाबाद, गोरखपुर, झाँसी, कानपुर नगर, लखनऊ, मथुरा, मेरठ, मुरादाबाद, प्रयागराज, सहारनपुर, शाहजहाँपुर और वाराणसी।",
          "श्रेणी III में बाकी सभी ज़िले हैं, जैसे बुलंदशहर, हापुड़, मुज़फ़्फ़रनगर या उन्नाव।",
          "आदेश में सिर्फ़ श्रेणी I के ज़िलों के नाम हैं। श्रेणी II की सूची राज्य के स्थानीय निकाय निदेशालय की नगर निगम सूची से है।",
        ],
        link: { href: "https://localbodies.up.nic.in/listnn.htm", label: "उत्तर प्रदेश के नगर निगम (स्थानीय निकाय निदेशालय)" },
      },
      madeUp: [
        `हर दर मूल वेतन और परिवर्तनशील महँगाई भत्ते (VDA) से बनती है। श्रेणी I में अकुशल काम के लिए यह ${formatRupees(first.basic)} मूल वेतन और ${formatRupees(first.vda)} VDA है।`,
        "यह आदेश अंतरिम राहत है। इसकी प्रस्तावना कहती है कि यह अप्रैल 2026 में नोएडा और ग्रेटर नोएडा में हुए श्रमिक असंतोष के बाद आया। इसने श्रम आयुक्त के 25 मार्च 2026 के आदेश की जगह ली।",
        "राज्य के 74 अनुसूचित कामों की अधिसूचनाओं में हर अप्रैल और अक्टूबर में उपभोक्ता मूल्य सूचकांक से VDA बदलने का प्रावधान है।",
        "रोज़ की दर मूल वेतन और VDA के 1/26 से कम नहीं होती। घंटे की दर रोज़ की दर के 1/6 से कम नहीं होती।",
        "ईंट भट्ठों में पीस-रेट मजदूरी पहले के आदेश के तहत ही रही। वह यहाँ नहीं दिखाई गई है।",
      ],
      contractLabour: {
        text: [
          "कॉन्ट्रैक्ट कामगार को भी अपने काम और कौशल की न्यूनतम मजदूरी मिलनी चाहिए, उस काम के किसी भी दूसरे कामगार की तरह।",
          contractCheck,
          "उत्तर प्रदेश में ठेकेदार चाहिए? साइट बताइए, हम साफ़ बताएँगे कि हम कामगार दे सकते हैं या नहीं।",
        ],
        link: { href: "/contact#state=UP", label: "कामगार माँगें" },
      },
      faqs: [
        {
          question: "2026 में UP में न्यूनतम मजदूरी कितनी है?",
          answer: `1 अप्रैल 2026 से अकुशल काम के लिए कम से कम ${c1} महीना गौतम बुद्ध नगर और गाज़ियाबाद में, ${c2} नगर निगम वाले दूसरे ज़िलों में, और ${c3} बाकी सभी ज़िलों में।`,
        },
        {
          question: "नोएडा में दर ज़्यादा क्यों है?",
          answer: "अप्रैल 2026 के आदेश ने गौतम बुद्ध नगर और गाज़ियाबाद को सबसे ऊँची श्रेणी I में रखा। इसकी प्रस्तावना कहती है कि राज्य ने उद्योग, शहर की सुविधाओं और रहने के ख़र्च को देखा, और मालिकों व कामगारों ने तीन श्रेणियों पर सहमति दी।",
        },
        {
          question: "लखनऊ, कानपुर या सहारनपुर में कौन-सी दर लागू है?",
          answer: `श्रेणी II, अकुशल काम के लिए ${c2} महीना। इन सभी ज़िलों में नगर निगम है।`,
        },
        { question: "अगला संशोधन कब है?", answer: nextRevisionAnswerHi(s) },
        {
          question: "क्या यह कॉन्ट्रैक्ट कामगारों पर लागू है?",
          answer: "हाँ। अनुसूचित काम में हर कामगार को न्यूनतम मजदूरी मिलनी चाहिए। ठेकेदार को कम से कम ये दरें देनी होती हैं।",
        },
      ],
      labourDepartment: { href: "https://uplabour.gov.in/", label: "श्रम विभाग, उत्तर प्रदेश" },
    };
  },
  delhi: (s) => {
    const t = "all-scheduled-employments";
    const unskilled = rate(s, t, "delhi", "unskilled");
    const effective = formatDateHi(s.tables[0].effectiveFrom);
    return {
      title: (year) => `दिल्ली न्यूनतम मजदूरी${year ? ` ${year}` : ""}: ${formatRupees(unskilled.daily ?? 0)}/दिन, ${formatRupees(unskilled.monthly)}/महीना`,
      description: `दिल्ली में ${formatShortDateHi(s.tables[0].effectiveFrom)} से न्यूनतम मजदूरी: अकुशल ${rs(s, t, "delhi", "unskilled")} महीना (${formatRupees(unskilled.daily ?? 0)} रोज़), अर्ध-कुशल ${rs(s, t, "delhi", "semi-skilled")}, कुशल ${rs(s, t, "delhi", "skilled")}। जाँच: ${formatShortMonthHi(s.checked.on)}।`,
      lede: `${effective} से दिल्ली में अकुशल कामगार को कम से कम ${formatRupees(unskilled.monthly)} महीना, या ${formatRupees(unskilled.daily ?? 0)} रोज़ मिलना चाहिए। अर्ध-कुशल के लिए ${rs(s, t, "delhi", "semi-skilled")} और कुशल के लिए ${rs(s, t, "delhi", "skilled")}। ये श्रम विभाग की प्रकाशित की हुई सबसे नई दरें हैं, ${formatDateHi(sourceById(s, "dl-2025-04").date)} के आदेश के तहत।`,
      headlineSource: { label: "आदेश", number: sourceById(s, "dl-2025-04").number },
      contactHref: "/contact#state=DL",
      jobsLine: JOBS_ELSEWHERE,
      zones: {
        heading: "क्या दिल्ली में जगह के हिसाब से दर बदलती है?",
        text: [
          "नहीं। पूरी दिल्ली में कौशल के हिसाब से एक ही दर है, और हर अनुसूचित काम में यही दरें लागू हैं।",
          "गुरुग्राम और फ़रीदाबाद हरियाणा में हैं, और नोएडा व गाज़ियाबाद उत्तर प्रदेश में। वहाँ उनके अपने राज्य की दरें लागू हैं।",
        ],
        link: { href: "/minimum-wages/uttar-pradesh", label: "उत्तर प्रदेश में न्यूनतम मजदूरी" },
      },
      madeUp: [
        "दिल्ली की मौजूदा मूल दरें 22 अक्टूबर 2019 से लागू हैं, 23 अक्टूबर 2019 को हस्ताक्षर हुए आदेश के तहत। तब से उन पर महँगाई भत्ता (DA) जुड़ता है, जो उपभोक्ता मूल्य सूचकांक से साल में दो बार, 1 अप्रैल और 1 अक्टूबर को, होना चाहिए।",
        "सबसे नया आदेश, 1 अप्रैल 2025 से लागू, जुलाई से दिसंबर 2024 के उपभोक्ता मूल्य सूचकांक से DA जोड़ता है।",
        "दिल्ली के आदेशों में हर मासिक दर के साथ रोज़ की दर भी दी जाती है। लिपिक और सुपरवाइज़री स्टाफ़ की पढ़ाई के हिसाब से अपनी तीन दरें हैं।",
      ],
      contractLabour: {
        text: [
          "कॉन्ट्रैक्ट कामगार को भी अपने कौशल स्तर की न्यूनतम मजदूरी मिलनी चाहिए, उस काम के किसी भी दूसरे कामगार की तरह।",
          contractCheck,
          "दिल्ली में ठेकेदार चाहिए? साइट बताइए, हम साफ़ बताएँगे कि हम कामगार दे सकते हैं या नहीं।",
        ],
        link: { href: "/contact#state=DL", label: "कामगार माँगें" },
      },
      faqs: [
        {
          question: "2026 में दिल्ली में न्यूनतम मजदूरी कितनी है?",
          answer: `अकुशल काम के लिए ${formatRupees(unskilled.monthly)} महीना, ${effective} से लागू आदेश के तहत। ${formatDateHi(s.checked.on)} को हमारी पिछली जाँच में श्रम विभाग की सूची में इसके बाद का कोई आदेश नहीं था।`,
        },
        {
          question: "अप्रैल 2025 के बाद दिल्ली की दर क्यों नहीं बदली?",
          answer: "दिल्ली की अधिसूचना हर अप्रैल और अक्टूबर में DA बदलने की बात कहती है, लेकिन श्रम विभाग की सूची में अप्रैल 2025 के बाद कोई आदेश नहीं है। आदेश आते ही हम यह पेज अपडेट करते हैं।",
        },
        {
          question: "कुछ वेबसाइटें दिल्ली की ज़्यादा दर क्यों दिखाती हैं?",
          answer: `देखिए कि जिस आदेश का वे हवाला देती हैं, वह श्रम विभाग की सूची में है या नहीं। ${formatDateHi(s.checked.on)} को हमारी जाँच में उसका सबसे नया आदेश ${formatDateHi(sourceById(s, "dl-2025-04").date)} का था। इस पेज की दरें उसी आदेश से हैं।`,
        },
        { question: "अगला संशोधन कब है?", answer: nextRevisionAnswerHi(s) },
        {
          question: "क्या यह कॉन्ट्रैक्ट कामगारों पर लागू है?",
          answer: "हाँ। अनुसूचित काम के हर कामगार को कम से कम ये दरें मिलनी चाहिए, चाहे भुगतान कोई भी करे।",
        },
      ],
      labourDepartment: { href: "https://labour.delhi.gov.in/labour/current-minimum-wage-rate", label: "श्रम विभाग, दिल्ली" },
    };
  },
  haryana: undefined,
};

export function getWageStateCopyHi(slug: WageStateSlug): WageStateCopy | undefined {
  const state = getWageState(slug);
  const build = copyHi[slug];
  return state && build ? build(state) : undefined;
}

/** Dataset text in Hindi, by state and table id: titles, scope, notes, zones (hashed as "data:<state>"). */
const TABLE_HI: Record<string, Record<string, { title: string; appliesTo: string; dailyRule?: string; basicLabel: string; vdaLabel: string; vdaNote?: string; zones: Record<string, { name: string; areas: string }> }>> = {
  uttarakhand: {
    "factories-and-industries": {
      title: "रजिस्टर्ड फ़ैक्टरियाँ और दूसरे उद्योग",
      appliesTo:
        "अधिसूचना 289 के 16 काम, जिनमें 50 से कम कामगारों वाले इंजीनियरिंग उद्योग, धातु और फ़ाउंड्री इकाइयाँ, प्लास्टिक, रबर, डेयरी, मिठाई और पेय बनाने वाले, और हर वह रजिस्टर्ड फ़ैक्टरी आती है जो किसी दूसरी अधिसूचना में नहीं है। 50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाइयाँ नीचे वाली तालिका देखें। दुकानें, निर्माण, होटल और कुछ दूसरे कामों की अपनी अधिसूचनाएँ और दरें हैं।",
      dailyRule:
        "अधिसूचना का पैरा 3 रोज़ की दर को महीने के मूल वेतन और VDA के 1/26 से कम नहीं रखता। इसलिए यहाँ रोज़ की दर महीने की कुल रकम को 26 से भाग देकर, पैसे तक ऊपर की ओर पूरी करके दी गई है।",
      basicLabel: "मूल वेतन",
      vdaLabel: "VDA",
      zones: { uttarakhand: { name: "पूरा उत्तराखंड", areas: "पूरे राज्य के लिए एक दर।" } },
    },
    "engineering-50-plus": {
      title: "50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाइयाँ",
      appliesTo: "50 या ज़्यादा कामगार रखने वाली इंजीनियरिंग इकाइयाँ और इंजीनियरिंग उद्योग। बाकी हर फ़ैक्टरी, चाहे कितनी भी बड़ी हो, ऊपर वाली तालिका देखे।",
      basicLabel: "DA मिला हुआ मूल वेतन",
      vdaLabel: "अलग DA",
      vdaNote: "आदेश एक ही मासिक रकम तय करता है, जिसमें DA मूल वेतन में मिला हुआ है। अलग DA नहीं है। रोज़ की दर तय नहीं है।",
      zones: { uttarakhand: { name: "पूरा उत्तराखंड", areas: "पूरे राज्य के लिए एक दर।" } },
    },
  },
  "uttar-pradesh": {
    "scheduled-employments": {
      title: "अनुसूचित काम",
      appliesTo:
        "हर उस काम के कामगार जिसकी न्यूनतम मजदूरी न्यूनतम मजदूरी अधिनियम, 1948 के तहत तय है (राज्य के 74 अनुसूचित काम)। ईंट भट्ठों में पीस-रेट मजदूरी पहले के आदेश के तहत रहती है।",
      dailyRule:
        "अप्रैल 2026 का आदेश महीने की दरें तय करता है। 74 कामों की अधिसूचनाएँ रोज़ की दर को मूल वेतन और VDA के 1/26 से कम नहीं रखतीं। इसलिए यहाँ रोज़ की दर महीने की कुल रकम को 26 से भाग देकर, पैसे तक ऊपर की ओर पूरी करके दी गई है।",
      basicLabel: "मूल वेतन",
      vdaLabel: "VDA",
      zones: {
        "category-1": { name: "श्रेणी I", areas: "गौतम बुद्ध नगर (नोएडा, ग्रेटर नोएडा) और गाज़ियाबाद ज़िले।" },
        "category-2": {
          name: "श्रेणी II",
          areas:
            "नगर निगम वाले ज़िले: आगरा, अलीगढ़, अयोध्या, बरेली, फ़िरोज़ाबाद, गोरखपुर, झाँसी, कानपुर नगर, लखनऊ, मथुरा, मेरठ, मुरादाबाद, प्रयागराज, सहारनपुर, शाहजहाँपुर और वाराणसी।",
        },
        "category-3": { name: "श्रेणी III", areas: "बाकी सभी ज़िले।" },
      },
    },
  },
  delhi: {
    "all-scheduled-employments": {
      title: "सभी अनुसूचित काम",
      appliesTo: "दिल्ली का हर अनुसूचित काम: अकुशल, अर्ध-कुशल और कुशल कामगार, और लिपिक व सुपरवाइज़री स्टाफ़।",
      basicLabel: "22 अक्टूबर 2019 को तय दर",
      vdaLabel: "तब से जुड़ा DA",
      vdaNote:
        "दिल्ली का आदेश लागू दर और हर संशोधन में जुड़ा DA देता है। यहाँ आधार 22 अक्टूबर 2019 की अधिसूचना से तय दर है, और DA उसके बाद जुड़ी पूरी रकम है।",
      zones: { delhi: { name: "पूरी दिल्ली", areas: "पूरे राष्ट्रीय राजधानी क्षेत्र दिल्ली के लिए एक दर।" } },
    },
  },
};

/** History notes in Hindi, by "<state>:<table>:<effectiveFrom>". */
const HISTORY_NOTE_HI: Record<string, string> = {
  "uttarakhand:factories-and-industries:2025-10-01": "वही मूल वेतन, ₹288 VDA के साथ।",
  "uttar-pradesh:scheduled-employments:2024-10-01":
    "अप्रैल 2026 के आदेश के तीन श्रेणियों में बाँटने से पहले, पूरे राज्य के लिए एक दर। श्रम विभाग की साइट पर अप्रैल 2025 से मार्च 2026 का कोई VDA आदेश नहीं है, और जिस 25 मार्च 2026 के आदेश की जगह अप्रैल 2026 का आदेश आया, वह वहाँ प्रकाशित नहीं है, इसलिए वे समय यहाँ नहीं दिखाए गए हैं।",
};

/** The dataset's table text, in Hindi where translated; English otherwise (content:check C13 keeps them in step). */
export function tableTextHi(state: WageState, table: WageTable) {
  const hi = TABLE_HI[state.state]?.[table.id];
  return {
    title: hi?.title ?? table.title,
    appliesTo: hi?.appliesTo ?? table.appliesTo,
    dailyRule: table.dailyRule && (hi?.dailyRule ?? table.dailyRule),
    basicLabel: hi?.basicLabel ?? table.basicLabel,
    vdaLabel: hi?.vdaLabel ?? table.vdaLabel,
    vdaNote: table.vdaNote && (hi?.vdaNote ?? table.vdaNote),
    zone: (id: string) => hi?.zones[id] ?? table.zones.find((z) => z.id === id)!,
  };
}
export const historyNoteHi = (state: WageState, entry: WageHistory) =>
  entry.note && (HISTORY_NOTE_HI[`${state.state}:${entry.table}:${entry.effectiveFrom}`] ?? entry.note);

export const wageHubCopyHi = {
  title: (year: string | null) => `न्यूनतम मजदूरी${year ? ` ${year}` : ""}: उत्तराखंड, UP और दिल्ली`,
  description: () =>
    `उत्तराखंड, उत्तर प्रदेश और दिल्ली की न्यूनतम मजदूरी, कौशल के हिसाब से, हर दर की अधिसूचना संख्या और लागू होने की तारीख़ के साथ। जाँच: ${formatShortMonthHi(wageStates.map((s) => s.checked.on).sort()[0])}।`,
  heading: (year: string | null) => `राज्य के हिसाब से न्यूनतम मजदूरी${year ? `, ${year}` : ""}।`,
  lede: (states: readonly WageState[]) =>
    `अकुशल, महीने की: ${states.map((s) => `${s.state === "uttar-pradesh" ? "UP" : stateNameHi(s)} ${headlineRange(s).replace(" to ", " से ")}`).join(", ")}। हर राज्य के पेज पर सभी कौशल स्तर और राज्य की अपनी अधिसूचना है। और राज्य बाद में जुड़ेंगे।`,
  whatIs: {
    heading: "न्यूनतम मजदूरी क्या है",
    text: [
      "न्यूनतम मजदूरी वह सबसे कम रकम है जो मालिक एक महीने या एक दिन के काम के लिए दे सकता है। हर राज्य अपने अनुसूचित कामों के लिए कौशल के हिसाब से दरें तय करता है, और कुछ राज्य ज़िले के हिसाब से भी अलग दरें रखते हैं।",
      "ज़्यादातर दरों के दो हिस्से होते हैं: मूल वेतन, और परिवर्तनशील महँगाई भत्ता (VDA), जो क़ीमतों के साथ बढ़ता है। अधिसूचनाओं में हर अप्रैल और अक्टूबर में VDA बदलने का प्रावधान है, लेकिन राज्य अक्सर देर से प्रकाशित करते हैं या कोई बारी छोड़ देते हैं। हर राज्य का पेज बताता है कि आख़िरी बार क्या प्रकाशित हुआ।",
      "वेतन संहिता, 2019 (Code on Wages) 21 नवंबर 2025 से लागू है। इसके तहत केंद्र सरकार एक राष्ट्रीय न्यूनतम आधार मजदूरी (फ़्लोर वेज) तय कर सकती है, और राज्य की दरें उससे कम नहीं हो सकतीं।",
    ],
  },
  changes: {
    heading: "2026 में क्या बदला",
    items: [
      {
        state: "uttar-pradesh" as const,
        text: () => "1 अप्रैल 2026 से एक अंतरिम आदेश ने राज्य के ज़िलों को तीन श्रेणियों में बाँटा, और सबसे ऊँची दरें गौतम बुद्ध नगर और गाज़ियाबाद में रखीं।",
      },
      {
        state: "uttarakhand" as const,
        text: (s: WageState) =>
          `1 अप्रैल 2026 से 50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाइयों को नई अंतरिम दरें मिलीं, और बाकी कामों का VDA बढ़कर ${formatRupees(rate(s, "factories-and-industries", "uttarakhand", "unskilled").vda)} महीना हो गया।`,
      },
      {
        state: "delhi" as const,
        text: (s: WageState) =>
          `${formatDateHi(s.tables[0].effectiveFrom)} से लागू आदेश के बाद कोई नया आदेश नहीं। इसकी दरें श्रम विभाग की प्रकाशित सबसे नई दरें हैं।`,
      },
    ],
  },
  employers: {
    heading: "कॉन्ट्रैक्ट लेबर लेने वाले मालिकों के लिए",
    text: [
      "कॉन्ट्रैक्ट कामगार को भी वही न्यूनतम मजदूरी मिलनी चाहिए जो सीधे रखे गए कामगार को। उत्तराखंड की अधिसूचना यह साफ़ शब्दों में कहती है।",
      "हर महीने अपने ठेकेदार से वेतन पर्ची, वेतन रजिस्टर और EPF व ESIC के चालान माँगिए। इनसे पता चलता है कि टीम को कम से कम ये दरें मिलीं या नहीं।",
    ],
  },
  workers: {
    heading: "कामगारों के लिए",
    text: [
      "अगर आपको अपने काम की न्यूनतम मजदूरी से कम मिलता है, तो आप जिस राज्य में काम करते हैं, उसके श्रम विभाग में शिकायत कर सकते हैं।",
      "अपनी वेतन पर्ची और हाज़िरी का रिकॉर्ड संभालकर रखिए। इनसे पता चलता है कि आपको कितना मिला।",
    ],
  },
  faqs: (lowest: string, highest: string) => [
    {
      question: "2026 में न्यूनतम मजदूरी कितनी है?",
      answer: `यह राज्य, काम के प्रकार और कौशल के स्तर पर निर्भर है। यहाँ दिखाए गए कामों में अकुशल काम की महीने की दरें ${lowest} से ${highest} तक हैं।`,
    },
    {
      question: "क्या पूरे देश की एक न्यूनतम मजदूरी है?",
      answer: "सबके लिए एक दर नहीं है। वेतन संहिता, 2019 केंद्र सरकार को एक आधार मजदूरी तय करने देती है। हर राज्य अपनी न्यूनतम मजदूरी तय करता है, जो उस आधार से कम नहीं हो सकती।",
    },
    {
      question: "दरें कितनी बार बदलती हैं?",
      answer: "अधिसूचनाओं में हर अप्रैल और अक्टूबर में महँगाई भत्ता बदलने का प्रावधान है, और मूल वेतन कुछ सालों में बदलता है। राज्य अक्सर देर से प्रकाशित करते हैं या कोई बारी छोड़ देते हैं। हर राज्य का पेज बताता है कि आख़िरी बार क्या प्रकाशित हुआ और अगला संशोधन कब है।",
    },
    {
      question: "क्या ये दरें कॉन्ट्रैक्ट कामगारों पर लागू हैं?",
      answer: "हाँ। कॉन्ट्रैक्ट कामगार को भी अपने काम की न्यूनतम मजदूरी मिलनी चाहिए, सीधे रखे गए कामगार की तरह। उत्तराखंड की अधिसूचना यह साफ़ शब्दों में कहती है।",
    },
  ],
};

export const howWeCheckHi = {
  heading: "हम ये पेज कैसे जाँचते हैं",
  text: [
    "हर आँकड़ा हम राज्य की अपनी अधिसूचना या आदेश से हाथ से भरते हैं, किसी सारांश वाली साइट से नहीं। हर राज्य के पेज पर इस्तेमाल हुए दस्तावेज़ों के लिंक हैं।",
    "हम हर संशोधन की तारीख़ (1 अप्रैल और 1 अक्टूबर) के आसपास, और किसी नए आदेश की ख़बर मिलने पर, राज्य के श्रम विभाग को फिर से जाँचते हैं।",
  ],
  corrections: "कोई आँकड़ा ग़लत दिखा? पेज और अधिसूचना के साथ हमें ईमेल कीजिए। पक्की ग़लती हम जल्दी ठीक करते हैं और पेज पर तारीख़ लिखते हैं।",
};

export const wageDoorsHi = {
  jobs: {
    eyebrow: "काम चाहिए",
    heading: "सिडकुल और पूरे हरिद्वार में फ़ैक्टरी और वेयरहाउस की नौकरी।",
    text: "पूरी 8 घंटे की शिफ्ट। आवेदन की कोई फ़ीस नहीं है।",
    link: { href: "/jobs", label: "नौकरियाँ देखें" },
  },
  business: { eyebrow: "यूनिट के लिए कामगार", heading: "अपनी साइट पर टीम चाहिए?", text: "काम, कितने लोग और शिफ्ट बताइए।", link: { href: "/contact", label: "कामगार माँगें" } },
};

export const wageUiHi: WageUi = {
  minimumWages: "न्यूनतम मजदूरी",
  stateHeading: (name, year) => `${name} में न्यूनतम मजदूरी${year ? `, ${year}` : ""}।`,
  statesListItem: (name) => `${name} में न्यूनतम मजदूरी`,
  facts: {
    inForce: "लागू होने की तारीख़",
    checked: "जाँच",
    checkedBy: (by) => `, ${by} ने की`,
    fromDocs: ", राज्य के दस्तावेज़ों से",
    overdue: "संशोधन बाकी, तब से",
    wasDue: "संशोधन होना था",
    next: "अगला संशोधन",
  },
  checkedPhrase: (by, date) => (by ? `${date} को ${by} ने जाँच की।` : `${date} को राज्य के अपने दस्तावेज़ों से भरा गया।`),
  doors: { looking: "काम चाहिए?", hiring: "यूनिट के लिए कामगार चाहिए?", paidLess: "इससे कम मिल रहा है?", whatYouCanDo: "आप क्या कर सकते हैं" },
  notice: {
    staleStrong: "ये दरें बदल चुकी हो सकती हैं।",
    staleText: "सबसे नई अधिसूचना देखिए।",
    staleLink: "राज्य की सबसे नई अधिसूचनाएँ",
    many: (dates, checked) => [
      `संशोधन ${dates} को होने थे।`,
      `${checked} को हमारी जाँच तक कोई प्रकाशित नहीं हुआ था। अगर ये पिछली तारीख़ से लागू हुए, तो बकाया बन सकता है। ये प्रकाशित हुई सबसे नई दरें हैं।`,
    ],
    one: (date, checked, name) => [`एक संशोधन ${date} को होना था।`, `${checked} को हमारी जाँच तक ${name} ने उसे प्रकाशित नहीं किया था। ये प्रकाशित हुई सबसे नई दरें हैं।`],
  },
  table: {
    caption: (title, name, date) => `${title}: ${name} में ${date} से न्यूनतम मजदूरी, रुपये में`,
    skill: "कौशल स्तर",
    month: "महीने की",
    day: "रोज़ की",
    dayDerived: "रोज़ की (÷ 26)",
    split: (basicLabel, basic, vdaLabel, vda) => `${basicLabel} ${basic} और ${vdaLabel} ${vda}`,
    notSet: "तय नहीं",
    from: (date) => `${date} से।`,
    also: "साथ में:",
    range: (from, to) => `${from} से ${to}`,
  },
  pdf: (kind, hindi, size) =>
    `${kind === "notification" ? "अधिसूचना" : kind === "order" ? "आदेश" : "संशोधन"} पढ़ें (PDF${hindi ? ", हिंदी" : ", अंग्रेज़ी"}${size ? `, ${size}` : ""})`,
  sourceKind: (kind) => (kind === "notification" ? "अधिसूचना" : kind === "order" ? "आदेश" : "संशोधन"),
  dated: "दिनांक",
  sections: {
    rates: "दरें",
    ratesHeading: (name) => `${name} में न्यूनतम मजदूरी की दरें`,
    where: "कहाँ लागू है",
    theRate: "दर",
    madeUpHeading: "दर कैसे बनती है",
    history: "इतिहास",
    historyHeading: "पहले की दरें",
    employers: "मालिकों के लिए",
    employersHeading: (name) => `अगर आप ${name} में कॉन्ट्रैक्ट लेबर लेते हैं`,
    workerLine: ["इससे कम मिल रहा है? आप शिकायत कर सकते हैं:", "। अपनी वेतन पर्ची और हाज़िरी का रिकॉर्ड संभालकर रखिए।"],
    others: "दूसरे राज्य",
    allStates: "सभी राज्य",
    questions: "सवाल",
    questionsHeading: "आम सवाल",
    sources: "स्रोत और जाँच",
    editorial: "हमारी संपादकीय नीति (अंग्रेज़ी में)",
    documents: "इस पेज में इस्तेमाल हुए दस्तावेज़",
  },
  hub: {
    byState: "राज्य के हिसाब से",
    tableHeading: "राज्य के हिसाब से अकुशल दर",
    caption: "मुख्य फ़ैक्टरी कामों में अकुशल काम की महीने की न्यूनतम मजदूरी, राज्य के हिसाब से, रुपये में",
    state: "राज्य",
    unskilledMonth: "अकुशल, महीने की",
    inForce: "लागू होने की तारीख़",
    checked: "जाँच",
    byCategory: ", ज़िले की श्रेणी के हिसाब से",
    mayBeRevised: " · बदल चुकी हो सकती है",
    from: (date) => `${date} से`,
    note: "ये मुख्य फ़ैक्टरी कामों की दरें हैं। हर राज्य के पेज पर सभी कौशल स्तर और ज़ोन, उसकी दूसरी तालिकाएँ, और हर दर की अधिसूचना है।",
    basics: "बुनियादी बातें",
    thisYear: "इस साल",
    employers: "मालिकों के लिए",
    requestCrew: "कामगार माँगें",
    workers: "कामगारों के लिए",
  },
};

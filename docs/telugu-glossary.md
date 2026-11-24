# Telugu (te-IN) glossary

**Status, 24 November 2026: retired.** The Telugu location pages are business pages, and business pages stay English unless search data supports another language. Keyword Planner found no Telugu buyer searches that name a place, so `/te-in/locations/...` 308s to the English page (`LOCATION_LOCALES` in `src/content/registry/pages.ts`). The copy stays in `src/content/locations` and this glossary stays for a return if the data changes.

Telugu went live on 24 November 2026 for the Visakhapatnam and Hyderabad location pages only: the two hubs and their nine area pages, `/te-in/locations/visakhapatnam/...` and `/te-in/locations/hyderabad/...` (`WITH_TELUGU` / `LOCATION_LOCALES` in `src/content/registry/pages.ts`). The copy is in `translations["te-IN"]` in `src/content/locations/visakhapatnam.ts` and `src/content/locations/hyderabad.ts`. The copy is a draft. A native-language audit (24 November 2026) was applied the same day: all its must-fix and should-fix rows; its nits and the items below marked *open* are not applied yet. The jobs pages, form and intake have no Telugu yet, so a Telugu reader's jobs copy is the English (`jobsLocale` in `src/lib/i18n.ts`); the wages and compliance links say "(English)". Fonts: Anek Telugu for headings, Hind Guntur for body (`src/assets/fonts/README.txt`).

## Review answers (te-IN audit, 24 November 2026)

The owner wants everyday Hyderabad and Vizag Telugu, as an HR person or supervisor speaks it, with the English work words people actually use, not formal or written-news Telugu.

- **Register.** Grammar and spelling were sound, but the vocabulary read like written news. Keep Telugu grammar and verbs; use the English nouns plant people say (టీమ్, వర్కర్, రూల్స్, ట్రైనింగ్, ట్రాన్స్‌పోర్ట్, అడ్రస్, రేటు, ఫేజ్, గార్మెంట్స్, జీవో); prefer verbs (ఇస్తాం, చూసుకుంటారు, కన్ఫర్మ్ చేస్తాం) to formal nouns (పర్యవేక్షణలో, నిర్ధారిస్తాం).
- **Loanwords.** ఫ్యాక్టరీ, హౌస్‌కీపింగ్, సూపర్‌వైజర్, ప్యాకింగ్, హైజీన్, సేఫ్టీ, రోల్స్ all read naturally; none becomes a Telugu word. The draft erred the other way, with Telugu words where the loanword is normal.
- **Crews.** Not బృందాలు (written register). Use టీమ్ / టీమ్‌లు, which also matches సైట్ టీమ్ and సేఫ్టీ టీమ్ on the client side. ("గ్యాంగ్" is floor slang, too informal for a buyer page.)
- **Supervised.** Not సూపర్‌వైజర్‌తో (reads "teams with a supervisor"). Use "సూపర్‌వైజర్ చూసుకునే టీమ్‌లు" in descriptions and ledes, and "పని మా సూపర్‌వైజర్ చూసుకుంటారు" in sentences. Drop పర్యవేక్షణలో and నడుపుతారు (నడపడం is for a business or vehicle, not people).
- **Requirements.** "{areas}లోని యూనిట్ల నుండి రిక్వైర్‌మెంట్లు తీసుకుంటాం." No మేము: the verb already says "we".
- **Joined area lists.** Were not clear (మరియు inside names plus మరియు as joiner; a comma inside "JN ఫార్మా సిటీ, పరవాడ" split one item in two). Paired places now take a hyphen (పటాన్‌చెరు-పాశమైలారం) and the place comes first (పరవాడ JN ఫార్మా సిటీ, అచ్యుతాపురం-రాంబిల్లి APSEZ). మరియు stays only as the list joiner (`and` in `location.tsx`). Headings use a comma (పటాన్‌చెరు, పాశమైలారంలో).
- **Meaning errors fixed.** "కార్మికులను అడగండి" read "ask the workers": the Request a crew button is now "వర్కర్ల కోసం అడగండి". "విచారణలు" read as an investigation: Enquiries is ఎంక్వైరీలు. "ఆంధ్రప్రదేశ్‌వే / తెలంగాణవే" was a calque of "'s": the wages answers open "ఆంధ్రప్రదేశ్ కనీస వేతనాలే" / "తెలంగాణ కనీస వేతనాలే".
- **Place names.** Answers in the Places table.

Writing rules:

- Every FAQ answer is a sentence with a verb (ఇస్తాం, చూసుకుంటారు, ఉంటారు), not a list of English nouns.
- Avoid మరియు inside sentences: use a comma, a hyphen for paired places, or "-తో పాటు".
- Workers are వర్కర్ (gender-neutral "చేస్తారు"), not కార్మికుడు / చేస్తాడు.
- Links to English pages are marked "(English)", not "(ఇంగ్లీష్‌లో)".

## Search register

Notes from the search data (coordinator, 24 Nov 2026):

- Telugu searchers type English words in Telugu script. Prefer loanwords in metaTitles and headings: జాబ్స్, లేబర్, సప్లై, కాంట్రాక్టర్, ఫ్యాక్టరీ, ప్యాకింగ్, హౌస్‌కీపింగ్.
- Class 12 is ఇంటర్ (Inter) wherever it comes up. (It does not come up on the location pages.)
- On its own, ఉద్యోగాలు leans towards government-job intent, so links and labels say జాబ్స్. The location pages say "జాబ్ కోసం చూస్తున్నవారు" (job seekers; "జాబ్" already signals private work) and "జాబ్స్ పేజీ" (jobs page); the header work door and the Andhra Pradesh, Telangana, Hyderabad and Visakhapatnam jobs links say జాబ్స్ ("హైదరాబాద్‌లో జాబ్స్"). *Open:* the other markets' jobs links and the jobs-only interface (JOBS_NAV, job groups, jobs-in-row, paused jobs notice) still say ఉద్యోగాలు / దరఖాస్తు; the audit proposes జాబ్స్ / అప్లై చేయండి there.
- metaTitles follow the Haridwar pattern: the Telugu phrase, then the Latin search term in brackets, at most 55 characters, for example "విశాఖపట్నంలో లేబర్ కాంట్రాక్టర్ (Labour Contractor)". Where the full English title does not fit, the Telugu title drops a name (Rambilli, Adibatla) and keeps it in the description.

## Terms

| English | Telugu | Notes |
|---|---|---|
| Labour contractor | లేబర్ కాంట్రాక్టర్ | |
| Contract labour | కాంట్రాక్ట్ లేబర్ | |
| Manpower supply / supplier | మ్యాన్‌పవర్ సప్లై | Hyderabad hub heading and FAQ |
| Supply (verb) | సప్లై చేస్తారా? / సప్లై చేస్తాం | |
| Workers (for a company) | వర్కర్ / వర్కర్లు | Not కార్మికులు (union and news register) |
| Request a crew (button) | వర్కర్ల కోసం అడగండి | Not కార్మికులను అడగండి, which means "ask the workers" |
| Do you need workers at your site? (CTA) | మీ సైట్‌కి వర్కర్లు కావాలా? | |
| Header crew label | కంపెనీలకు వర్కర్లు | |
| Crew(s) | టీమ్ / టీమ్‌లు | Not బృందం; matches సైట్ టీమ్, సేఫ్టీ టీమ్. Services label: "మేము ఇచ్చే టీమ్‌లు (English)" |
| Supervised (crews) | సూపర్‌వైజర్ చూసుకునే (టీమ్‌లు) | Not సూపర్‌వైజర్‌తో |
| Supervisor | సూపర్‌వైజర్ | |
| Run by our supervisor | పని మా సూపర్‌వైజర్ చూసుకుంటారు | Not నడుపుతారు or పర్యవేక్షణలో |
| On our payroll | వర్కర్లు మా పేరోల్‌లో ఉంటారు | |
| Loading and unloading | లోడింగ్-అన్‌లోడింగ్ (in lists) / లోడింగ్, అన్‌లోడింగ్ (labels) | |
| Housekeeping and grounds (services label) | హౌస్‌కీపింగ్, గార్డెనింగ్ | Not గ్రౌండ్స్, which reads as playgrounds |
| Housekeeping | హౌస్‌కీపింగ్ | |
| Factory | ఫ్యాక్టరీ | |
| Warehouse | వేర్‌హౌస్ | గోదాం where it reads better (not used yet) |
| Industrial area / belt | ఇండస్ట్రియల్ ఏరియా / బెల్ట్ | Keep పారిశ్రామిక భూములు for "industrial land" |
| Industrial park / estate | ఇండస్ట్రియల్ పార్క్ / ఇండస్ట్రియల్ ఎస్టేట్ | |
| Phase | ఫేజ్ | "ఐదు ఫేజ్‌లలో"; parks are signed "Phase 1" |
| Unit(s) | యూనిట్ / యూనిట్లు | |
| Pharma / pharmaceuticals | ఫార్మా / ఫార్మాస్యూటికల్స్ | |
| Bulk drug | బల్క్ డ్రగ్ | API kept in Latin |
| Chemical / fine chemicals | కెమికల్ / ఫైన్ కెమికల్స్ | |
| Engineering | ఇంజినీరింగ్ | |
| Apparel | గార్మెంట్స్ | "apparel SEZ" stays అపెరల్ SEZ as a name |
| Export units | ఎక్స్‌పోర్ట్ యూనిట్లు | |
| Logistics | లాజిస్టిక్స్ | |
| Life sciences | లైఫ్ సైన్సెస్ | |
| Production support | ప్రొడక్షన్ సపోర్ట్ | |
| Packing / packers | ప్యాకింగ్ / ప్యాకర్లు | |
| Stores / dispatch / picking | స్టోర్స్ / డిస్పాచ్ / పికింగ్ | |
| Helpers / loaders | హెల్పర్లు / లోడర్లు | |
| Shift / night shift | షిఫ్ట్ / నైట్ షిఫ్ట్ | |
| Site / site team | సైట్ / సైట్ టీమ్ | |
| Induction | ఇండక్షన్ | |
| Rules (site, hygiene, safety, PPE, entry, gate) | రూల్స్ | "హైజీన్, సేఫ్టీ రూల్స్"; not నియమాలు / నిబంధనలు |
| Safety team | సేఫ్టీ టీమ్ | |
| PPE, GMP, permit-to-work | PPE, GMP, పర్మిట్-టు-వర్క్ | Acronyms in Latin |
| Restricted area | రిస్ట్రిక్టెడ్ ఏరియా | |
| Revised Schedule M | రివైజ్డ్ షెడ్యూల్ M | QA usage |
| Contract staff, cleaners included | క్లీనర్లతో సహా కాంట్రాక్ట్ స్టాఫ్ | |
| Training / training records | ట్రైనింగ్ / ట్రైనింగ్ రికార్డులు | "GMP ట్రైనింగ్" is the floor term |
| Gowning / health checks | గౌనింగ్ / మెడికల్ చెకప్‌లు | |
| Roles | రోల్స్ | |
| Requirements | రిక్వైర్‌మెంట్లు | "{areas}లోని యూనిట్ల నుండి రిక్వైర్‌మెంట్లు తీసుకుంటాం" |
| Worker list | వర్కర్ల లిస్ట్ | |
| Job seekers | జాబ్ కోసం చూస్తున్నవారు | See Search register |
| Jobs page | జాబ్స్ పేజీ | |
| Job(s) | జాబ్ / జాబ్స్ | Links and labels; ఉద్యోగాలు remains in some jobs-only strings (*open*); see Search register |
| Enquiries | ఎంక్వైరీలు | Not విచారణలు, which reads as an investigation |
| Minimum wage / wages | కనీస వేతనం / వేతనాలు | |
| Zone / skill | జోన్ / స్కిల్ | |
| Basic rate | బేసిక్ రేటు | |
| Dearness allowance (VDA) | కరువు భత్యం (VDA) | Andhra Pradesh |
| Cost of living allowance | జీవన వ్యయ భత్యం | Telangana |
| Order (government) | జీవో | Universal in AP and Telangana speech and press |
| Listed employment | జాబితాలో ఉన్న (ప్రతి రకం) పని | |
| Professional Tax | ప్రొఫెషనల్ ట్యాక్స్ | |
| Labour Welfare Fund | లేబర్ వెల్ఫేర్ ఫండ్ | |
| Compliance | కంప్లయన్స్ | Link label "మేము కంప్లయన్స్ ఎలా చూసుకుంటాం (English)" |
| PF and ESIC | PF, ESIC | Kept in Latin |
| Transport / housing / pick-up route | ట్రాన్స్‌పోర్ట్ / వసతి (ఉండటానికి వసతి) / పికప్ రూట్ | "కంపెనీ ట్రాన్స్‌పోర్ట్"; not రవాణా |
| Address | అడ్రస్ | Not చిరునామా |
| Price / pricing (manpower) | రేటు | Not ధర: manpower is quoted as a rate |
| Confirm | కన్ఫర్మ్ చేస్తాం | Not నిర్ధారిస్తాం |
| Approx. | దాదాపు | More spoken than సుమారు |
| Micro and small units | మైక్రో, చిన్న యూనిట్లు | Not సూక్ష్మ |
| Security guards / licence | సెక్యూరిటీ గార్డులు / లైసెన్స్ | |
| Private security agency | ప్రైవేట్ సెక్యూరిటీ ఏజెన్సీ | |
| Port / port city | పోర్టు | "port and steel city" is "పోర్టు, స్టీల్ ప్లాంట్ ఉన్న నగరం" |
| Steel plant | స్టీల్ ప్లాంట్ | |
| Special Economic Zone | స్పెషల్ ఎకనామిక్ జోన్ | SEZ in Latin |
| Export processing zone | ఎక్స్‌పోర్ట్ ప్రాసెసింగ్ జోన్ | |
| Effluent treatment plant | ఎఫ్లుయెంట్ ట్రీట్‌మెంట్ ప్లాంట్ | ETP where an acronym fits |
| Public-private partnership | పబ్లిక్-ప్రైవేట్ పార్ట్‌నర్‌షిప్ (PPP) | |
| Development Commissioner | డెవలప్‌మెంట్ కమిషనర్ | |
| Government of India / Ministry of Commerce | కేంద్ర ప్రభుత్వం / కేంద్ర వాణిజ్య శాఖ | Not భారత ప్రభుత్వం / మంత్రిత్వ శాఖ |
| District / mandal | జిల్లా / మండలం | |
| km / acres / hectares | కి.మీ. / ఎకరాలు / హెక్టార్లు | |
| Vayasya Seva | Vayasya Seva | Kept in Latin |
| APIIC, APSEZ, APSRTC, VSEZ, SEZ, IDA, TGIIC, NH-16 | Latin | Acronyms kept as written |

## Places

| English | Telugu | Notes |
|---|---|---|
| Visakhapatnam (Vizag) | విశాఖపట్నం (వైజాగ్) | |
| Anakapalli | అనకాపల్లి | |
| Atchutapuram | అచ్యుతాపురం | |
| Rambilli | రాంబిల్లి | |
| Parawada | పరవాడ | |
| JN Pharma City | JN ఫార్మా సిటీ; in full జవహర్‌లాల్ నెహ్రూ ఫార్మా సిటీ | Page and area name: పరవాడ JN ఫార్మా సిటీ (place first, no comma) |
| APSEZ Atchutapuram and Rambilli | అచ్యుతాపురం-రాంబిల్లి APSEZ | Page and area name; heading "అచ్యుతాపురం, రాంబిల్లి APSEZలో" |
| VSEZ Duvvada | VSEZ దువ్వాడ | *open*: audit nit proposes దువ్వాడ VSEZ |
| Duvvada | దువ్వాడ | |
| Gajuwaka | గాజువాక | |
| Gangavaram Port | గంగవరం పోర్టు | |
| Pendurthi | పెందుర్తి | |
| Kakinada | కాకినాడ | |
| Nakkapalli | నక్కపల్లి | |
| Kurmannapalem | కూర్మన్నపాలెం | |
| Aganampudi | అగనంపూడి | |
| Malkapuram | మల్కాపురం | |
| Steel Plant township | స్టీల్ ప్లాంట్ టౌన్‌షిప్ | *open*: locally also ఉక్కునగరం (check before adding) |
| Hyderabad | హైదరాబాద్ | |
| Secunderabad | సికింద్రాబాద్ | |
| Patancheru | పటాన్‌చెరు | Correct and current; పటాన్‌చెరువు is the older long form. Paired page name: పటాన్‌చెరు-పాశమైలారం |
| Pashamylaram | పాశమైలారం | |
| Bollaram (IDA Bollaram) | బొల్లారం (IDA బొల్లారం) | |
| Sultanpur | సుల్తాన్‌పూర్ | |
| Gaddapotharam | గడ్డపోతారం | |
| Gummadidala | గుమ్మడిదల | |
| Jinnaram | జిన్నారం | |
| Solapur highway | సోలాపూర్ హైవే | |
| Sangareddy district | సంగారెడ్డి జిల్లా | |
| Jeedimetla | జీడిమెట్ల | Paired page name: జీడిమెట్ల-మేడ్చల్ |
| Medchal | మేడ్చల్ | |
| Medchal-Malkajgiri district | మేడ్చల్-మల్కాజిగిరి జిల్లా | |
| Gandimaisamma | గండిమైసమ్మ | |
| Dundigal | దుండిగల్ | |
| Kukatpally | కూకట్‌పల్లి | |
| Sanathnagar | సనత్‌నగర్ | |
| Cherlapally | చర్లపల్లి | Paired page name: చర్లపల్లి-నాచారం |
| Nacharam | నాచారం | |
| Uppal | ఉప్పల్ | |
| Mallapur | మల్లాపూర్ | |
| Moula Ali | మౌలాలి | |
| Kushaiguda | కుషాయిగూడ | |
| Genome Valley | జీనోమ్ వ్యాలీ | |
| Shamirpet / Shameerpet | శామీర్‌పేట | One spelling for both English forms; checked: Telangana "-pet" names take -పేట |
| Turkapally | తుర్కపల్లి | |
| Kolthur | కొల్తూరు | Checked: correct |
| Lalgadi Malakpet | లాల్‌గడి మలక్‌పేట | Checked 24 Nov 2026: Namasthe Telangana writes లాల్‌గడి మలక్‌పేట; Eenadu and Telugu Wikipedia write లాల్‌గాడి. All sources have లాల్‌, none లాలగడి |
| Outer Ring Road | ఔటర్ రింగ్ రోడ్ | |
| Shamshabad | శంషాబాద్ | Paired page name: శంషాబాద్-కొత్తూరు |
| Kothur | కొత్తూరు | |
| Mankhal | మంఖాల్ | Checked: correct as commonly written |
| Adibatla | ఆదిభట్ల | |
| Maheshwaram | మహేశ్వరం | |
| Shadnagar | షాద్‌నగర్ | |
| Rangareddy district | రంగారెడ్డి జిల్లా | |
| Andhra Pradesh / Telangana | ఆంధ్రప్రదేశ్ / తెలంగాణ | |
| Kapurthala (jobs labels only) | కపుర్తలా | *open*: audit nit proposes కపూర్తలా (long ū) |

## Open (from the audit, not applied)

- The 15 nit rows (jobs-only labels and nav to జాబ్స్ / అప్లై చేయండి, ఇంటర్ పాస్, form-draft notice wording, Duvvada word order, VISIT question wording, Gajuwaka షాపులు, the APSEZ metaTitle).
- కపూర్తలా spelling (confirm first).
- The seeker jobs link on te-IN location pages opens an English page without an "(English)" marker; adding one is a code change in `location.tsx`.
- The Patancheru (Hyderabad) FAQ question "... మీ బృందాలు సురక్షితంగా ఎలా పనిచేస్తాయి?" was not in the audit and still says బృందాలు (glossary now says టీమ్‌లు).

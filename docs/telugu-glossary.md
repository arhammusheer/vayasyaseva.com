# Telugu (te-IN) glossary

Telugu went live on 24 November 2026 for the Visakhapatnam and Hyderabad location pages only: the two hubs and their nine area pages, `/te-in/locations/visakhapatnam/...` and `/te-in/locations/hyderabad/...` (`WITH_TELUGU` / `LOCATION_LOCALES` in `src/content/registry/pages.ts`). The copy is in `translations["te-IN"]` in `src/content/locations/visakhapatnam.ts` and `src/content/locations/hyderabad.ts`. Everything is a draft pending native review, like the Hindi, Punjabi and Kannada copy. The jobs pages, form and intake have no Telugu yet, so a Telugu reader's jobs copy is the English (`jobsLocale` in `src/lib/i18n.ts`); the wages and compliance links say "(English)". Fonts: Anek Telugu for headings, Hind Guntur for body (`src/assets/fonts/README.txt`).

Review questions for the native reviewer: is the register right for a plant or HR manager in Vizag or Hyderabad (spoken Telugu with the English loanwords people use, short sentences)? Do the loanwords (ఫ్యాక్టరీ, హౌస్‌కీపింగ్, సూపర్‌వైజర్, ప్యాకింగ్, హైజీన్, సేఫ్టీ, రోల్స్) read naturally, or should any be Telugu words? Is బృందాలు the right word for "crews", and సూపర్‌వైజర్‌తో for "supervised"? Does "{areas}లోని యూనిట్ల నుండి మేము అవసరాలు తీసుకుంటాం" read well for "We take requirements from units in ..." (రిక్వైర్‌మెంట్లు is the alternative)? With area names that already contain మరియు ("APSEZ అచ్యుతాపురం మరియు రాంబిల్లి"), is the joined list in the hub paragraphs clear? Please check the place-name spellings marked *check* below.

## Search register

Notes from the search data (coordinator, 24 Nov 2026):

- Telugu searchers type English words in Telugu script. Prefer loanwords in metaTitles and headings: జాబ్స్, లేబర్, సప్లై, కాంట్రాక్టర్, ఫ్యాక్టరీ, ప్యాకింగ్, హౌస్‌కీపింగ్.
- Class 12 is ఇంటర్ (Inter) wherever it comes up. (It does not come up on the location pages.)
- On its own, ఉద్యోగాలు leans towards government-job intent. Where a sentence is about jobs, say ప్రైవేట్ ఫ్యాక్టరీ or name the role plainly. The location pages say "ప్రైవేట్ జాబ్స్ కోసం చూస్తున్నవారు" (job seekers) and "జాబ్స్ పేజీ" (jobs page).
- metaTitles follow the Haridwar pattern: the Telugu phrase, then the Latin search term in brackets, at most 55 characters, for example "విశాఖపట్నంలో లేబర్ కాంట్రాక్టర్ (Labour Contractor)". Where the full English title does not fit, the Telugu title drops a name (Rambilli, Adibatla) and keeps it in the description.

## Terms

| English | Telugu | Notes |
|---|---|---|
| Labour contractor | లేబర్ కాంట్రాక్టర్ | |
| Contract labour | కాంట్రాక్ట్ లేబర్ | |
| Manpower supply / supplier | మ్యాన్‌పవర్ సప్లై | Hyderabad hub heading and FAQ |
| Supply (verb) | సప్లై చేస్తారా? / సప్లై చేస్తాం | |
| Workers (for a company) | కార్మికులు | "Request a crew" is కార్మికులను అడగండి |
| Crew(s) | బృందం / బృందాలు | As in the interface's "మా బృందాలు" |
| Supervised | సూపర్‌వైజర్‌తో | |
| Supervisor | సూపర్‌వైజర్ | |
| Run by our supervisor | మా సూపర్‌వైజర్ నడుపుతారు / మా సూపర్‌వైజర్ పర్యవేక్షణలో | |
| On our payroll | మా పేరోల్‌లో | |
| Loading and unloading | లోడింగ్ మరియు అన్‌లోడింగ్ | |
| Housekeeping | హౌస్‌కీపింగ్ | |
| Factory | ఫ్యాక్టరీ | |
| Warehouse | వేర్‌హౌస్ | గోదాం where it reads better (not used yet) |
| Industrial area / belt | పారిశ్రామిక ప్రాంతం | ఇండస్ట్రియల్ ఏరియా also fine |
| Industrial park / estate | ఇండస్ట్రియల్ పార్క్ / ఇండస్ట్రియల్ ఎస్టేట్ | |
| Phase | దశ | "ఐదు దశల్లో" |
| Unit(s) | యూనిట్ / యూనిట్లు | |
| Pharma / pharmaceuticals | ఫార్మా / ఫార్మాస్యూటికల్స్ | |
| Bulk drug | బల్క్ డ్రగ్ | API kept in Latin |
| Chemical / fine chemicals | కెమికల్ / ఫైన్ కెమికల్స్ | |
| Engineering | ఇంజినీరింగ్ | |
| Apparel | దుస్తుల తయారీ | "apparel SEZ" is అపెరల్ SEZ |
| Logistics | లాజిస్టిక్స్ | |
| Life sciences | లైఫ్ సైన్సెస్ | |
| Production support | ప్రొడక్షన్ సపోర్ట్ | |
| Packing / packers | ప్యాకింగ్ / ప్యాకర్లు | |
| Stores / dispatch / picking | స్టోర్స్ / డిస్పాచ్ / పికింగ్ | |
| Helpers / loaders | హెల్పర్లు / లోడర్లు | |
| Shift / night shift | షిఫ్ట్ / నైట్ షిఫ్ట్ | |
| Site / site team | సైట్ / సైట్ టీమ్ | |
| Induction | ఇండక్షన్ | |
| Hygiene and safety rules | హైజీన్ మరియు సేఫ్టీ నియమాలు | |
| Safety team | సేఫ్టీ టీమ్ | |
| PPE, GMP, permit-to-work | PPE, GMP, పర్మిట్-టు-వర్క్ | Acronyms in Latin |
| Restricted area | నిషేధిత ప్రాంతం | |
| Revised Schedule M | సవరించిన షెడ్యూల్ M | |
| Contract staff, cleaners included | క్లీనర్లతో సహా కాంట్రాక్ట్ సిబ్బంది | |
| Training / training records | శిక్షణ / శిక్షణ రికార్డులు | |
| Gowning / health checks | గౌనింగ్ / ఆరోగ్య పరీక్షలు | |
| Roles | రోల్స్ | |
| Requirements | అవసరాలు | Review: రిక్వైర్‌మెంట్లు? |
| Worker list | కార్మికుల జాబితా | |
| Job seekers | ప్రైవేట్ జాబ్స్ కోసం చూస్తున్నవారు | See Search register |
| Jobs page | జాబ్స్ పేజీ | |
| Job(s) | ఉద్యోగం / ఉద్యోగాలు | Interface strings; see Search register |
| Minimum wage / wages | కనీస వేతనం / వేతనాలు | |
| Zone / skill | జోన్ / నైపుణ్యం | |
| Basic rate | బేసిక్ రేటు | |
| Dearness allowance (VDA) | కరువు భత్యం (VDA) | Andhra Pradesh |
| Cost of living allowance | జీవన వ్యయ భత్యం | Telangana |
| Order (government) | ఉత్తర్వు | |
| Listed employment | జాబితాలోని ఉపాధి | |
| Professional Tax | ప్రొఫెషనల్ ట్యాక్స్ | |
| Labour Welfare Fund | లేబర్ వెల్ఫేర్ ఫండ్ | |
| Compliance | కంప్లయన్స్ | Link label "మేము కంప్లయన్స్ ఎలా చూసుకుంటాం (English)" |
| PF and ESIC | PF, ESIC | Kept in Latin |
| Transport / housing / pick-up route | రవాణా / వసతి / పికప్ రూట్ | |
| Security guards / licence | సెక్యూరిటీ గార్డులు / లైసెన్స్ | |
| Private security agency | ప్రైవేట్ సెక్యూరిటీ ఏజెన్సీ | |
| Port / port city | పోర్టు / ఓడరేవు | "port and steel city" is ఓడరేవు, ఉక్కు నగరం |
| Steel plant | స్టీల్ ప్లాంట్ | |
| Special Economic Zone | స్పెషల్ ఎకనామిక్ జోన్ | SEZ in Latin |
| Export processing zone | ఎక్స్‌పోర్ట్ ప్రాసెసింగ్ జోన్ | |
| Effluent treatment plant | వ్యర్థ జల శుద్ధి ప్లాంట్ | |
| Public-private partnership | పబ్లిక్-ప్రైవేట్ భాగస్వామ్యం | |
| Development Commissioner | డెవలప్‌మెంట్ కమిషనర్ | |
| Ministry of Commerce | వాణిజ్య మంత్రిత్వ శాఖ | |
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
| JN Pharma City | JN ఫార్మా సిటీ; in full జవహర్‌లాల్ నెహ్రూ ఫార్మా సిటీ | |
| Duvvada | దువ్వాడ | |
| Gajuwaka | గాజువాక | |
| Gangavaram Port | గంగవరం పోర్టు | |
| Pendurthi | పెందుర్తి | |
| Kakinada | కాకినాడ | |
| Nakkapalli | నక్కపల్లి | |
| Kurmannapalem | కూర్మన్నపాలెం | |
| Aganampudi | అగనంపూడి | |
| Malkapuram | మల్కాపురం | |
| Steel Plant township | స్టీల్ ప్లాంట్ టౌన్‌షిప్ | |
| Hyderabad | హైదరాబాద్ | |
| Secunderabad | సికింద్రాబాద్ | |
| Patancheru | పటాన్‌చెరు | *check*: పటాన్‌చెరువు is also written |
| Pashamylaram | పాశమైలారం | |
| Bollaram (IDA Bollaram) | బొల్లారం (IDA బొల్లారం) | |
| Sultanpur | సుల్తాన్‌పూర్ | |
| Gaddapotharam | గడ్డపోతారం | |
| Gummadidala | గుమ్మడిదల | |
| Jinnaram | జిన్నారం | |
| Solapur highway | సోలాపూర్ హైవే | |
| Sangareddy district | సంగారెడ్డి జిల్లా | |
| Jeedimetla | జీడిమెట్ల | |
| Medchal | మేడ్చల్ | |
| Medchal-Malkajgiri district | మేడ్చల్-మల్కాజిగిరి జిల్లా | |
| Gandimaisamma | గండిమైసమ్మ | |
| Dundigal | దుండిగల్ | |
| Kukatpally | కూకట్‌పల్లి | |
| Sanathnagar | సనత్‌నగర్ | |
| Cherlapally | చర్లపల్లి | |
| Nacharam | నాచారం | |
| Uppal | ఉప్పల్ | |
| Mallapur | మల్లాపూర్ | |
| Moula Ali | మౌలాలి | |
| Kushaiguda | కుషాయిగూడ | |
| Genome Valley | జీనోమ్ వ్యాలీ | |
| Shamirpet / Shameerpet | శామీర్‌పేట | One spelling for both English forms; *check* |
| Turkapally | తుర్కపల్లి | |
| Kolthur | కొల్తూరు | *check* |
| Lalgadi Malakpet | లాలగడి మలక్‌పేట | *check* |
| Outer Ring Road | ఔటర్ రింగ్ రోడ్ | |
| Shamshabad | శంషాబాద్ | |
| Kothur | కొత్తూరు | |
| Mankhal | మంఖాల్ | *check* |
| Adibatla | ఆదిభట్ల | |
| Maheshwaram | మహేశ్వరం | |
| Shadnagar | షాద్‌నగర్ | |
| Rangareddy district | రంగారెడ్డి జిల్లా | |
| Andhra Pradesh / Telangana | ఆంధ్రప్రదేశ్ / తెలంగాణ | |

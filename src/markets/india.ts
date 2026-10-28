/**
 * Every place the jobs form can say a person lives in (the `home` answer):
 * states and union territories, major cities and industrial clusters. The
 * ids and English names are stored values in the shared rules (HOME_STATES,
 * HOME_CITIES); this file adds what the site needs to guess and search them:
 * coordinates, a size weight, other spellings, and the market and form
 * answers a place files under. Page names in other scripts: ./place-names.ts.
 *
 * Layer 1: data and pure queries; no React, registry or page content.
 */
import { HOME_CITIES, HOME_STATES, homeStateOf, type HomeState } from "@/lib/talent-intake/rules";
import type { AreaId } from "./areas";
import type { MarketId } from "./data";

export type HomeId = string;

export type PlaceRow = {
  /** Where it is (a city's centre); states have none, except the city-states. */
  lat?: number;
  lon?: number;
  /** Size, for search order and ties: 3 a metro or big city, 2 a city or major cluster, 1 a town. */
  w: 1 | 2 | 3;
  /** The jobs market it lies in, whose market answer (market:<id>) it files under. */
  market?: MarketId;
  /** Form answers that name it, most specific first: a page's own answer wins (home.ts areaForPlace). */
  areas?: readonly AreaId[];
  /** Other spellings and names people type, lower case Latin. */
  aka?: readonly string[];
};

const at = (lat: number, lon: number, w: PlaceRow["w"], more: Omit<PlaceRow, "lat" | "lon" | "w"> = {}): PlaceRow => ({ lat, lon, w, ...more });

const UK_REST: readonly AreaId[] = ["uttarakhand:other", "haridwar:rest-of-uttarakhand", "dehradun:rest-of-uttarakhand"];
const PB_REST: readonly AreaId[] = ["punjab:other", "jalandhar:rest-of-punjab", "kapurthala:rest-of-punjab"];
const AP_REST: readonly AreaId[] = ["andhra-pradesh:other", "visakhapatnam:rest-of-andhra-pradesh"];
const TS_REST: readonly AreaId[] = ["telangana:other", "hyderabad:rest-of-telangana"];

export const STATE_ROWS: Readonly<Record<HomeState, PlaceRow>> = {
  an: { w: 1, aka: ["andaman", "port blair"] },
  ap: { w: 3, market: "andhra-pradesh", areas: AP_REST, aka: ["andhra"] },
  ar: { w: 1, aka: ["arunachal"] },
  as: { w: 2, aka: ["assam"] },
  br: { w: 3 },
  ch: at(30.733, 76.779, 2),
  cg: { w: 2, aka: ["chattisgarh", "chhatisgarh"] },
  dh: { w: 1, aka: ["dadra", "nagar haveli", "dnh", "daman and diu", "diu"] },
  dl: at(28.644, 77.216, 3, { aka: ["new delhi", "dilli", "ncr"] }),
  ga: at(15.4, 74.0, 1, { aka: ["panaji", "vasco", "verna"] }),
  gj: { w: 3, aka: ["gujrat"] },
  hr: { w: 3 },
  hp: { w: 1, aka: ["himachal"] },
  jk: { w: 1, aka: ["j&k", "kashmir"] },
  jh: { w: 2 },
  ka: { w: 3 },
  kl: { w: 2 },
  la: { w: 1, aka: ["leh", "kargil"] },
  ld: { w: 1 },
  mp: { w: 3, aka: ["mp"] },
  mh: { w: 3, aka: ["maharastra"] },
  mn: { w: 1 },
  ml: { w: 1 },
  mz: { w: 1, aka: ["aizawl"] },
  nl: { w: 1, aka: ["kohima", "dimapur"] },
  od: { w: 2, aka: ["orissa"] },
  py: at(11.94, 79.81, 1, { aka: ["pondicherry", "pondy"] }),
  pb: { w: 3, market: "punjab", areas: PB_REST },
  rj: { w: 3 },
  sk: { w: 1, aka: ["gangtok"] },
  tn: { w: 3 },
  ts: { w: 3, market: "telangana", areas: TS_REST },
  tr: { w: 1 },
  up: { w: 3, aka: ["up"] },
  uk: { w: 2, market: "uttarakhand", areas: UK_REST, aka: ["uttaranchal"] },
  wb: { w: 3, aka: ["bengal", "bangal"] },
};

export const CITY_ROWS: Readonly<Record<string, PlaceRow>> = {
  "uk:haridwar": at(29.945, 78.164, 2, { market: "haridwar", areas: ["haridwar-jwalapur", "uttarakhand:haridwar"], aka: ["hardwar", "jwalapur"] }),
  "uk:sidcul": at(29.94, 78.06, 2, { market: "haridwar", areas: ["sidcul-bahadrabad", "uttarakhand:haridwar"], aka: ["sidcul", "bahadrabad", "shivalik nagar"] }),
  "uk:roorkee": at(29.854, 77.888, 2, { market: "haridwar", areas: ["roorkee-bhagwanpur", "uttarakhand:haridwar"], aka: ["rurki", "bhagwanpur"] }),
  "uk:laksar": at(29.758, 78.04, 1, { market: "haridwar", areas: ["laksar", "uttarakhand:haridwar"] }),
  "uk:dehradun": at(30.316, 78.032, 3, { market: "dehradun", areas: ["dehradun:city", "uttarakhand:dehradun-selaqui"], aka: ["dehra dun", "doon"] }),
  "uk:selaqui": at(30.37, 77.86, 1, { market: "dehradun", areas: ["dehradun:selaqui-sahaspur", "uttarakhand:dehradun-selaqui"], aka: ["sahaspur", "selakui"] }),
  "uk:rishikesh": at(30.087, 78.268, 2, { market: "dehradun", areas: ["dehradun:rishikesh-doiwala", "uttarakhand:dehradun-selaqui"], aka: ["doiwala"] }),
  "uk:vikasnagar": at(30.469, 77.775, 1, { market: "dehradun", areas: ["dehradun:vikasnagar", "uttarakhand:dehradun-selaqui"], aka: ["herbertpur"] }),
  "uk:rudrapur": at(28.98, 79.4, 2, { market: "uttarakhand", areas: ["uttarakhand:udham-singh-nagar"], aka: ["pantnagar", "udham singh nagar"] }),
  "uk:kashipur": at(29.21, 78.96, 1, { market: "uttarakhand", areas: ["uttarakhand:udham-singh-nagar"] }),
  "uk:sitarganj": at(28.93, 79.7, 1, { market: "uttarakhand", areas: ["uttarakhand:udham-singh-nagar"] }),
  "uk:haldwani": at(29.22, 79.51, 2, { market: "uttarakhand", aka: ["kathgodam", "nainital"] }),

  "pb:jalandhar": at(31.326, 75.576, 3, { market: "jalandhar", areas: ["jalandhar:city", "punjab:jalandhar", "kapurthala:jalandhar"], aka: ["jullundur"] }),
  "pb:kapurthala": at(31.38, 75.38, 2, { market: "kapurthala", areas: ["kapurthala:city", "punjab:kapurthala", "jalandhar:kapurthala"] }),
  "pb:phagwara": at(31.224, 75.77, 2, { market: "kapurthala", areas: ["kapurthala:phagwara", "punjab:kapurthala", "jalandhar:kapurthala"] }),
  "pb:sultanpur-lodhi": at(31.215, 75.2, 1, { market: "kapurthala", areas: ["kapurthala:sultanpur-lodhi", "punjab:kapurthala", "jalandhar:kapurthala"], aka: ["bholath"] }),
  "pb:goraya": at(31.12, 75.77, 1, { market: "jalandhar", areas: ["jalandhar:goraya-phillaur", "punjab:jalandhar", "kapurthala:jalandhar"], aka: ["phillaur", "guraya"] }),
  "pb:ludhiana": at(30.901, 75.857, 3, { market: "punjab", areas: ["punjab:ludhiana"] }),
  "pb:mohali": at(30.704, 76.717, 2, { market: "punjab", areas: ["punjab:mohali"], aka: ["kharar", "sas nagar", "zirakpur", "dera bassi"] }),
  "pb:amritsar": at(31.634, 74.872, 3, { market: "punjab", areas: ["punjab:amritsar"] }),
  "pb:patiala": at(30.34, 76.386, 2, { market: "punjab", aka: ["rajpura"] }),
  "pb:bathinda": at(30.21, 74.945, 2, { market: "punjab", aka: ["bhatinda"] }),
  "pb:hoshiarpur": at(31.53, 75.91, 1, { market: "punjab" }),
  "pb:gobindgarh": at(30.67, 76.3, 1, { market: "punjab", aka: ["khanna", "fatehgarh sahib"] }),

  "ka:bengaluru": at(12.972, 77.594, 3, { market: "bengaluru", aka: ["bangalore", "blr"] }),
  "ka:peenya": at(13.03, 77.52, 2, { market: "bengaluru", areas: ["bengaluru:north"], aka: ["yeshwanthpur", "dasarahalli", "nelamangala"] }),
  "ka:electronic-city": at(12.845, 77.66, 2, { market: "bengaluru", areas: ["bengaluru:south"], aka: ["bommasandra", "jigani", "anekal", "e city"] }),
  "ka:whitefield": at(12.97, 77.75, 2, { market: "bengaluru", areas: ["bengaluru:east"], aka: ["hoskote", "kr puram"] }),
  "ka:kengeri": at(12.91, 77.48, 1, { market: "bengaluru", areas: ["bengaluru:west"], aka: ["bidadi"] }),
  "ka:tumakuru": at(13.34, 77.1, 2, { aka: ["tumkur"] }),
  "ka:mysuru": at(12.296, 76.639, 3, { aka: ["mysore"] }),
  "ka:hubballi": at(15.364, 75.124, 2, { aka: ["hubli", "dharwad"] }),
  "ka:belagavi": at(15.85, 74.5, 2, { aka: ["belgaum"] }),
  "ka:mangaluru": at(12.914, 74.856, 2, { aka: ["mangalore"] }),
  "ka:kalaburagi": at(17.33, 76.83, 1, { aka: ["gulbarga"] }),
  "ka:ballari": at(15.14, 76.92, 1, { aka: ["bellary", "hospet"] }),

  "ap:visakhapatnam": at(17.687, 83.218, 3, { market: "visakhapatnam", areas: ["visakhapatnam:city", "andhra-pradesh:visakhapatnam"], aka: ["vizag", "vishakhapatnam", "visakhapatanam"] }),
  "ap:gajuwaka": at(17.66, 83.17, 1, { market: "visakhapatnam", areas: ["visakhapatnam:gajuwaka", "andhra-pradesh:visakhapatnam"], aka: ["duvvada", "steel plant"] }),
  "ap:pendurthi": at(17.83, 83.2, 1, { market: "visakhapatnam", areas: ["visakhapatnam:pendurthi", "andhra-pradesh:visakhapatnam"], aka: ["sabbavaram"] }),
  "ap:anakapalli": at(17.69, 83.0, 2, { market: "visakhapatnam", areas: ["visakhapatnam:anakapalli", "andhra-pradesh:visakhapatnam"], aka: ["parawada", "atchutapuram", "achutapuram"] }),
  "ap:vijayawada": at(16.506, 80.648, 3, { market: "andhra-pradesh", areas: ["andhra-pradesh:vijayawada-guntur"], aka: ["bezawada"] }),
  "ap:guntur": at(16.307, 80.436, 2, { market: "andhra-pradesh", areas: ["andhra-pradesh:vijayawada-guntur"] }),
  "ap:kakinada": at(16.989, 82.247, 2, { market: "andhra-pradesh", areas: ["andhra-pradesh:kakinada-rajahmundry"] }),
  "ap:rajahmundry": at(17.0, 81.8, 2, { market: "andhra-pradesh", areas: ["andhra-pradesh:kakinada-rajahmundry"], aka: ["rajamahendravaram"] }),
  "ap:nellore": at(14.44, 79.99, 2, { market: "andhra-pradesh", areas: ["andhra-pradesh:nellore-tirupati"] }),
  "ap:tirupati": at(13.628, 79.419, 2, { market: "andhra-pradesh", areas: ["andhra-pradesh:nellore-tirupati"] }),
  "ap:sri-city": at(13.55, 80.0, 1, { market: "andhra-pradesh", areas: ["andhra-pradesh:nellore-tirupati"] }),
  "ap:kurnool": at(15.83, 78.04, 1, { market: "andhra-pradesh" }),
  "ap:anantapur": at(14.68, 77.6, 1, { market: "andhra-pradesh", aka: ["anantapuramu"] }),

  "ts:hyderabad": at(17.385, 78.487, 3, { market: "hyderabad", areas: ["hyderabad:city", "telangana:hyderabad"], aka: ["secunderabad", "hyd"] }),
  "ts:patancheru": at(17.53, 78.26, 1, { market: "hyderabad", areas: ["hyderabad:patancheru", "telangana:hyderabad"], aka: ["pashamylaram", "bollaram", "sangareddy"] }),
  "ts:jeedimetla": at(17.51, 78.45, 1, { market: "hyderabad", areas: ["hyderabad:jeedimetla-medchal", "telangana:hyderabad"], aka: ["kukatpally", "medchal"] }),
  "ts:uppal": at(17.4, 78.56, 1, { market: "hyderabad", areas: ["hyderabad:uppal-cherlapally", "telangana:hyderabad"], aka: ["cherlapally", "nacharam"] }),
  "ts:shamshabad": at(17.25, 78.4, 1, { market: "hyderabad", areas: ["hyderabad:shamshabad-kothur", "telangana:hyderabad"], aka: ["kothur", "shadnagar"] }),
  "ts:warangal": at(17.97, 79.59, 2, { market: "telangana", areas: ["telangana:warangal"], aka: ["hanamkonda"] }),
  "ts:karimnagar": at(18.44, 79.13, 2, { market: "telangana", areas: ["telangana:karimnagar-ramagundam"], aka: ["ramagundam", "peddapalli"] }),
  "ts:nalgonda": at(17.05, 79.27, 1, { market: "telangana", areas: ["telangana:nalgonda-suryapet"], aka: ["suryapet"] }),
  "ts:mahabubnagar": at(16.74, 78.0, 1, { market: "telangana", areas: ["telangana:mahabubnagar-jadcherla"], aka: ["jadcherla"] }),
  "ts:khammam": at(17.25, 80.15, 1, { market: "telangana" }),
  "ts:nizamabad": at(18.67, 78.09, 1, { market: "telangana" }),

  "dl:bawana": at(28.8, 77.03, 1, { aka: ["narela"] }),
  "dl:okhla": at(28.53, 77.27, 1),

  "up:noida": at(28.535, 77.391, 3, { aka: ["gautam buddh nagar"] }),
  "up:greater-noida": at(28.474, 77.504, 2),
  "up:ghaziabad": at(28.669, 77.454, 3, { aka: ["sahibabad"] }),
  "up:meerut": at(28.984, 77.706, 2),
  "up:saharanpur": at(29.968, 77.546, 2),
  "up:muzaffarnagar": at(29.473, 77.708, 2),
  "up:bijnor": at(29.37, 78.13, 1, { aka: ["najibabad"] }),
  "up:moradabad": at(28.839, 78.773, 2),
  "up:bareilly": at(28.367, 79.432, 2),
  "up:aligarh": at(27.883, 78.08, 2),
  "up:agra": at(27.177, 78.008, 3),
  "up:lucknow": at(26.847, 80.947, 3),
  "up:kanpur": at(26.449, 80.331, 3),
  "up:prayagraj": at(25.435, 81.846, 2, { aka: ["allahabad"] }),
  "up:varanasi": at(25.317, 82.973, 3, { aka: ["banaras", "benares", "kashi"] }),
  "up:gorakhpur": at(26.76, 83.373, 2),
  "up:azamgarh": at(26.07, 83.18, 1),

  "hr:gurugram": at(28.459, 77.027, 3, { aka: ["gurgaon"] }),
  "hr:manesar": at(28.36, 76.94, 2),
  "hr:faridabad": at(28.408, 77.317, 3),
  "hr:sonipat": at(28.993, 77.016, 2, { aka: ["sonepat", "kundli", "rai"] }),
  "hr:panipat": at(29.391, 76.963, 2),
  "hr:karnal": at(29.686, 76.99, 1),
  "hr:yamunanagar": at(30.129, 77.267, 1, { aka: ["jagadhri"] }),
  "hr:ambala": at(30.378, 76.776, 1),
  "hr:hisar": at(29.149, 75.721, 1, { aka: ["hissar"] }),
  "hr:bawal": at(28.08, 76.58, 1, { aka: ["rewari", "dharuhera"] }),

  "hp:baddi": at(30.958, 76.791, 2, { aka: ["nalagarh", "barotiwala", "bbn"] }),
  "hp:paonta-sahib": at(30.437, 77.624, 1, { aka: ["paonta", "kala amb"] }),
  "hp:shimla": at(31.104, 77.173, 1, { aka: ["simla"] }),
  "hp:una": at(31.468, 76.271, 1),

  "jk:jammu": at(32.727, 74.857, 2),
  "jk:srinagar": at(34.084, 74.797, 2),
  "jk:kathua": at(32.37, 75.52, 1),

  "rj:jaipur": at(26.912, 75.787, 3),
  "rj:jodhpur": at(26.238, 73.024, 2),
  "rj:kota": at(25.18, 75.833, 2),
  "rj:udaipur": at(24.585, 73.712, 2),
  "rj:bhiwadi": at(28.21, 76.86, 2),
  "rj:neemrana": at(27.99, 76.38, 1),
  "rj:alwar": at(27.55, 76.6, 1),
  "rj:bhilwara": at(25.35, 74.63, 1),

  "gj:ahmedabad": at(23.023, 72.571, 3, { aka: ["amdavad"] }),
  "gj:sanand": at(22.99, 72.38, 1),
  "gj:surat": at(21.17, 72.831, 3),
  "gj:vadodara": at(22.307, 73.181, 3, { aka: ["baroda"] }),
  "gj:rajkot": at(22.303, 70.802, 2),
  "gj:vapi": at(20.371, 72.905, 2),
  "gj:ankleshwar": at(21.626, 73.015, 2, { aka: ["bharuch", "dahej"] }),
  "gj:morbi": at(22.81, 70.83, 1, { aka: ["morvi"] }),

  "mh:mumbai": at(19.076, 72.878, 3, { aka: ["bombay"] }),
  "mh:thane": at(19.218, 72.978, 2),
  "mh:navi-mumbai": at(19.033, 73.03, 2, { aka: ["taloja", "turbhe", "panvel"] }),
  "mh:bhiwandi": at(19.296, 73.063, 2),
  "mh:pune": at(18.52, 73.857, 3, { aka: ["poona", "pimpri", "chinchwad"] }),
  "mh:chakan": at(18.76, 73.86, 2, { aka: ["talegaon", "ranjangaon"] }),
  "mh:nashik": at(19.997, 73.79, 2, { aka: ["nasik"] }),
  "mh:sambhajinagar": at(19.876, 75.343, 2, { aka: ["aurangabad", "waluj"] }),
  "mh:nagpur": at(21.146, 79.088, 3, { aka: ["butibori"] }),
  "mh:kolhapur": at(16.705, 74.243, 1),

  "mp:indore": at(22.719, 75.857, 3),
  "mp:pithampur": at(22.61, 75.68, 2),
  "mp:dewas": at(22.97, 76.05, 1),
  "mp:bhopal": at(23.26, 77.412, 3, { aka: ["mandideep"] }),
  "mp:jabalpur": at(23.181, 79.986, 2),
  "mp:gwalior": at(26.218, 78.182, 2),

  "cg:raipur": at(21.251, 81.63, 3),
  "cg:bhilai": at(21.21, 81.38, 2, { aka: ["durg"] }),
  "cg:bilaspur": at(22.08, 82.14, 1),

  "br:patna": at(25.594, 85.137, 3),
  "br:gaya": at(24.79, 85.0, 2),
  "br:muzaffarpur": at(26.12, 85.39, 2),
  "br:bhagalpur": at(25.25, 86.98, 1),
  "br:darbhanga": at(26.15, 85.9, 1),
  "br:purnia": at(25.78, 87.47, 1, { aka: ["purnea"] }),

  "jh:ranchi": at(23.344, 85.31, 3),
  "jh:jamshedpur": at(22.805, 86.203, 2, { aka: ["tatanagar", "adityapur"] }),
  "jh:dhanbad": at(23.795, 86.43, 2),
  "jh:bokaro": at(23.67, 86.15, 1),

  "wb:kolkata": at(22.573, 88.364, 3, { aka: ["calcutta"] }),
  "wb:howrah": at(22.596, 88.264, 2),
  "wb:durgapur": at(23.52, 87.31, 2),
  "wb:asansol": at(23.68, 86.98, 2),
  "wb:siliguri": at(26.73, 88.4, 2),
  "wb:kharagpur": at(22.35, 87.23, 1),
  "wb:haldia": at(22.06, 88.07, 1),

  "od:bhubaneswar": at(20.296, 85.825, 3),
  "od:cuttack": at(20.462, 85.883, 2),
  "od:rourkela": at(22.26, 84.85, 2),
  "od:jharsuguda": at(21.86, 84.01, 1),
  "od:angul": at(20.84, 85.1, 1),
  "od:berhampur": at(19.31, 84.79, 1, { aka: ["brahmapur", "ganjam"] }),

  "as:guwahati": at(26.144, 91.736, 3, { aka: ["gauhati"] }),
  "as:dibrugarh": at(27.47, 94.91, 1),
  "tr:agartala": at(23.83, 91.28, 1),
  "mn:imphal": at(24.817, 93.937, 1),
  "ml:shillong": at(25.578, 91.893, 1),

  "tn:chennai": at(13.083, 80.271, 3, { aka: ["madras"] }),
  "tn:sriperumbudur": at(12.97, 79.95, 2, { aka: ["oragadam"] }),
  "tn:hosur": at(12.74, 77.825, 2),
  "tn:coimbatore": at(11.017, 76.956, 3, { aka: ["kovai"] }),
  "tn:tiruppur": at(11.108, 77.341, 2, { aka: ["tirupur"] }),
  "tn:madurai": at(9.925, 78.12, 2),
  "tn:trichy": at(10.79, 78.705, 2, { aka: ["trichy", "tiruchi"] }),
  "tn:salem": at(11.664, 78.146, 1),

  "kl:kochi": at(9.931, 76.267, 3, { aka: ["cochin", "ernakulam"] }),
  "kl:thiruvananthapuram": at(8.524, 76.937, 2, { aka: ["trivandrum"] }),
  "kl:kozhikode": at(11.259, 75.78, 2, { aka: ["calicut"] }),

  "dh:silvassa": at(20.27, 73.01, 1),
  "dh:daman": at(20.41, 72.83, 1),
};

export const isHomeId = (id: unknown): id is HomeId => typeof id === "string" && (Object.hasOwn(HOME_STATES, id) || Object.hasOwn(HOME_CITIES, id));
export const isStateId = (id: string): id is HomeState => Object.hasOwn(HOME_STATES, id);
export const placeRow = (id: HomeId): PlaceRow | undefined =>
  isStateId(id) ? STATE_ROWS[id] : Object.hasOwn(CITY_ROWS, id) ? CITY_ROWS[id] : undefined;
export { homeStateOf };

/** The English name: the city's or the state's. */
export const englishName = (id: HomeId) => (isStateId(id) ? HOME_STATES[id] : HOME_CITIES[id]);

/** Every place with a position: the cities and the city-states. */
const LOCATED = [...Object.entries(STATE_ROWS), ...Object.entries(CITY_ROWS)].filter(([, r]) => r.lat !== undefined) as [HomeId, Required<Pick<PlaceRow, "lat" | "lon">> & PlaceRow][];

const km = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};

/**
 * The places nearest a point, nearest first, within `withinKm`. A bigger
 * place a little further away beats a town next door (5 km per size step),
 * since an IP or a phone's position is often a few km off.
 */
export function nearestPlaces(lat: number, lon: number, { limit = 3, withinKm = 120 } = {}): { id: HomeId; km: number }[] {
  return LOCATED.map(([id, r]) => ({ id, km: km(lat, lon, r.lat, r.lon), w: r.w }))
    .filter((p) => p.km <= withinKm)
    .sort((a, b) => a.km - 5 * a.w - (b.km - 5 * b.w))
    .slice(0, limit)
    .map(({ id, km: d }) => ({ id, km: Math.round(d) }));
}

/** Lower case Latin with single spaces, as typed text and IP cities are compared. */
const latin = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z&]+/g, " ")
    .trim();

/** Search words per place: English name parts and other spellings (Latin, lower case). */
const SEARCH_WORDS: ReadonlyMap<HomeId, readonly string[]> = new Map(
  [...Object.keys(STATE_ROWS), ...Object.keys(CITY_ROWS)].map((id) => [
    id,
    [...englishName(id).split(/\s*[/(),]\s*/).map(latin).filter(Boolean), ...(placeRow(id)?.aka ?? [])],
  ]),
);

/**
 * The city an IP city names exactly (a part of its name or another
 * spelling), if any. With the IP's state, only a city in that state: a
 * Bilaspur in Himachal (no row of its own) is not Chhattisgarh's.
 */
export function placeNamed(city: string | null | undefined, state?: HomeState): HomeId | undefined {
  const t = city ? latin(city) : "";
  return t ? Object.keys(CITY_ROWS).find((id) => (!state || homeStateOf(id) === state) && SEARCH_WORDS.get(id)!.includes(t)) : undefined;
}

const fold = (s: string) => s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Places for typed text, best first: a name that starts with it, then a word
 * in a name, then another spelling, then a city whose state starts with it
 * (typing "bihar" lists Bihar, then its cities). `names` adds the page's own
 * script (./place-names.ts), so हरिद्वार or ਲੁਧਿਆਣਾ find their place too.
 */
export function searchPlaces(text: string, names: Readonly<Record<string, string>> = {}, limit = 6): HomeId[] {
  const q = latin(text);
  const qn = fold(text);
  if (!q && !qn) return [];
  const scored: [HomeId, number][] = [];
  for (const [id, words] of SEARCH_WORDS) {
    const row = placeRow(id)!;
    const name = latin(englishName(id));
    const own = names[id] ? fold(names[id]) : "";
    let score = 0;
    if (q && (name === q || words.includes(q))) score = 100;
    else if ((q && name.startsWith(q)) || (qn && own.startsWith(qn))) score = 80;
    else if (q && words.some((w) => w.startsWith(q) || w.split(" ").some((part) => part.startsWith(q)))) score = 60;
    else if (qn && own.split(/[\s/]+/).some((part) => part.startsWith(qn))) score = 60;
    else if (q.length >= 3 && words.some((w) => w.includes(q))) score = 30;
    else if (!isStateId(id)) {
      const state = homeStateOf(id)!;
      const stateName = latin(HOME_STATES[state]);
      const stateOwn = names[state] ? fold(names[state]) : "";
      if ((q.length >= 3 && (stateName.startsWith(q) || stateName.split(" ").some((p) => p.startsWith(q)))) || (qn.length >= 2 && stateOwn.startsWith(qn))) score = 10;
    }
    if (score) scored.push([id, score + row.w * 3 + (isStateId(id) ? 2 : 0)]);
  }
  return scored
    .sort((a, b) => b[1] - a[1] || englishName(a[0]).localeCompare(englishName(b[0])))
    .slice(0, limit)
    .map(([id]) => id);
}

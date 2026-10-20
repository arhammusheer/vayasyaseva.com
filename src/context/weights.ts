/**
 * How much each signal counts (docs/visitor-context.md). The only file that
 * changes when the weights are tuned: bump CONTEXT_VERSION with any change,
 * so analytics can tell the models' data apart, and rewrite the golden
 * scenarios in tests/context.spec.mjs on purpose.
 *
 * 4 (18 Oct 2026): replaces area intent model 3 (src/lib/intent) with
 * families, per-audience weights, stated picks, bands and the holdout
 * (owner decisions, 18 Oct 2026).
 * 5 (18 Oct 2026): Dehradun becomes a market (Dehradun-district places no
 * longer name the rest of Uttarakhand); the weights are unchanged.
 * 6 (20 Oct 2026): Kapurthala becomes a jobs market (Kapurthala-district
 * places, Phagwara included, no longer name Jalandhar's); weights unchanged.
 */
import type { AudienceWeights, ContextTables, RegionWeights } from "./core";

export const CONTEXT_VERSION = 6;

/**
 * Job seekers: where they live decides, so the IP (roughly where the phone
 * is) and the form's area answer count most among the guesses; browsing
 * counts little (people tap around).
 */
const JOBS: RegionWeights = {
  pickOld: 12,
  answerOld: 12,
  site: 0,
  param: 8,
  utm: 6,
  landing: 6,
  agree: 2,
  page: 5,
  view: 1,
  viewCap: 3,
  wageView: 1,
  wageViewCap: 2,
  ipCity: 5,
  ipState: 3,
  deviceLang: 2,
  langPick: 3,
};

/**
 * Clients: where their site is decides. The crew form's site place is the
 * strongest evidence (owner decision, 18 Oct 2026), browsing estates and
 * state wage pages counts, and the IP (their head office) barely does.
 */
const BUSINESS: RegionWeights = {
  pickOld: 10,
  answerOld: 0,
  site: 14,
  param: 8,
  utm: 6,
  landing: 6,
  agree: 2,
  page: 5,
  view: 2,
  viewCap: 6,
  wageView: 3,
  wageViewCap: 6,
  ipCity: 1,
  ipState: 1,
  deviceLang: 0,
  langPick: 0,
};

const AUDIENCE: AudienceWeights = {
  page: 5,
  earlierPage: 2,
  earlierPageCap: 6,
  arrival: 8,
  regionalLanguage: 4,
  deviceLanguage: 1,
  pickOld: 6,
  margin: 4,
};

export const WEIGHTS = { jobs: JOBS, business: BUSINESS, audience: AUDIENCE } as const;

/** How far the decision may act (docs/visitor-context.md, "Bands"). */
export const BANDS: ContextTables["bands"] = {
  /** Two markets show when the leader has less than twice the runner-up's points. */
  clearWin: 2,
  confidentShare: 0.67,
  confidentPoints: 8,
  leaningPoints: 3,
};

/** How long a pick counts, in days. */
export const PICK_DAYS: ContextTables["days"] = {
  link: 90,
  // Where someone lives is a standing fact, but people move (owner decision, 18 Oct 2026).
  answer: 30,
  site: 90,
  audience: 90,
};

/** Share of sessions that see the neutral site whatever was inferred (owner decision, 18 Oct 2026). */
export const HOLDOUT_SHARE = 0.1;

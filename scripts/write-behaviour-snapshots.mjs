// Rewrites the behaviour snapshots the refactor tests pin
// (tests/markets.spec.mjs). Only for a change that means to move a decision;
// review the fixture diff as the change itself.
import { writeFileSync } from "node:fs";
import { relative } from "node:path";
import { root } from "./lib/register-ts.mjs";
import { MARKET_BEHAVIOUR_PATH, marketBehaviour } from "./lib/market-behaviour.mjs";

writeFileSync(MARKET_BEHAVIOUR_PATH, `${JSON.stringify(await marketBehaviour(), null, 2)}\n`);
console.log(`Wrote ${relative(root, MARKET_BEHAVIOUR_PATH)}`);

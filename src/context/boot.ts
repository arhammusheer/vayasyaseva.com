/**
 * The pre-paint boot script (docs/visitor-context.md, "Before paint"),
 * inlined in every page's <head> by the root layout. It reads the page
 * view's signals (collect.ts), resolves the context (core.ts) and sets the
 * <html data-ctx-*> attributes (attrs.ts) before the body paints, so the
 * CSS in css.ts shows the decided surfaces on the first frame. It also
 * records the page view in sessionStorage and leaves the result on
 * window.__vsctx for the runtime (runtime.ts), which takes over after
 * hydration. Any failure leaves the neutral page.
 *
 * The three functions are inlined with Function.prototype.toString, so
 * they must stay self-contained (tests/context.spec.mjs runs this script).
 */
import { contextAttributes } from "./attrs";
import { collectSignals } from "./collect";
import { resolveContext } from "./core";
import { contextCss } from "./css";
import { LOCALE_CODES, collectData, contextTables } from "./tables";
import { MARKET_IDS } from "@/markets/index";

import { LEGACY_CHOICE_KEY, SESSION_KEY } from "./keys";

let script: string | undefined;

export function bootScript(): string {
  if (script) return script;
  const data = JSON.stringify({ t: contextTables(), d: collectData(), c: LOCALE_CODES }).replace(/</g, "\\u003c");
  script = `(function(){try{var R=${resolveContext.toString()},C=${collectSignals.toString()},A=${contextAttributes.toString()},D=${data};
var ss=null,lc=null;try{ss=JSON.parse(sessionStorage.getItem(${JSON.stringify(SESSION_KEY)})||"null")}catch(e){}
try{lc=JSON.parse(localStorage.getItem(${JSON.stringify(LEGACY_CHOICE_KEY)})||"null")}catch(e){}
var o=C({now:Date.now(),pathname:location.pathname,search:location.search,cookie:document.cookie,session:ss,legacyChoice:lc,languages:navigator.languages||[navigator.language||""],random:Math.random()},D.d);
try{sessionStorage.setItem(${JSON.stringify(SESSION_KEY)},JSON.stringify(o.session))}catch(e){}
var x=R(o.signals,D.t),a=A(x,{locale:o.locale,market:o.signals.page.market},D.c),h=document.documentElement;for(var k in a)h.setAttribute(k,a[k]);
window.__vsctx={pathname:location.pathname,search:location.search,ctx:x,signals:o.signals}}catch(e){}})();`;
  return script;
}

let css: string | undefined;
export const bootCss = () => (css ??= contextCss(MARKET_IDS));

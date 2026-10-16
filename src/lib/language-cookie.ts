/**
 * The cookie that remembers a language picked on the language picker, so
 * the picker lists it first next time (src/lib/language-rank.ts). It holds
 * only the locale tag and never makes a page switch language by itself.
 */
export const LANGUAGE_COOKIE = "vspl_lang";
/** One year, in seconds. */
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

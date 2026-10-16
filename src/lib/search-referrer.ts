/**
 * Arrived from a web search, by the referrer: a search engine's site
 * (Google, Bing and the like) or the Google app on Android, which sends
 * android-app://com.google.android.googlequicksearchbox/.
 */
const SEARCH_REFERRER =
  /^(https?:\/\/([^/]+\.)?(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu)\.[^/]+|android-app:\/\/com\.google\.android\.googlequicksearchbox(\/|$))/i;

export function fromSearchReferrer(referrer: string | null | undefined): boolean {
  return SEARCH_REFERRER.test(referrer ?? "");
}

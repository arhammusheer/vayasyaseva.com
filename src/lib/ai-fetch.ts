/**
 * Which AI crawler or assistant fetched a page, from its user agent. The
 * proxy counts these in Umami (server events website, event `ai_fetch`), so
 * we can see which engines read which pages, and whether they read
 * robots.txt, llms.txt and the sitemap, without server logs (Vercel keeps
 * them for a day). Searcher research, 1 Nov 2026.
 *
 * `kind`: "training" crawls for model training, "search" builds an AI search
 * index, "user" fetches a page because a person asked an assistant right now
 * (the closest thing to a visit), "agent" acts in a browser for a person.
 * Order matters: the first match wins, so specific names come before
 * general ones.
 */
export type AiFetchKind = "training" | "search" | "user" | "agent";

const AGENTS: readonly [pattern: RegExp, bot: string, operator: string, kind: AiFetchKind][] = [
  [/ChatGPT-User/i, "ChatGPT-User", "OpenAI", "user"],
  [/ChatGPT Agent|ChatGPT-Agent/i, "ChatGPT Agent", "OpenAI", "agent"],
  [/OAI-SearchBot/i, "OAI-SearchBot", "OpenAI", "search"],
  [/GPTBot/i, "GPTBot", "OpenAI", "training"],
  [/Claude-User/i, "Claude-User", "Anthropic", "user"],
  [/Claude-SearchBot/i, "Claude-SearchBot", "Anthropic", "search"],
  [/ClaudeBot|anthropic-ai/i, "ClaudeBot", "Anthropic", "training"],
  [/Perplexity-User/i, "Perplexity-User", "Perplexity", "user"],
  [/PerplexityBot/i, "PerplexityBot", "Perplexity", "search"],
  [/Google-Agent/i, "Google-Agent", "Google", "agent"],
  [/Gemini-Deep-Research|Google-NotebookLM/i, "Gemini (user)", "Google", "user"],
  [/meta-externalfetcher/i, "Meta-ExternalFetcher", "Meta", "user"],
  [/meta-externalagent/i, "Meta-ExternalAgent", "Meta", "training"],
  [/MistralAI-User/i, "MistralAI-User", "Mistral", "user"],
  [/DuckAssistBot/i, "DuckAssistBot", "DuckDuckGo", "search"],
  [/Applebot/i, "Applebot", "Apple", "search"],
  [/Amazonbot/i, "Amazonbot", "Amazon", "search"],
  [/YouBot/i, "YouBot", "You.com", "search"],
  [/Bytespider/i, "Bytespider", "ByteDance", "training"],
  [/CCBot/i, "CCBot", "Common Crawl", "training"],
  [/cohere-ai|cohere-training/i, "cohere-ai", "Cohere", "training"],
];

export type AiFetch = { bot: string; operator: string; kind: AiFetchKind };

export function aiFetchOf(userAgent: string | null): AiFetch | null {
  if (!userAgent) return null;
  for (const [pattern, bot, operator, kind] of AGENTS) {
    if (pattern.test(userAgent)) return { bot, operator, kind };
  }
  return null;
}

/** The machine-read files the proxy also sees, beyond pages. */
export const AI_READ_FILES = ["/robots.txt", "/llms.txt", "/llms-full.txt", "/sitemap.xml", "/openapi/v1.json", "/ai-access-policy.txt"] as const;

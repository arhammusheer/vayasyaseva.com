/**
 * Zod schemas for the registry, used by content:check (scripts/content-check.mjs).
 * Not imported by pages or the proxy. Objects are strict: an unknown key
 * fails, so nothing unplanned (or internal) slips into a public entry.
 */
import { z } from "zod/v4";
import { AUDIENCES, CLUSTER_IDS, LOCALE_TAGS, PAGE_STATUSES, WAGE_STATE_SLUGS, type LocaleTag } from "./identifiers";
import { PAGE_KINDS } from "./pages";

const isoDate = z.iso.date();
const neutralPath = z.string().regex(/^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/, "lower-case neutral path without a locale or trailing slash");

const perLocale = <T extends z.ZodType>(schema: T) =>
  Object.fromEntries(LOCALE_TAGS.map((l) => [l, schema.optional()])) as Record<LocaleTag, z.ZodOptional<T>>;

const localeStatuses = z
  .strictObject(perLocale(z.enum(PAGE_STATUSES)))
  .refine((v) => Object.values(v).some(Boolean), "a page needs at least one language");

export const pageEntrySchema = z
  .strictObject({
    path: neutralPath,
    kind: z.enum(PAGE_KINDS),
    audience: z.enum(AUDIENCES),
    locales: localeStatuses,
    neutral: z.union([z.enum(LOCALE_TAGS), z.literal("prompt")]).optional(),
    parent: neutralPath.optional(),
    cluster: z.enum(CLUSTER_IDS).optional(),
    updated: isoDate,
    changeFrequency: z.enum(["monthly", "yearly"]),
    priority: z.number().min(0).max(1),
    retiredTo: neutralPath.optional(),
  })
  .refine((p) => !p.neutral || p.neutral === "prompt" || p.locales[p.neutral], "neutral locale is not one of the page's languages")
  .refine(
    (p) => !p.retiredTo || Object.values(p.locales).every((s) => s === "retired"),
    "retiredTo needs every language retired (a partly retired page 404s in the retired languages)",
  );

const publicClaimSchema = z.strictObject({
  text: z.string().min(1),
  tier: z.enum(["aspirational", "directional", "measured", "contractual"]),
  signedOffOn: isoDate,
  expires: isoDate,
});

const publicRegistrationSchema = z
  .strictObject({
    name: z.strictObject(perLocale(z.string().min(1))).refine((n) => Boolean(n["en-IN"]), "English name is required"),
    number: z.string().min(1).optional(),
    issuedBy: z.strictObject(perLocale(z.string().min(1))).refine((n) => Boolean(n["en-IN"]), "English issuer is required"),
    signedOffOn: isoDate,
    expires: isoDate,
  })
  .refine((r) => r.expires > r.signedOffOn, "expires must be after signedOffOn");

export const clusterSchema = z.strictObject({
  id: z.enum(CLUSTER_IDS),
  publishable: z.literal(true),
  name: z.strictObject(perLocale(z.string().min(1))),
  states: z.array(z.enum(WAGE_STATE_SLUGS)).min(1),
  quickSwitch: z.array(z.enum(LOCALE_TAGS)).min(1),
  buyerHub: neutralPath,
  claims: z.array(publicClaimSchema),
  registrations: z.array(publicRegistrationSchema),
});

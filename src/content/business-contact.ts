/**
 * The business phone line. It is for businesses hiring workers or services,
 * so it appears on business pages only: never on a jobs page, a reference
 * page (wages, guides) or anything a job seeker is likely to land on.
 *
 * Jobs and reference code cannot import this file (ESLint
 * no-restricted-imports in eslint.config.mjs), and the shared header and
 * footer receive the phone as a prop from the business layout. After a
 * build, `pnpm phone:check` (also run by `pnpm seo:check`) fails if the
 * number reaches a jobs page, llms.txt or the jobs routes in the OpenAPI spec.
 *
 * Keep this file free of imports: scripts/check-jobs-phone.mjs reads it
 * directly with Node.
 */
export const businessPhone = {
  /** As shown on the page. */
  display: "+91 72920 14101",
  /** For tel: links and JSON-LD. */
  e164: "+917292014101",
  /** The ten digits, for checks that look for the number in any spacing. */
  digits: "7292014101",
} as const;

export const businessPhoneHref = `tel:${businessPhone.e164}`;

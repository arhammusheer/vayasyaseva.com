/**
 * The WhatsApp Business number, +91 78958 50598 (Fast2SMS, co-existence with
 * the Business app). Application acknowledgements go out from it, and the team
 * answers replies there. Messages only, and the site never shows it, as digits
 * or as a link (scripts/check-jobs-phone.mjs, which imports this file without
 * the site's aliases): people reach it by replying to their acknowledgement.
 */
export const WHATSAPP_NUMBER = "917895850598";

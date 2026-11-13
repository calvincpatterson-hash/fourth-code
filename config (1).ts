/**
 * Platform configuration — single source of truth for business constants.
 *
 * MONETIZATION MODEL (owner decision, Nov 11 2026):
 * Fourth Code takes a PERCENTAGE CUT OF EACH BOOKING. There are no
 * monthly Host fees and no Athlete account fees. The working rate is 12%.
 *
 * This is the ONLY place the fee rate lives. Booking code must import
 * PLATFORM_FEE_PERCENT from here — never hardcode the rate elsewhere.
 * It can be overridden with the PLATFORM_FEE_PERCENT env var.
 */
export const PLATFORM_FEE_PERCENT = (() => {
  const raw = process.env.PLATFORM_FEE_PERCENT;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 12;
})();

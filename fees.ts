import { PLATFORM_FEE_PERCENT } from "./config";

export interface BookingMoneySplit {
  total_cents: number;
  platform_fee_cents: number;
  host_payout_cents: number;
}

/**
 * Splits a booking total into the platform fee and the Host payout.
 * The fee is rounded to the nearest cent and the Host keeps the rest, so
 * fee + payout always equals the total exactly.
 */
export function splitBookingTotal(totalCents: number): BookingMoneySplit {
  const platform_fee_cents = Math.round(
    (totalCents * PLATFORM_FEE_PERCENT) / 100,
  );
  return {
    total_cents: totalCents,
    platform_fee_cents,
    host_payout_cents: totalCents - platform_fee_cents,
  };
}

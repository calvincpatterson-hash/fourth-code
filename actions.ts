"use server";

import { splitBookingTotal } from "@/lib/fees";
import { totalCentsForRange } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Athlete requests a bookable slot.
 *
 * Creates a `bookings` row in "requested" status with the full money
 * split stored on the row: total_cents (what the Athlete will pay),
 * platform_fee_cents (Fourth Code's percentage cut — see
 * PLATFORM_FEE_PERCENT in lib/config.ts) and host_payout_cents.
 *
 * Milestone 1 simplification: we attempt to flip the slot's is_booked
 * flag, but row level security only lets the gym's Host update slots, so
 * for Athlete requests that update is expected to be denied. Slot-holding
 * must move to a database function / service-role step before real money
 * flows (see README → "Known Milestone 1 simplifications"). The Host's
 * approve/decline decision is the real gate in M1.
 */
export async function requestBooking(formData: FormData) {
  const slotId = String(formData.get("slot_id") ?? "");
  const gymId = String(formData.get("gym_id") ?? "");
  if (!slotId || !gymId || !isSupabaseConfigured) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/gyms/${gymId}`);
  }

  const { data: slot } = await supabase
    .from("bookable_slots")
    .select("*")
    .eq("id", slotId)
    .eq("is_booked", false)
    .single();
  if (!slot) redirect(`/gyms/${gymId}`);

  const { data: gym } = await supabase
    .from("gyms")
    .select("price_per_hour_cents")
    .eq("id", gymId)
    .single();
  if (!gym) redirect(`/gyms/${gymId}`);

  const total = totalCentsForRange(
    gym.price_per_hour_cents as number,
    slot.starts_at as string,
    slot.ends_at as string,
  );
  const split = splitBookingTotal(total);

  const { error } = await supabase.from("bookings").insert({
    gym_id: gymId,
    athlete_id: user.id,
    slot_id: slot.id,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    status: "requested",
    total_cents: split.total_cents,
    platform_fee_cents: split.platform_fee_cents,
    host_payout_cents: split.host_payout_cents,
  });
  if (error) redirect(`/gyms/${gymId}`);

  // Best-effort slot hold (see note above; may be denied by RLS in M1).
  await supabase
    .from("bookable_slots")
    .update({ is_booked: true })
    .eq("id", slot.id);

  redirect(`/gyms/${gymId}?booked=1`);
}

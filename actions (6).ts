"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/host");
  return { supabase, user };
}

/** Create the Host's gym page (a gyms row owned by the signed-in Host). */
export async function createGym(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const { supabase, user } = await requireUser();

  const equipment = String(formData.get("equipment") ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const priceDollars = Number(formData.get("price_dollars") ?? 0);

  const { data, error } = await supabase
    .from("gyms")
    .insert({
      host_id: user.id,
      name: String(formData.get("name") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      neighborhood: String(formData.get("neighborhood") ?? "").trim() || null,
      equipment,
      price_per_hour_cents: Math.max(0, Math.round(priceDollars * 100)),
      capacity: Math.max(1, Number(formData.get("capacity") ?? 1)),
      is_published: formData.get("is_published") === "on",
    })
    .select("id")
    .single();

  if (error || !data) redirect("/host?error=gym");
  revalidatePath("/");
  redirect(`/gyms/${data.id}`);
}

/** Host adds a bookable slot to one of their gyms. */
export async function addSlot(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const { supabase, user } = await requireUser();

  const gymId = String(formData.get("gym_id") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  if (!gymId || !startsAt || !endsAt) redirect("/host?error=slot");

  // Verify the gym belongs to this Host before writing (RLS also enforces).
  const { data: gym } = await supabase
    .from("gyms")
    .select("id")
    .eq("id", gymId)
    .eq("host_id", user.id)
    .single();
  if (!gym) redirect("/host?error=slot");

  const { error } = await supabase.from("bookable_slots").insert({
    gym_id: gymId,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
  });
  if (error) redirect("/host?error=slot");

  revalidatePath(`/gyms/${gymId}`);
  redirect("/host?slot=added");
}

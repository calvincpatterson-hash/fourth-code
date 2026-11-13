import { demoGyms, demoSlotsFor } from "./demo-data";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import type {
  BookableSlot,
  BookingWithGym,
  Gym,
  GymPhoto,
  GymWithDetails,
  Profile,
} from "./types";

/**
 * Read-side data access. Every function falls back to demo data when
 * Supabase is not configured (or the query errors), so pages always
 * render. Writes (create gym, request booking) live in server actions.
 */

function matchesQuery(gym: GymWithDetails, q: string): boolean {
  const haystack = [
    gym.name,
    gym.city,
    gym.neighborhood ?? "",
    ...gym.equipment,
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export async function fetchPublishedGyms(
  query = "",
): Promise<{ gyms: GymWithDetails[]; isDemo: boolean }> {
  if (!isSupabaseConfigured) {
    return {
      gyms: demoGyms.filter((g) => matchesQuery(g, query)),
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gyms")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error || !data) throw error ?? new Error("No gyms returned");

    const gyms = data as Gym[];
    const gymIds = gyms.map((g) => g.id);
    const hostIds = [...new Set(gyms.map((g) => g.host_id))];

    const [photosRes, hostsRes] = await Promise.all([
      supabase
        .from("gym_photos")
        .select("*")
        .in("gym_id", gymIds.length ? gymIds : [""])
        .order("sort_order", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", hostIds.length ? hostIds : [""]),
    ]);

    const photos = (photosRes.data ?? []) as GymPhoto[];
    const hostNames = new Map(
      ((hostsRes.data ?? []) as Pick<Profile, "id" | "display_name">[]).map(
        (p) => [p.id, p.display_name],
      ),
    );

    const withDetails: GymWithDetails[] = gyms.map((gym) => ({
      ...gym,
      cover_photo_url:
        photos.find((p) => p.gym_id === gym.id)?.url ?? null,
      host_name: hostNames.get(gym.host_id) ?? null,
    }));

    return { gyms: withDetails.filter((g) => matchesQuery(g, query)), isDemo: false };
  } catch {
    return {
      gyms: demoGyms.filter((g) => matchesQuery(g, query)),
      isDemo: true,
    };
  }
}

export interface GymPageData {
  gym: GymWithDetails;
  photos: GymPhoto[];
  slots: BookableSlot[];
  isDemo: boolean;
}

export async function fetchGymPage(id: string): Promise<GymPageData | null> {
  const demo = demoGyms.find((g) => g.id === id);
  if (!isSupabaseConfigured) {
    return demo
      ? { gym: demo, photos: [], slots: demoSlotsFor(demo.id), isDemo: true }
      : null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gyms")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return demo ? { gym: demo, photos: [], slots: demoSlotsFor(demo.id), isDemo: true } : null;

    const gym = data as Gym;
    const [photosRes, hostRes, slotsRes] = await Promise.all([
      supabase
        .from("gym_photos")
        .select("*")
        .eq("gym_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", gym.host_id)
        .single(),
      supabase
        .from("bookable_slots")
        .select("*")
        .eq("gym_id", id)
        .eq("is_booked", false)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(30),
    ]);

    const photos = (photosRes.data ?? []) as GymPhoto[];
    return {
      gym: {
        ...gym,
        cover_photo_url: photos[0]?.url ?? null,
        host_name:
          (hostRes.data as Pick<Profile, "display_name"> | null)
            ?.display_name ?? null,
      },
      photos,
      slots: (slotsRes.data ?? []) as BookableSlot[],
      isDemo: false,
    };
  } catch {
    return demo
      ? { gym: demo, photos: [], slots: demoSlotsFor(demo.id), isDemo: true }
      : null;
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return (data as Profile) ?? null;
  } catch {
    return null;
  }
}

export async function fetchHostGyms(hostId: string): Promise<Gym[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("gyms")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    return (data as Gym[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchAthleteBookings(
  athleteId: string,
): Promise<BookingWithGym[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*, gyms(name, city)")
      .eq("athlete_id", athleteId)
      .order("starts_at", { ascending: true });
    if (!data) return [];
    return (data as Record<string, unknown>[]).map((row) => {
      const gym = row.gyms as { name: string; city: string } | null;
      const { gyms: _gyms, ...booking } = row;
      return {
        ...(booking as unknown as BookingWithGym),
        gym_name: gym?.name ?? null,
        gym_city: gym?.city ?? null,
      };
    });
  } catch {
    return [];
  }
}

import type { BookableSlot, GymWithDetails } from "./types";

/**
 * Demo listings shown when Supabase env vars are not configured yet, so
 * the app renders meaningfully out of the box. Replaced by live data as
 * soon as NEXT_PUBLIC_SUPABASE_* are set (see lib/data.ts).
 */
export const demoGyms: GymWithDetails[] = [
  {
    id: "demo-iron-garage",
    host_id: "demo-host-1",
    name: "The Iron Garage",
    bio: "Deadlift platform, calibrated plates, and a monolift in a quiet suburban garage. Chalk friendly, music up to you.",
    city: "Lee's Summit",
    neighborhood: "Lakewood",
    equipment: ["Power rack", "Deadlift platform", "Calibrated plates", "Air bike"],
    price_per_hour_cents: 1500,
    capacity: 3,
    is_published: true,
    created_at: "2026-11-01T00:00:00.000Z",
    cover_photo_url: null,
    host_name: "Marcus T.",
  },
  {
    id: "demo-basement-strength",
    host_id: "demo-host-2",
    name: "Basement Strength Co.",
    bio: "Finished basement gym with a full dumbbell run, cable station, and a rower. Perfect for solo sessions and PT work.",
    city: "Kansas City",
    neighborhood: "Waldo",
    equipment: ["Dumbbells 5–100", "Cable station", "Rower", "Bench"],
    price_per_hour_cents: 1200,
    capacity: 2,
    is_published: true,
    created_at: "2026-11-02T00:00:00.000Z",
    cover_photo_url: null,
    host_name: "Dana R.",
  },
  {
    id: "demo-loft-lab",
    host_id: "demo-host-3",
    name: "The Loft Lab",
    bio: "Bright loft-style training space with turf, sled, SkiErg, and a curved treadmill. Conditioning heaven.",
    city: "Overland Park",
    neighborhood: "Downtown OP",
    equipment: ["Turf + sled", "SkiErg", "Curved treadmill", "Kettlebells"],
    price_per_hour_cents: 2000,
    capacity: 4,
    is_published: true,
    created_at: "2026-11-03T00:00:00.000Z",
    cover_photo_url: null,
    host_name: "Priya K.",
  },
];

/** Generates a few upcoming one-hour slots for a demo gym. */
export function demoSlotsFor(gymId: string): BookableSlot[] {
  const slots: BookableSlot[] = [];
  const now = new Date();
  for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
    for (const hour of [7, 12, 17]) {
      const start = new Date(now);
      start.setDate(start.getDate() + dayOffset);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(hour + 1);
      slots.push({
        id: `demo-slot-${gymId}-${dayOffset}-${hour}`,
        gym_id: gymId,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        is_booked: false,
      });
    }
  }
  return slots;
}

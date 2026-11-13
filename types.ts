/** Shared types for the Fourth Code marketplace (Milestone 1). */

export type UserRole = "host" | "athlete";

export type BookingStatus =
  | "requested"
  | "approved"
  | "declined"
  | "cancelled"
  | "completed";

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  city: string | null;
  created_at: string;
}

export interface Gym {
  id: string;
  host_id: string;
  name: string;
  bio: string;
  city: string;
  neighborhood: string | null;
  equipment: string[];
  price_per_hour_cents: number;
  capacity: number;
  is_published: boolean;
  created_at: string;
}

export interface GymPhoto {
  id: string;
  gym_id: string;
  url: string;
  sort_order: number;
}

/** A gym row plus the bits the UI joins on (cover photo, host name). */
export interface GymWithDetails extends Gym {
  cover_photo_url: string | null;
  host_name: string | null;
}

export interface BookableSlot {
  id: string;
  gym_id: string;
  starts_at: string;
  ends_at: string;
  is_booked: boolean;
}

export interface Booking {
  id: string;
  gym_id: string;
  athlete_id: string;
  slot_id: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  /** What the Athlete pays, in cents. */
  total_cents: number;
  /** Fourth Code's percentage cut of the booking, in cents. */
  platform_fee_cents: number;
  /** What the Host receives (total - platform fee), in cents. */
  host_payout_cents: number;
  created_at: string;
}

/** A booking joined with its gym's name for list views. */
export interface BookingWithGym extends Booking {
  gym_name: string | null;
  gym_city: string | null;
}

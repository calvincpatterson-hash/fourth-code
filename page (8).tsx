import { fetchAthleteBookings } from "@/lib/data";
import { formatMoney, formatSlotRange } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

export default async function BookingsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="container">
        <div className="card form-card">
          <p className="kicker">My bookings</p>
          <h2>Connect Supabase to book</h2>
          <p className="muted">
            Bookings need live accounts. See the README for setup, then
            browse the demo gyms on the home page.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container">
        <div className="card form-card">
          <p className="kicker">My bookings</p>
          <h2>Log in to see your bookings</h2>
          <p style={{ marginTop: 14 }}>
            <Link href="/login?next=/bookings" className="btn btn-gold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const bookings = await fetchAthleteBookings(user.id);

  return (
    <div className="container">
      <p className="kicker">Athlete bookings</p>
      <h1>
        My <span className="gold">bookings</span>
      </h1>

      {bookings.length === 0 ? (
        <p className="muted" style={{ marginTop: 14 }}>
          No bookings yet. <Link href="/">Browse gyms →</Link>
        </p>
      ) : (
        <div className="list" style={{ maxWidth: 760 }}>
          {bookings.map((booking) => (
            <div key={booking.id} className="card list-row">
              <span>
                <strong>
                  {booking.gym_name ?? "Gym"}
                  {booking.gym_city ? ` — ${booking.gym_city}` : ""}
                </strong>
                <br />
                <span className="muted">
                  {formatSlotRange(booking.starts_at, booking.ends_at)}
                </span>
                <br />
                <span className="muted">
                  Total {formatMoney(booking.total_cents)}
                </span>
              </span>
              <span
                className={`badge ${booking.status === "approved" ? "" : "badge-outline"}`}
              >
                {STATUS_LABEL[booking.status] ?? booking.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { fetchGymPage } from "@/lib/data";
import { formatMoney, formatPricePerHour, formatSlotRange, totalCentsForRange } from "@/lib/format";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requestBooking } from "./actions";

export default async function GymDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string }>;
}) {
  const { id } = await params;
  const { booked } = await searchParams;
  const data = await fetchGymPage(id);
  if (!data) notFound();

  const { gym, photos, slots, isDemo } = data;

  return (
    <div className="container">
      {photos.length > 0 ? (
        <div className="gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0].url} alt={gym.name} />
          <div className="side">
            {photos.slice(1, 3).map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.id} src={photo.url} alt={gym.name} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="gym-card-photo gym-card-placeholder"
          style={{ borderRadius: 16, marginBottom: 24 }}
        >
          <span>{gym.name.charAt(0)}</span>
        </div>
      )}

      <div className="two-col">
        <div>
          <p className="kicker">
            {gym.city}
            {gym.neighborhood ? ` · ${gym.neighborhood}` : ""}
          </p>
          <h1 style={{ fontSize: "clamp(30px, 4.5vw, 44px)" }}>{gym.name}</h1>
          <p className="muted" style={{ marginBottom: 16 }}>
            {gym.host_name ? `Hosted by ${gym.host_name} · ` : ""}
            Up to {gym.capacity} Athlete{gym.capacity === 1 ? "" : "s"} per
            session
          </p>
          <p style={{ maxWidth: 620, marginBottom: 24 }}>{gym.bio}</p>

          <h2 style={{ fontSize: 22 }}>Equipment</h2>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            {gym.equipment.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="price" style={{ fontSize: 24 }}>
            {formatPricePerHour(gym.price_per_hour_cents)}
          </p>
          <p className="muted">Pick an open slot to request it.</p>

          {booked && (
            <p className="notice-box" style={{ marginTop: 14 }}>
              Request sent — your Host will confirm. Track it under{" "}
              <Link href="/bookings">My Bookings</Link>.
            </p>
          )}
          {isDemo && (
            <p className="muted" style={{ marginTop: 14 }}>
              Demo listing — booking activates once Supabase is connected.
            </p>
          )}

          <div className="slot-list">
            {slots.length === 0 && (
              <p className="muted">No open slots right now. Check back soon.</p>
            )}
            {slots.map((slot) => {
              const total = totalCentsForRange(
                gym.price_per_hour_cents,
                slot.starts_at,
                slot.ends_at,
              );
              return (
                <form
                  key={slot.id}
                  action={requestBooking}
                  className="slot-row"
                >
                  <input type="hidden" name="slot_id" value={slot.id} />
                  <input type="hidden" name="gym_id" value={gym.id} />
                  <span>
                    {formatSlotRange(slot.starts_at, slot.ends_at)}
                    <br />
                    <span className="muted">{formatMoney(total)} total</span>
                  </span>
                  <button
                    type="submit"
                    className="btn btn-gold btn-small"
                    disabled={isDemo}
                  >
                    Request
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

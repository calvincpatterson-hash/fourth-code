import Link from "next/link";
import { formatPricePerHour } from "@/lib/format";
import type { GymWithDetails } from "@/lib/types";

export function GymCard({ gym }: { gym: GymWithDetails }) {
  return (
    <Link href={`/gyms/${gym.id}`} className="card gym-card">
      {gym.cover_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gym.cover_photo_url}
          alt={gym.name}
          className="gym-card-photo"
        />
      ) : (
        <div className="gym-card-photo gym-card-placeholder">
          <span>{gym.name.charAt(0)}</span>
        </div>
      )}
      <div className="gym-card-body">
        <div className="gym-card-top">
          <h3>{gym.name}</h3>
          <span className="price">{formatPricePerHour(gym.price_per_hour_cents)}</span>
        </div>
        <p className="muted">
          {gym.city}
          {gym.neighborhood ? ` · ${gym.neighborhood}` : ""}
          {gym.host_name ? ` · Hosted by ${gym.host_name}` : ""}
        </p>
        <div className="chip-row">
          {gym.equipment.slice(0, 3).map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
          {gym.equipment.length > 3 && (
            <span className="chip">+{gym.equipment.length - 3} more</span>
          )}
        </div>
      </div>
    </Link>
  );
}

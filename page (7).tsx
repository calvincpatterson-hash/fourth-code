import { fetchHostGyms, fetchProfile } from "@/lib/data";
import { formatPricePerHour } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { addSlot, createGym } from "./actions";

export default async function HostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; slot?: string }>;
}) {
  const { error, slot } = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <div className="container">
        <div className="card form-card">
          <p className="kicker">Host dashboard</p>
          <h2>Connect Supabase to host</h2>
          <p className="muted">
            The Host area needs live accounts. Copy <code>.env.example</code>{" "}
            to <code>.env.local</code> with your Supabase keys and run the SQL
            migration (see README), then sign up as a Host.
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
          <p className="kicker">Host dashboard</p>
          <h2>List your gym</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            Have a garage gym or home gym? Create its page, set your price
            and hours, and get booked by local Athletes. You need a Host
            account first.
          </p>
          <p>
            <Link href="/signup" className="btn btn-gold">
              Sign up as a Host
            </Link>{" "}
            <Link href="/login?next=/host" className="btn btn-outline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const profile = await fetchProfile(user.id);
  const myGyms = await fetchHostGyms(user.id);

  return (
    <div className="container">
      <p className="kicker">Host dashboard</p>
      <h1>
        Your gym <span className="gold">pages</span>
      </h1>
      <p className="lede">
        Each gym gets its own page — your name, your photos, your price —
        like Airbnb, for private gyms.
      </p>

      {profile && profile.role !== "host" && (
        <p className="notice-box" style={{ marginTop: 18, maxWidth: 640 }}>
          You&rsquo;re signed in as an Athlete. You can still create a gym
          page below, but finish your Host profile before going live so
          payouts can find you (payments arrive in a later milestone).
        </p>
      )}
      {error && (
        <p className="error-box" style={{ marginTop: 18, maxWidth: 640 }}>
          Something didn&rsquo;t save. Check the form and try again.
        </p>
      )}
      {slot === "added" && (
        <p className="notice-box" style={{ marginTop: 18, maxWidth: 640 }}>
          Slot added — Athletes can now request it on your gym page.
        </p>
      )}

      {myGyms.length > 0 && (
        <div className="list" style={{ maxWidth: 760 }}>
          {myGyms.map((gym) => (
            <div key={gym.id} className="card list-row">
              <span>
                <strong>{gym.name}</strong>
                <br />
                <span className="muted">
                  {gym.city} · {formatPricePerHour(gym.price_per_hour_cents)}
                </span>
              </span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span
                  className={`badge ${gym.is_published ? "" : "badge-outline"}`}
                >
                  {gym.is_published ? "Published" : "Draft"}
                </span>
                <Link href={`/gyms/${gym.id}`}>View page →</Link>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="two-col" style={{ marginTop: 36 }}>
        <div className="card">
          <h2 style={{ fontSize: 22 }}>Create your gym page</h2>
          <form className="stack" action={createGym}>
            <div>
              <label htmlFor="name">Gym name</label>
              <input id="name" name="name" type="text" required placeholder="e.g. The Iron Garage" />
            </div>
            <div>
              <label htmlFor="bio">Bio</label>
              <textarea id="bio" name="bio" rows={4} placeholder="What makes your space worth booking?" />
            </div>
            <div>
              <label htmlFor="city">City</label>
              <input id="city" name="city" type="text" required placeholder="e.g. Lee's Summit" />
            </div>
            <div>
              <label htmlFor="neighborhood">Neighborhood (optional)</label>
              <input id="neighborhood" name="neighborhood" type="text" />
            </div>
            <div>
              <label htmlFor="equipment">Equipment (comma-separated)</label>
              <input
                id="equipment"
                name="equipment"
                type="text"
                placeholder="Power rack, Deadlift platform, Air bike"
              />
            </div>
            <div>
              <label htmlFor="price_dollars">Price per hour (USD)</label>
              <input
                id="price_dollars"
                name="price_dollars"
                type="number"
                min={0}
                step="0.50"
                required
                placeholder="15"
              />
            </div>
            <div>
              <label htmlFor="capacity">Capacity (Athletes per session)</label>
              <input id="capacity" name="capacity" type="number" min={1} defaultValue={2} />
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
              <input
                type="checkbox"
                name="is_published"
                defaultChecked
                style={{ width: "auto" }}
              />
              Publish immediately
            </label>
            <button type="submit" className="btn btn-gold">
              Create gym page
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 22 }}>Add a bookable slot</h2>
          {myGyms.length === 0 ? (
            <p className="muted">Create a gym page first, then open time slots for it here.</p>
          ) : (
            <form className="stack" action={addSlot}>
              <div>
                <label htmlFor="slot-gym">Gym</label>
                <select id="slot-gym" name="gym_id" required>
                  {myGyms.map((gym) => (
                    <option key={gym.id} value={gym.id}>
                      {gym.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="starts_at">Starts</label>
                <input id="starts_at" name="starts_at" type="datetime-local" required />
              </div>
              <div>
                <label htmlFor="ends_at">Ends</label>
                <input id="ends_at" name="ends_at" type="datetime-local" required />
              </div>
              <button type="submit" className="btn btn-outline">
                Add slot
              </button>
              <p className="muted">
                Athletes request a slot; you approve or decline. (Approve /
                decline controls arrive with the Host booking inbox in the
                next milestone.)
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

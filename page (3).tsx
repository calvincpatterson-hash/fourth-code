import { GymCard } from "@/components/GymCard";
import { fetchPublishedGyms } from "@/lib/data";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { gyms, isDemo } = await fetchPublishedGyms(q);

  return (
    <div className="container">
      <section className="hero">
        <p className="kicker">Private gyms · Hosted by locals</p>
        <h1>
          Find a gym. <span className="gold">Book the hour.</span>
          <br />
          It&rsquo;s yours.
        </h1>
        <p className="lede">
          Fourth Code Hosts list their garage and home gyms. Athletes book
          them by the hour — no membership desk, no crowds, no waiting for a
          rack.
        </p>
        <form className="search-bar" method="get" action="/">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by city, gym name, or equipment…"
            aria-label="Search gyms"
          />
          <button type="submit" className="btn btn-gold">
            Search
          </button>
        </form>
        {isDemo && (
          <p className="notice-box" style={{ maxWidth: 560 }}>
            Showing demo listings — connect Supabase (see README) to load
            live Host gyms.
          </p>
        )}
      </section>

      <section>
        {gyms.length === 0 ? (
          <p className="muted">
            No gyms match that search yet.{" "}
            <Link href="/host">Become the first Host in your area →</Link>
          </p>
        ) : (
          <div className="grid">
            {gyms.map((gym) => (
              <GymCard key={gym.id} gym={gym} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

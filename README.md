# Fourth Code — Marketplace App (Milestone 1)

Fourth Code is a two-sided marketplace for private gyms — Airbnb-style.
**Hosts** (garage gym and small gym owners) create their own gym pages;
**Athletes** (never "guests") find and book those gyms by the hour.
Brand: black and gold (`#c9a227`), tagline **KEEP MOVING.**, logo is four
tally marks. Kansas City first.

> **PROPRIETARY — ALL RIGHTS RESERVED.** This code is the private,
> proprietary property of Fourth Code / Calvin Patterson. It is not open
> source, no license is granted to copy, distribute, or reuse it, and it
> must only ever live in private repositories.

## Monetization

Fourth Code makes money with a **percentage cut of each booking** —
working rate **12%**. There are **no monthly Host fees and no Athlete
account fees**; listing a gym and joining as an Athlete are free.

- The rate lives in exactly one place: `PLATFORM_FEE_PERCENT` in
  `src/lib/config.ts` (overridable with the `PLATFORM_FEE_PERCENT` env
  var). `splitBookingTotal()` in `src/lib/fees.ts` does the math.
- Every booking row stores the full split: `total_cents` (what the
  Athlete pays), `platform_fee_cents` (Fourth Code's cut), and
  `host_payout_cents` (what the Host earns). Fee + payout always equals
  the total.
- Actual charging and Host payouts run through Stripe Connect in a later
  milestone — Milestone 1 only records the split.

## What Milestone 1 includes

- **Next.js (App Router) + TypeScript** scaffold on the production stack:
  Next.js, Supabase (Postgres + Auth), Stripe later, Vercel hosting.
- **Supabase schema** (`supabase/migrations/0001_marketplace.sql`):
  `profiles` (Host/Athlete role), `gyms`, `gym_photos`, `bookable_slots`,
  `bookings` — all with row level security enabled and starter policies
  (public reads published gyms; Hosts manage their own gyms; Athletes see
  their own bookings; Hosts see bookings for their gyms). A trigger
  creates a profile from signup metadata.
- **Home page** with a search bar and a grid of published gyms (name,
  city, price/hr, equipment chips).
- **Gym detail pages** at `/gyms/[id]` with photos, equipment, Host info,
  open slots, and a booking-request flow that stores the money split.
- **Auth**: `/signup` with a Host/Athlete role choice, `/login`, sign-out,
  session-refresh middleware (Supabase SSR).
- **Host area** at `/host`: "create your gym page" form (name, bio, city,
  neighborhood, equipment, price/hr, capacity, publish toggle), the
  Host's gym list, and an add-a-slot form.
- **Athlete bookings** at `/bookings`: the signed-in Athlete's bookings
  with status and totals.
- **Graceful demo mode**: with no Supabase keys configured, the app still
  renders using built-in demo listings (`src/lib/demo-data.ts`).

## Booking model

Milestone 1 uses **concrete `bookable_slots`** rather than recurring
availability rules: a Host publishes specific time windows; an Athlete
requests one; the booking copies the slot's times. This avoids
recurrence/exception complexity up front. Recurring rules can later be
added as a generator that writes slot rows — the booking flow doesn't
change.

## What's stubbed / not built yet

- **Payments & payouts** — no Stripe / Stripe Connect yet. No money is
  charged in M1; bookings are requests and the fee split is only
  recorded on the row.
- **Photo upload** — `gym_photos` stores URLs; there is no upload UI or
  Supabase Storage bucket yet. Paste an image URL via the database or
  wait for the upload milestone.
- **Host booking inbox** — Hosts can see bookings for their gyms via the
  database (RLS allows it), but there's no approve/decline UI yet.
- **Reviews, ratings, messaging, maps/search by distance** — not in M1.
- **Cancellation / no-show enforcement** — statuses exist; policy logic
  doesn't.

### Known Milestone 1 simplifications

- Row level security lets only a gym's Host update its slots, so an
  Athlete's booking request cannot hold the slot (`is_booked`) from the
  browser session. Before real money flows, slot-holding must move into
  a Postgres function or a service-role server step, and booking insert +
  slot hold must become one transaction. Host approve/decline is the
  real gate in M1.
- The platform fee is computed in the server action at request time and
  stored on the booking row, so a later rate change never rewrites
  history.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase dashboard
   (Project Settings → API). The project URL is pre-filled for the
   Fourth Code project. Real keys go only in `.env.local` — never commit
   them, never hardcode them.
3. **Run the database migration** — open the Supabase SQL editor for the
   Fourth Code project, paste the contents of
   `supabase/migrations/0001_marketplace.sql`, and run it. (Or use the
   Supabase CLI: `supabase db push`.)
4. **Run the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000. Without step 2–3 you'll see demo
   listings; with them, live data.
5. **Accounts** — sign up at `/signup` as a Host to create a gym page and
   slots, and as an Athlete (second account) to request a booking and
   see it under `/bookings`.

## Structure

```
src/
  app/            App Router pages (home, gyms/[id], login, signup,
                  host, bookings) + auth sign-out route
  components/     Header (tallies logo), GymCard, SignOutButton
  lib/
    config.ts     PLATFORM_FEE_PERCENT — the one fee constant
    fees.ts       splitBookingTotal()
    data.ts       read-side queries with demo fallback
    demo-data.ts  demo listings for unconfigured environments
    format.ts     price/date/total helpers
    types.ts      shared marketplace types
    supabase/     browser client, server client, middleware helper, env
supabase/
  migrations/     0001_marketplace.sql — schema + RLS + signup trigger
```

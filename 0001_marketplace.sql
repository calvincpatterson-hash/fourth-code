-- Fourth Code marketplace — Milestone 1 schema
-- =====================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`) against
-- the Fourth Code project. Safe to run once on an empty project.
--
-- BOOKING MODEL (design choice, Milestone 1):
--   We use a simple `bookable_slots` table instead of recurring
--   `availability_rules`. A Host publishes concrete time slots for a gym;
--   an Athlete requests one slot, which creates a `bookings` row copying
--   the slot's start/end times. This is deliberately simpler than
--   recurrence rules + exception calendars. Recurring availability can be
--   added later as a generator that materializes rows into bookable_slots
--   without changing the bookings flow.
--
-- Vocabulary is locked: space owners are "Hosts", customers are
-- "Athletes" (never "guests").

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger on signup.
-- role is chosen at signup (Host or Athlete) and stored in user metadata.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'athlete' check (role in ('host', 'athlete')),
  display_name text not null default '',
  city text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- gyms: a Host's listing / "gym page" (Airbnb-style, host-created).
-- ---------------------------------------------------------------------
create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  bio text not null default '',
  city text not null default '',
  neighborhood text,
  equipment text[] not null default '{}',
  price_per_hour_cents integer not null default 0 check (price_per_hour_cents >= 0),
  capacity integer not null default 1 check (capacity >= 1),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists gyms_host_id_idx on public.gyms (host_id);
create index if not exists gyms_published_city_idx on public.gyms (is_published, city);

-- ---------------------------------------------------------------------
-- gym_photos: photo URLs for a gym page. Milestone 1 stores external /
-- storage URLs only; in-app upload is stubbed (see README).
-- ---------------------------------------------------------------------
create table if not exists public.gym_photos (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gym_photos_gym_id_idx on public.gym_photos (gym_id, sort_order);

-- ---------------------------------------------------------------------
-- bookable_slots: concrete time windows a Host opens for booking.
-- ---------------------------------------------------------------------
create table if not exists public.bookable_slots (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint bookable_slots_time_order check (ends_at > starts_at)
);

create index if not exists bookable_slots_gym_starts_idx
  on public.bookable_slots (gym_id, starts_at)
  where is_booked = false;

-- ---------------------------------------------------------------------
-- bookings: an Athlete's request/booking against a gym (and a slot).
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  slot_id uuid references public.bookable_slots (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'declined', 'cancelled', 'completed')),
  -- Money split (monetization: percentage cut per booking, no
  -- subscription or account fees). platform_fee_cents is Fourth Code's
  -- cut (working rate 12%, see PLATFORM_FEE_PERCENT in src/lib/config.ts);
  -- host_payout_cents is what the Host earns. fee + payout = total.
  total_cents integer not null default 0 check (total_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  host_payout_cents integer not null default 0 check (host_payout_cents >= 0),
  created_at timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at)
);

create index if not exists bookings_athlete_id_idx on public.bookings (athlete_id, starts_at);
create index if not exists bookings_gym_id_idx on public.bookings (gym_id, starts_at);

-- ---------------------------------------------------------------------
-- Signup trigger: create a profile row whenever an auth user is created.
-- Role + display name come from the metadata set by the signup form.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name, city)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' in ('host', 'athlete')
        then new.raw_user_meta_data ->> 'role'
      else 'athlete'
    end,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    new.raw_user_meta_data ->> 'city'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.gyms enable row level security;
alter table public.gym_photos enable row level security;
alter table public.bookable_slots enable row level security;
alter table public.bookings enable row level security;

-- profiles: readable by everyone (Host names appear on gym pages);
-- a user can only insert/update their own row.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- gyms: public can read published gyms; a Host can read/manage their own
-- gyms (published or not). All writes are owner-only.
create policy "published gyms are publicly readable"
  on public.gyms for select
  using (is_published = true or auth.uid() = host_id);

create policy "hosts can create their own gyms"
  on public.gyms for insert
  with check (auth.uid() = host_id);

create policy "hosts can update their own gyms"
  on public.gyms for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "hosts can delete their own gyms"
  on public.gyms for delete
  using (auth.uid() = host_id);

-- gym_photos: readable when the gym is readable; writable only by the
-- gym's Host.
create policy "photos of readable gyms are publicly readable"
  on public.gym_photos for select
  using (
    exists (
      select 1 from public.gyms g
      where g.id = gym_photos.gym_id
        and (g.is_published = true or g.host_id = auth.uid())
    )
  );

create policy "hosts can manage photos of their own gyms"
  on public.gym_photos for all
  using (
    exists (
      select 1 from public.gyms g
      where g.id = gym_photos.gym_id and g.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.gyms g
      where g.id = gym_photos.gym_id and g.host_id = auth.uid()
    )
  );

-- bookable_slots: readable when the gym is readable; writable only by
-- the gym's Host. (Athletes do not update slots directly; the booking
-- server action flips is_booked — see note in README about hardening.)
create policy "slots of readable gyms are publicly readable"
  on public.bookable_slots for select
  using (
    exists (
      select 1 from public.gyms g
      where g.id = bookable_slots.gym_id
        and (g.is_published = true or g.host_id = auth.uid())
    )
  );

create policy "hosts can manage slots of their own gyms"
  on public.bookable_slots for all
  using (
    exists (
      select 1 from public.gyms g
      where g.id = bookable_slots.gym_id and g.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.gyms g
      where g.id = bookable_slots.gym_id and g.host_id = auth.uid()
    )
  );

-- bookings: Athletes see and create their own bookings; Hosts see
-- bookings for their gyms and can update their status
-- (approve / decline / complete). Athletes can update (cancel) their own.
create policy "athletes can read their own bookings"
  on public.bookings for select
  using (auth.uid() = athlete_id);

create policy "hosts can read bookings for their gyms"
  on public.bookings for select
  using (
    exists (
      select 1 from public.gyms g
      where g.id = bookings.gym_id and g.host_id = auth.uid()
    )
  );

create policy "athletes can create their own bookings"
  on public.bookings for insert
  with check (auth.uid() = athlete_id);

create policy "hosts can update bookings for their gyms"
  on public.bookings for update
  using (
    exists (
      select 1 from public.gyms g
      where g.id = bookings.gym_id and g.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.gyms g
      where g.id = bookings.gym_id and g.host_id = auth.uid()
    )
  );

create policy "athletes can update their own bookings"
  on public.bookings for update
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

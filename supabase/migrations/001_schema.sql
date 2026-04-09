-- PoolRide Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- ─── Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ──────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  email        text not null unique,
  department   text,
  floor        text,
  vehicle      text,
  preference   text default 'no_preference',
  is_admin     boolean default false,
  is_active    boolean default true,
  avatar_color text default '#1a9e6e',
  created_at   timestamptz default now()
);

-- ─── Rides ─────────────────────────────────────────────────────
create table public.rides (
  id           uuid primary key default uuid_generate_v4(),
  driver_id    uuid not null references public.profiles(id) on delete cascade,
  from_location text not null,
  to_location   text not null,
  waypoints     text[] default '{}',
  departure_time time not null,
  ride_date     date not null,
  recurrence    text default 'once',   -- once | weekdays | daily
  ride_type     text default 'free',   -- free | paid
  price_per_seat numeric(8,2) default 0,
  total_seats   int not null default 2,
  notes         text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- ─── Bookings ──────────────────────────────────────────────────
create table public.bookings (
  id         uuid primary key default uuid_generate_v4(),
  ride_id    uuid not null references public.rides(id) on delete cascade,
  rider_id   uuid not null references public.profiles(id) on delete cascade,
  status     text default 'pending',  -- pending | confirmed | cancelled
  pickup_stop text,                    -- which waypoint they're boarding at
  created_at timestamptz default now(),
  unique(ride_id, rider_id)
);

-- ─── Messages ──────────────────────────────────────────────────
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- ─── Notifications ─────────────────────────────────────────────
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,  -- ride_request | ride_confirmed | ride_cancelled | new_message
  title      text not null,
  body       text,
  is_read    boolean default false,
  data       jsonb,
  created_at timestamptz default now()
);

-- ─── Views ─────────────────────────────────────────────────────
create view public.rides_with_details as
select
  r.*,
  p.full_name  as driver_name,
  p.vehicle    as driver_vehicle,
  p.avatar_color as driver_avatar_color,
  (select count(*) from public.bookings b where b.ride_id = r.id and b.status = 'confirmed') as booked_seats,
  (r.total_seats - (select count(*) from public.bookings b where b.ride_id = r.id and b.status = 'confirmed')) as available_seats
from public.rides r
join public.profiles p on p.id = r.driver_id;

-- ─── Row Level Security ────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.rides        enable row level security;
alter table public.bookings     enable row level security;
alter table public.messages     enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read all, only update their own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Rides: anyone authenticated can read; only driver can modify
create policy "rides_select" on public.rides for select using (auth.role() = 'authenticated');
create policy "rides_insert" on public.rides for insert with check (auth.uid() = driver_id);
create policy "rides_update" on public.rides for update using (auth.uid() = driver_id);
create policy "rides_delete" on public.rides for delete using (auth.uid() = driver_id);

-- Bookings: riders see their own; drivers see bookings on their rides
create policy "bookings_select" on public.bookings for select
  using (auth.uid() = rider_id or auth.uid() = (select driver_id from public.rides where id = ride_id));
create policy "bookings_insert" on public.bookings for insert with check (auth.uid() = rider_id);
create policy "bookings_update" on public.bookings for update
  using (auth.uid() = rider_id or auth.uid() = (select driver_id from public.rides where id = ride_id));

-- Messages: only participants
create policy "messages_select" on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "messages_insert" on public.messages for insert with check (auth.uid() = sender_id);
create policy "messages_update" on public.messages for update using (auth.uid() = receiver_id);

-- Notifications: only owner
create policy "notif_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update" on public.notifications for update using (auth.uid() = user_id);

-- ─── Realtime ──────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.bookings;

-- ─── Auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Helper: get unread message count ─────────────────────────
create or replace function public.get_unread_count(user_uuid uuid)
returns bigint language sql security definer as $$
  select count(*) from public.messages
  where receiver_id = user_uuid and is_read = false;
$$;

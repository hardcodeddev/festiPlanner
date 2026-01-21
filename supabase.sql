-- Supabase schema for Festival Planner

-- Profiles (linked to auth.users by id)
create table if not exists profiles (
  id uuid primary key,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Camps
create table if not exists camps (
  id text primary key,
  name text not null,
  festival_name text,
  date text,
  dimensions jsonb,
  members text[] default '{}',
  objects jsonb default '[]'::jsonb,
  shared_packing_list jsonb default '[]'::jsonb,
  image_url text,
  created_at timestamptz default now()
);

-- Invitations
create table if not exists invitations (
  id bigserial primary key,
  inviter_id uuid references profiles(id) on delete set null,
  email text not null,
  camp_id text references camps(id) on delete cascade,
  token text not null unique,
  accepted boolean default false,
  accepted_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Unique constraint: one invite per email per camp
create unique index if not exists idx_invitations_email_camp on invitations (email, camp_id);

-- Index to speed up member queries
create index if not exists idx_camps_members on camps using gin (members);

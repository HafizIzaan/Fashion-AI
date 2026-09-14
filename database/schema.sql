-- Fashion AI initial database shape
-- Review and adapt to the chosen Supabase migration workflow before production.

create table if not exists profiles (
  id uuid primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table if not exists clothing_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0
);

create table if not exists clothing_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid not null references clothing_categories(id),
  subcategory text,
  owner_user_id uuid not null,
  family_id uuid references families(id) on delete cascade,
  library_type text not null check (library_type in ('personal', 'family')),
  image_path text not null,
  thumbnail_path text,
  source_type text not null check (source_type in ('manual_upload', 'ai_extraction')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  provider_id uuid,
  model text,
  credit_cost integer not null default 0,
  input_data jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists generated_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  family_id uuid references families(id) on delete cascade,
  generation_job_id uuid references generation_jobs(id) on delete set null,
  image_path text not null,
  visibility text not null check (visibility in ('private', 'family')) default 'private',
  created_at timestamptz not null default now()
);

create table if not exists ai_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  enabled boolean not null default true
);

create table if not exists user_ai_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_id uuid not null references ai_providers(id) on delete cascade,
  encrypted_credential text not null,
  status text not null check (status in ('connected', 'invalid', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_id)
);

create table if not exists credit_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  balance integer not null default 0 check (balance >= 0),
  mode text not null check (mode in ('limited', 'unlimited')) default 'limited',
  updated_at timestamptz not null default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount integer not null,
  transaction_type text not null,
  generation_job_id uuid references generation_jobs(id) on delete set null,
  description text,
  created_at timestamptz not null default now()
);

insert into clothing_categories (name, slug, sort_order) values
  ('Outerwear', 'outerwear', 10),
  ('Tops', 'tops', 20),
  ('Dresses', 'dresses', 30),
  ('Bottoms', 'bottoms', 40),
  ('Shoes', 'shoes', 50),
  ('Accessories', 'accessories', 60)
on conflict (slug) do nothing;

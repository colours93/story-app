-- Membership tiers and creator media posts schema
-- Safe to run multiple times; checks for existence

-- Tiers
create table if not exists public.membership_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  rank int not null default 0, -- 0 = free, higher means more access
  monthly_price_cents int not null default 0,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User subscriptions
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tier_id uuid references public.membership_tiers(id) on delete set null,
  status text not null default 'active', -- active | canceled | past_due
  started_at timestamptz not null default now(),
  canceled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists user_subscriptions_user_idx on public.user_subscriptions(user_id);

-- Follows (who user follows)
create table if not exists public.user_follows (
  follower_id uuid not null,
  followed_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id)
);
create index if not exists user_follows_followed_idx on public.user_follows(followed_id);

-- Posts by creators
create table if not exists public.media_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text,
  body text,
  required_tier_id uuid references public.membership_tiers(id) on delete set null,
  price_cents int, -- optional pay-per-post price
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists media_posts_user_idx on public.media_posts(user_id);
create index if not exists media_posts_published_idx on public.media_posts(is_published, created_at);

-- Media assets (images/videos)
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.media_posts(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image','video')),
  thumb_url text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists media_assets_post_idx on public.media_assets(post_id);

-- Seed default tiers if empty
insert into public.membership_tiers (name, slug, rank, monthly_price_cents, description)
select 'Free', 'free', 0, 0, 'Basic access' where not exists (select 1 from public.membership_tiers);
insert into public.membership_tiers (name, slug, rank, monthly_price_cents, description)
select 'Silver', 'silver', 1, 499, 'More content access' where not exists (
  select 1 from public.membership_tiers where slug='silver'
);
insert into public.membership_tiers (name, slug, rank, monthly_price_cents, description)
select 'Gold', 'gold', 2, 999, 'Full access' where not exists (
  select 1 from public.membership_tiers where slug='gold'
);
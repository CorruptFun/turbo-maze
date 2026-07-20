-- ============================================================================
-- 0001_saves.sql  —  Turbo Maze cloud save (per-user, Google-account)
--
-- One row per signed-in user holding the WHOLE game save (the localStorage
-- `store` blob) as jsonb. This is the entire server-side footprint of the
-- Google/Supabase cloud-save path; the client does the "most-progress-wins"
-- merge (see index.html `syncMerge` / `cloudSyncNow`), so this table is a plain
-- owner-scoped key/value store.
--
-- Security model: Row Level Security (RLS) restricts every row to its owner
-- (auth.uid() = user_id). The Supabase anon / publishable key is SAFE to ship
-- in the static game precisely because these policies gate all access -- the key
-- only ever grants what RLS allows for the currently signed-in user. NEVER ship
-- the service_role key or the database password.
--
-- Idempotent-friendly (safe to re-run): CREATE ... IF NOT EXISTS and
-- DROP ... IF EXISTS before each CREATE.
-- ============================================================================

-- ==========================================
-- TABLE: public.saves — one row per user; the whole game save as jsonb.
-- ==========================================
create table if not exists public.saves (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    data       jsonb not null,
    updated_at timestamptz not null default now()
);

-- Deny-by-default: with RLS enabled and no permissive policy matched, access is
-- refused. The policies below re-grant access to each row's owner only.
alter table public.saves enable row level security;

-- ==========================================
-- RLS POLICIES
-- A signed-in user may read/write ONLY their own row (auth.uid() = user_id).
-- The anon role matches none of these (auth.uid() is null when unauthenticated),
-- so cross-user and anonymous access are denied.
-- ==========================================

drop policy if exists "Users can view own save" on public.saves;
create policy "Users can view own save"
    on public.saves
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own save" on public.saves;
create policy "Users can insert own save"
    on public.saves
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own save" on public.saves;
create policy "Users can update own save"
    on public.saves
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own save" on public.saves;
create policy "Users can delete own save"
    on public.saves
    for delete
    using (auth.uid() = user_id);

-- ==========================================
-- TRIGGER: keep updated_at fresh on every UPDATE (the column DEFAULT only
-- stamps now() on INSERT). search_path pinned to '' as a hardening measure
-- (now() lives in pg_catalog, always resolvable).
-- ==========================================
create or replace function public.set_saves_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_saves_updated_at on public.saves;
create trigger trg_saves_updated_at
    before update on public.saves
    for each row
    execute function public.set_saves_updated_at();

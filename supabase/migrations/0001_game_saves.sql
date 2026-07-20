-- ============================================================================
-- 0001_game_saves.sql  —  SHARED multi-game cloud save (one Supabase project
--                         for ALL of the owner's games)
--
-- This Supabase project is shared across every game (Viva Maya, Turbo Maze, and
-- future ones) so a player signs in with Google ONCE and their identity
-- (auth.users) is the same everywhere — sign in on any game, recognized on all.
--
-- Each game's save is ISOLATED by a `game` slug. The composite primary key
-- (user_id, game) means exactly ONE row per user PER game, so no game can ever
-- overwrite another game's save. Add a new game later by simply using a new slug
-- from its client — NO new migration, NO new table.
--
-- ⚠️ This migration does NOT touch Viva Maya. Viva Maya (already live) keeps its
--    own single-row `public.saves` table in this same project; that table is left
--    exactly as-is. Turbo Maze and every FUTURE game share THIS `game_saves`
--    table instead. (Viva Maya could be folded in later by copying its rows here
--    with game='viva-maya' and repointing its client — a separate, careful task,
--    not done here.)
--
-- Security: Row Level Security restricts every row to its owner
-- (auth.uid() = user_id) — a signed-in player can read/write only their OWN rows,
-- across all their games. The Supabase anon / publishable key is SAFE to ship in
-- each game's client precisely because these policies gate all access. NEVER ship
-- the service_role key or the database password.
--
-- Idempotent-friendly (safe to re-run).
-- ============================================================================

-- ==========================================
-- TABLE: public.game_saves — one row per (user, game); the whole game save as jsonb.
-- ==========================================
create table if not exists public.game_saves (
    user_id    uuid        not null references auth.users(id) on delete cascade,
    game       text        not null,
    data       jsonb       not null,
    updated_at timestamptz not null default now(),
    primary key (user_id, game)
);

-- Deny-by-default: RLS on, no permissive policy matched → refused. Policies below
-- re-grant access to each row's owner only.
alter table public.game_saves enable row level security;

-- ==========================================
-- RLS POLICIES — a signed-in user may read/write ONLY their own rows (any game).
-- The anon role matches none of these (auth.uid() is null when unauthenticated),
-- so cross-user and anonymous access are denied.
-- ==========================================

drop policy if exists "Users can view own game saves" on public.game_saves;
create policy "Users can view own game saves"
    on public.game_saves
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own game saves" on public.game_saves;
create policy "Users can insert own game saves"
    on public.game_saves
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own game saves" on public.game_saves;
create policy "Users can update own game saves"
    on public.game_saves
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own game saves" on public.game_saves;
create policy "Users can delete own game saves"
    on public.game_saves
    for delete
    using (auth.uid() = user_id);

-- ==========================================
-- TRIGGER: keep updated_at fresh on every UPDATE (the column DEFAULT only stamps
-- now() on INSERT). search_path pinned to '' as a hardening measure.
-- ==========================================
create or replace function public.set_game_saves_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_game_saves_updated_at on public.game_saves;
create trigger trg_game_saves_updated_at
    before update on public.game_saves
    for each row
    execute function public.set_game_saves_updated_at();

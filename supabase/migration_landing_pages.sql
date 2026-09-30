-- ════════════════════════════════════════════════════════════════════
-- DFVLeads — migration: landing pages geradas por IA
-- Rode DEPOIS do schema.sql no SQL Editor do Supabase.
-- Uma landing page por lead (regenerar substitui o HTML).
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.landing_pages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  lead_id    uuid not null references public.leads (id) on delete cascade,
  html       text not null,
  created_at timestamptz not null default now()
);

create index if not exists landing_pages_user_idx on public.landing_pages (user_id, created_at desc);

-- Uma página por lead; regenerar faz upsert (substitui o HTML).
create unique index if not exists landing_pages_lead_unique on public.landing_pages (lead_id);

alter table public.landing_pages enable row level security;

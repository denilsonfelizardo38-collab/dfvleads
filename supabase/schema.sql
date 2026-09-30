-- ════════════════════════════════════════════════════════════════════
-- DFVLeads — schema do banco (rode no SQL Editor do Supabase)
-- Autenticação fica no Supabase Auth (schema auth/users, nativo).
-- Este backend usa a SERVICE ROLE key (bypassa RLS) e valida o JWT do
-- Supabase em cada request — nenhuma tabela abaixo precisa de policy.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  plan            text        not null default 'free',     -- free | pro | pro_max
  credits         int         not null default 1,          -- saldo de buscas (1 crédito = 1 busca)
  total_searches  int         not null default 0,
  total_leads     int         not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Cria perfil com 1 crédito grátis (1 busca completa) para cada novo usuário.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, credits)
  values (new.id, 1)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Uma "busca": nicho + cidade + snapshot do resultado.
create table if not exists public.searches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  niche       text not null,
  city        text not null,
  radius_km   int,
  lead_count  int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists searches_user_recent_idx
  on public.searches (user_id, created_at desc);

-- Leads retornados por uma busca (o snapshot fica em payload).
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  search_id   uuid not null references public.searches (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  place_id    text not null,
  name        text not null,
  phone       text,
  address     text,
  website     text,
  rating      numeric(2,1),
  reviews     int,
  lat         double precision,
  lng         double precision,
  status      text not null,              -- NO_SITE | SOCIAL_ONLY | HAS_SITE
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists leads_search_idx  on public.leads (search_id);
create index if not exists leads_user_place_idx on public.leads (user_id, place_id);

-- RLS (defesa em profundidade: ninguém deve consultar via anon key).
alter table public.profiles enable row level security;
alter table public.searches enable row level security;
alter table public.leads    enable row level security;

-- Nota: o "já visto" (dedupe) é calculado em memória no backend via
-- (user_id, place_id) e não consome crédito; não precisa de coluna.

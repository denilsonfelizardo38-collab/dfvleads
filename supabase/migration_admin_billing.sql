-- ════════════════════════════════════════════════════════════════════
-- DFVLeads — migração: planos mensais, billing manual (WhatsApp),
-- painel admin e publicação de sites.
-- Rodar no SQL Editor do Supabase DEPOIS do schema.sql e da
-- migration_landing_pages.sql. Idempotente (pode rodar de novo).
-- ════════════════════════════════════════════════════════════════════

-- ── Perfis: admin, bloqueio e consumo mensal do plano ───────────────
alter table public.profiles add column if not exists is_admin      boolean not null default false;
alter table public.profiles add column if not exists blocked       boolean not null default false;
alter table public.profiles add column if not exists plan_expires  timestamptz;
alter table public.profiles add column if not exists sites_used    int     not null default 0;
alter table public.profiles add column if not exists searches_used int     not null default 0;
alter table public.profiles add column if not exists period_start  timestamptz;
alter table public.profiles add column if not exists full_name     text;

-- Admin inicial: conta dfvcode@mail.com (troque aqui se mudar de e-mail).
update public.profiles set is_admin = true
where user_id in (select id from auth.users where email = 'dfvcode@mail.com');

-- ── Sites: publicação (link público) ────────────────────────────────
alter table public.landing_pages
  add column if not exists published boolean not null default false,
  add column if not exists slug      text,
  add column if not exists published_at timestamptz;

create unique index if not exists landing_pages_slug_unique on public.landing_pages (slug) where slug is not null;

-- ── Pedidos de pagamento (comprovante enviado → admin confirma) ─────
create table if not exists public.payment_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  plan_key    text not null,
  amount_usd  numeric(10,2) not null,
  metodo      text not null default 'binance',   -- binance | paypal
  referencia  text,                              -- hash/ID da transação que o usuário informou
  status      text not null default 'pending',   -- pending | approved | rejected
  admin_id    uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists payment_requests_user_idx on public.payment_requests (user_id, created_at desc);
create index if not exists payment_requests_status_idx on public.payment_requests (status, created_at);

-- ── Notificações por usuário (sininho no painel) ────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  titulo     text not null,
  corpo      text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ── Logs de crédito (auditoria de recargas e consumos) ─────────────
create table if not exists public.credit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  tipo       text not null,                      -- busca | site | recarga | ajuste
  quantidade int  not null,
  detalhe    text,
  created_at timestamptz not null default now()
);

create index if not exists credit_logs_user_idx on public.credit_logs (user_id, created_at desc);

-- ── Migração de saldos antigos para o modelo de plano mensal ────────
update public.profiles
set plan = case
  when plan = 'pro_max' then 'plano75'
  when plan = 'pro' then 'plano30'
  else 'free'
end
where plan in ('free', 'pro', 'pro_max');

-- Perfis que faltam (usuários criados antes do trigger).
insert into public.profiles (user_id, credits)
select id, 0 from auth.users
on conflict (user_id) do nothing;

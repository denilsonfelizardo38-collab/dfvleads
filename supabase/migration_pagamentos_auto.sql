-- ════════════════════════════════════════════════════════════════════
-- DFVLeads — migração: pagamento AUTOMÁTICO (PayPal + Binance Pay).
-- Rodar no SQL Editor do Supabase DEPOIS da migration_admin_billing.sql.
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════

alter table public.payment_requests
  add column if not exists provider        text,          -- paypal | binance | manual
  add column if not exists provider_order_id text,        -- PayPal order id / Binance prepay id
  add column if not exists auto_approved   boolean not null default false;

create index if not exists payment_requests_order_idx
  on public.payment_requests (provider, provider_order_id)
  where provider_order_id is not null;

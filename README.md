# DFVLeads

Encontre empresas **SEM SITE** em segundos — e transforme cada uma em cliente.

O DFVLeads busca empresas reais por nicho e cidade, separa as que não têm
site (ou só têm redes sociais), gera landing pages com IA para cada lead e
gere planos, créditos e pagamentos. Tudo num painel React com modo
claro/escuro.

## Funcionalidades

- **Busca de leads sem site** — por nicho + cidade. Com `GOOGLE_MAPS_API_KEY`
  usa a Google Places API (New); sem chave usa **OpenStreetMap**
  (Overpass + Nominatim), grátis e sem cadastro. Só entra lead **com
  telefone**; cada lead é classificado como `NO_SITE`, `SOCIAL_ONLY` ou
  `HAS_SITE` (`server/src/services/leadStatus.ts`).
- **Catálogos de atalho** — 12 categorias de nichos (`web/src/lib/nichos.ts`)
  e 11 países com divisões (estado/província/distrito/ilha) para o campo
  "Cidade / País" (`web/src/lib/paises.ts`). Nichos e cidades fora da lista
  funcionam na mesma (o Nominatim resolve).
- **Geração de sites com IA** — análise do negócio + landing page por lead
  (`server/src/services/siteGenerator.ts`, `siteBuilder.ts`,
  `businessAnalyzer.ts`). Fotos reais do nicho via Unsplash (opcional; sem
  chave usa arte em gradiente/SVG). Prévia por iframe com assinatura HMAC de
  1h, download do HTML e **publicação em `/s/:slug`**.
- **Planos e créditos** — conta nova nasce com **1 crédito (1 busca grátis)**.
  1 crédito = 1 busca; exportar CSV custa 3; gerar site consome 1 da cota de
  sites. Planos mensais (USD): **Starter $10** (100 pesquisas + 4 sites),
  **Business $30** (200 + 15), **Agência $75** (600 + 35).
- **Pagamentos PayPal + Binance** — checkout automático (ordem PayPal com
  captura no retorno; Binance Pay com webhook) + registo manual com
  referência e confirmação via WhatsApp do admin. Painel admin aprova/recusa
  pedidos, bloqueia usuários, credita buscas e envia notificações.
- **Painel completo** — Busca, Histórico, Meus Leads, Websites, Templates,
  Mensagens (registo local de contactos em `localStorage`), Créditos,
  Planos, Perfil, Configurações e Admin. Páginas públicas: Landing
  (Hero, Como funciona, Preços, FAQ), Login, Registo, Reset de senha,
  Termos e Privacidade.
- **Modo claro/escuro** — alternador no painel, persistido em
  `localStorage` (`dfvleads-theme`, omissão: claro), aplicado via classe
  `.dark` no `<html>` (Tailwind v4 `@custom-variant`).

## Stack

| | |
|---|---|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS 4, react-router-dom 7 |
| Backend | Node.js + Express 4 + TypeScript (execução com `tsx`) |
| Banco / Auth | Supabase (PostgreSQL + Supabase Auth, email/senha) |
| Leads | Google Places API (New) ou OpenStreetMap (Overpass/Nominatim) |
| Sites | API OpenAI-compatible (padrão: Groq `openai/gpt-oss-120b`) + Unsplash |
| Pagamentos | PayPal (orders + webhook) + Binance Pay (webhook HMAC) |
| Testes web | Vitest (`npm test -w web`) |

## Estrutura

```
.
├── server/                # API Express (porta 3001)
│   └── src/
│       ├── index.ts       # bootstrap + serve estático de web/dist
│       ├── app.ts         # app Express, CORS, webhooks, rotas /api
│       ├── env.ts         # config + planos + custos (fonte da verdade)
│       ├── middleware/    # auth (JWT Supabase), gateBloqueio, searchRateLimit
│       ├── routes/        # search, history, leads, export, credits,
│       │                  # landingPages, billing, admin, notifications, public
│       ├── services/      # supabaseAdmin, googlePlaces, openStreetMap,
│       │                  # siteGenerator/siteBuilder/businessAnalyzer,
│       │                  # paypal, binancePay, planActivation, autoPing, ...
│       └── lib/           # http (erros JSON)
├── web/                   # SPA React (porta 5173, proxy /api → :3001)
│   └── src/
│       ├── pages/         # Landing, Login, Register, Reset*, Dashboard,
│       │                  # Termos, Privacidade
│       ├── pages/dashboard/ # Search, History, MeusLeads, Websites, Templates,
│       │                  # Mensagens, Credits, Planos, Perfil, Settings, Admin
│       ├── components/    # Landing/, dashboard/, ui/, Logo
│       ├── contexts/      # AuthContext, ToastContext
│       ├── hooks/         # useAuth, useProfile
│       └── lib/           # supabase client (+stub sem .env), api client,
│                          # format, theme, nichos, paises, contatos
├── supabase/              # schema.sql + 3 migrações (ordem abaixo)
├── api/index.ts           # função serverless (deploy só-Vercel)
├── scripts/               # testa-busca/google/sonda/supabase/telefone, gerar-exemplo
├── render.yaml            # deploy de serviço único no Render
├── vercel.json            # rewrites /api, /s e SPA
└── GUIA-DEPLOY.md         # opções Render / Vercel / híbrido em detalhe
```

## Correr localmente

**Pré-requisitos:** Node.js >= 20 e um projeto em
[supabase.com](https://supabase.com).

1. **Banco** — no SQL Editor do Supabase, rode **nesta ordem** (cada arquivo
   indica o antecessor no cabeçalho):
   1. `supabase/schema.sql` (tabelas `profiles`, `searches`, `leads` + trigger:
      perfil novo nasce com 1 crédito)
   2. `supabase/migration_landing_pages.sql` (tabela `landing_pages`)
   3. `supabase/migration_admin_billing.sql` (admin, bloqueio, cotas do plano,
      `payment_requests`; torne sua conta admin: o SQL marca
      `dfvcode@mail.com` — ajuste o e-mail se preciso)
   4. `supabase/migration_pagamentos_auto.sql` (colunas do pagamento
      automático PayPal/Binance)
2. **Backend** — copie `server/.env.example` para `server/.env` e preencha:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (obrigatórias);
   `GOOGLE_MAPS_API_KEY` (opcional — sem ela usa OpenStreetMap);
   `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODELO` (geração de sites);
   `UNSPLASH_ACCESS_KEY` (opcional); `PAYPAL_*` / `BINANCE_PAY_*`
   (opcionais — sem elas, só o registo manual via WhatsApp).
3. **Frontend** — copie `web/.env.example` para `web/.env` e preencha
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Sem `.env`, o app abre
   mesmo assim (cliente Supabase stub) e as páginas de auth mostram aviso.
4. Na raiz:
   ```bash
   npm install
   npm run dev        # API (:3001) + web (:5173) juntos via concurrently
   ```
   (`npm run dev:server` / `npm run dev:web` sobem cada um. Em dev, o proxy
   do Vite encaminha `/api` para `localhost:3001`, sem CORS.)
5. Abra `http://localhost:5173`, crie uma conta (1 busca grátis) e faça a
   primeira busca.

## Modelo de créditos e limites

- 1 crédito = **1 busca** (com todos os leads que ela encontrar).
- Exportar CSV: 3 créditos. Gerar site: 1 da cota de sites do período
  (planos: cotas mensais de pesquisas + sites a partir da ativação).
- Trial: conta nova tem 1 crédito e 1 geração de site grátis.
- Rate limit: **10 buscas/hora por usuário** (em memória — reinicia ao
  reiniciar o servidor; responde 429 com `retryAfterMinutes`).
- Sem saldo/cota, a busca ou geração é bloqueada com CTA de upgrade.

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | API + web juntos |
| `npm run build` | `tsc` do server + build da web (`web/dist`) |
| `npm start` | Produção: API serve `web/dist` na mesma porta |
| `npm run typecheck` | `tsc --noEmit` no server e no web |
| `npm test -w web` | Testes unitários do frontend (Vitest, 34 testes em `web/src/lib/*.test.ts`) |
| `npm run dev -w server` / `-w web` | Cada workspace isolado |

## Deploy no Render

`render.yaml` define **um serviço só**: a API serve o painel estático
(`web/dist` com fallback para `index.html`; `/s/:slug` continua dinâmico).

- **Build:** `npm ci && npm run build -w server && npm run build -w web`
- **Start:** `npm run start -w server` · **Health check:** `/api/health`
- **Variáveis:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_API_KEY`,
  `UNSPLASH_ACCESS_KEY`, `PAYPAL_CLIENT_ID/SECRET`, `BINANCE_PAY_KEY/SECRET`,
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`sync: false` — preencher no
  dashboard); `LLM_BASE_URL`, `LLM_MODELO`, `APP_BASE_URL`, `CORS_ORIGIN`,
  `AUTO_PING_URL/MIN` (auto-ping a cada 5 min contra o sleep do plano Free),
  `PAYPAL_SANDBOX=false`, `VITE_API_URL=""` (mesma origem).
- Troque `https://SEU-APP.onrender.com` pelo URL real em `APP_BASE_URL`,
  `AUTO_PING_URL` e `CORS_ORIGIN`.
- O deploy deve passar `npm test -w web` e `npm run typecheck` antes/depois
  do build. Alternativas (só-Vercel via `api/index.ts` com
  `OVERPASS_PRAZO_MS=45000`, ou painel na Vercel + API no Render) estão em
  `GUIA-DEPLOY.md`.

## Segurança

- Todas as rotas `/api/*` (exceto health, preview, retorno/webhooks e sites
  públicos `/s`) exigem **JWT do Supabase válido** (`requireAuth`) e conta
  **não bloqueada** (`gateBloqueio`). O backend usa a **service-role key só
  no servidor** (bypassa RLS); o browser usa a **anon key**.
- **Webhooks:** Binance verificado por HMAC-SHA512 do `rawBody` (cabeçalho
  `binancepay-signature`, comparação em tempo constante); PayPal confirmado
  por captura da ordem na API do PayPal antes de ativar o plano. `express.json`
  com limite de 256kb.
- **Prévia de site:** fora do grupo autenticado, só com assinatura HMAC de
  1h devolvida na criação.
- **CORS:** lista fechada em `CORS_ORIGIN` (aceita várias origens separadas
  por vírgula); sem origem (curl/mobile) é liberado.
- Pagamentos manuais exigem referência ≥ 4 caracteres; decisão de
  aprovar/recusar é exclusiva do admin (`/api/admin/*`).

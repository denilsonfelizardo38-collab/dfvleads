# DFVLeads

Encontre empresas **SEM SITE** no Google Maps em segundos — e transforme cada uma em cliente.

| | |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 (Vite) |
| Backend | Node.js + Express + TypeScript |
| Banco / Auth | Supabase (PostgreSQL + Supabase Auth, email/senha) |
| Leads | Google Places API (New) ou **OpenStreetMap** (Overpass/Nominatim) — grátis e sem chave |
| Sites | Groq (OpenAI-compatible) + fotos do nicho via Unsplash |

## Estrutura

```
dfvleads/
├── server/          # API Express (porta 3001)
│   └── src/
│       ├── index.ts         # bootstrap
│       ├── app.ts           # app Express + rotas
│       ├── middleware/      # rate limit (10 buscas/h) + auth
│       ├── routes/          # /api/search /api/history /api/leads /api/export /api/credits/consume
│       ├── services/        # supabaseAdmin, googlePlaces, leadStatus
│       └── lib/             # helpers de validação/erros
├── web/             # SPA React (porta 5173)
│   └── src/
│       ├── pages/           # Landing, Login, Register, Reset, Dashboard (Search/History/Credits/Settings)
│       ├── components/      # Landing/, dashboard/, ui/
│       ├── contexts/        # AuthContext, ToastContext
│       └── lib/             # supabase client, api client, format
└── supabase/schema.sql      # rode no SQL Editor do Supabase
```

## Setup em 5 passos

1. **Supabase** — crie um projeto em [supabase.com](https://supabase.com) e rode `supabase/schema.sql` no SQL Editor (cria `profiles`, `searches`, `leads` + trigger que dá 5 créditos grátis a cada novo usuário).
2. **Leads sem cartão de crédito?** Não configure nada: sem `GOOGLE_MAPS_API_KEY`, o backend busca empresas **reais em tempo real pelo OpenStreetMap** (Overpass + Nominatim, gratuito). Com chave do Google, usa a Places API (New) automaticamente.
3. **Backend** — `cp server/.env.example server/.env`, preencha `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_API_KEY`, `LLM_API_KEY` (Groq, grátis — use `openai/gpt-oss-120b` como `LLM_MODELO`) e `UNSPLASH_ACCESS_KEY` (opcional, para fotos reais do nicho nos sites gerados), depois `npm install` na raiz e `npm run dev:server`.
4. **Frontend** — `cp web/.env.example web/.env`, preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e rode `npm run dev:web`.
5. Abra `http://localhost:5173`, crie uma conta (5 leads grátis) e faça sua primeira busca.

> **Sem configurar nada?** Na tela de login, clique em **Ver demonstração do painel (sem conta)**
> para navegar pelo painel completo com dados fictícios — busca, histórico e geração de site —
> sem Supabase, sem Google Maps e sem gastar créditos.

Na raiz, `npm run dev` sobe API + web juntos (concurrently).

## Como funcionam os créditos

- Conta nova: **5 créditos grátis**.
- Cada lead **novo** (place_id nunca retornado antes para o usuário) consome 1 crédito; leads "já vistos" (dedupe) e leads com site próprio são **gratuitos**.
- Sem saldo suficiente, a busca é bloqueada com CTA de upgrade.
- Rate limit: **10 buscas/hora** por usuário.

## Planos (pagamentos em breve)

Free (5 leads) · Pro 19€/mês (100 leads) · Pro Max 49€/mês (500 leads).
Stripe e M-Pesa/Emola estão como placeholder — os botões exibem "Em breve".

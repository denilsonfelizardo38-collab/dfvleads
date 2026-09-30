# Publicar o DFVLeads de graça (Render + Supabase)

## Três caminhos possíveis

**Opção A — Tudo no Render (recomendada para começar):** um serviço só
roda a API e serve o painel. Menos peças, zero configuração extra.

**Opção C — SÓ Vercel (sem Render):** a API inteira vira UMA função
serverless (`api/index.ts`) e o painel é servido pela Vercel. Um deploy
só, um domínio só, tudo grátis. Limites honestos:

- Cada requisição dura no máx. **60 s** — buscas OSM muito lentas podem
  falhar; o código já usa `OVERPASS_PRAZO_MS=45000` (sete nas variáveis
  da Vercel) para caber no limite. Geração de site (IA) costuma caber.
- A função "fria" demora ~2-4 s na primeira chamada (imperceptível perto
  dos 50 s do Render Free).
- Cache em memória é por instância (menos eficaz; nada quebra).

Como publicar na Opção C:
1. `vercel.json` já está pronto (função + rewrites do painel e /s);
2. Importe o repo em vercel.com/new (Framework: Other);
3. Variáveis: TODAS as do Render (Supabase, LLM, Unsplash, APP_BASE_URL
   = `https://seu-projeto.vercel.app`, pagamentos opcionais) MAIS
   `OVERPASS_PRAZO_MS=45000`;
4. `CORS_ORIGIN`: `https://seu-projeto.vercel.app` (mesma origem do
   painel — o proxy entrega /api no mesmo domínio, mas deixe explícito).

**Opção B — Painel na Vercel + API no Render:** o painel carrega mais
rápido e não dorme, MAS a API continua no Render — e com o plano Free,
buscas/generações demoram ~50 s depois de inatividade. Use a Opção A ou
C primeiro; a B é transição.

### Opção B — publicar o painel na Vercel (API fica no Render)

1. No `vercel.json` (raiz), troque as 2 ocorrências de
   `https://SEU-APP.onrender.com` pelo URL real da sua API no Render;
2. Render: adicione a origem da Vercel no `CORS_ORIGIN`, separada por
   vírgula (o código aceita várias):
   `https://seu-painel.vercel.app,https://SEU-APP.onrender.com`;
3. Remova os blocos `"functions"` e os rewrites internos do `vercel.json`
   e deixe só os 2 rewrites para o Render (`/api/:path*` e `/s/:path*`);
4. Importe o repositório em vercel.com/new;
5. Variáveis no projeto Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   (`VITE_API_URL` fica vazio — o rewrite entrega o /api no mesmo domínio).

Com a Opção B, os links publicados (`/s/nome`) também funcionam no
seu domínio da Vercel via rewrite — pode distribuir links da Vercel.

## Manter o Render SEMPRE acordado (grátis)

O plano Free dorme após ~15 min sem visitas (a primeira visita demora
~50 s para acordar). Truque: um "pingador" visita sua API a cada poucos
minutos e o contador de inatividade nunca zera. Três formas — a 1ª já
está no código:

**1. Auto-ping embutido (zero configuração extra):** o próprio servidor
visita a própria URL a cada 5 min. No Render, adicione só estas duas
variáveis:

| Variável | Valor |
|---|---|
| `AUTO_PING_URL` | `https://SEU-APP.onrender.com/api/health` |
| `AUTO_PING_MIN` | `5` |

Custo: zero — o Free inclui 750 h/mês, o suficiente para 1 serviço
ligado 24 h. Só funciona com o serviço acordado (auto-segura), então o
primeiro acesso do dia pode demorar se ninguém visitou antes.

**2. UptimeRobot (recomendado junto com o 1):** crie conta grátis em
uptimerobot.com → Add New Monitor → HTTP(s) → URL
`https://SEU-APP.onrender.com/api/health` → intervalo 5 min. Vigia de
fora: se o Render reiniciar e o auto-ping ainda não subiu, o UptimeRobot
acorda na mesma. Bônus: te avisa por e-mail se o site cair de verdade.

**3. cron-job.org:** alternativa ao 2, mesmo esquema (URL a cada 5 min,
grátis).

Para uso comercial sério, o plano de $7/mês do Render elimina o sleep
de vez — comece com os pingadores e evolua quando faturar.

---

## Passo 1 — Suba o projeto para o GitHub

```bash
git init
git add .
git commit -m "DFVLeads - versao inicial"
# Crie o repositorio no github.com e:
git remote add origin https://github.com/SEU-USUARIO/dfvleads.git
git push -u origin main
```

Confirme que o `.env` NÃO foi commitado (o .gitignore já cobre).

## Passo 2 — Crie o serviço no Render

1. Acesse https://dashboard.render.com → **New** → **Web Service**;
2. Conecte seu GitHub e escolha o repositório `dfvleads`;
3. Preencha:
   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build -w server && npm run build -w web`
   - **Start Command:** `npm run start -w server`
   - **Instance Type:** Free
4. Em **Advanced → Add Environment Variable**, adicione (use o botão
   "Secret file" ou uma por uma):

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | copie do Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | copie do Supabase → Settings → API (service_role, é segredo) |
| `LLM_API_KEY` | sua chave da Groq (console.groq.com) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` |
| `LLM_MODELO` | `openai/gpt-oss-120b` |
| `UNSPLASH_ACCESS_KEY` | sua chave Unsplash (para as fotos dos sites) |
| `CORS_ORIGIN` | `https://SEU-APP.onrender.com` (o URL final do serviço) |
| `APP_BASE_URL` | `https://SEU-APP.onrender.com` (usado nos retornos de pagamento) |
| `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` | credenciais do PayPal (ver "Pagamento automático" abaixo) |
| `PAYPAL_SANDBOX` | `false` para receber de verdade |
| `BINANCE_PAY_KEY` / `BINANCE_PAY_SECRET` | credenciais Binance Pay Merchant (ver abaixo) |
| `VITE_API_URL` | *(deixe vazio — mesmo domínio)* |
| `VITE_SUPABASE_URL` | igual ao SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | copie do Supabase → Settings → API (anon) |

5. Clique **Create Web Service** e aguarde o build (~3-5 min).

O arquivo `render.yaml` na raiz faz o mesmo automaticamente se preferir
usar "Blueprint" no Render.

## Passo 3 — Confirme que está no ar

- Abra `https://SEU-APP.onrender.com` → painel de login do DFVLeads;
- Abra `https://SEU-APP.onrender.com/api/health` → `{"ok":true,...}`.

## Passo 4 — Configure o admin

1. Crie sua conta normal pela tela de registro;
2. No Supabase → SQL Editor, rode (troque o e-mail):

```sql
update public.profiles set is_admin = true
where user_id in (select id from auth.users where email = 'dfvcode@mail.com');
```

3. Recarregue o painel — o menu "Administração" aparece na barra lateral.

## Passo 5 — Use

- **Buscar leads:** painel → Busca (cada busca gasta 1 crédito; conta nova tem 1 grátis);
- **Gerar site:** aba leads → "Criar site" (conta nova tem 1 grátis; depois exige plano);
- **Publicar:** no site gerado → "Publicar site" → escolha o endereço → link em `/s/...` pronto para o WhatsApp;
- **Vender planos:** o cliente paga Binance/PayPal → envia o comprovante no seu WhatsApp (+258 87 910 1185) → você aprova em Administração → Pagamentos.

## Pagamento automático (sem confirmar admin)

Com estas variáveis preenchidas, o painel mostra os botões "Pagar com
PayPal (automático)" e "Pagar com Binance (USDT, automático)". O plano
ativa SOZINHO quando o pagamento confirma — sem WhatsApp e sem você no
meio. Sem as variáveis, só o fluxo manual por WhatsApp aparece.

### PayPal (sem mensalidade; taxa ~4,5% + 0,30 por venda)

1. Crie conta de **business** em developer.paypal.com;
2. Dashboard → Apps & Credentials → **Live** → Create App;
3. Copie o **Client ID** e o **Secret** → coloque nas variáveis do Render;
4. Depois do primeiro deploy, adicione um **Webhook** no app do PayPal:
   URL: `https://SEU-APP.onrender.com/api/billing/webhook/paypal`
   Eventos: `CHECKOUT.ORDER.APPROVED` e `PAYMENT.CAPTURE.COMPLETED`.

### Binance Pay (0% de taxa por transferência USDT)

1. Tenha conta **Binance** (verificada); em Crypto Pay → Merchant
   Portal (binancepay) crie a conta de comerciante;
2. Portal → Developers → gere **API key** e **API secret**;
3. Coloque em `BINANCE_PAY_KEY` / `BINANCE_PAY_SECRET` no Render;
4. O webhook oficial é `https://SEU-APP.onrender.com/api/billing/webhook/binance`
   (o código já envia este URL na criação do pedido). A Binance exige
   domínio próprio (sem .onrender.com) para aprovar merchants — mas o
   fluxo funciona por consulta de status mesmo sem webhook confirmado.

### Como testar sem gastar

Use `PAYPAL_SANDBOX=true` com contas de teste do PayPal (sandbox) para
simular compras sem dinheiro real. Binance Pay não tem sandbox público;
faça 1 compra pequena real (1 plano de 10 USD) para validar.

## Limites do plano Free (quando crescer)

| Sintoma | Causa | Solução |
|---|---|---|
| Primeiro acesso demora ~50 s | serviço dormindo | plano Starter ($7/mês) |
| " Este site can be served from..." aviso | HTTP (sem HTTPS no domínio próprio) | usar o domínio .onrender.com (HTTPS) |
| Buscas OSM falham às vezes | Overpass público instável | já tem retry + plano B no código |
| Groq responde devagar em picos | fila do tier grátis | normal; retry automático |

## Atualizar a versão publicada

```bash
git add . && git commit -m "atualizacao" && git push
```

O Render reconstrói sozinho a cada push na branch principal.

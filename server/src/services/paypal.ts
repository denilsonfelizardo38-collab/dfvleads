import { config } from '../env.ts';

const API = () => (config.paypalSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com');

/** Cache simples do token OAuth2 (válido ~9h; renovamos com margem). */
let tokenCache: { valor: string; expira: number } | null = null;

export function paypalAtivo(): boolean {
  return Boolean(config.paypalClientId && config.paypalSecret);
}

async function token(): Promise<string> {
  if (tokenCache && tokenCache.expira > Date.now() + 60_000) return tokenCache.valor;
  const resposta = await fetch(`${API()}/v1/oauth2/token`, {
    method: 'POST',
    signal: AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.paypalClientId}:${config.paypalSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resposta.ok) throw new Error(`PayPal token: HTTP ${resposta.status}`);
  const json = (await resposta.json()) as { access_token: string; expires_in: number };
  tokenCache = { valor: json.access_token, expira: Date.now() + json.expires_in * 1000 };
  return tokenCache.valor;
}

export interface OrdemPayPal {
  id: string;
  url: string;
}

/** Cria uma order de 1 item (o plano) e devolve o link de aprovação. */
export async function criarOrdemPayPal(input: {
  planoKey: string;
  planoNome: string;
  precoUsd: number;
  pedidoId: string;
  retornoUrl: string;
  canceloUrl: string;
}): Promise<OrdemPayPal> {
  const acesso = await token();
  const resposta = await fetch(`${API()}/v2/checkout/orders`, {
    method: 'POST',
    signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${acesso}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: input.pedidoId,
          description: `DFVLeads ${input.planoNome} - 1 mes (${input.pedidoId.slice(0, 8)})`,
          amount: { currency_code: 'USD', value: input.precoUsd.toFixed(2) },
        },
      ],
      application_context: {
        brand_name: 'DFVLeads',
        user_action: 'PAY_NOW',
        return_url: input.retornoUrl,
        cancel_url: input.canceloUrl,
      },
    }),
  });
  if (!resposta.ok) throw new Error(`PayPal order: HTTP ${resposta.status}`);
  const json = (await resposta.json()) as { id: string; links: { rel: string; href: string }[] };
  const aprovacao = json.links.find((l) => l.rel === 'approve')?.href;
  if (!aprovacao) throw new Error('PayPal: link de aprovação ausente.');
  return { id: json.id, url: aprovacao };
}

/** Captura a order aprovada pelo usuário; só captura paga ativa o plano. */
export async function capturarOrdemPayPal(orderId: string): Promise<boolean> {
  const acesso = await token();
  const resposta = await fetch(`${API()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${acesso}`, 'Content-Type': 'application/json' },
  });
  if (!resposta.ok) return false;
  const json = (await resposta.json()) as { status?: string };
  return json.status === 'COMPLETED';
}

/** Confere o estado da order sem capturar (usado no retorno). */
export async function estadoOrdemPayPal(orderId: string): Promise<string | null> {
  const acesso = await token();
  const resposta = await fetch(`${API()}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${acesso}` },
  });
  if (!resposta.ok) return null;
  const json = (await resposta.json()) as { status?: string };
  return json.status ?? null;
}

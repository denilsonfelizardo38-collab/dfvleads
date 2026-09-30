import { createHmac, randomUUID } from 'node:crypto';
import { config } from '../env.ts';

const API = 'https://bpay.binanceapi.com';

export function binanceAtivo(): boolean {
  return Boolean(config.binancePayKey && config.binancePaySecret);
}

/**
 * Assinatura oficial Binance Pay: payload = timestamp\\nnonce\\nbody\\n
 * MAC = HMAC-SHA512(payload, secretKey), maiúsculo.
 */
function assinar(timestamp: string, nonce: string, body: string): string {
  const payload = `${timestamp}\\n${nonce}\\n${body}\\n`;
  return createHmac('sha512', config.binancePaySecret).update(payload).digest('hex').toUpperCase();
}

interface RespostaBinance {
  status: string;
  code: string;
  errorMessage?: string;
  data?: unknown;
}

async function chamar(caminho: string, body: Record<string, unknown>): Promise<RespostaBinance> {
  const timestamp = Date.now().toString();
  const nonce = randomUUID().replaceAll('-', '');
  const corpo = JSON.stringify(body);
  const resposta = await fetch(`${API}${caminho}`, {
    method: 'POST',
    signal: AbortSignal.timeout(20_000),
    headers: {
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp,
      'BinancePay-Nonce': nonce,
      'BinancePay-Certificate-SN': config.binancePayKey,
      'BinancePay-Signature': assinar(timestamp, nonce, corpo),
    },
    body: corpo,
  });
  if (!resposta.ok) throw new Error(`Binance Pay: HTTP ${resposta.status}`);
  return (await resposta.json()) as RespostaBinance;
}

/** Cria o pedido de pagamento e devolve o prepayId + link universal. */
export async function criarOrdemBinance(input: {
  pedidoId: string;
  precoUsd: number;
  planoNome: string;
}): Promise<{ prepayId: string; url: string } | null> {
  const resposta = await chamar('/binancepay/openapi/v3/order', {
    env: { terminalType: 'WEB' },
    merchantTradeNo: `dfv${Date.now()}`.slice(0, 32),
    orderAmount: input.precoUsd,
    currency: 'USDT',
    description: `DFVLeads ${input.planoNome} - 1 mes`,
    goodsDetails: [{ goodsType: '02', goodsCategory: 'Z000', referenceGoodsId: input.pedidoId, goodsName: `DFVLeads ${input.planoNome}` }],
    // O webhook é a via oficial de confirmação; passamos o id do pedido
    // para o nosso endpoint conseguir casar sem depender de detalhe extra.
    webhookUrl: config.appBaseUrl ? `${config.appBaseUrl}/api/billing/webhook/binance` : undefined,
  });
  if (resposta.status !== 'SUCCESS' || !resposta.data) return null;
  const data = resposta.data as { prepayId: string; universalUrl?: string; checkoutUrl?: string };
  const url = data.universalUrl ?? data.checkoutUrl;
  if (!url) return null;
  return { prepayId: data.prepayId, url };
}

/** Consulta o estado do pagamento pelo prepayId. */
export async function estadoBinance(prepayId: string): Promise<'PAID' | 'PENDING' | 'FAILED' | null> {
  const resposta = await chamar('/binancepay/openapi/v2/order/query', { prepayId });
  if (resposta.status !== 'SUCCESS' || !resposta.data) return null;
  const data = resposta.data as { status: string };
  if (data.status === 'PAID') return 'PAID';
  if (data.status === 'CANCELED' || data.status === 'EXPIRED') return 'FAILED';
  return 'PENDING';
}

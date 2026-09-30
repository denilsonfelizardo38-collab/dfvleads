import { Router } from 'express';
import { createHmac } from 'node:crypto';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import { HttpError } from '../lib/http.ts';
import { config, PLANOS, WHATSAPP_ADMIN, planoPelaChave } from '../env.ts';
import { paypalAtivo, criarOrdemPayPal, capturarOrdemPayPal } from '../services/paypal.ts';
import { binanceAtivo, criarOrdemBinance } from '../services/binancePay.ts';
import { ativarPlanoDoPedido } from '../services/planActivation.ts';
import type { AuthedRequest } from '../types.ts';

export const billingRouter = Router();

/** Pagamentos automáticos disponíveis (o painel mostra os ativos). */
billingRouter.get('/metodos', (_request, response) => {
  response.json({ paypal: paypalAtivo(), binance: binanceAtivo() });
});

/** GET /api/billing/planos — catálogo para a página Planos. */
billingRouter.get('/planos', (_request, response) => {
  response.json({ planos: PLANOS, whatsappAdmin: WHATSAPP_ADMIN });
});

/** POST /api/billing/pagamentos { planKey, metodo, referencia } — registra a intenção. */
billingRouter.post('/pagamentos', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const planKey = String(request.body?.planKey ?? '');
    const metodo = String(request.body?.metodo ?? 'binance').toLowerCase();
    const referencia = String(request.body?.referencia ?? '').trim().slice(0, 120);

    const plano = planoPelaChave(planKey);
    if (!plano) throw new HttpError(400, 'Plano inválido.');
    if (!['binance', 'paypal'].includes(metodo)) throw new HttpError(400, 'Método inválido (binance ou paypal).');
    if (referencia.length < 4) throw new HttpError(400, 'Informe o ID/hash da transferência para o admin conferir.');

    const { data: pedido, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({ user_id: user.id, plan_key: planKey, amount_usd: plano.precoUsd, metodo, referencia, status: 'pending' })
      .select('id, created_at')
      .single();
    if (error || !pedido) throw new HttpError(500, 'Falha ao registrar o pedido de pagamento.');

    // Mensagem que abre no WhatsApp do admin — o usuário só aperta enviar.
    const { data: perfil } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    const mensagem = [
      'Olá! Acabei de fazer o pagamento do plano:',
      '',
      `Plano: ${plano.nome} — ${plano.precoUsd} USD/mês (${plano.pesquisas} pesquisas + ${plano.sites} sites)`,
      `Método: ${metodo === 'binance' ? 'Binance (USDT)' : 'PayPal'}`,
      `ID da transferência: ${referencia}`,
      `Conta: ${user.email}${perfil?.full_name ? ` (${perfil.full_name})` : ''}`,
      `Pedido: ${pedido.id}`,
      '',
      'Pode confirmar a ativação, por favor?',
    ].join('\n');

    const link = `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(mensagem)}`;
    response.json({ id: pedido.id, whatsappUrl: link });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/billing/checkout/paypal { planKey } — cria order e devolve o
 * link de aprovação do PayPal. O plano ativa no RETORNO (captura) e no
 * webhook (rede de segurança).
 */
billingRouter.post('/checkout/paypal', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');
    if (!paypalAtivo()) throw new HttpError(501, 'PayPal não configurado neste servidor.');

    const plano = planoPelaChave(String(request.body?.planKey ?? ''));
    if (!plano) throw new HttpError(400, 'Plano inválido.');

    const { data: pedido, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: user.id,
        plan_key: plano.key,
        amount_usd: plano.precoUsd,
        metodo: 'paypal',
        provider: 'paypal',
        status: 'pending',
      })
      .select('id')
      .single();
    if (error || !pedido) throw new HttpError(500, 'Falha ao registrar o pedido.');

    const base = config.appBaseUrl || `${request.protocol}://${request.get('host')}`;
    const ordem = await criarOrdemPayPal({
      planoKey: plano.key,
      planoNome: plano.nome,
      precoUsd: plano.precoUsd,
      pedidoId: pedido.id,
      retornoUrl: `${base}/api/billing/retorno/paypal?pedido=${pedido.id}`,
      canceloUrl: `${base}/dashboard/planos?pagamento=cancelado`,
    });

    await supabaseAdmin
      .from('payment_requests')
      .update({ provider_order_id: ordem.id })
      .eq('id', pedido.id);

    response.json({ pedidoId: pedido.id, aprovacaoUrl: ordem.url });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billing/retorno/paypal?token=ORDERID&pedido=UUID
 * Volta do PayPal: captura o pagamento e ativa o plano na hora.
 * MONTADO PÚBLICO (sem sessão) — o navegador do usuário volta do PayPal
 * direto para cá.
 */
export const paypalRetornoHandler = async (request: import('express').Request, response: import('express').Response, next: import('express').NextFunction) => {
  try {
    const pedidoId = String(request.query.pedido ?? '');
    const orderId = String(request.query.token ?? '');
    if (!pedidoId || !orderId) throw new HttpError(400, 'Retorno inválido.');

    const { data: pedido } = await supabaseAdmin
      .from('payment_requests')
      .select('id, provider_order_id, status')
      .eq('id', pedidoId)
      .single();
    if (!pedido) throw new HttpError(404, 'Pedido não encontrado.');

    if (pedido.status !== 'approved') {
      const pago = await capturarOrdemPayPal(orderId);
      if (pago) await ativarPlanoDoPedido(pedidoId);
    }
    response.redirect(302, `${config.appBaseUrl || ''}/dashboard/planos?pagamento=sucesso`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/webhook/paypal — rede de segurança: se o usuário fechar
 * o navegador antes do retorno, o webhook da PayPal ativa o plano.
 * MONTADO PÚBLICO. A captura só é aceita após conferir o pedido no banco.
 */
export const paypalWebhookHandler = async (request: import('express').Request, response: import('express').Response, next: import('express').NextFunction) => {
  try {
    const evento = request.body ?? {};
    if (evento?.event_type === 'CHECKOUT.ORDER.APPROVED' || evento?.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = evento?.resource?.supplementary_data?.related_ids?.order_id ?? evento?.resource?.id;
      if (typeof orderId === 'string') {
        const { data: pedido } = await supabaseAdmin
          .from('payment_requests')
          .select('id, status')
          .eq('provider_order_id', orderId)
          .maybeSingle();
        if (pedido && pedido.status !== 'approved') await ativarPlanoDoPedido(pedido.id);
      }
    }
    response.json({ received: true });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/billing/checkout/binance { planKey } — cria order e devolve o
 * link universal do Binance Pay. O plano ativa no WEBHOOK oficial.
 */
billingRouter.post('/checkout/binance', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');
    if (!binanceAtivo()) throw new HttpError(501, 'Binance Pay não configurado neste servidor.');

    const plano = planoPelaChave(String(request.body?.planKey ?? ''));
    if (!plano) throw new HttpError(400, 'Plano inválido.');

    const { data: pedido, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: user.id,
        plan_key: plano.key,
        amount_usd: plano.precoUsd,
        metodo: 'binance',
        provider: 'binance',
        status: 'pending',
      })
      .select('id')
      .single();
      if (error || !pedido) throw new HttpError(500, 'Falha ao registrar o pedido.');

    const ordem = await criarOrdemBinance({ pedidoId: pedido.id, precoUsd: plano.precoUsd, planoNome: plano.nome });
    if (!ordem) throw new HttpError(502, 'Binance Pay recusou o pedido. Tente novamente ou use o WhatsApp.');

    await supabaseAdmin
      .from('payment_requests')
      .update({ provider_order_id: ordem.prepayId })
      .eq('id', pedido.id);

    response.json({ pedidoId: pedido.id, pagamentoUrl: ordem.url });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/billing/webhook/binance — confirmação oficial da Binance Pay.
 * Verifica a assinatura HMAC-SHA512 e ativa o plano se PAID.
 * MONTADO PÚBLICO (chamado pelos servidores da Binance).
 */
export const binanceWebhookHandler = async (request: import('express').Request, response: import('express').Response, next: import('express').NextFunction) => {
  try {
    const corpoBruto = (request as typeof request & { rawBody?: string }).rawBody;
    const timestamp = String(request.headers['binancepay-timestamp'] ?? '');
    const nonce = String(request.headers['binancepay-nonce'] ?? '');
    const assinatura = String(request.headers['binancepay-signature'] ?? '');

    if (config.binancePaySecret && corpoBruto && timestamp && nonce && assinatura) {
      const payload = `${timestamp}\n${nonce}\n${corpoBruto}\n`;
      const esperado = createHmac('sha512', config.binancePaySecret).update(payload).digest('hex').toUpperCase();
      if (esperado !== assinatura) {
        response.status(401).json({ error: 'Assinatura inválida.' });
        return;
      }
    }

    const data = request.body?.data ?? {};
    const prepayId = String(data.prepayId ?? '');
    const statusBinance = String(data.status ?? '');
    if (prepayId && statusBinance === 'PAID') {
      const { data: pedido } = await supabaseAdmin
        .from('payment_requests')
        .select('id, status')
      .eq('provider_order_id', prepayId)
        .maybeSingle();
      if (pedido && pedido.status !== 'approved') await ativarPlanoDoPedido(pedido.id);
    }
    response.json({ returnCode: 'SUCCESS', returnMessage: null });
  } catch (error) {
    next(error);
  }
};

/** GET /api/billing/meus-pagamentos — histórico do usuário. */
billingRouter.get('/meus-pagamentos', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');
    const { data } = await supabaseAdmin
      .from('payment_requests')
      .select('id, plan_key, amount_usd, metodo, referencia, status, created_at, reviewed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    response.json({ pagamentos: data ?? [] });
  } catch (error) {
    next(error);
  }
});
